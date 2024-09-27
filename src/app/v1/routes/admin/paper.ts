import type { FlattenMaps } from "mongoose";
import type { FastifyPluginAsync } from "fastify";

import type { IDBPaper } from "../../../../database/models/Paper.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { findPapersBySchoolIdAndType, updatePaperbyId } from "../../../../services/db/paper.js";

export const adminPaperRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     *  @rotue   GET "/api/v1/admin/school/paper?school&type"
     *  @desc    get All Papers of School by type
     */
    fastify.route({
        method: "GET",
        url: "/admin/school/paper",
        handler: async (req, res) => {
            const { school, type } = req.query as { school: string; type: string };
            const papers = await findPapersBySchoolIdAndType(school, type);
            return sendSuccessResponse({
                data: papers,
                response: res,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/admin/school/paper/update"
     *  @desc    update paper by id
     */
    fastify.route({
        method: "POST",
        url: "/admin/school/paper/update",
        handler: async (req, res) => {
            const body = req.body;
            const result = await updatePaperbyId(body);

            return sendSuccessResponse({
                data: result,
                response: res,
            });
        },
    });

    /**
     * @route   POST "/api/v1/admin/school/paper/objective/update-answer"
     * @desc    update objective paper answer
     */
    fastify.route({
        method: "POST",
        url: "/admin/school/paper/objective/update-answer",
        handler: async (req, res) => {
            const body = req.body as FlattenMaps<IDBPaper>;

            const result = await updatePaperbyId(body);

            return sendSuccessResponse({
                data: result,
                response: res,
            });
        },
    });
};
