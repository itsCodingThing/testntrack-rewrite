import lodash from "lodash";
import type { FastifyPluginAsync } from "fastify";

import { sortDates } from "../../../../utils/date.js";
import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import {
    EvaluatorService,
    EvaluatorHistoryService,
    PurchasedPaperBundleService,
    EvaluationCopyService,
    MarketplaceBundleService,
    FcmService,
} from "../../../../services/index.js";

export const copiesRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/evaluator/getMarketPlaceCopies "
     * @desc    getCopies for MarketPlace
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/getMarketPlaceCopies",
        handler: async (req, res) => {
            const { boards, classes, subjects } = await validate(
                yup.object({
                    boards: yup.array().of(yup.string().required()).required(),
                    classes: yup.array().of(yup.string().required()).required(),
                    subjects: yup.array().of(yup.string().required()).required(),
                }),
                req.body
            );

            const bundles = await MarketplaceBundleService.marketplacebundleModel
                .find({
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

            const copies = {
                count: bundles.length,
                bundles: bundles.map((bundle) => {
                    return {
                        paper: bundle.paper,
                        copies: bundle.un_assigned_copies.copies,
                        no_of_copies: bundle.un_assigned_copies.no_of_copies,
                    };
                }),
            };

            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   POST "/evaluator/getCopiesDetailListById "
     * @desc    get Details of copies by id list fo copies
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/getCopiesDetailsById",
        handler: async (req, res) => {
            const { ids } = await validate(
                yup.object({
                    ids: yup.array().of(yup.string().required()).required(),
                }),
                req.body
            );

            const copies = await EvaluationCopyService.evaluationCopyModel.find({ _id: { $in: ids } }).lean();

            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   POST "/evaluator/assignCopiesToEvaluator "
     * @desc    assign copies to evaluator by copy id list
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/assignCopiesToEvaluator",
        handler: async (req, res) => {
            const { ids, is_b2c } = await validate(
                yup.object({
                    is_b2c: yup
                        .boolean()
                        .default(() => false)
                        .required(),
                    ids: yup.array().of(yup.string().required()).required(),
                }),
                req.body
            );

            const copies = await EvaluatorService.assignCopiesToEvaluator(req.payload.id, ids);

            // checking the copy is from b2c then we need to look for sending and updating respective notification
            if (is_b2c) {
                // use to b2c identify b2c copies and
                const copiesData = await EvaluationCopyService.fetchEvaluationCopiesByIds(ids);
                await Promise.allSettled(
                    copiesData.map((copy) => PurchasedPaperBundleService.evaluateBundlePaperById(copy))
                );
            }

            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   GET "/evaluator/getAssignedCopies "
     * @desc    list of copies assigned copies to evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/getAssignedCopies",
        handler: async (req, res) => {
            const { id: evaluatorId } = req.payload;

            const bundles = await MarketplaceBundleService.findAssignedCopiesByEvaluatorId(evaluatorId, "assigned");
            const responseBundles = [];

            // add assigned time for bundle
            for (const bundle of bundles) {
                if (lodash.isEmpty(bundle.assigned_time)) {
                    const copies = await EvaluationCopyService.evaluationCopyModel
                        .find({ _id: { $in: bundle.copies } }, "associate_teacher")
                        .lean();

                    const dates = sortDates(
                        copies.map((copy) => new Date(copy.associate_teacher?.assigned_time ?? "")),
                        "desc"
                    );

                    bundle.assigned_time = dates?.[0] ?? new Date().toISOString();
                    responseBundles.push(bundle);
                } else {
                    responseBundles.push(bundle);
                }
            }

            return sendSuccessResponse({
                data: { bundles: responseBundles, count: responseBundles.length },
                response: res,
            });
        },
    });

    /**
     * @rotue   GET "/evaluator/getCheckedCopies "
     * @desc    list of checked copies to evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/getCheckedCopies",
        handler: async (req, res) => {
            const { id: evaluatorId } = req.payload;

            const bundles = await MarketplaceBundleService.findAssignedCopiesByEvaluatorId(evaluatorId, "checked");

            const responseBundles = [];

            // add assigned time for bundle
            for (const bundle of bundles) {
                if (lodash.isEmpty(bundle.assigned_time)) {
                    const copies = await EvaluationCopyService.evaluationCopyModel
                        .find({ _id: { $in: bundle.copies } }, "associate_teacher")
                        .lean();

                    const dates = sortDates(
                        copies.map((copy) => new Date(copy.associate_teacher?.assigned_time ?? "")),
                        "desc"
                    );

                    bundle.assigned_time = dates?.[0] ?? new Date().toISOString();
                    responseBundles.push(bundle);
                } else {
                    responseBundles.push(bundle);
                }
            }

            return sendSuccessResponse({
                data: { bundles: responseBundles, count: responseBundles.length },
                response: res,
            });
        },
    });

    /**
     * @rotue   POST "/evaluator/updateEvaluatorCopy"
     * @desc    update copy of evaluator during copy check
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/updateEvaluatorCopy",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    id: yup.string().required(),
                    update: yup.object().required(),
                }),
                req.body,
                { stripUnknown: false }
            );

            const copies = await EvaluatorService.updateEvaluatorCopyById(body.id, body.update);

            return sendSuccessResponse({ data: copies, response: res });
        },
    });

    /**
     * @rotue   GET "/evaluator/getEvaluatorHistory"
     * @desc    get lifetime history of the evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/getEvaluatorHistory",
        handler: async (req, res) => {
            return sendSuccessResponse({
                data: await EvaluatorHistoryService.findEvaluatorHistoryByEvaluatorId(req.payload.id),
                response: res,
            });
        },
    });

    /**
     * @rotue   GET "/evaluator/getEvaluatorWallet"
     * @desc    get lifetime history of the evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/getEvaluatorWallet",
        handler: async (req, res) => {
            return sendSuccessResponse({
                data: await EvaluatorHistoryService.findEvaluatorWalletByEvaluatorId(req.payload.id),
                response: res,
            });
        },
    });

    /**
     * @rotue   POST "/evaluator/copyRejection"
     * @desc    update rejection process for evaluation copy for b2c paper
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/copyRejection",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    status: yup.string().oneOf(["rejected", "approved"]).required(), // only rejected and approved status are allowed
                    bundle_id: yup.string(),
                    paper_id: yup.string().required(),
                    copy_id: yup.string().required(),
                    student_id: yup.string().required(),
                    reason: yup.string(),
                    rejected_copy: yup.string(),
                }),
                req.body
            );

            const bundle = await PurchasedPaperBundleService.findBundleByEvaluationCopy(body.copy_id);
            if (!bundle) {
                return sendErrorResponse({
                    response: res,
                    msg: "No bundle found",
                });
            }

            body.bundle_id = bundle._id.toString();

            await PurchasedPaperBundleService.updateBundlePaperStatus({
                bundleId: body.bundle_id,
                paperId: body.paper_id,
                status: body.status,
                rejectedCopy: body.rejected_copy,
                reason: body.reason,
                copyId: body.copy_id,
            });

            await EvaluationCopyService.updateRejectionStatus({
                status: body.status,
                copyId: body.copy_id,
                reason: body.reason,
            });

            if (body.status === "rejected") {
                await FcmService.sendNotification({
                    user_id: bundle.student_details?._id?.toString(),
                    message: `Your submitted copy is rejected due to ${body.reason}`,
                    url: FcmService.redirect.tnp.paperListScreen({ bundleId: body.bundle_id }),
                });
            }

            if (body.status === "approved") {
                await FcmService.sendNotification({
                    user_id: bundle.student_details?._id?.toString(),
                    message: `Your submitted copy is approved for checking.`,
                    url: FcmService.redirect.tnp.paperListScreen({ bundleId: body.bundle_id }),
                });
            }

            return sendSuccessResponse({ response: res, msg: "Bundle status updated" });
        },
    });
};
