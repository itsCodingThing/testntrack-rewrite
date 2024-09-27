import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { resultModel, studentQuestionWiseResultAnalysis } from "../../../../services/db/result.js";

export const resultRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   GET "/api/v1/teacher/result/paper/:paper_id"
     * @desc    paper result
     */
    fastify.route({
        method: "GET",
        url: "/teacher/result/paper/:paper_id",
        handler: async (req, res) => {
            const { paper_id: paperId } = req.params as { paper_id: string };

            const list = await resultModel
                .find({ paper: paperId })
                .populate("paper")
                .populate("student", "name")
                .sort("-created_at")
                .lean();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/result/student/:student_id"
     * @desc    paper result
     */
    fastify.route({
        method: "GET",
        url: "/teacher/result/student/:student_id",
        handler: async (req, res) => {
            const { student_id: studentId } = req.params as { student_id: string };

            const list = await resultModel
                .find({ student: studentId })
                .populate("paper")
                .populate("student", "name")
                .lean();

            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/result/student/:student_id/paper/:paper_id/analysis"
     * @desc    paper result analysis
     */
    fastify.route({
        method: "GET",
        url: "/teacher/result/student/:student_id/paper/:paper_id/analysis",
        handler: async (req, res) => {
            const { paper_id, student_id } = req.params as { paper_id: string; student_id: string };
            return sendSuccessResponse({
                data: await studentQuestionWiseResultAnalysis(student_id, paper_id),
                response: res,
            });
        },
    });

    /**
     * @route   POST "/api/v1/teacher/result/update"
     * @desc    update student result
     */
    fastify.route({
        method: "POST",
        url: "/teacher/result/update",
        handler: async (req, res) => {
            const { id, copy } = req.body as $TSFixMe;

            const updatedCopy = await resultModel
                .findOneAndUpdate({ _id: id }, copy, { returnDocument: "after" })
                .lean();
            return sendSuccessResponse({ data: updatedCopy, response: res });
        },
    });
};
