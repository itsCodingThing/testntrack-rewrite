import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { getNotesListByBatch, removeNotesById, addNotes } from "../../../../services/db/erp/notes.js";

export const notesRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route GET "/api/v1/erp/notes?batch"
     * @desc  GET NOTES OF BATCH
     */
    fastify.route({
        method: "GET",
        url: "/erp/notes",
        handler: async (req, res) => {
            const { batch } = req.query as { batch: string };

            const list = await getNotesListByBatch(batch);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route GET "/api/v1/erp/notes/delete?id"
     * @desc  DELETE NOTES BY ID
     */
    fastify.route({
        method: "GET",
        url: "/erp/notes/delete",
        handler: async (req, res) => {
            const { id } = req.query as { id: string };

            const list = await removeNotesById(id);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route POST "/api/v1/erp/notes"
     * @desc  POST NOTES OF BATCH
     */
    fastify.route({
        method: "POST",
        url: "/erp/notes",
        handler: async (req, res) => {
            const data = await addNotes(req.body);
            return sendSuccessResponse({ data: data, response: res });
        },
    });
};
