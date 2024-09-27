import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { getEnquiryList, createEnquiry, removeEnquiryById } from "../../../../services/db/enquiry/enquiry.js";

export const enquiryRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue  POST "/api/v1/enquiry/all"
     * @desc   get all enquiry
     */
    fastify.route({
        method: "GET",
        url: "/enquiry/all",
        handler: async (req, res) => {
            const list = await getEnquiryList();

            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue  POST "/api/v1/enquiry/add"
     * @desc   add new enquiry
     */
    fastify.route({
        method: "POST",
        url: "/enquiry/add",
        handler: async (req, res) => {
            const enquiry = await createEnquiry(req.body);

            if (!enquiry) {
                return sendErrorResponse({
                    msg: "An enquiry already exist with this number",
                    response: res,
                    code: 404,
                });
            }

            return sendSuccessResponse({ data: enquiry, response: res });
        },
    });

    /**
     * @rotue  POST "/api/v1/enquiry/remove"
     * @desc   remove enquiry
     */
    fastify.route({
        method: "POST",
        url: "/enquiry/remove",
        handler: async (req, res) => {
            const { id } = req.body as { id: string };

            const enquiry = await removeEnquiryById(id, "");
            if (enquiry == null) {
                return sendErrorResponse({ msg: "Enquiry not found", response: res, code: 404 });
            }

            return sendSuccessResponse({ data: {}, response: res });
        },
    });
};
