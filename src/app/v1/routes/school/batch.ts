import type { FastifyPluginAsync } from "fastify";

import { validate, yup } from "../../../../utils/validation.js";
import { BatchService, PaperService, SchoolService } from "../../../../services/index.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

export const batchRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/api/v1/school/admin/batch/list?school_id&session_id"
     * @desc    Get all batch list
     */
    fastify.route({
        method: "GET",
        url: "/school/admin/batch/list",
        handler: async (req, res) => {
            const query = await validate(
                yup.object({ school_id: yup.string().required(), session_id: yup.string().required() }),
                req.query
            );
            const list = await BatchService.getBatchesBySchoolIdAndSessionId(query.school_id, query.session_id);

            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/batch/update_batch"
     * @desc    update batch
     */
    fastify.route({
        method: "POST",
        url: "/school/admin/batch/update_batch",
        handler: async (req, res) => {
            const currentUser = req.payload;
            const body = await validate(
                yup.object({ id: yup.string().required(), update: yup.object().required() }),
                req.body,
                { stripUnknown: false }
            );

            await BatchService.updateBatchById({
                id: body.id,
                update: { ...body.update, updated_by: currentUser.id },
            });

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/batch/create_batch"
     * @desc    Add batch in school
     */
    fastify.route({
        method: "POST",
        url: "/school/admin/batch/create_batch",
        handler: async (req, res) => {
            const payload = req.payload;
            const body = await validate(
                yup.object({
                    name: yup.string().required(),
                    school: yup.string().required(),
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.array().of(yup.string().required()).required(),
                    image: yup.string().default(""),
                }),
                req.body
            );

            let school = await SchoolService.schoolModel.findById(body.school, "current_session").lean();

            if (!school) {
                return sendErrorResponse({ response: res, msg: "school does not exists." });
            }

            // add a default session
            if (!school.current_session) {
                const t = await SchoolService.createDefaultSession(body.school);

                if (t) {
                    school = t;
                } else {
                    return sendErrorResponse({ response: res, msg: "school does not exists." });
                }
            }

            const batch = await BatchService.addBatch({
                name: body.name,
                board: body.board,
                class: body.class,
                subject: body.subject,
                image: body.image,
                school: body.school,
                session: school.current_session._id.toString(),
                created_by: payload.id,
            });

            return sendSuccessResponse({ data: batch, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/batch/remove_batch"
     * @desc    remove batch in school
     */
    fastify.route({
        method: "POST",
        url: "/school/admin/batch/remove_batch",
        handler: async (req, res) => {
            const currentUser = req.payload;
            const body = await validate(
                yup.object({ ids: yup.array().of(yup.string().required()).required() }),
                req.body
            );

            for (const id of body.ids) {
                await BatchService.removeBatchById({ id, updated_by: currentUser.id });
            }

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/school/admin/batch/paper-list/:batch_id"
     * @desc    Get paper list by batch id
     */
    fastify.route({
        method: "GET",
        url: "/school/admin/batch/paper-list/:batch_id",
        handler: async (req, res) => {
            const { batch_id } = req.params as { batch_id: string };

            const list = await PaperService.paperModel
                .find({ batch: batch_id, deleted: false })
                .sort("-schedule_details.start_time")
                .lean();

            return sendSuccessResponse({ data: list, response: res });
        },
    });
};
