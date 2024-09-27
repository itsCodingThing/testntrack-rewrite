import DrawCoordModel from "../../database/models/SingleCopyCheck.js";
import CopyReviewModel, { type TReviewStatus } from "../../database/models/EvaluationCopyReview.js";
import DrawCoordHistoryModel from "../../database/models/SingleCopyCheckHistory.js";
import { ServiceError } from "../../utils/error.js";

export const copyReviewModel = CopyReviewModel;
export const drawCoordModel = DrawCoordModel;
export const drawCoordHistoryModel = DrawCoordHistoryModel;

export async function findReviewById(reviewId: string) {
    return await CopyReviewModel.findById(reviewId).lean();
}

export async function createReview({
    copyId,
    paperId,
    reviewerId,
}: {
    copyId: string;
    paperId: string;
    reviewerId: string;
}) {
    const doc = await CopyReviewModel.create({
        copy_id: copyId,
        paper_id: paperId,
        reviewer_id: reviewerId,
        status: "in-review",
    });
    return doc.toObject();
}

export async function createDrawCoordHistory({
    evaluationCopyId,
    paperId,
    reviewerId,
}: {
    evaluationCopyId: string;
    paperId: string;
    reviewerId: string;
}) {
    const currentDrawCoords = await DrawCoordModel.findOne({ copyId: evaluationCopyId }).lean();

    if (!currentDrawCoords) {
        throw new ServiceError({ msg: "unable to find draw detials for this evaluation copy" });
    }

    const doc = await DrawCoordHistoryModel.create({
        copy_id: evaluationCopyId,
        paper_id: paperId,
        review_evaluator_id: reviewerId,
        check_details: currentDrawCoords.check_details,
    });

    return doc._id.toString();
}

export async function resetCopyDrawHistory(evaluationCopyId: string, reviewId: string) {
    const currentDrawCoords = await DrawCoordModel.findOne({ copyId: evaluationCopyId }).orFail();
    const review = await CopyReviewModel.findById(reviewId).orFail();

    const initialReviewHistory = review.history[review.history.length - 1];

    const intialDrawCoords = await DrawCoordHistoryModel.findById(
        initialReviewHistory.check_details,
        "check_details"
    ).lean();

    currentDrawCoords.check_details = intialDrawCoords?.check_details ?? [];

    await currentDrawCoords.save();
}

export async function addReviewToReviewHistory({
    reviewId,
    status,
    details = [],
    checkDetailsId = "",
}: {
    reviewId: string;
    status: TReviewStatus;
    details?: any;
    checkDetailsId?: string;
}) {
    const review = await CopyReviewModel.findById(reviewId).orFail();

    review.status = status;
    if (details) {
        review.details = details;
        review.markModified("details");
    }

    review.history.unshift({ status, check_details: checkDetailsId });
    await review.save();
}

export async function findCheckDetailsById(checkDetailsId: string) {
    return await DrawCoordHistoryModel.findById(checkDetailsId).lean();
}
