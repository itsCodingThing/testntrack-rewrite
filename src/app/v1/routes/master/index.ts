import type { FastifyPluginAsync } from "fastify";

import { PaperService, SchoolService, FcmService } from "../../../../services/index.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

import { roleRoute } from "./role.js";
import { contentRoute } from "./content.js";
import { permissionRoute } from "./permission.js";
import { primaryDataRoute } from "./primaryData.js";

export const masterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.register(roleRoute);
    fastify.register(contentRoute);
    fastify.register(permissionRoute);
    fastify.register(primaryDataRoute);

    /**
     * @rotue   GET "/api/v1/grouped-papers"
     * @desc    get grouped paper by school and batch
     */
    fastify.route({
        method: "GET",
        url: "/paper/grouped-papers",
        handler: async (req, res) => {
            const query = req.query as { board: string; class: string; subject: string; school?: string };

            return sendSuccessResponse({
                response: res,
                data: await PaperService.groupedPapersBySchoolAndBatch(query),
            });
        },
    });

    /**
     * @rotue   GET "/api/v1/code/:code"
     * @desc    Verify school code
     */
    fastify.route({
        method: "GET",
        url: "/code/:code",
        handler: async (req, res) => {
            const params = req.params as $TSFixMe;

            const school = await SchoolService.findSchoolByCode(params.code);

            if (!school) {
                return sendErrorResponse({
                    code: 400,
                    msg: "No school found",
                    response: res,
                });
            }

            return sendSuccessResponse({ data: school._id, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/notification"
     * @desc    Trigger notification for fcm_id
     */
    fastify.route({
        method: "POST",
        url: "/notification",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;

            let id = "";
            try {
                id = await FcmService.sendNotificationWithToken({ message: body.message, fcm_id: body.fcm_id });
            } catch (e) {
                req.log.error(e);
            }

            return sendSuccessResponse({ data: id, response: res });
        },
    });
};
