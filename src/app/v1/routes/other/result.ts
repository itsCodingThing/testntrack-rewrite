import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { resultModel } from "../../../../services/db/result.js";

export const resultRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.route({
        method: "GET",
        url: "/result/student/:student_id/paper/:paper_id",
        handler: async (req, res) => {
            const { paper_id: paperId, student_id: studentId } = req.params as { paper_id: string; student_id: string };

            return sendSuccessResponse({
                response: res,
                data: await resultModel.findOne({ paper: paperId, student: studentId }).lean(),
            });
        },
    });

    fastify.route({
        method: "GET",
        url: "/result/teacher/:teacher_id/paper/:paper_id",
        handler: async (req, res) => {
            const { paper_id: paperId, teacher_id: teacherId } = req.params as { paper_id: string; teacher_id: string };

            return sendSuccessResponse({
                response: res,
                data: await resultModel
                    .findOne({
                        paper: paperId,
                        "associate_teacher.teacher_id": teacherId,
                    })
                    .lean(),
            });
        },
    });
};
