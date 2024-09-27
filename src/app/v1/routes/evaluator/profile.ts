import type { FastifyPluginAsync } from "fastify";
import { yup, validate } from "../../../../utils/validation.js";
import { notificationModel } from "../../../../services/db/notification.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { updateEvaluatorById, getEvaluatorById } from "../../../../services/db/evaluator.js";

import { getRatingsForEvaluator } from "../../../../services/db/rating.js";
export const profileRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   Get "/api/v1/evaluator/getProfile"
     * @desc    Get Evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/getProfile",
        handler: async (req, res) => {
            const { id } = req.payload;

            const user = await getEvaluatorById(id);

            if (user) {
                return sendSuccessResponse({ data: user, response: res });
            } else {
                return sendErrorResponse({
                    code: 400,
                    msg: "No user Found",
                    response: res,
                });
            }
        },
    });

    /**
     * @rotue   POST "/api/v1/evaluator/updateProfile"
     * @desc    Add Evaluator
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/updateProfile",
        handler: async (req, res) => {
            const id = req.payload.id;
            const { update } = await validate(
                yup.object({
                    update: yup.object().required(),
                }),
                req.body,
                { stripUnknown: false }
            );

            const user = await updateEvaluatorById(id, update);

            if (user) {
                return sendSuccessResponse({ data: user, response: res });
            } else {
                return sendErrorResponse({
                    code: 400,
                    msg: "No user Found",
                    response: res,
                });
            }
        },
    });

    /**
     * @rotue   POST "/api/v1/evaluator/notification"
     * @desc    get notification
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/notification",
        handler: async (req, res) => {
            const user_id = req.payload.id;

            if (!user_id) {
                return sendErrorResponse({
                    code: 400,
                    msg: "User Id Required",
                    response: res,
                });
            }

            return sendSuccessResponse({
                response: res,
                data: await notificationModel.find({ user_id: user_id }).sort({ created_at: -1 }).lean(),
            });
        },
    });
    /**
     * @rotue   POST "/api/v1/evaluator/ratings"
     * @desc    get all ratings for evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/ratings",
        handler: async (req, res) => {
            const user_id = req.payload.id;
            const evaluatorRatings = await getRatingsForEvaluator(user_id);

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
};
