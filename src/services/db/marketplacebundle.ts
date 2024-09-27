import lodash from "lodash";
import mongoose, { type FlattenMaps, type PipelineStage } from "mongoose";

import { sortDates } from "../../utils/date.js";
import * as PaperService from "./paper.js";
import { evaluatorModel } from "./evaluator.js";
import { type IDBCommonCopy } from "../../database/models/CommonCopy.js";
import * as EvaluationCopyService from "./evaluationCopy.js";
import MarketPlaceBundleModel from "../../database/models/MarketPlaceBundle.js";

export const model = MarketPlaceBundleModel;
export const marketplacebundleModel = MarketPlaceBundleModel;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getEmptyBundleByPaper = async (paper: any) => {
    const data = {
        paper: paper,
    };
    const bundle = new MarketPlaceBundleModel(data);
    await bundle.save();

    return bundle.toJSON();
};

const getBundleByPaperId = async (paperId: string) => {
    const bundle = await MarketPlaceBundleModel.findOne({ "paper._id": new mongoose.Types.ObjectId(paperId) }).lean();
    return bundle;
};

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
const createMarketPlaceBundleForExisitingCopies = async (data: $TSFixMe) => {
    const bundles = data.map((e: $TSFixMe) => {
        const bundle = new MarketPlaceBundleModel(e);
        return bundle.save();
    });
    const result = await Promise.allSettled(bundles);
    return result;
};

export const refreshBundleByPaperId = async (paperId: string) => {
    const assignedCopies: FlattenMaps<IDBCommonCopy>[] = [];
    const unAssignedCopies: FlattenMaps<IDBCommonCopy>[] = [];
    const checkedCopies: FlattenMaps<IDBCommonCopy>[] = [];
    const submittedCopies: FlattenMaps<IDBCommonCopy>[] = [];
    const inreviewCopies: FlattenMaps<IDBCommonCopy>[] = [];

    const paper = await PaperService.getPopulatedBatchSchoolPaperById(paperId);

    if (paper.schedule_details.is_evaluator === false) {
        return {};
    }

    const copies = await EvaluationCopyService.findEvalutionCopiesByPaper(paperId);

    copies.forEach((copy) => {
        // checked copies bundle
        if (
            copy.associate_teacher.teacher_id != null &&
            !copy.associate_teacher.is_submitted &&
            copy.associate_teacher.checked_copy !== ""
        ) {
            // inreview copies bundle
            if (copy.evaluator_review_details?.in_review) {
                inreviewCopies.push(copy);
            }
            checkedCopies.push(copy);

            return;
        }

        // assigned copies bundle
        if (copy.associate_teacher.teacher_id != null && copy.associate_teacher.checked_copy === "") {
            assignedCopies.push(copy);
            return;
        }

        // submitted copies bundle
        if (copy.associate_teacher.is_submitted && copy.associate_teacher.checked_copy !== "") {
            submittedCopies.push(copy);
            return;
        }

        // unassign copies bundle
        unAssignedCopies.push(copy);
    });

    async function groupCopies(
        type: "checked" | "assigned" | "submitted" | "inreview" | "un_assigned",
        refreshCopies: FlattenMaps<IDBCommonCopy>[]
    ) {
        if (type === "checked") {
            return {
                copies: Object.values(
                    lodash.groupBy(refreshCopies, (copies) => copies.associate_teacher.teacher_id.toString())
                )
                    .map((copies) => {
                        return {
                            teacher_id: copies[0].associate_teacher.teacher_id,
                            copies: copies.map((copy) => copy._id).flat(),
                        };
                    })

                    .flat(),
                no_of_copies: refreshCopies.length,
            };
        }

        if (type === "assigned") {
            return {
                copies: Object.values(
                    lodash.groupBy(refreshCopies, (copies) => copies.associate_teacher.teacher_id.toString())
                )
                    .map((copies) => {
                        const assignedTime = sortDates(
                            copies.map((copy) => new Date(copy.associate_teacher.assigned_time)),
                            "desc"
                        );

                        return {
                            teacher_id: copies[0].associate_teacher.teacher_id,
                            copies: copies.map((copy) => copy._id).flat(),
                            assigned_time: assignedTime?.[0] ?? new Date().toISOString(),
                        };
                    })

                    .flat(),
                no_of_copies: refreshCopies.length,
            };
        }

        if (type === "submitted") {
            return {
                copies: Object.values(lodash.groupBy(refreshCopies, (copies) => copies.associate_teacher.teacher_id))
                    .map((copies) => {
                        return {
                            teacher_id: copies[0].associate_teacher.teacher_id,
                            copies: copies.map((copy) => copy._id).flat(),
                        };
                    })

                    .flat(),
                no_of_copies: refreshCopies.length,
            };
        }

        if (type === "inreview") {
            return {
                copies: Object.values(
                    lodash.groupBy(refreshCopies, (copies) => copies.evaluator_review_details.reviewer_id)
                )
                    .map((copies) => {
                        return {
                            teacher_id: copies[0].evaluator_review_details.reviewer_id,
                            copies: copies.map((copy) => copy._id).flat(),
                        };
                    })

                    .flat(),
                no_of_copies: refreshCopies.length,
            };
        }

        if (type === "un_assigned") {
            return {
                copies: refreshCopies.map((copy) => copy._id).flat(),
                no_of_copies: refreshCopies.length,
            };
        }
    }

    const [
        groupedCheckedCopies,
        groupedAssignedCopies,
        groupedSubmittedCopies,
        groupedInreviewCopies,
        groupedUnAssignedCopies,
    ] = await Promise.all([
        groupCopies("checked", checkedCopies),
        groupCopies("assigned", assignedCopies),
        groupCopies("submitted", submittedCopies),
        groupCopies("inreview", inreviewCopies),
        groupCopies("un_assigned", unAssignedCopies),
    ]);

    // we consider bundle completed when submittedCopies got equal to copies in the bundle
    const data = {
        paper: paper,
        copies: copies.map((copy) => copy._id).flat(),
        no_of_copies: copies.length,
        completed: copies.filter((copy) => copy.is_result_declared === false).length === 0,
        checked_copies: groupedCheckedCopies,
        assigned_copies: groupedAssignedCopies,
        submitted_copies: groupedSubmittedCopies,
        inreview_copies: groupedInreviewCopies,
        un_assigned_copies: groupedUnAssignedCopies,
    };

    let bundle = await getBundleByPaperId(paperId);

    if (!bundle) {
        bundle = await getEmptyBundleByPaper(paper);
    }

    await MarketPlaceBundleModel.findByIdAndUpdate(bundle._id, data);

    return data;
};

