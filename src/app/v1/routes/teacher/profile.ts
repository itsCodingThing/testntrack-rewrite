import type { FastifyPluginAsync } from "fastify";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { findTeacherById, findTeacherBySchoolIdAndContact, teacherModel } from "../../../../services/db/teacher.js";

export const teacherProfileRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route POST "/api/v1/teacher/details/update"
     * @desc  Update teacher profile
     */
    fastify.route({
        method: "POST",
        url: "/teacher/details/update",
        handler: async (req, res) => {
            const payload = req.payload;
            const { teacher_id, update } = req.body as { teacher_id: string; update: any };
            const { contact } = update;

            if (contact) {
                const found = await findTeacherBySchoolIdAndContact({ schoolId: payload.school, contact });

                if (found) {
                    return sendErrorResponse({ msg: "Mobile no already register with us", response: res });
                }
            }

            const doc = await teacherModel.findByIdAndUpdate(teacher_id, update, { returnDocument: "after" }).lean();

            return sendSuccessResponse({ data: doc, response: res });
        },
    });

    /**
     * @route Get "/api/v1/teacher/details"
     * @desc  Get teacher details
     */
    fastify.route({
        method: "GET",
        url: "/teacher/details",
        handler: async (req, res) => {
            const currentTeacherId = req.payload.id;
            return sendSuccessResponse({ data: await findTeacherById(currentTeacherId), response: res });
        },
    });
};
