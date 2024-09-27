import type { FastifyPluginAsync } from "fastify";

import * as ParentService from "../../../../services/db/parent/parent.js";
import { notificationModel } from "../../../../services/db/notification.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   Get "/parent/getProfile"
     * @desc    Get parent
     */
    fastify.route({
        method: "GET",
        url: "/parent/getProfile",
        handler: async (req, res) => {
            const id = req.payload.id;

            const user = await ParentService.findParentById(id);

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
     * @rotue   POST "/parent/updateProfile"
     * @desc    Add parent
     */
    fastify.route({
        method: "POST",
        url: "/parent/updateProfile",
        handler: async (req, res) => {
            const id = req.payload.id;
            const { update } = req.body as $TSFixMe;

            const user = await ParentService.updateParentById({ id, update });

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
     * @rotue   POST "/parent/notification"
     * @desc    get notification
     */
    fastify.route({
        method: "GET",
        url: "/parent/notification",
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
};
