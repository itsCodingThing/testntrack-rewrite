import lodash from "lodash";
import mongoose, { type PipelineStage } from "mongoose";

import { ServiceError } from "../../utils/error.js";
import { type IDBPaper } from "../../database/models/Paper.js";
import * as NotificationService from "../fcm.js";
import * as MarketPlaceBundleService from "./marketplacebundle.js";
import TeacherEvaluationCopy from "../../database/models/TeacherEvaluationCopy.js";
import EvaluatorHistoryModel, { type IDBEvaluatorHistory } from "../../database/models/EvaluatorHistory.js";

export const getEvaluatorRatingByHistory = async (evaluatorId: string) => {
    const ratingAvgAggPipeline = [
        {
            $match: {
                evaluator: new mongoose.Types.ObjectId(evaluatorId),
                action: "Submitted",
            },
        },
        {
            $group: {
                _id: {
                    action: "Submitted",
                },
                rating: {
                    $avg: "$rating",
                },
                count: { $sum: 1 },
            },
        },
    ];

    const data = await EvaluatorHistoryModel.aggregate(ratingAvgAggPipeline);

    return data[0]?.rating ?? 5.0;
};

// used to calculate price of copies
// eslint-disable-next-line no-unused-vars
const calculateCopyMarks = async (copies: $TSFixMe) => {
    const price = {
        amount: 0,
        bonus: 0,
        penalty: 0,
    };

    const copy = await TeacherEvaluationCopy.findById(copies[0]);

    if (!copy) {
        throw new ServiceError({ msg: "unable to find copy" });
    }

    if (!copy.submission_details.total_marks) {
        throw new ServiceError({ msg: "unable to find total marks in copy" });
    }

    const totalMarks = copy.submission_details.total_marks;

    if (totalMarks > 0 && totalMarks <= 25) {
        price.amount = 10;
        price.bonus = 5;
    } else if (totalMarks > 25 && totalMarks <= 50) {
        price.amount = 18;
        price.bonus = 7;
    } else if (totalMarks > 50 && totalMarks <= 80) {
        price.amount = 30;
        price.bonus = 10;
    } else if (totalMarks > 80) {
        price.amount = 35;
        price.bonus = 15;
    }

    return price;
};

const createEvaluatorHistory = async (
    action: "Submitted" | "Withdrawn" | "Inreview" | "Dropped" | "Reviewed" | "Assigned" | "Recheck",
    teacher_id: string,
    copies: string[],
    reason = ""
) => {
    let price = {
        amount: 0,
        bonus: 0,
        penalty: 0,
    };

    const copy = await TeacherEvaluationCopy.findOne({ _id: { $in: copies } }).lean();

    let message = "New Copies Assigned for Copy Checking";

    if (action === "Submitted") {
        message = "Checked Copies Payment Recieved";
    }

    if (action === "Withdrawn") {
        message = "Your Copies Are Withdrawn";
    }

    if (action === "Inreview") {
        message = "Your copies are in review process";
    }

    if (action === "Dropped") {
        message = "Your copies are dropped from review process";
    }

    if (action === "Reviewed") {
        message = "Your copies are reviewed successfully";
    }

    // creating notification for evaluator
    NotificationService.sendNotification({
        user_id: teacher_id,
        message: message,
    });

    if (!copy) {
        return;
    }

    if (action === "Submitted") {
        price = await calculateCopyMarks([copy]);
    }

    const doc = await EvaluatorHistoryModel.create({
        action: action,
        reason: reason,
        amount: price.amount,
        bonus: price.bonus,
        penalty: price.penalty,
        evaluator: teacher_id,
        paper: copy.paper,
        copies: copies,
        no_of_copies: copies.length,
    });

    await MarketPlaceBundleService.refreshBundleByCopiesId(copies);

    return doc.toObject();
};

