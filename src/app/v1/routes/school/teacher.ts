import type { FastifyPluginAsync } from "fastify";
import {
    addTeacher,
    addOrRemoveTeacherBatch,
    removeBatchFromTeacher,
    removeTeacherById,
    findTeacherBySchoolIdAndContact,
    teacherModel,
} from "../../../../services/db/teacher.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { validate, yup } from "../../../../utils/validation.js";

export const teacherRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/api/v1/school/admin/teacher/list/batch/:batch_id"
     * @desc    List teachers in batch
     */
    fastify.route({
        method: "GET",
        url: "/school/admin/teacher/list/batch/:batch_id",
        handler: async (req, res) => {
            const params = req.params as { batch_id: string };

            const list = await teacherModel
                .find({ batch: params.batch_id, deleted: false })
                .lean({ autopopulate: true });
            return sendSuccessResponse({ data: list ?? [], response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/teacher/list/school/:school_id"
     * @desc    List teachers in school
     */
    fastify.route({
        method: "GET",
        url: "/school/admin/teacher/list/school/:school_id",
        handler: async (req, res) => {
            const params = req.params as { school_id: string };

            const list = await teacherModel
                .find({ school: params.school_id, deleted: false })
                .lean({ autopopulate: true });
            return sendSuccessResponse({ data: list ?? [], response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/teacher/add_teachers"
     * @desc    Add teachers in batch
     */
    fastify.route({
        method: "POST",
        url: "/school/admin/teacher/add_teachers",
        handler: async (req, res) => {
            const { id: currentAdminId } = req.payload;
            const { list, school, batch } = await validate(
                yup.object({
                    school: yup.string().required(),
                    batch: yup.string().required(),
                    list: yup.array().required(),
                }),
                req.body,
                {
                    stripUnknown: false,
                }
            );

            const rejected = [];
            for (const doc of list) {
                const found = await findTeacherBySchoolIdAndContact({ schoolId: school, contact: doc.contact });

                if (!found) {
                    await addTeacher({
                        ...doc,
                        school: school,
                        batch: batch,
                        created_by: currentAdminId,
                    });
                } else {
                    rejected.push(doc);
                }
            }

            return sendSuccessResponse({ data: rejected, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/teacher/batch/update_batch"
     * @desc    update teacher's batch
     */
    fastify.route({
        method: "POST",
        url: "/school/admin/teacher/batch/update_batch",
        handler: async (req, res) => {
            const body = req.body as { action: "add" | "remove"; batch: string; ids: string[] };

            if (body.action === "add") {
                await addOrRemoveTeacherBatch({ ids: body.ids, batch: body.batch, action: body.action });
            }

            if (body.action === "remove") {
                await Promise.allSettled(
                    body.ids.map(async (id) => {
                        return await removeBatchFromTeacher(id, body.batch);
                    })
                );
            }

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/school/admin/teacher/remove_teachers"
     * @desc    Remove teachers in batch
     */
    fastify.route({
        method: "POST",
        url: "/school/admin/teacher/remove_teachers",
        handler: async (req, res) => {
            const currentUser = req.payload;
            const { ids = [] } = await validate(
                yup.object({ ids: yup.array().of(yup.string().required()).required() }),
                req.body
            );

            const result = await Promise.allSettled(
                ids.map(async (id) => {
                    await removeTeacherById({ id, updated_by: currentUser.id });
                    return id;
                })
            );

            return sendSuccessResponse({ data: result, response: res });
        },
    });
};
