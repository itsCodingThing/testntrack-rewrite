import type { FastifyPluginAsync } from "fastify";
import * as ParentService from "../../../../services/db/parent/parent.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

export const loginRegisterRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/parent/create"
     * @desc    Add Parent
     */
    fastify.route({
        method: "POST",
        url: "/parent/create",
        handler: async (req, res) => {
            const { name, email, contact } = req.body as $TSFixMe;

            const found = await ParentService.getParentByFilter({ contact });

            if (!found) {
                const user = await ParentService.addParent({
                    name,
                    email,
                    contact,
                });

                return sendSuccessResponse({ data: user, response: res });
            } else {
                return sendErrorResponse({
                    code: 400,
                    msg: "Parent already exists",
                    response: res,
                });
            }
        },
    });
};