export async function findAllEvaluatorPerformance() {
    const agg = [
        {
            $match: {
                deleted: false,
            },
        },
        {
            $group: {
                _id: "$evaluator",
                history: {
                    $push: "$$ROOT",
                },
            },
        },
        {
            $lookup: {
                from: "evaluators",
                let: { evaluatorId: "$_id" },
                as: "evaluator",
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$$evaluatorId", "$_id"] },
                        },
                    },
                ],
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$$ROOT",
                        {
                            $arrayElemAt: ["$evaluator", 0],
                        },
                    ],
                },
            },
        },
        {
            $project: {
                name: 1,
                rating: 1,
                history: 1,
                contact: 1,
                image: 1,
                created_at: 1,
                status: 1,
            },
        },
    ];

    let list = await EvaluatorHistoryModel.aggregate(agg).exec();

    // removing evaluator that are not in db
    list = list.filter((value: $TSFixMe) => value.name);

    list = list.map(async (value: $TSFixMe) => {
        const response = await getEvaluatorRatingByHistory(value._id);
        value.rating = response;

        return value;
    });

    list = await Promise.allSettled(list);

    return list.map((value: $TSFixMe) => value.value);
}

export const evaluatorHistoryModel = EvaluatorHistoryModel;

export const deleteEvaluatorHistory = async (historyId: $TSFixMe) => {
    return await EvaluatorHistoryModel.findByIdAndUpdate(historyId, { deleted: true }, { returnDocument: "after" });
};

export const addAssignEvaluatorHistory = async (teacher_id: $TSFixMe, copies: $TSFixMe) => {
    const history = await createEvaluatorHistory("Assigned", teacher_id, copies);
    return history;
};

export const addSubmittedEvaluatorHistory = async (teacher_id: $TSFixMe, copies: $TSFixMe) => {
    const history = await createEvaluatorHistory("Submitted", teacher_id, copies);
    return history;
};

export const addWidthdrawnEvaluatorHistory = async (teacher_id: $TSFixMe, copies: $TSFixMe, reason: $TSFixMe) => {
    const history = await createEvaluatorHistory("Withdrawn", teacher_id, copies, reason);
    return history;
};

export const addRecheckEvaluatorHistory = async (teacher_id: $TSFixMe, copies: $TSFixMe) => {
    const history = await createEvaluatorHistory("Recheck", teacher_id, copies);
    return history;
};

export const addReviewEvaluatorHistory = async (action: $TSFixMe, teacher_id: $TSFixMe, copies: $TSFixMe) => {
    if (action === "Inreview") {
        const history = await createEvaluatorHistory(action, teacher_id, copies);
        return history;
    }

    if (action === "Reviewed") {
        const history = await createEvaluatorHistory(action, teacher_id, copies);
        return history;
    }

    if (action === "Dropped") {
        const history = await createEvaluatorHistory(action, teacher_id, copies);
        return history;
    }
};

export const getEvaluatorHistory = async (evaluatorId: $TSFixMe) => {
    const history = await EvaluatorHistoryModel.find({ evaluator: evaluatorId, deleted: false })
        .sort({ created_at: -1 })
        .populate("paper")
        .lean();

    return history;
};

export async function findEvaluatorHistoryByEvaluatorId(evaluatorId: $TSFixMe) {
    const history = await EvaluatorHistoryModel.find({ evaluator: evaluatorId, deleted: false })
        .sort({ created_at: -1 })
        .populate("paper")
        .lean();

    return history;
}

