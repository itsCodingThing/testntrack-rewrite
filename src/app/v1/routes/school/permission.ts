import type { FastifyPluginAsync } from "fastify";

import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { getSchoolPermissionById, updateSchoolPermission } from "../../../../services/db/school.js";

export const permissionRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/api/v1/school/permission?school"
     * @desc   get permissions of school by id
     */
    fastify.route({
        method: "GET",
        url: "/school/permission",
        handler: async (req, res) => {
            const { school } = req.query as { school: string };
            const permission = await getSchoolPermissionById({ id: school });

            return sendSuccessResponse({ data: permission, response: res });
        },
    });

    /**
     * @rotue   Post "/api/v1   /school/permission/update"
     * @desc   update permissions of school by id
     */
    fastify.route({
        method: "POST",
        url: "/school/permission/update",
        handler: async (req, res) => {
            const { id, update } = req.body as $TSFixMe;
            const permission = await updateSchoolPermission({ id, update });

            return sendSuccessResponse({ data: permission, response: res });
        },
    });
};
