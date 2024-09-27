import type { FastifyPluginAsync } from "fastify";

import { validate, yup } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { BatchService, TeacherService, StudentService, SchoolService } from "../../../../services/index.js";

export const teacherBatchRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route POST "/api/v1/teacher/batch/create_batch"
     * @desc  Add students in batch
     */
    fastify.route({
        method: "POST",
        url: "/teacher/batch/create_batch",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    name: yup.string().required(),
                    school: yup.string().required(),
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.array().of(yup.string().required()).required(),
                    image: yup.string().default(""),
                }),
                req.body
            );
            const currentTeacher = req.payload;

            const batch = await BatchService.batchModel
                .findOne({ name: body.name, school: currentTeacher.school, delete: false })
                .lean();

            if (batch) {
                return sendErrorResponse({
                    code: 400,
                    msg: "Name already exists",
                    response: res,
                });
            }

            let school = await SchoolService.schoolModel.findById(body.school, "current_session").lean();

            if (!school) {
                return sendErrorResponse({ response: res, msg: "school does not exists." });
            }

            // add a default session
            if (!school.current_session) {
                const t = await SchoolService.createDefaultSession(body.school);

                if (t) {
                    school = t;
                } else {
                    return sendErrorResponse({ response: res, msg: "school does not exists." });
                }
            }

            // Create new batch
            const doc = await BatchService.addBatch({
                school: currentTeacher.school,
                session: school.current_session._id.toString(),
                name: body.name,
                board: body.board,
                class: body.class,
                subject: body.subject,
                image: body.image ?? "",
                created_by: currentTeacher.id,
            });

            // Add new batch in teacher's batch list
            await TeacherService.addOrRemoveTeacherBatch({
                ids: [currentTeacher.id],
                batch: doc._id.toString(),
                action: "add",
            });

            return sendSuccessResponse({ data: doc, response: res });
        },
    });

    /**
     * @route POST "/api/v1/teacher/batch/remove_batch"
     * @desc  Remove batch
     */
    fastify.route({
        method: "POST",
        url: "/teacher/batch/remove_batch",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;
            const currentTeacher = req.payload;

            const doc = await BatchService.getBatchById(body.id);

            if (!doc) {
                return sendErrorResponse({
                    response: res,
                });
            }

            if (doc.created_by !== currentTeacher.id) {
                return sendErrorResponse({
                    code: 401,
                    msg: "Unauthorized",
                    response: res,
                });
            }

            await BatchService.removeBatchById({ id: body.id, updated_by: currentTeacher.id });
            await TeacherService.addOrRemoveTeacherBatch({
                ids: [currentTeacher.id],
                batch: body.id,
                action: "remove",
            });

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @route POST "/api/v1/teacher/batch/add_students"
     * @desc  Add students in batch
     */
    fastify.route({
        method: "POST",
        url: "/teacher/batch/add_students",
        handler: async (req, res) => {
            const { batch, school, list } = req.body as $TSFixMe;
            const payload = req.payload;

            const rejected = [];
            for (const user of list) {
                const found = await StudentService.getStudentByFilter({ contact: user.contact, school: school });

                if (!found) {
                    await StudentService.addStudent({
                        school: school,
                        batch: batch,
                        name: user.name,
                        contact: user.contact,
                        created_by: payload.id,
                    });
                } else {
                    rejected.push(user);
                }
            }

            return sendSuccessResponse({ data: rejected, response: res });
        },
    });

    /**
     * @route GET "/api/v1/teacher/batch/teacher/list/:batch_id"
     * @desc  Get student list in batch
     */
    fastify.route({
        method: "GET",
        url: "/teacher/batch/teacher/list/:batch_id",
        handler: async (req, res) => {
            const { batch_id } = await validate(yup.object({ batch_id: yup.string().required() }), req.params);

            const list = await TeacherService.findTeachersByBatchId(batch_id);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route POST "/api/v1/teacher/batch/update"
     * @desc  Update batch
     */
    fastify.route({
        method: "POST",
        url: "/teacher/batch/update",
        handler: async (req, res) => {
            const body = req.body as { id: string; update: any };
            const currentTeacher = req.payload;

            const doc = await BatchService.getBatchById(body.id);

            if (!doc) {
                return sendErrorResponse({
                    response: res,
                    msg: "unable to find batch",
                });
            }

            if (doc.created_by !== currentTeacher.id) {
                return sendErrorResponse({
                    code: 401,
                    msg: "Unauthorized",
                    response: res,
                });
            }

            const batch = await BatchService.batchModel
                .findByIdAndUpdate(
                    body.id,
                    { ...body.update, updated_by: currentTeacher.id },
                    { returnDocument: "after" }
                )
                .lean();
            return sendSuccessResponse({ data: batch, response: res });
        },
    });

    /**
     * @route Get "/api/v1/teacher/batch/list"
     * @desc  Get teacher batch list
     */
    fastify.route({
        method: "GET",
        url: "/teacher/batch/list",
        handler: async (req, res) => {
            const currentTeacher = req.payload;

            const list = await TeacherService.getTeacherBatchListById(currentTeacher.id);
            return sendSuccessResponse({ data: list, response: res });
        },
    });
};
