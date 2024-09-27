import type { FastifyPluginAsync } from "fastify";
import {
    getAttendenceByBatchId,
    getAttendenceByStudentBatch,
    getStudentParentAttendence,
    addAttendenceToBatch,
} from "../../../../services/db/erp/attendence.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const attendenceRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route GET "/api/v1/erp/attendence?batch"
     * @desc  GET ATTENDENCE OF BATCH
     */
    fastify.route({
        method: "GET",
        url: "/erp/attendence",
        handler: async (req, res) => {
            const { batch, ref_date } = req.query as { batch: string; ref_date: string };

            const list = await getAttendenceByBatchId(batch, ref_date);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route GET "/api/v1/erp/attendence/student?batch&&?student"
     * @desc  GET ATTENDENCE OF BATCH
     */
    fastify.route({
        method: "GET",
        url: "/erp/attendence/student",
        handler: async (req, res) => {
            const { batch, student } = req.query as { batch: string; student: string };

            const list = await getAttendenceByStudentBatch(batch, student);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route GET "/api/v1/erp/attendence/parent?student"
     * @desc  GET ATTENDENCE OF STUDENT
     */
    fastify.route({
        method: "GET",
        url: "/erp/attendence/parent",
        handler: async (req, res) => {
            const { student } = req.query as { student: string };

            const list = await getStudentParentAttendence(student);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route POST "/api/v1/erp/attendence"
     * @desc  POST ATTENDENCE OF BATCH
     */
    fastify.route({
        method: "POST",
        url: "/erp/attendence",
        handler: async (req, res) => {
            const { batch_id, attendence, ref_date } = req.body as {
                batch_id: string;
                attendence: string;
                ref_date: string;
            };

            const data = await addAttendenceToBatch(batch_id, ref_date, attendence);
            return sendSuccessResponse({ data: data, response: res });
        },
    });
};