const createMarketPlaceBundlesForLegacy = async () => {
    const papers = await PaperService.paperModel.find({ "schedule_details.is_evaluator": true }).lean();

    const reqs = papers.map(async (e: $TSFixMe) => await refreshBundleByPaperId(e._id));
    await Promise.all(reqs);
};

export const refreshBundleByBundleId = async (bundleId: $TSFixMe) => {
    const bundle = await MarketPlaceBundleModel.findOne({ _id: bundleId, completed: false }).lean();

    if (!bundle) {
        return;
    }

    await refreshBundleByPaperId(bundle.paper._id);
};

export const updateBundleCompleteAction = async (bundleId: $TSFixMe, completed = true) => {
    const updatedBundle = await MarketPlaceBundleModel.findByIdAndUpdate(
        bundleId,
        { completed },
        { returnDocument: "after" }
    );

    return updatedBundle;
};

export const getCurrentMarketPlaceBundles = async () => {
    return MarketPlaceBundleModel.find({
        "paper.is_b2c": false,
        completed: false,
        deleted: false,
    }).lean();
};

export const getCompletedMarketPlaceBundles = async () => {
    return MarketPlaceBundleModel.find({
        "paper.is_b2c": false,
        completed: true,
        deleted: false,
    }).lean();
};

export const refreshBundleByCopiesId = async (copies: $TSFixMe) => {
    if (copies.length !== 0) {
        const copy = await EvaluationCopyService.findEvaluationCopyById(copies[0]);

        if (copy) {
            await refreshBundleByPaperId(copy.paper.toString());
        } else {
            throw new Error(`Error: unable to refresh bundle for copies [${copies.join(",")}]`);
        }
    }
};

export async function refreshMarketPlaceBundle() {
    await createMarketPlaceBundlesForLegacy();
}

