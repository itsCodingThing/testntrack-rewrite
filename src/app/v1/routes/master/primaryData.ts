import type { FastifyPluginAsync } from "fastify";
import {
    getBoardList,
    getClassList,
    getSubjectList,
    getChapterList,
    getTopicList,
    addPrimaryData as _addPrimaryData,
    updatePrimaryData as _updatePrimaryData,
    removePrimaryData as _removePrimaryData,
    updateManyPrimaryData,
} from "../../../../services/master.js";
import { getBatchListBySchoolId } from "../../../../services/db/batch.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

export const primaryDataRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * @route  GET "/api/v1/data/getBatchList?school"
     * @desc   used to get batches during student registration
     */
    fastify.route({
        method: "GET",
        url: "/data/getBatchList",
        handler: async (req, res) => {
            const { school } = req.query as { school: string };
            const batchList = await getBatchListBySchoolId(school);

            return sendSuccessResponse({
                data: batchList,
                response: res,
            });
        },
    });

    /**
     * @rotue   POST "/api/v1/data/udpateMany"
     * @desc    Update Many
     */
    fastify.route({
        method: "POST",
        url: "/data/updateMany",
        handler: async (req, res) => {
            const { update, filter } = req.body as $TSFixMe;
            await updateManyPrimaryData(update, filter);

            return sendSuccessResponse({ msg: "Successfully Updated", response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/data/get/:type"
     * @desc    Get all board list
     */
    fastify.route({
        method: "POST",
        url: "/data/get/:type",
        handler: async (req, res) => {
            const { type } = req.params as { type: string };
            const body = req.body as { board: string; class: string; subject: string; chapter: string };

            let list = [];

            switch (type) {
                case "board": {
                    list = await getBoardList();
                    break;
                }
                case "class": {
                    list = await getClassList(body);
                    break;
                }
                case "subject": {
                    list = await getSubjectList(body);
                    break;
                }
                case "chapter": {
                    list = await getChapterList(body);
                    break;
                }
                case "topic": {
                    list = await getTopicList(body);
                    break;
                }
                default: {
                    return sendErrorResponse({ msg: "invalid type", response: res });
                }
            }

            return sendSuccessResponse({ msg: "success", data: list, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/data/add"
     * @desc    Add primary data
     */
    fastify.route({
        method: "POST",
        url: "/data/add",
        handler: async (req, res) => {
            const body = req.body;

            await _addPrimaryData(body);
            return sendSuccessResponse({ msg: "success", response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/data/update
     * @desc    Update primary data
     */
    fastify.route({
        method: "POST",
        url: "/data/update",
        handler: async (req, res) => {
            const body = req.body;
            await _updatePrimaryData(body);
            return sendSuccessResponse({ msg: "success", response: res });
        },
    });

    /**
     * @route POST "/api/v1/data/remove"
     * @desc Delete primary data
     */
    fastify.route({
        method: "POST",
        url: "/data/remove",
        handler: async (req, res) => {
            const body = req.body;
            await _removePrimaryData(body);
            return sendSuccessResponse({ msg: "success", response: res });
        },
    });

    /**
     * @route  GET "/api/v1/getBatchList?school"
     * @desc   used to get batches during student registration
     */
    fastify.route({
        method: "GET",
        url: "/auth/app/getBatchList",
        handler: async (req, res) => {
            const { school } = req.query as { school: string };
            const batchList = await getBatchListBySchoolId(school);

            return sendSuccessResponse({
                data: batchList,
                response: res,
            });
        },
    });
};
