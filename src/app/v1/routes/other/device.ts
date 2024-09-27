import type { FastifyPluginAsync } from "fastify";
import { deviceModel } from "../../../../services/db/device.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const deviceRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route  POST "/api/v1/device"
     * @desc   Add or update device data
     */
    fastify.route({
        method: "POST",
        url: "/device",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;
            const currentUserId = req.payload.id;

            const data = await deviceModel.replaceOne(
                { user_id: body.user_id, device_id: body.device_id },
                { ...body, created_by: currentUserId, updated_by: currentUserId },
                { upsert: true }
            );

            return sendSuccessResponse({ data: data, response: res });
        },
    });
};
