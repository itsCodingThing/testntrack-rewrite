import mongoose, { Types } from "mongoose";
import datefns from "date-fns";

import { ServiceError } from "../../utils/error.js";
import { replaceUploadedCopy } from "../../utils/service.js";
import type { TReviewStatus } from "../../database/models/EvaluationCopyReview.js";
import TeacherEvaluationCopyModel from "../../database/models/TeacherEvaluationCopy.js";
import { EvaluatorHistoryService, CopyReviewService, EventService } from "../index.js";

if (process.env.NODE_ENV === "production") {
    const TeacherEvaluationCopyStream = TeacherEvaluationCopyModel.watch([{ $match: { operationType: "insert" } }], {
        fullDocument: "updateLookup",
    });

    TeacherEvaluationCopyStream.on("change", async ({ fullDocument, operationType }: $TSFixMe) => {
        if (operationType !== "insert") return;

        const {
            _id: id,
            submission_details: { submitted_copy, type, paper_type },
        } = fullDocument;

        if (
            operationType === "insert" &&
            type.toLowerCase() !== "offline" &&
            paper_type.toLowerCase() === "subjective"
        ) {
            try {
                const result = await replaceUploadedCopy({
                    link: submitted_copy,
                });

                fullDocument.submission_details.submitted_copy = result.data.data.url;
                fullDocument.submission_details.pages = result.data.data.pages;

                await TeacherEvaluationCopyModel.findByIdAndUpdate(id, fullDocument, { new: true });
            } catch {
                // ignore
            }
        }
    });
}

export const evaluationCopyModel = TeacherEvaluationCopyModel;

export async function createEvaluationCopy(body: $TSFixMe) {
    const evaluationCopy = new TeacherEvaluationCopyModel(body);

    const copy = await evaluationCopy.save();

    // only alter market-place in case of evalutor check exam
    if (copy?.associate_teacher?.is_evaluator ?? false) {
        const paperId = copy.paper.toString();
        EventService.BackgroundEvent.emit("REFRESH_BUNDLE_BY_PAPERID", paperId);
    }

    return evaluationCopy.toObject();
}

export async function updateEvaluationCopyById({ id, update }: $TSFixMe) {
    const doc = await TeacherEvaluationCopyModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return doc;
}

export async function fetchEvaluationCopiesByIds(ids: string[]) {
    const objIds = ids.map((s) => new mongoose.Types.ObjectId(s));
    const copies = await TeacherEvaluationCopyModel.find({ _id: { $in: objIds } }).lean();

    return copies;
}

export async function findEvalutionCopiesByPaper(paperId: string) {
    const copies = await TeacherEvaluationCopyModel.find({ deleted: false, paper: paperId }).lean();
    return copies;
}

export async function findEvaluationCopyById(copyId: string) {
    const copy = await TeacherEvaluationCopyModel.findById(copyId).lean();
    return copy;
}

export async function deleteEvalutionCopyById(copyId: string) {
    const copy = await TeacherEvaluationCopyModel.deleteOne({ _id: copyId });
    return copy;
}

export async function updateRejectionStatus({
    status,
    copyId,
    reason,
    newCopyUrl = "",
}: {
    status: string;
    copyId: string;
    reason?: string;
    newCopyUrl?: string;
}) {
    if (status === "re-uploaded") {
        const copy = await TeacherEvaluationCopyModel.findById(copyId).lean();

        if (!copy) {
            throw new ServiceError({ msg: "evaluation copy not found" });
        }

        copy.submission_details.submitted_copy = newCopyUrl;
        copy.submission_details.pages = [""] as Types.Array<string>;
        copy.rejection_details.status = status;

        await TeacherEvaluationCopyModel.deleteOne({ _id: copyId });
        await TeacherEvaluationCopyModel.create(copy);
    } else {
        const copy = await TeacherEvaluationCopyModel.findById(copyId);

        if (!copy) {
            throw new ServiceError({ msg: "evaluation copy not found" });
        }

        if (status === "rejected") {
            copy.rejection_details.is_rejected = true;
            copy.rejection_details.status = status;
            copy.rejection_details.reason = reason ?? "";
            copy.rejection_details.rejected_date = new Date();
        }

        if (status === "approved") {
            copy.rejection_details.status = status;
        }

        await copy.save();
    }
}

