import type { FastifyPluginAsync } from "fastify";
import datefns from "date-fns";

import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import {
    FcmService,
    PaperService,
    ResultService,
    EvaluatorService,
    StudentCopyService,
    EvaluationCopyService,
    EvaluatorHistoryService,
    MarketplaceBundleService,
    MarketPaperBundleService,
    PurchasedPaperBundleService,
} from "../../../../services/index.js";
import { getRatingsForPaper, migrateOldRating } from "../../../../services/db/rating.js";

const bundleOrderTypes = {
    dsc: "new-to-old",
    asc: "old-to-new",
    mostCopies: "most-copies",
    mostAssigned: "most-assigned",
    mostUnassigned: "most-unassigned",
    mostChecked: "most-checked",
} as const;

function createSortingConfig(orderType: (typeof bundleOrderTypes)[keyof typeof bundleOrderTypes]) {
    switch (orderType) {
        case bundleOrderTypes.asc: {
            return { created_at: 1 };
        }

        case bundleOrderTypes.dsc: {
            return { created_at: -1 };
        }

        case bundleOrderTypes.mostCopies: {
            return { no_of_copies: -1 };
        }

        case bundleOrderTypes.mostAssigned: {
            return { "assigned_copies.no_of_copies": -1 };
        }

        case bundleOrderTypes.mostChecked: {
            return { "checked_copies.no_of_copies": -1 };
        }

        case bundleOrderTypes.mostUnassigned: {
            return { "un_assigned_copies.no_of_copies": -1 };
        }

        default: {
            return { created_at: -1 };
        }
    }
}

export const adminMarketplaceCopiesRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   GET "/api/v1/admin/marketplaceCopies/filters?isB2c"
     * @desc    get market bundles filters
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/filters",
        handler: async (req, res) => {
            const query = await validate(
                yup.object({
                    completed_bundle: yup.boolean().default(false),
                }),
                req.query
            );

            req.log.info(query, "filters api query body");

            return sendSuccessResponse({
                response: res,
                data: {
                    evaluators: {
                        non_b2c: await MarketplaceBundleService.findDistinctEvaluatorsInBundles({
                            isb2c: false,
                            bundleCompleted: query.completed_bundle,
                        }),
                        b2c: await MarketplaceBundleService.findDistinctEvaluatorsInBundles({
                            isb2c: true,
                            bundleCompleted: query.completed_bundle,
                        }),
                    },
                    filterOptions: {
                        order: Object.values(bundleOrderTypes),
                        b2c: await MarketplaceBundleService.findBundleSearchFilterOptions({
                            isb2c: true,
                            bundleCompleted: query.completed_bundle,
                        }),
                        non_b2c: await MarketplaceBundleService.findBundleSearchFilterOptions({
                            isb2c: false,
                            bundleCompleted: query.completed_bundle,
                        }),
                    },
                    total_bundles: {
                        non_b2c: await MarketplaceBundleService.marketplacebundleModel.countDocuments({
                            completed: query.completed_bundle,
                            "paper.is_b2c": false,
                        }),
                        b2c: await MarketplaceBundleService.marketplacebundleModel.countDocuments({
                            completed: query.completed_bundle,
                            "paper.is_b2c": true,
                        }),
                    },
                },
            });
        },
    });

    /**
     * @route   POST "/api/v1/admin/marketplaceCopies/bundles"
     * @desc    get market bundles
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/bundles",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    page: yup.number().default(0),
                    limit: yup.number().default(10),
                    is_b2c: yup.boolean().default(false),
                    order: yup.string().oneOf(Object.values(bundleOrderTypes)).default(bundleOrderTypes.dsc),
                    teacher: yup.string(),
                    school: yup.string(),
                    board: yup.string(),
                    class: yup.string(),
                    completed_bundle: yup.boolean().default(false),
                }),
                req.body
            );

            const searchFilter = {
                completed: body.completed_bundle,
                "paper.is_b2c": body.is_b2c,
                ...{
                    ...(body.school && { "paper.school": body.school }),
                    ...(body.board && { "paper.board": body.board }),
                    ...(body.class && { "paper.class": body.class }),
                },
                ...(body.teacher
                    ? {
                          $or: [
                              { "checked_copies.copies.teacher_id": body.teacher },
                              { "assigned_copies.copies.teacher_id": body.teacher },
                              { "inreview_copies.copies.teacher_id": body.teacher },
                          ],
                      }
                    : {}),
            };

            const projection = {
                no_of_copies: 1,
                checked_copies: 1,
                assigned_copies: 1,
                submitted_copies: 1,
                un_assigned_copies: 1,
                inreview_copies: 1,
                completed: 1,
                copies: 1,
                paper: {
                    _id: 1,
                    name: 1,
                    school: 1,
                    board: 1,
                    batch: 1,
                    class: 1,
                    subject: 1,
                    schedule_details: {
                        start_time: 1,
                        end_time: 1,
                    },
                },
                created_at: 1,
            };

            const options = {
                skip: body.page * body.limit,
                limit: body.limit,
                sort: createSortingConfig(body.order),
                lean: true,
            };

            const bundles = await MarketplaceBundleService.marketplacebundleModel
                .find(searchFilter, projection, options)
                .lean();

            return sendSuccessResponse({
                response: res,
                data: {
                    bundles,
                    count: bundles.length,
                    filters: body,
                },
            });
        },
    });

    /**
     * @route   POST "/api/v1/admin/marketplaceCopies/bundle/update"
     * @desc    Update marketplace bundle
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/bundle/update",
        handler: async (req, res) => {
            const { bundle_id, completed = true } = req.body as { bundle_id: string; completed: boolean };
            const bundle = await MarketplaceBundleService.updateBundleCompleteAction(bundle_id, completed);

            return sendSuccessResponse({ response: res, data: bundle });
        },
    });

    /**
     * @route   GET "/api/v1/admin/marketplaceCopies/getMarktePlaceCopiesWithoutId"
     * @desc    List of Copies of Marketplace
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/getMarktePlaceCopiesWithoutId",
        handler: async (req, res) => {
            const evaluators = await EvaluatorService.getMarketPlaceCopiesAdmin({ is_result_declared: false });

            return sendSuccessResponse({
                data: evaluators,
                response: res,
            });
        },
    });

    /**
     *  @rotue   GET "/api/v1/admin/marketplaceCopies/getB2cMarketPlaceBundles?isDemo=false"
     *  @desc    get All MarketPlaceCopies of b2c for demo
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/getB2cMarketPlaceBundles",
        handler: async (req, res) => {
            const allMarketBundles = await MarketPaperBundleService.getAllMarketPaperBundle();

            const paperIds = allMarketBundles
                .map((bundle) => bundle.paper_list)
                .flat()
                .map((paper) => paper._id?.toString())
                .filter(Boolean);

            const bundles = await MarketplaceBundleService.findB2CMarketPlaceBundlesByPaperIds(paperIds);

            return sendSuccessResponse({
                data: { count: bundles.length, bundles: bundles, no_of_pages: 1 },
                response: res,
            });
        },
    });

    /**
     * @route   GET "/api/v1/admin/marketplaceCopies/getOurMarktePlaceCopiesWithoutId"
     * @desc    List of Copies of Marketplace
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/getOurMarktePlaceCopiesWithoutId",
        handler: async (req, res) => {
            const evaluators = await EvaluatorService.getMarketPlaceCopiesAdmin({
                is_result_declared: true,
            });

            return sendSuccessResponse({
                data: evaluators,
                response: res,
            });
        },
    });

    /**
     * @route   GET "/api/v1/admin/marketplaceCopies/getTeacherById"
     * @desc    Get Teacher Details by teacher Id
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/getEvaluatorProfileData",
        handler: async (req, res) => {
            const { id } = req.query as { id: string };
            const user = await EvaluatorService.evaluatorModel.findById(id, "-otp").lean();

            if (user) {
                return sendSuccessResponse({ data: user, response: res });
            } else {
                return sendErrorResponse({
                    code: 400,
                    msg: "Evaluator No Found",
                    response: res,
                });
            }
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/marketplaceCopies/assignCopiesToReview"
     * @desc    assign copies to evaluator for review
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/assignCopiesToReview",
        handler: async (req, res) => {
            const { evaluation_copies, review_evaluator_id, paper_id } = req.body as {
                evaluation_copies: string[];
                review_evaluator_id: string;
                paper_id: string;
            };
            await EvaluationCopyService.assignCopiesForReview(review_evaluator_id, evaluation_copies, paper_id);

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @route   PUT "/api/v1/admin/marketplaceCopies/review/update-duration"
     * @desc    update review status duration
     */
    fastify.route({
        method: "PUT",
        url: "/admin/marketplaceCopies/review/update-duration",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    copy_ids: yup.array(yup.string().required()).required(),
                    bundle_id: yup.string().required(),
                    amount: yup.number().required(),
                }),
                req.body
            );

            for (const copyId of body.copy_ids) {
                try {
                    const evaluationCopy = await EvaluationCopyService.evaluationCopyModel.findById(copyId).orFail();
                    evaluationCopy.evaluator_review_details.status_duration = datefns.addMinutes(
                        evaluationCopy.evaluator_review_details.status_duration,
                        body.amount
                    );
                    await evaluationCopy.save();
                } catch {
                    req.log.warn(copyId, "unable to update copy status duration");
                }
            }

            return sendSuccessResponse({ response: res, msg: "successfully update review duration" });
        },
    });

    /**
     * @route   POST "/api/v1/admin/marketplaceCopies/dropReviewCopies"
     * @desc    assgin checked copies to evaluators for review
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/dropReviewCopies",
        handler: async (req, res) => {
            const { evaluation_copies: copyIds, review_evaluator_id: reviewEvaluatorId } = req.body as {
                evaluation_copies: string[];
                review_evaluator_id: string;
            };

            const assignedCopies = copyIds.map(async (id) => {
                await EvaluationCopyService.updateEvaluationReview({ evaluationCopyId: id, status: "dropped" });
            });

            await Promise.allSettled(assignedCopies);
            await EvaluatorHistoryService.addReviewEvaluatorHistory("Dropped", reviewEvaluatorId, copyIds);

            const evaluationCopy = await EvaluationCopyService.evaluationCopyModel
                .findById(copyIds[0], "evaluator_review_details associate_teacher")
                .lean();

            if (!evaluationCopy) {
                await sendSuccessResponse({ response: res });
            } else {
                await sendSuccessResponse({ response: res });

                await FcmService.sendMultipleNotification([
                    {
                        user_id: evaluationCopy.evaluator_review_details.reviewer_id,
                        message: "Your copy is dropped from review",
                    },
                    {
                        user_id: evaluationCopy.associate_teacher.teacher_id.toString(),
                        message: "Your copy is dropped from review",
                    },
                ]);
            }
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/marketplaceCopies/assignCopiesToEvaluator"
     * @desc  assign copies to evaluator by copy id list
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/assignCopiesToEvaluator",
        handler: async (req, res) => {
            const { ids, is_b2c = false } = req.body as { ids: string[]; is_b2c: boolean };
            const { id } = req.query as { id: string };
            const copies = await EvaluatorService.assignCopiesToEvaluator(id, ids);

            if (is_b2c) {
                // use to b2c identify b2c copies and
                const copiesData = await EvaluationCopyService.fetchEvaluationCopiesByIds(ids);
                await Promise.allSettled(
                    copiesData.map((copy: $TSFixMe) => PurchasedPaperBundleService.evaluateBundlePaperById(copy))
                );
            }

            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/marketplaceCopies/unassignCopies"
     * @desc   unassign Copy form evaluator
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/unassignCopies",
        handler: async (req, res) => {
            const { ids, evaluatorId, reason } = req.body as { ids: string[]; evaluatorId: string; reason: string };

            await EvaluatorService.removeAssignedCopiesByEvaluatorId(ids, evaluatorId, reason);
            return sendSuccessResponse({ data: [], response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/marketplaceCopies/getEvaluationCopiesData"
     * @desc   Get Evaluation Copies Data
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/getEvaluationCopiesData",
        handler: async (req, res) => {
            const { ids } = req.body as { ids: string[] };

            const copies = await EvaluationCopyService.fetchEvaluationCopiesByIds(ids);
            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/marketplaceCopies/getEvaluationCopiesData"
     * @desc   Assign Copy For Recheck
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/assignCopyForRecheck",
        handler: async (req, res) => {
            const { ids } = req.body as { ids: string[] };

            const copies = await EvaluationCopyService.evaluationCopyModel
                .updateMany(
                    { _id: { $in: ids } },
                    {
                        "associate_teacher.is_submitted": false,
                        "associate_teacher.checked_copy": "",
                    }
                )
                .lean();
            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/marketplaceCopies/submitCopies"
     * @desc    Submit Copies After Checked
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/submitCopies",
        handler: async (req, res) => {
            const {
                ids,
                is_b2c,
                evaluator_id: evaluatorId,
            } = req.body as { ids: string[]; is_b2c: string; evaluator_id: string };

            const copies = await EvaluationCopyService.evaluationCopyModel
                .updateMany(
                    { _id: { $in: ids } },
                    {
                        "associate_teacher.is_submitted": true,
                    }
                )
                .lean();

            // checking if paper is type of b2c and we need to declare the result after the submit of copies
            if (is_b2c) {
                //  then we need to declare the result of the following copies and update the status of copies
                const resultList = await Promise.allSettled(
                    ids.map(async (copyId) => {
                        const teacherEvaluationCopy = await EvaluationCopyService.evaluationCopyModel
                            .findById(copyId)
                            .lean();
                        if (!teacherEvaluationCopy) {
                            throw new Error();
                        }

                        let result = await ResultService.resultModel
                            .findOne({ paper: teacherEvaluationCopy.paper, student: teacherEvaluationCopy.student })
                            .lean();

                        // check if student result already exists
                        if (!result) {
                            // create new result copy for student
                            const copy = await EvaluationCopyService.evaluationCopyModel
                                .findByIdAndUpdate(
                                    copyId,
                                    {
                                        is_result_declared: true,
                                    },
                                    { returnDocument: "after" }
                                )
                                .lean();

                            result = await ResultService.createStudentResultCopy({
                                ...copy,
                                checked_teachers: [copy?.associate_teacher?.teacher_id ?? ""],
                            });

                            return result;
                        } else {
                            // update previous evalaution copy with current result
                            await EvaluationCopyService.evaluationCopyModel.updateMany(
                                {
                                    paper: teacherEvaluationCopy.paper,
                                    student: teacherEvaluationCopy.student,
                                },
                                { is_result_declared: false }
                            );

                            const newEvaluationCopy = await EvaluationCopyService.evaluationCopyModel
                                .findByIdAndUpdate(
                                    copyId,
                                    {
                                        is_result_declared: true,
                                    },
                                    { returnDocument: "after" }
                                )
                                .lean();

                            // replace result with new result
                            result = await ResultService.resultModel
                                .findOneAndUpdate(
                                    { _id: result._id.toString() },
                                    {
                                        associate_teacher: newEvaluationCopy?.associate_teacher ?? "",
                                        submission_details: newEvaluationCopy?.submission_details ?? "",
                                        checked_teachers: [],
                                        updated_by: evaluatorId,
                                    },
                                    {
                                        returnDocument: "after",
                                    }
                                )
                                .lean();

                            return result;
                        }
                    })
                );

                // after declareing result we need to update the status of each copy in student purchase bundle
                await Promise.allSettled(
                    resultList.map(async (resultCopy) => {
                        if (resultCopy.status === "fulfilled") {
                            await PurchasedPaperBundleService.declareResultOfBundlePaperByCopy(resultCopy.value);
                        } else {
                            req.log.error(resultCopy, "error in submit copies");
                        }
                    })
                );
            }

            // creating histories
            await EvaluatorHistoryService.addSubmittedEvaluatorHistory(evaluatorId, ids);
            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     *  @rotue   POST "/api/v1/admin/addInstructionToPaper"
     *  @desc    Add instructions to specific paper for copy checking
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/addInstructionToPaper",
        handler: async (req, res) => {
            const { paper_id, instructions, level_of_checking } = req.body as {
                paper_id: string;
                instructions: string[];
                level_of_checking: string;
            };

            const result = await PaperService.addInstructionToPaper(paper_id, instructions, level_of_checking);

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     *  @rotue   POST "/api/v1/admin/refreshMarketPlaceBundles"
     *  @desc    use to refresh the market bundles on the basis of current papers and copies of evaluator
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/refreshMarketPlaceCopies",
        handler: async (req, res) => {
            await MarketplaceBundleService.refreshMarketPlaceBundle();
            return sendSuccessResponse({ response: res });
        },
    });

    /**
     *  @rotue   POST "/api/v1/admin/removeCopyFromMarketPlace"
     *  @desc   use to remove copies from market place
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/removeCopyFromMarketPlace",
        handler: async (req, res) => {
            const { ids } = req.body as { ids: string[] };

            const evaluationCopies = await EvaluationCopyService.evaluationCopyModel.find({ _id: { $in: ids } });

            if (!evaluationCopies.length) {
                return sendErrorResponse({ response: res, msg: "no evalaution copy found" });
            }

            const result = evaluationCopies
                .map((copy) => {
                    const promises = [];
                    promises.push(EvaluationCopyService.deleteEvalutionCopyById(copy._id.toString()));
                    promises.push(
                        StudentCopyService.deleteStudentCopyByStudentIdAndPaperId({
                            studentId: copy.student.toString(),
                            paperId: copy.paper.toString(),
                        })
                    );
                    return promises;
                })
                .flat();

            await Promise.all(result);
            await MarketplaceBundleService.refreshBundleByPaperId(evaluationCopies[0].paper.toString());

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     *  @rotue   GET "/api/v1/admin/marketplaceCopies/bundle/:bundleId/refresh"
     *  @desc    refresh bundle by bundle id
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/bundle/:bundleId/refresh",
        handler: async (req, res) => {
            const { bundleId } = req.params as { bundleId: string };

            await MarketplaceBundleService.refreshBundleByBundleId(bundleId);
            return sendSuccessResponse({ response: res });
        },
    });

    /**
     *  @rotue   POST "/api/v1/admin/marketplaceCopies/bundle/:bundleId/revertSubmitCopies"
     *  @desc    revert submit copies from bundle
     */
    fastify.route({
        method: "POST",
        url: "/admin/marketplaceCopies/bundle/:bundleId/revertSubmitCopies",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    bundleId: yup.string().required(),
                    copyIds: yup.array().of(yup.string()).min(1).required(),
                    paperId: yup.string().required(),
                    evaluatorId: yup.string().required(),
                }),
                {
                    ...(req.body as { copyIds: string[]; paperId: string; evaluatorId: string }),
                    ...(req.params as { bundleId: string }),
                }
            );

            const evaluationCopies = await EvaluationCopyService.evaluationCopyModel
                .find({ _id: { $in: body.copyIds }, "associate_teacher.is_submitted": true }, { student: 1 })
                .lean();

            await EvaluationCopyService.evaluationCopyModel.updateMany(
                { _id: { $in: body.copyIds }, "associate_teacher.is_submitted": true },
                { "associate_teacher.is_submitted": false, is_result_declared: false }
            );

            await ResultService.resultModel.deleteMany({
                paper: body.paperId,
                student: { $in: evaluationCopies.map((doc) => doc.student) },
            });

            await EvaluatorHistoryService.evaluatorHistoryModel.findOneAndUpdate(
                {
                    action: "Submitted",
                    evaluator: body.evaluatorId,
                    copies: { $all: body.copyIds },
                },
                {
                    action: "Reverted",
                }
            );

            await MarketplaceBundleService.refreshBundleByBundleId(body.bundleId);

            return sendSuccessResponse({ data: evaluationCopies, response: res });
        },
    });
    /**
     *  @rotue   GET "/api/v1/admin/marketplaceCopies/bundle-ratings/:paper"
     *  @desc    get ratings for market place bundle ratings
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/bundle-ratings/:paper",
        handler: async (req, res) => {
            const params = await validate(yup.object({ paper: yup.string().required() }).required(), req.params);

            const paperRatings = await getRatingsForPaper(params.paper);

            if (paperRatings) {
                return sendSuccessResponse({
                    response: res,
                    data: paperRatings,
                });
            } else {
                return sendErrorResponse({
                    response: res,
                    msg: "No ratings found",
                });
            }
        },
    });
    /**
     *  @rotue   GET "/api/v1/admin/marketplaceCopies/migrate-old-rating"
     *  @desc    use to migrate old rating system to new
     */
    fastify.route({
        method: "GET",
        url: "/admin/marketplaceCopies/migrate-old-rating",
        handler: async (req, res) => {
            await migrateOldRating();
            return sendSuccessResponse({ response: res });
        },
    });
};
