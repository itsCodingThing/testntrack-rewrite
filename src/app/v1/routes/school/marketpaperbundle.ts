import type { FastifyPluginAsync } from "fastify";

import {
    createMarketPaperBundle,
    getMarketPaperBundleByBatch,
    deleteMarketPaperBundleById,
} from "../../../../services/db/b2c/marketpaperbundle.js";
import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { addPapersToMarketPaperBundle } from "../../../../services/db/paper.js";

export const schoolMarketPaperRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     *  @rotue   POST "/api/v1/school/marketpaperbundle/create"
     *  @desc    create market paper bundle for selling
     */
    fastify.route({
        method: "POST",
        url: "/school/marketpaperbundle/create",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    bundle_type: yup.string().oneOf(["free", "paid"]).required(),
                    name: yup.string(),
                    banner_image: yup.string(),
                    description: yup.string(),
                    video_url: yup.string(),
                    total_price: yup.number(),
                    total_discount: yup.number(),
                    batch_details: yup.object({
                        _id: yup.string(),
                        name: yup.string(),
                        board: yup.string(),
                        class: yup.string(),
                        subject: yup.array().of(yup.string()),
                    }),
                    bundle_details: yup.array().of(
                        yup.object({
                            price: yup.number(),
                            discount: yup.number(),
                            category: yup.string(),
                            chapters: yup.array().of(yup.string()),
                            topics: yup.array().of(yup.string()),
                        })
                    ),
                    paper_list: yup.array().of(
                        yup.object({
                            _id: yup.string(),
                            bundle_index: yup.number(),
                            name: yup.string(),
                            type: yup.string(),
                            schedule_details: yup.object({
                                start_time: yup.string(),
                                end_time: yup.string(),
                            }),
                            question_details: yup.object({
                                total_marks: yup.number(),
                                no_of_questions: yup.number(),
                                solution_pdf: yup.string(),
                                solution_video: yup.string(),
                                pdf: yup.object({
                                    paper: yup.string(),
                                }),
                            }),
                        })
                    ),
                    entity: yup.array().of(yup.string()),
                    free_entity: yup.array().of(yup.string()),
                    entity_details: yup.array(),
                }),
                req.body
            );
            const result = await createMarketPaperBundle(body);

            // finding ids of papers that needs to be updated for the bundle
            const paperIds = result.paper_list.map((paper: $TSFixMe) => paper._id);

            // updaing the add bundle status of papers that are in the bundle
            await addPapersToMarketPaperBundle(paperIds.flat());

            return sendSuccessResponse({
                data: body,
                response: res,
            });
        },
    });

    /**
     *  @rotue   GET "/api/v1/school/marketpaperbundle?batch"
     *  @desc    use to get market place bundle by batch
     */
    fastify.route({
        method: "GET",
        url: "/school/marketpaperbundle",
        handler: async (req, res) => {
            const { batch } = req.query as { batch: string };

            const list = await getMarketPaperBundleByBatch(batch);

            return sendSuccessResponse({
                data: list,
                response: res,
            });
        },
    });

    /**
     *  @rotue   DELETE "/api/v1/school/marketpaperbundle?id"
     *  @desc    use to delete the market paper bundle by id
     */
    fastify.route({
        method: "DELETE",
        url: "/school/marketpaperbundle",
        handler: async (req, res) => {
            const { id } = req.query as { id: string };

            const deleted = await deleteMarketPaperBundleById(id);

            return sendSuccessResponse({
                data: deleted,
                response: res,
            });
        },
    });
};