export async function assignCopiesForReview(reviewEvaluatorId: string, copyIds: string[], paperId: string) {
    const assignCopies = copyIds.map(async (copyId) => {
        const reviewDoc = await CopyReviewService.createReview({
            copyId: copyId,
            paperId: paperId,
            reviewerId: reviewEvaluatorId,
        });

        await TeacherEvaluationCopyModel.findByIdAndUpdate(copyId, {
            "evaluator_review_details.review_id": reviewDoc._id,
            "evaluator_review_details.reviewer_id": reviewEvaluatorId,
            "evaluator_review_details.in_review": true,
            "evaluator_review_details.is_reviewed": true,
            "evaluator_review_details.status": "in-review",
            "evaluator_review_details.reviewed_date": new Date(),
            "evaluator_review_details.status_date": new Date(),
            "evaluator_review_details.status_duration": datefns.addMinutes(new Date(), 6 * 60),
        });

        const drawHistoryDocId = await CopyReviewService.createDrawCoordHistory({
            evaluationCopyId: copyId,
            paperId: paperId,
            reviewerId: reviewEvaluatorId,
        });

        await CopyReviewService.addReviewToReviewHistory({
            reviewId: reviewDoc._id.toString(),
            status: "in-review",
            checkDetailsId: drawHistoryDocId,
        });
    });

    await Promise.allSettled(assignCopies);
    await EvaluatorHistoryService.addReviewEvaluatorHistory("Inreview", reviewEvaluatorId, copyIds);
}

export async function updateEvaluationReview({
    evaluationCopyId,
    status,
    details,
}: {
    evaluationCopyId: string;
    status: TReviewStatus;
    details?: any;
}) {
    const evaluationCopy = await TeacherEvaluationCopyModel.findById(evaluationCopyId);

    if (!evaluationCopy) {
        throw new ServiceError({ msg: "unable to find evaluation copy" });
    }

    let checkDetailsId = "";
    evaluationCopy.evaluator_review_details.status_date = new Date();

    // when reviewer submit copy for re-checking
    if (status === "re-checking") {
        // get current single copy check details
        const drawHistoryDocId = await CopyReviewService.createDrawCoordHistory({
            evaluationCopyId: evaluationCopy.id,
            paperId: evaluationCopy.paper.toString(),
            reviewerId: evaluationCopy.evaluator_review_details.review_id,
        });

        // update evaluation copy for review
        checkDetailsId = drawHistoryDocId;
        evaluationCopy.evaluator_review_details.previous_check_details = drawHistoryDocId;
        evaluationCopy.evaluator_review_details.status = status;
        evaluationCopy.evaluator_review_details.reason = "";
        evaluationCopy.evaluator_review_details.status_date = new Date();
        evaluationCopy.evaluator_review_details.status_duration = datefns.addMinutes(
            evaluationCopy.evaluator_review_details.status_date,
            6 * 60
        );
    }

    // when evaluator submit copy for review
    if (status === "in-review") {
        evaluationCopy.evaluator_review_details.status = status;
        evaluationCopy.evaluator_review_details.reason = "";
        evaluationCopy.evaluator_review_details.status_date = new Date();
        evaluationCopy.evaluator_review_details.status_duration = datefns.addMinutes(
            evaluationCopy.evaluator_review_details.status_date,
            6 * 60
        );
    }

    // when reviwer approved copy
    if (status === "approved") {
        evaluationCopy.evaluator_review_details.in_review = false;
        evaluationCopy.evaluator_review_details.status = status;
        evaluationCopy.evaluator_review_details.reason = "";
        evaluationCopy.evaluator_review_details.status_date = new Date();
    }

    // when admin dropped copy from review
    if (status === "dropped") {
        evaluationCopy.evaluator_review_details.in_review = false;
        evaluationCopy.evaluator_review_details.status = status;
        evaluationCopy.evaluator_review_details.reason = "";
        evaluationCopy.evaluator_review_details.status_date = new Date();

        await CopyReviewService.resetCopyDrawHistory(
            evaluationCopyId,
            evaluationCopy.evaluator_review_details.review_id
        );
    }

    await evaluationCopy.save();

    // update evaluation copy review document
    await CopyReviewService.addReviewToReviewHistory({
        reviewId: evaluationCopy.evaluator_review_details.review_id,
        status: status,
        details: details,
        checkDetailsId: checkDetailsId,
    });

    return evaluationCopy.toObject();
}
