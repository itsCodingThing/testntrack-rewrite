import { Types } from "mongoose";
import type { FastifyPluginAsync } from "fastify";

import { ServiceError } from "../../../../utils/error.js";
import { yup, validate } from "../../../../utils/validation.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../../utils/serverResponse.js";

import {
    ResultService,
    PaperService,
    StudentCopyService,
    EvaluatorService,
    MarketplaceBundleService,
    TeacherDrawService,
    EvaluationCopyService,
} from "../../../../services/index.js";

export const evaluationRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route Get "/api/v1/teacher/evalution/copy/batch/:batch_id"
     * @desc  Get teacher's evalution copy list
     */
    fastify.route({
        method: "GET",
        url: "/teacher/evaluation/copy/batch/:batch_id",
        handler: async (req, res) => {
            const currentTeacherId = req.payload.id;
            const { batch_id } = await validate(yup.object({ batch_id: yup.string().required() }), req.params);

            return sendSuccessResponse({
                data: await EvaluationCopyService.evaluationCopyModel
                    .find({
                        "associate_teacher.teacher_id": currentTeacherId,
                        "submission_details.batch": batch_id,
                        "submission_details.paper_type": "Subjective",
                    })
                    .populate({ path: "paper", select: "name type variant question_details" })
                    .populate({ path: "student", select: "name" })
                    .sort({ created_at: -1 })
                    .lean(),
                response: res,
            });
        },
    });

    /**
     * @route Get "/api/v1/teacher/evaluation/copy/:copy_id"
     * @desc  Get evaluation copy
     */
    fastify.route({
        method: "GET",
        url: "/teacher/evaluation/copy/:copy_id",
        handler: async (req, res) => {
            const { copy_id } = await validate(yup.object({ copy_id: yup.string().required() }), req.params);

            return sendSuccessResponse({
                data: await EvaluationCopyService.evaluationCopyModel
                    .findById(copy_id)
                    .populate({ path: "paper", select: "_id name type variant" })
                    .populate({ path: "student", select: "_id name" })
                    .lean(),
                response: res,
            });
        },
    });

    /**
     * @route POST "/api/v1/teacher/evaluation/copy/update"
     * @desc  Update evalution copy
     */
    fastify.route({
        method: "POST",
        url: "/teacher/evaluation/copy/update",
        handler: async (req, res) => {
            const payload = req.payload;

            const { copy_id, update } = await validate(
                yup.object({ copy_id: yup.string().required(), update: yup.object().required() }),
                req.body,
                { stripUnknown: false }
            );

            return sendSuccessResponse({
                data: await EvaluationCopyService.evaluationCopyModel
                    .findByIdAndUpdate(
                        copy_id,
                        { ...update, updated_by: payload.id, is_result_declared: false, is_exam_completed: true },
                        { returnDocument: "after" }
                    )
                    .lean(),
                response: res,
            });
        },
    });

    /**
     * @route POST "/api/v1/teacher/evaluation/copy/submit"
     * @desc  submit teacher evalution copy
     */
    fastify.route({
        method: "POST",
        url: "/teacher/evaluation/copy/submit",
        handler: async (req, res) => {
            const currentTeacherId = req.payload.id;
            const { copy_id: evaluationCopyId, checked_copy: checkedCopyLink } = req.body as {
                copy_id: string;
                checked_copy: string;
            };

            const evaluationCopy = await EvaluationCopyService.evaluationCopyModel.findById(evaluationCopyId);

            if (!evaluationCopy) {
                throw new ServiceError({ msg: "unable to find evaluation copy" });
            }

            // check if copy already checked
            if (evaluationCopy.associate_teacher?.checked_copy.length !== 0) {
                return sendSuccessResponse({ msg: "Copy checked already", response: res });
            }

            if (evaluationCopy.result_declared_type.toLowerCase() === "auto") {
                evaluationCopy.is_result_declared = true;
                evaluationCopy.associate_teacher = {
                    ...evaluationCopy.associate_teacher,
                    teacher_id: new Types.ObjectId(currentTeacherId),
                    checked_copy: checkedCopyLink,
                    submitted_time: new Date(),
                };
                evaluationCopy.updated_by = currentTeacherId;

                await evaluationCopy.save();
                const result = await ResultService.createStudentResultCopy(evaluationCopy);

                return sendSuccessResponse({ msg: "Copy checked successfully", data: result, response: res });
            }

            if (evaluationCopy.result_declared_type?.toLowerCase() === "manual") {
                evaluationCopy.is_result_declared = false;
                evaluationCopy.associate_teacher = {
                    ...evaluationCopy.associate_teacher,
                    teacher_id: new Types.ObjectId(currentTeacherId),
                    checked_copy: checkedCopyLink,
                    submitted_time: new Date(),
                };
                evaluationCopy.updated_by = currentTeacherId;

                await evaluationCopy.save();
                return sendSuccessResponse({
                    msg: "Copy checked successfully",
                    data: evaluationCopy.toObject(),
                    response: res,
                });
            }
        },
    });

    /**
     * @route POST "/api/v1/teacher/evaluation/copy/pending"
     * @desc  get pending evalution copy
     */
    fastify.route({
        method: "POST",
        url: "/teacher/evaluation/copy/pending",
        handler: async (req, res) => {
            const { paper_id } = await validate(yup.object({ paper_id: yup.string().required() }), req.body);
            const paper = await PaperService.findPaperById(paper_id);

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "uable to find paper" });
            }

            // IF PAPER IS EVALUATED BY EVALUATOR THEN
            if (paper.schedule_details.is_evaluator === true) {
                return sendSuccessResponse({
                    data: await EvaluationCopyService.evaluationCopyModel.find({
                        paper: paper_id,
                        result_declared_type: "Manual",
                        is_result_declared: false,
                        "associate_teacher.checked_copy": { $ne: "" },
                        "associate_teacher.is_submitted": true,
                    }),
                    response: res,
                });
            } else {
                if (paper.type.toLowerCase() === "subjective") {
                    return sendSuccessResponse({
                        data: await EvaluationCopyService.evaluationCopyModel.find({
                            paper: paper_id,
                            result_declared_type: "Manual",
                            is_result_declared: false,
                            "associate_teacher.checked_copy": { $ne: "" },
                        }),
                        response: res,
                    });
                }

                if (paper.type.toLowerCase() === "objective") {
                    return sendSuccessResponse({
                        data: await EvaluationCopyService.evaluationCopyModel.find({
                            paper: paper_id,
                            result_declared_type: "Manual",
                            is_result_declared: false,
                        }),
                        response: res,
                    });
                }
            }
        },
    });

    /**
     * @route POST "/api/v1/teacher/evaluation/copy/pending/declare_result"
     * @desc  declare pending evalution copy result
     */
    fastify.route({
        method: "POST",
        url: "/teacher/evaluation/copy/pending/declare_result",
        handler: async (req, res) => {
            const currentTeacherId = req.payload.id;
            const { ids: evaluationCopyIds } = await validate(
                yup.object({ ids: yup.array().of(yup.string().required()).required() }),
                req.body
            );

            const results = await ResultService.createResultsFromCopyIds(evaluationCopyIds, currentTeacherId);

            await sendSuccessResponse({
                msg: "Result declared successfully",
                data: results,
                response: res,
            });

            // refresh market place bundles
            await MarketplaceBundleService.refreshBundleByCopiesId(evaluationCopyIds);
        },
    });

    /**
     * @route GET "/teacher/evaluation/copy/check-details?copy"
     * @desc  get copy check-details by copy-id
     */
    fastify.route({
        method: "GET",
        url: "/teacher/evaluation/copy/check-details",
        handler: async (req, res) => {
            const { copy } = await validate(yup.object({ copy: yup.string().required() }), req.query);
            return sendSuccessResponse({ data: await TeacherDrawService.getByCopyId(copy), response: res });
        },
    });

    /**
     * @route POST "/teacher/evaluation/copy/check-details-update"
     * @desc  update copy check-details by copy-id
     */
    fastify.route({
        method: "POST",
        url: "/teacher/evaluation/copy/check-details-update",
        handler: async (req, res) => {
            const { copy_id, check_details } = await validate(
                yup.object({ copy_id: yup.string().required(), check_details: yup.array().required() }),
                req.body
            );

            return sendSuccessResponse({
                data: await TeacherDrawService.updateByCopyId(copy_id, check_details),
                response: res,
            });
        },
    });

    /**
     * @route POST "/teacher/evaluation/copy/remove"
     * @desc  remove evaluation copy and student copy
     */
    fastify.route({
        method: "POST",
        url: "/teacher/evaluation/copy/remove",
        handler: async (req, res) => {
            const { paper_id, student_id, is_evaluator } = await validate(
                yup.object({
                    paper_id: yup.string().required(),
                    student_id: yup.string().required(),
                    is_evaluator: yup.boolean().required(),
                }),
                req.body
            );

            const evaluationCopy = await EvaluationCopyService.evaluationCopyModel
                .findOne({ paper: paper_id, student: student_id })
                .lean();
            if (!evaluationCopy) {
                return sendErrorResponse({ response: res, msg: "unable to find evaluation copy" });
            }

            if (is_evaluator && evaluationCopy.associate_teacher?.teacher_id) {
                await EvaluatorService.removeAssignedCopiesByEvaluatorId(
                    [evaluationCopy._id.toString()],
                    evaluationCopy.associate_teacher.teacher_id.toString()
                );
            }

            await StudentCopyService.studentCopyModel.findOneAndDelete({ paper: paper_id, student: student_id });
            await EvaluationCopyService.evaluationCopyModel.findOneAndDelete({ paper: paper_id, student: student_id });

            if (is_evaluator && evaluationCopy.associate_teacher?.teacher_id) {
                await MarketplaceBundleService.refreshBundleByPaperId(evaluationCopy.paper.toString());
            }

            return sendSuccessResponse({ response: res });
        },
    });
};
