import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { createVendorModel, getVendorList, updateVendorById } from "../../../../services/db/b2c/vendor.js";

export const vendorRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/api/v1/school/vendor/create"
     * @desc    Create Vendor
     */
    fastify.route({
        method: "POST",
        url: "/school/vendor/create",
        handler: async (req, res) => {
            const data = req.body as $TSFixMe;

            const model = await createVendorModel(data);

            if (!model) {
                return sendErrorResponse({ response: res });
            }

            return sendSuccessResponse({
                response: res,
                data: model,
            });
        },
    });

    /**
     * @rotue   GET "/api/v1/school/vendor/all"
     * @desc    Used to get al vendors
     */
    fastify.route({
        method: "GET",
        url: "/school/vendor/all",
        handler: async (req, res) => {
            const vendors = await getVendorList();

            return sendSuccessResponse({
                response: res,
                data: vendors,
            });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/vendor/update"
     * @desc    Used to get al vendors
     */
    fastify.route({
        method: "POST",
        url: "/school/vendor/update",
        handler: async (req, res) => {
            const { id, update } = req.body as $TSFixMe;
            const model = await updateVendorById(id, update);

            return sendSuccessResponse({
                response: res,
                data: model,
            });
        },
    });
};
