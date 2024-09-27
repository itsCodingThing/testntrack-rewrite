import type { FastifyPluginAsync } from "fastify";
import RoleService from "../../../../services/db/role.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const roleRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/api/v1/role/list"
     * @desc    Get all roles list
     */
    fastify.route({
        method: "GET",
        url: "/role/list",
        handler: async (req, res) => {
            const list = await RoleService.getRolesList();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/role/add_role"
     * @desc    Add new role
     */
    fastify.route({
        method: "POST",
        url: "/role/add_role",
        handler: async (req, res) => {
            const payload = req.payload;
            const body = req.body as $TSFixMe;

            const result = await RoleService.addNewRole({ ...body, created_by: payload.id });

            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/role/delete_role"
     * @desc    delete role
     */
    fastify.route({
        method: "POST",
        url: "/role/delete_role",
        handler: async (req, res) => {
            const payload = req.payload;
            const body = req.body as $TSFixMe;

            for (const id of body.ids) {
                await RoleService.updateRoleById({ id, update: { deleted: true, updated_by: payload.id } });
            }

            return sendSuccessResponse({ response: res });
        },
    });
};
