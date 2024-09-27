import type { FastifyPluginAsync } from "fastify";

import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { EvaluatorService, RatingService, EvaluatorHistoryService } from "../../../../services/index.js";

export const adminEvaluatorRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   GET "/api/v1/admin/evaluator/ratings"
     * @desc    get evaluator rating history
     */
    fastify.route({
        method: "GET",
        url: "/admin/evaluators/ratings",
        handler: async (req, res) => {
            const query = await validate(
                yup.object({ page: yup.number().default(0), limit: yup.number().default(10) }),
                req.query
            );

            const page = query.page;
            const limit = query.limit;
            const skip = page * limit;

            const alerts = await RatingService.adminRatingAlertModel
                .find()
                .sort({
                    created_at: -1,
                })
                .skip(skip)
                .limit(limit);

            return sendSuccessResponse({
                response: res,
                data: alerts,
            });
        },
    });

    /**
     * @route   POST "/api/v1/admin/evaluator/ratings/update"
     * @desc    get evaluator rating history
     */
    fastify.route({
        method: "POST",
        url: "/admin/evaluators/ratings/update",
        handler: async (req, res) => {
            const body = await validate(yup.object({ id: yup.string().required() }), req.body);

            await RatingService.updateAdminRatingAlertViewed(body.id);
            return sendSuccessResponse({
                response: res,
            });
        },
    });

    /**
     * @route   GET "/api/v1/admin/evaluator/ratings/:evaluator"
     * @desc    get evaluator ratings
     */
    fastify.route({
        method: "GET",
        url: "/admin/evaluators/ratings/:evaluator",
        handler: async (req, res) => {
            const query = await validate(yup.object({ evaluator: yup.string().required() }), req.params);

            const evaluatorRatings = await RatingService.getRatingsForEvaluator(query.evaluator);

            if (evaluatorRatings) {
                return sendSuccessResponse({
                    response: res,
                    data: evaluatorRatings,
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
     * @route   GET "/api/v1/admin/evaluators/getAllEvaluators"
     * @desc    List school by admin
     */
    fastify.route({
        method: "GET",
        url: "/admin/evaluators/getAllEvaluators",
        handler: async (req, res) => {
            const evaluators = await EvaluatorService.getAllEvaluators();

            return sendSuccessResponse({
                data: evaluators,
                response: res,
            });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/evaluators/createEvaluator"
     * @desc   create an evaluator
     */
    fastify.route({
        method: "POST",
        url: "/admin/evaluators/createEvaluator",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    name: yup.string().required(),
                    email: yup.string(),
                    contact: yup.string().required(),
                    boards: yup.array().of(yup.string()).required(),
                    subjects: yup.array().of(yup.string()).required(),
                    classes: yup.array().of(yup.string()).required(),
                    experience: yup.string().required(),
                    status: yup.string().oneOf(["active", "inactive"]).default("active"),
                }),
                req.body
            );

            const found = await EvaluatorService.findEvaluatorByContact(body.contact);

            if (found) {
                return sendErrorResponse({
                    code: 400,
                    msg: "Evaluator already exists",
                    response: res,
                });
            }

            const user = await EvaluatorService.addEvaluator(body);
            return sendSuccessResponse({ data: user, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/evaluators/updateEvaluator"
     * @desc   create an evaluator
     */
    fastify.route({
        method: "POST",
        url: "/admin/evaluators/updateEvaluator",
        handler: async (req, res) => {
            const { id, update } = req.body as { id: string; update: any };

            const user = await EvaluatorService.updateEvaluatorById(id, update);

            return sendSuccessResponse({ data: user, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/admin/evaluators/removeManyEvaluators"
     * @desc  Remove many evaluators
     */
    fastify.route({
        method: "POST",
        url: "/admin/evaluators/removeManyEvaluators",
        handler: async (req, res) => {
            const { ids } = req.body as { ids: string[] };
            const { updatedBy } = req.query as { updatedBy: string };

            const found = await EvaluatorService.removeManyEvaluatorsById(ids, updatedBy);

            return sendSuccessResponse({
                data: found,
                response: res,
            });
        },
    });

    /**
     * @rotue  GET "/api/v1/admin/evaluators/getAllEvaluatorPerformance"
     * @desc   Get Performance of all evaluators
     */
    fastify.route({
        method: "GET",
        url: "/admin/evaluators/getAllEvaluatorPerformance",
        handler: async (req, res) => {
            const list = await EvaluatorHistoryService.findAllEvaluatorPerformance();

            return sendSuccessResponse({
                data: list,
                response: res,
            });
        },
    });

    /**
     * @route   GET "/api/v1/admin/evaluator/:evaluator_id/performance"
     * @desc    Get evalualtor performance by id
     */
    fastify.route({
        method: "GET",
        url: "/admin/evaluator/:evaluator_id/performance",
        handler: async (req, res) => {
            const { paper_id } = req.query as { paper_id: string };
            const { evaluator_id } = req.params as { evaluator_id: string };

            if (paper_id) {
                return sendSuccessResponse({
                    response: res,
                    data: await EvaluatorHistoryService.getEvalautorPerformanceByPaper(evaluator_id, paper_id),
                });
            }

            return sendSuccessResponse({
                response: res,
                data: await EvaluatorHistoryService.getEvalautorPerformance(evaluator_id),
            });
        },
    });

    /**
     * @route   POST "/api/v1/admin/evaluator/:evaluator_id/history/:history_id"
     * @desc    Update evaluator history
     */
    fastify.route({
        method: "POST",
        url: "/admin/evaluator/:evaluator_id/history/:history_id",
        handler: async (req, res) => {
            const { history_id } = req.params as { history_id: string };
            const body = req.body;

            return sendSuccessResponse({
                response: res,
                data: await EvaluatorHistoryService.updateEvaluatorHistory(history_id, body),
            });
        },
    });

    /**
     * @route   DELETE "/api/v1/admin/evaluator/:evaluator_id/history/:history_id"
     * @desc    Delete evaluator history
     */
    fastify.route({
        method: "DELETE",
        url: "/admin/evaluator/:evaluator_id/history/:history_id",
        handler: async (req, res) => {
            const { history_id } = req.params as { history_id: string };

            return sendSuccessResponse({
                response: res,
                data: await EvaluatorHistoryService.deleteEvaluatorHistory(history_id),
            });
        },
    });
};
