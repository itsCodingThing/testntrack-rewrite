import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import * as PermissionService from "../../../../services/db/permission.js";

export const permissionRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/api/v1/permission/list"
     * @desc    Get all permission list
     */
    fastify.route({
        method: "GET",
        url: "/permission/list",
        handler: async (req, res) => {
            const list = await PermissionService.getPermissionsList();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/permission/create_permission"
     * @desc    Create new permission
     */
    fastify.route({
        method: "POST",
        url: "/permission/create_permission",
        handler: async (req, res) => {
            const payload = req.payload;
            const body = req.body as $TSFixMe;

            const permission = await PermissionService.createNewPermission({ ...body, created_by: payload.id });

            return sendSuccessResponse({ data: permission, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/permission/update_permission"
     * @desc    Update permission by id
     */
    fastify.route({
        method: "POST",
        url: "/permission/update_permission",
        handler: async (req, res) => {
            const payload = req.payload;
            const body = req.body as $TSFixMe;

            await PermissionService.updatePermission({
                id: body.id,
                update: { ...body.update, updated_by: payload.id },
            });

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/permission/remove_permission"
     * @desc    Remove permission by id
     */
    fastify.route({
        method: "POST",
        url: "/permission/remove_permission",
        handler: async (req, res) => {
            const payload = req.payload;
            const body = req.body as $TSFixMe;

            for (const id of body.ids) {
                await PermissionService.removePermission({ id: id, updated_by: payload.id });
            }

            return sendSuccessResponse({ response: res });
        },
    });
};
