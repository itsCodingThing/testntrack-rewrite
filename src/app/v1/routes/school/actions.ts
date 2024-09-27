import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { addAction, removeAction, getActions, type TActionType } from "../../../../services/db/b2c/actions.js";

export const actionRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @desc    use to add actions by type
     * @route   POST "api/v1/school/action/add/:type"
     */
    fastify.route({
        method: "POST",
        url: "/school/actions/add/:type",
        handler: async (req, res) => {
            const data = req.body as $TSFixMe;
            const { type } = req.params as { type: TActionType };

            const result = await addAction(data, type);
            return sendSuccessResponse({
                response: res,
                data: result,
            });
        },
    });

    /**
     * @rotue   GET "/api/v1/school/actions/remove/:type?id"
     * @desc    use to remove the actions by id
     */
    fastify.route({
        method: "GET",
        url: "/school/actions/remove/:type",
        handler: async (req, res) => {
            const { type } = req.params as { type: TActionType };
            const { id } = req.query as { id: string };

            const result = await removeAction(id, type);
            return sendSuccessResponse({
                response: res,
                data: result,
            });
        },
    });

    /**
     * @rotue   GET "/api/v1/school/actions/all/:type"
     * @desc    use to get all actions by type
     */
    fastify.route({
        method: "GET",
        url: "/school/actions/all/:type",
        handler: async (req, res) => {
            const { type } = req.params as { type: TActionType };
            const result = await getActions(type);

            return sendSuccessResponse({ response: res, data: result });
        },
    });
};
