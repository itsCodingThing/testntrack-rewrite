import {
    addWidthdrawnEvaluatorHistory,
    getEvaluatorRatingByHistory,
    addAssignEvaluatorHistory,
} from "./evaluatorHistory.js";
import {
    getCompletedMarketPlaceBundles,
    getCurrentMarketPlaceBundles,
    findReviewCopiesByReviewerId,
    refreshBundleByCopiesId,
} from "./marketplacebundle.js";
import lodash from "lodash";
import { ServiceError } from "../../utils/error.js";
import PaperModel from "../../database/models/Paper.js";
import EvaluatorModel from "../../database/models/Evaluator.js";
import { scheduleRemoveUncheckedCopies } from "../scheduling.js";
import TeacherEvaluationCopyModel from "../../database/models/TeacherEvaluationCopy.js";

export const evaluatorModel = EvaluatorModel;

export async function removeAssignedCopiesByEvaluatorId(
    ids: string[],
    evaluatorId: string,
    reason = "Removed by testntrack"
) {
    const copies = await TeacherEvaluationCopyModel.updateMany(
        {
            _id: { $in: ids },
            "submission_details.paper_type": "Subjective",
        },
        {
            $set: {
                associate_teacher: {
                    checked_copy: "",
                    teacher_id: null,
                    is_evaluator: true,
                    is_submitted: false,
                },
            },
        }
    );

    // creating widthdran history
    await addWidthdrawnEvaluatorHistory(evaluatorId, ids, reason);
    return copies;
}

export async function removeUncheckedCopies({ copies = [], evaluatorId = "", scheduleTime = "" }) {
    const evaluationCopies = await TeacherEvaluationCopyModel.find({
        _id: { $in: copies },
        "associate_teacher.teacher_id": evaluatorId,
        "associate_teacher.is_submitted": false,
        "associate_teacher.assigned_time": new Date(scheduleTime),
    }).lean();

    const unCheckedCopies: $TSFixMe = [];
    const checkedCopies = [];

    evaluationCopies.forEach((copy) => {
        // const timeDiff = moment(copy.associate_teacher.assigned_time).diff(moment(scheduleTime), "minutes");
        if (copy.associate_teacher.checked_copy !== "") {
            checkedCopies.push(copy);
        }

        if (copy.associate_teacher.checked_copy === "") {
            unCheckedCopies.push(copy);
        }
    });

    if (unCheckedCopies.length !== 0) {
        await removeAssignedCopiesByEvaluatorId(
            unCheckedCopies.map((copy: $TSFixMe) => copy._id).flat(),
            evaluatorId,
            "You Exceded the time limit of copy-checking"
        );
    }
}

export async function getEvaluatorById(id: $TSFixMe) {
    const doc = await EvaluatorModel.findOne({ _id: id, deleted: false }).lean();

    if (!doc) {
        throw new ServiceError({ msg: "unable to find evaluator" });
    }

    // getting rating of evaluator bu evaluator History
    const rating = await getEvaluatorRatingByHistory(id);

    doc.rating = rating;
    return doc;
}

export async function addEvaluator(body: $TSFixMe) {
    const doc = await EvaluatorModel.create(body);
    return doc.toObject();
}

export async function updateEvaluatorById(id: $TSFixMe, update: $TSFixMe) {
    return await EvaluatorModel.findByIdAndUpdate(id, update, { returnDocument: "after" });
}

export async function removeEvaluatorById({ id, updated_by }: $TSFixMe) {
    return await EvaluatorModel.findByIdAndUpdate(id, { deleted: true, updated_by }, { new: true }).lean();
}

export async function removeManyEvaluatorsById(ids: $TSFixMe, updatedBy: $TSFixMe) {
    return await EvaluatorModel.updateMany(
        { _id: ids },
        { $set: { deleted: true, updated_by: updatedBy } },
        { multi: true }
    ).lean();
}

export async function getEvaluatorOtpById(id = "") {
    const doc = await EvaluatorModel.findOne({ _id: id, deleted: false }).lean();

    if (!doc) {
        return null;
    }

    return doc.otp;
}

export async function updateEvaluatorOtp({ id, otp }: { id: string; otp: string }) {
    return await EvaluatorModel.findByIdAndUpdate(id, { otp }, { new: true }).lean({ autopopulate: true });
}

export async function findEvaluatorByContact(contact: string) {
    return await EvaluatorModel.findOne({ contact, deleted: false }).lean();
}

