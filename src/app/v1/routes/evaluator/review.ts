import type { FastifyPluginAsync } from "fastify";

import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import {
    FcmService,
    MarketplaceBundleService,
    CopyReviewService,
    EvaluationCopyService,
} from "../../../../services/index.js";

export const evaluatorReviewRotues: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/evaluator/review/copies"
     * @desc    get review copies for evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/review/copies",
        handler: async (req, res) => {
            const { id: evaluatorId } = req.payload;

            return sendSuccessResponse({
                response: res,
                data: await MarketplaceBundleService.findReviewCopiesByReviewerId(evaluatorId),
            });
        },
    });

    /**
     * @rotue   PUT "/evaluator/review/submit"
     * @desc    submit review copies for evaluator
     */
    fastify.route({
        method: "PUT",
        url: "/evaluator/review/submit",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    status: yup.string().oneOf(["in-review", "approved", "re-checking"]).required(),
                    copy_id: yup.string().required(),
                    details: yup.array().required(),
                }),
                req.body
            );

            await EvaluationCopyService.updateEvaluationReview({
                status: body.status,
                details: body.details,
                evaluationCopyId: body.copy_id,
            });

            await sendSuccessResponse({ response: res });

            const evaluationCopy = await EvaluationCopyService.evaluationCopyModel
                .findById(body.copy_id, "evaluator_review_details associate_teacher paper")
                .lean();

            if (evaluationCopy) {
                if (body.status === "in-review") {
                    await FcmService.sendNotification({
                        user_id: evaluationCopy.evaluator_review_details.reviewer_id,
                        message: `You have a copy for review`,
                    });
                }

                if (body.status === "re-checking") {
                    await FcmService.sendNotification({
                        user_id: evaluationCopy.associate_teacher.teacher_id.toString(),
                        message: `You have a copy for re-checking`,
                    });
                }

                if (body.status === "approved") {
                    await FcmService.sendNotification({
                        user_id: evaluationCopy.associate_teacher.teacher_id.toString(),
                        message: `Your copy is approved by reviewer`,
                    });
                }
            }
        },
    });

    /**
     * @rotue   GET "/evaluator/review/:review_id"
     * @desc    get review copies history for evaluator
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/review/:review_id",
        handler: async (req, res) => {
            const { review_id } = await validate(yup.object({ review_id: yup.string().required() }), req.params);
            return sendSuccessResponse({ response: res, data: await CopyReviewService.findReviewById(review_id) });
        },
    });

    /**
     * @route   GET "/evaluator/review/check-details/:check_id"
     * @desc    get past review check details
     */
    fastify.route({
        method: "GET",
        url: "/evaluator/review/check-details/:check_id",
        handler: async (req, res) => {
            const { check_id } = await validate(yup.object({ check_id: yup.string().required() }), req.params);
            return sendSuccessResponse({ response: res, data: await CopyReviewService.findCheckDetailsById(check_id) });
        },
    });
};