export async function getBundleByFilter(boards: string[], classes: string[], subjects: string[]) {
    const bundles = await MarketPlaceBundleModel.find({
        "paper.board": { $in: boards },
        "paper.class": { $in: classes },
        "paper.subject": { $in: subjects },
        "paper.schedule_details.is_evaluator": true,
        "un_assigned_copies.no_of_copies": { $gt: 0 },
        completed: false,
        deleted: false,
    })
        .sort("-created_at")
        .lean();

    return {
        count: bundles.length,
        bundles: bundles.map((bundle) => {
            return {
                paper: bundle.paper,
                copies: bundle.un_assigned_copies.copies,
                no_of_copies: bundle.un_assigned_copies.no_of_copies,
            };
        }),
    };
}

export async function findB2CMarketPlaceBundlesByPaperIds(paperIds: string[]) {
    const list = await MarketPlaceBundleModel.find({ "paper._id": { $in: paperIds } }).lean();
    return list;
}

export async function findReviewCopiesByReviewerId(reviewerId: string) {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                "inreview_copies.copies.teacher_id": reviewerId,
            },
        },
        {
            $project: {
                paper: 1,
                copies: {
                    $filter: {
                        input: "$inreview_copies.copies",
                        as: "copy",
                        cond: { $eq: ["$$copy.teacher_id", reviewerId] },
                    },
                },
            },
        },
        {
            $project: {
                paper: 1,
                copies: {
                    $reduce: {
                        input: "$copies.copies",
                        initialValue: [],
                        in: { $concatArrays: ["$$value", "$$this"] },
                    },
                },
            },
        },
        {
            $project: {
                paper: 1,
                copies: 1,
                no_of_copies: { $size: "$copies" },
            },
        },
    ];

    return await MarketPlaceBundleModel.aggregate(pipeline);
}

export async function findAssignedCopiesByEvaluatorId(evaluatorId: string, type: "assigned" | "checked" = "assigned") {
    const pipeline: PipelineStage[] = [
        {
            $match: {
                [`${type}_copies.copies.teacher_id`]: evaluatorId,
                completed: false,
            },
        },
        {
            $project: {
                paper: 1,
                copies: {
                    $filter: {
                        input: `$${type}_copies.copies`,
                        as: "copy",
                        cond: {
                            $eq: ["$$copy.teacher_id", evaluatorId],
                        },
                    },
                },
            },
        },
        {
            $project: {
                paper: 1,
                copies: {
                    $first: "$copies",
                },
            },
        },
        {
            $project: {
                _id: 0,
                paper: 1,
                copies: "$copies.copies",
                assigned_time: "$copies.assigned_time",
                no_of_copies: { $size: "$copies.copies" },
            },
        },
    ];

    return await MarketPlaceBundleModel.aggregate(pipeline);
}

export async function findBundleSearchFilterOptions({
    isb2c,
    bundleCompleted,
}: {
    isb2c: boolean;
    bundleCompleted: boolean;
}) {
    const filter = { completed: bundleCompleted, "paper.is_b2c": isb2c };

    const resultPromise = await Promise.all<string[]>([
        MarketPlaceBundleModel.distinct("paper.school", filter),
        MarketPlaceBundleModel.distinct("paper.board", filter),
        MarketPlaceBundleModel.distinct("paper.class", filter),
        MarketPlaceBundleModel.distinct("paper.subject", filter),
    ]);

    return {
        school: resultPromise[0],
        board: resultPromise[1],
        class: resultPromise[2],
        subject: resultPromise[3],
    };
}

export async function findDistinctEvaluatorsInBundles({
    isb2c = false,
    bundleCompleted = false,
}: {
    isb2c: boolean;
    bundleCompleted: boolean;
}) {
    const evaluators = await Promise.all([
        MarketPlaceBundleModel.distinct<string>("assigned_copies.copies.teacher_id", {
            completed: bundleCompleted,
            "paper.is_b2c": isb2c,
        }),
        MarketPlaceBundleModel.distinct<string>("checked_copies.copies.teacher_id", {
            completed: bundleCompleted,
            "paper.is_b2c": isb2c,
        }),
        MarketPlaceBundleModel.distinct<string>("inreview_copies.copies.teacher_id", {
            completed: bundleCompleted,
            "paper.is_b2c": isb2c,
        }),
    ]);

    return await evaluatorModel.find({ _id: { $in: evaluators.flat() } }, { name: 1 }).lean();
}