export async function getMarketPlaceCopiesByEvaluator(boards: $TSFixMe, classes: $TSFixMe, subjects: $TSFixMe) {
    const papers = await PaperModel.find({
        board: { $in: boards },
        class: { $in: classes },
        subject: { $in: subjects },
        type: "Subjective",
        "schedule_details.is_evaluator": true,
    })
        .sort({ "schedule_details.start_time": -1 })
        .lean();

    const paperIdList = papers.map((paper: $TSFixMe) => paper._id).flat();

    const copies = await TeacherEvaluationCopyModel.find({
        is_result_declared: false,
        paper: { $in: paperIdList },
        "associate_teacher.checked_copy": "",
        "associate_teacher.is_evaluator": true,
        "associate_teacher.teacher_id": null,
    }).lean();

    const resultBundle = Object.values(
        lodash.groupBy(copies, (details: $TSFixMe) => {
            return details.paper;
        })
    ).map((copies) => {
        const paper = papers.find((p: $TSFixMe) => p._id.toString() === copies[0].paper.toString());
        const data = {
            paper: paper,
            no_of_copies: copies.length,
            copies: copies.map((copy: $TSFixMe) => copy._id).flat(),
        };
        return data;
    });

    return { count: resultBundle.length, bundles: copies };
}

// GET ALL MARKETPLACE COPIES WITHOUT EVALUATOR ID
export async function getMarketPlaceCopiesAdmin({ is_result_declared = false }) {
    let no_of_pages = 1;

    let copies;

    if (is_result_declared) {
        copies = await getCompletedMarketPlaceBundles();
    } else {
        copies = await getCurrentMarketPlaceBundles();
        no_of_pages = 1;
    }
    return { count: copies.length, bundles: copies, no_of_pages: no_of_pages };
}

export async function getCopiesDetailsById(copyIds: $TSFixMe) {
    return await TeacherEvaluationCopyModel.find({
        _id: { $in: copyIds },
    }).lean();
}

export async function assignCopiesToEvaluator(evaluatorId: $TSFixMe, copyIds: $TSFixMe) {
    const scheduleTime = new Date();

    const copies = await TeacherEvaluationCopyModel.updateMany(
        { _id: { $in: copyIds } },
        {
            "associate_teacher.is_evaluator": true,
            "associate_teacher.teacher_id": evaluatorId,
            "associate_teacher.checked_copy": "",
            "associate_teacher.assigned_time": scheduleTime,
        }
    );

    await addAssignEvaluatorHistory(evaluatorId, copyIds);

    // adding 24 hour time slot to remove the copy that are not checked by the evaluator
    scheduleRemoveUncheckedCopies(copyIds, evaluatorId, scheduleTime);

    return copies;
}

// TODO: need to improve this query (Scanned / Returned) ratio above 1000
export async function getAssignedCopies(evaluatorId: string) {
    const copies = await TeacherEvaluationCopyModel.find({
        is_result_declared: false,
        "associate_teacher.is_evaluator": true,
        "associate_teacher.is_submitted": false,
        "associate_teacher.teacher_id": evaluatorId,
        "submission_details.paper_type": "Subjective",
    })
        .populate({ path: "paper" })
        .sort({ "associate_teacher.assigned_time": -1 })
        .lean();

    const resultBundles = Object.values(
        lodash.groupBy(copies, (details: $TSFixMe) => {
            if (details.paper) {
                return details.paper._id;
            } else {
                return details.paper;
            }
        })
    ).map((copies) => {
        const paper = copies[0].paper;

        if (paper) {
            const data = {
                paper: paper,
                assigned_time: copies[0].associate_teacher?.assigned_time,
                no_of_copies: copies.length,
                copies: copies.map((c: $TSFixMe) => c._id).flat(),
            };
            return data;
        } else {
            return {};
        }
    });

    return { count: resultBundles.length, bundles: copies };
}

export async function getReviewCopies(reviewerId: $TSFixMe) {
    return await findReviewCopiesByReviewerId(reviewerId);
}

export async function updateEvaluatorCopyById(id: $TSFixMe, update: $TSFixMe) {
    const copies = await TeacherEvaluationCopyModel.findByIdAndUpdate(id, update);
    if (update?.associate_teacher?.checked_copy !== "" ?? false) {
        await refreshBundleByCopiesId([id]);
    }

    return copies;
}

export async function updateManyCopiesById(ids: $TSFixMe, update: $TSFixMe) {
    const copies = await TeacherEvaluationCopyModel.updateMany({ _id: { $in: ids } }, update);
    return copies;
}

export async function getAllEvaluators() {
    const evaluators = await EvaluatorModel.find({ deleted: false }).lean();
    return evaluators;
}
