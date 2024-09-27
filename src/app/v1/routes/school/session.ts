import type { FastifyPluginAsync } from "fastify";

import { validate, yup } from "../../../../utils/validation.js";
import { BatchService, SchoolService, TeacherService, StudentService } from "../../../../services/index.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../../utils/serverResponse.js";
import type { IDBStudent } from "../../../../database/models/Student.js";
import type { IDBTeacher } from "../../../../database/models/Teacher.js";

export const sessionRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   PUT "/school/session/update"
     * @desc    update session details
     */
    fastify.route({
        method: "PUT",
        url: "/school/session/update",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({ school_id: yup.string().required(), name: yup.string().required() }),
                req.body
            );

            return sendSuccessResponse({
                response: res,
                data: await SchoolService.updateCurrentSession(body.school_id, { name: body.name }),
            });
        },
    });

    /**
     * @rotue   PUT "/school/session/switch-session"
     * @desc    switch to new session
     */
    fastify.route({
        method: "PUT",
        url: "/school/session/switch-session",
        handler: async (req, res) => {
            const { school_id, session_name } = await validate(
                yup.object({ school_id: yup.string().required(), session_name: yup.string().required() }),
                req.body
            );

            const school = await SchoolService.createDefaultSession(school_id);

            if (
                school.current_session.name === session_name ||
                school.previous_sessions.find((s) => s.name === session_name)
            ) {
                return sendErrorResponse({ response: res, msg: "session name already exists" });
            }

            const updatedSchool = await SchoolService.schoolModel.findByIdAndUpdate(
                school_id,
                {
                    $set: { current_session: { name: session_name } },
                    $push: { previous_sessions: { $each: [school.current_session], $position: 0 } },
                },
                { returnDocument: "after", lean: true }
            );

            const batches = await BatchService.batchModel
                .find({ school: school._id, session: school.current_session._id }, "_id")
                .lean();

            // add all current user in batch for archiving
            await Promise.all(
                batches.map(async (batch) => {
                    const [teachers, students] = await Promise.all([
                        TeacherService.teacherModel
                            .find({ school: school?._id, batch: { $in: [batch._id] } }, "_id name deleted")
                            .lean<Array<Pick<IDBTeacher, "_id" | "name" | "deleted">>>(),
                        StudentService.studentModel
                            .find({ school: school?._id, batch: { $in: [batch._id] } }, "_id name deleted")
                            .lean<Array<Pick<IDBStudent, "_id" | "name" | "deleted">>>(),
                    ]);

                    await BatchService.batchModel.findByIdAndUpdate(batch._id, {
                        teachers: teachers.map((teacher) => ({
                            _id: teacher._id,
                            name: teacher.name,
                            deleted: teacher.deleted,
                        })),
                        students: students.map((student) => ({
                            _id: student._id,
                            name: student.name,
                            deleted: student.deleted,
                        })),
                    });
                })
            );

            // reset teacher and student batches
            await Promise.all([
                TeacherService.teacherModel.updateMany({ school: school._id }, { $set: { batch: [] } }),
                StudentService.studentModel.updateMany({ school: school._id }, { $set: { batch: [] } }),
            ]);

            return sendSuccessResponse({ response: res, data: updatedSchool });
        },
    });

    /**
     * @rotue   GET "/school/:school_id/session"
     * @desc    get previous session for school
     */
    fastify.route({
        method: "GET",
        url: "/school/:school_id/session",
        handler: async (req, res) => {
            const { school_id } = req.params as { school_id: string };

            const session = await SchoolService.findSchoolSessionById(school_id);

            return sendSuccessResponse({
                response: res,
                data: {
                    current_session: session?.current_session ?? [],
                    previous_sessions: session?.previous_sessions ?? [],
                },
            });
        },
    });
};