export async function findEvaluatorWalletByEvaluatorId(evaluatorId: $TSFixMe) {
    // fetching totalWalletAmount
    const pipeline: PipelineStage[] = [
        {
            $match: {
                action: "Submitted",
                evaluator: new mongoose.Types.ObjectId(evaluatorId),
                deleted: false,
            },
        },
        {
            $lookup: {
                from: "paper",
                let: { paperId: "$paper" },
                as: "paper",

                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$$paperId", "$_id"] },
                        },
                    },
                    {
                        $project: {
                            paper: "$name",
                        },
                    },
                ],
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$$ROOT",
                        {
                            $arrayElemAt: ["$paper", 0],
                        },
                    ],
                },
            },
        },
        {
            $sort: {
                created_at: -1,
            },
        },
    ];

    const totalWalletAmount = await EvaluatorHistoryModel.aggregate<
        Omit<IDBEvaluatorHistory, "paper"> & { paper: string }
    >(pipeline).exec();

    const totalPaidAmount = totalWalletAmount.filter((history) => history.paid);
    const totalCurrentAmount = totalWalletAmount.filter((history) => !history.paid);

    return {
        total: {
            amount:
                totalWalletAmount.length === 0
                    ? 0
                    : totalWalletAmount.map((a) => a.amount + a?.bonus ?? 0 - a?.penalty ?? 0).reduce((a, b) => a + b),
            history: totalWalletAmount,
        },
        paid: {
            amount:
                totalPaidAmount.length === 0
                    ? 0
                    : totalPaidAmount.map((a) => a.amount + a?.bonus ?? 0 - a?.penalty ?? 0).reduce((a, b) => a + b),
            history: totalPaidAmount,
        },
        current: {
            amount:
                totalCurrentAmount.length === 0
                    ? 0
                    : totalCurrentAmount.map((a) => a.amount + a?.bonus ?? 0 - a?.penalty ?? 0).reduce((a, b) => a + b),
            history: totalCurrentAmount,
        },
    };
}

export async function getEvalautorPerformance(evaluatorId: string) {
    const evaluatorHistory = await EvaluatorHistoryModel.find({
        evaluator: evaluatorId,
        action: "Submitted",
        deleted: false,
    })
        .populate<{
            paper: Omit<
                IDBPaper,
                | "schedule_details"
                | "question_details.questions"
                | "question_details.sections"
                | "created_by"
                | "updated_by"
                | "updated_at"
            >;
        }>([
            {
                path: "paper",
                select: "-schedule_details -question_details.questions -question_details.sections -created_by -updated_by -updated_at",
                populate: [
                    { path: "school", select: "name code" },
                    { path: "batch", select: "name" },
                ],
            },
            { path: "evaluator", select: "name" },
        ])
        .lean();

    const papaerWiseGroupedHistory = lodash.groupBy(evaluatorHistory, (bundle) => bundle.paper._id.toString());
    return Object.values(papaerWiseGroupedHistory).map((bundle) => {
        const paper = bundle[0].paper;

        return {
            ...paper,
            bundles: bundle.map((value) => lodash.omit(value, "paper")),
        };
    });
}

export async function getEvalautorPerformanceByPaper(evaluatorId: string, paperId: string) {
    const evaluatorHistory = await EvaluatorHistoryModel.find({
        evaluator: evaluatorId,
        paper: paperId,
        action: "Submitted",
        deleted: false,
    })
        .populate<{
            paper: Omit<
                IDBPaper,
                | "schedule_details"
                | "question_details.questions"
                | "question_details.sections"
                | "created_by"
                | "updated_by"
                | "updated_at"
            >;
        }>([
            {
                path: "paper",
                select: "-schedule_details -question_details.questions -question_details.sections -created_by -updated_by -updated_at",
                populate: [
                    { path: "school", select: "name code" },
                    { path: "batch", select: "name" },
                ],
            },
            { path: "evaluator", select: "name" },
        ])
        .lean();

    const papaerWiseGroupedHistory = lodash.groupBy(evaluatorHistory, (bundle) => bundle.paper._id.toString());
    return Object.values(papaerWiseGroupedHistory).map((bundle) => {
        const paper = bundle[0].paper;

        return {
            ...paper,
            bundles: bundle.map((value) => lodash.omit(value, "paper")),
        };
    });
}

export async function updateEvaluatorHistory(historyId: string, update: any) {
    const result = await EvaluatorHistoryModel.findByIdAndUpdate(historyId, update, { returnDocument: "after" }).lean();
    return result;
}
