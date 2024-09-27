import type { FastifyPluginAsync } from "fastify";

import { validate, yup } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import {
    PaperService,
    StudentCopyService,
    EvaluationCopyService,
    ResultService,
    MarketplaceBundleService,
} from "../../../../services/index.js";

export const schoolPaperRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   POST "/api/v1/school/paper/generate-analysis"
     * @desc    generate result analysis for a paper
     */
    fastify.route({
        method: "POST",
        url: "/school/paper/generate-analysis",
        handler: async (req, res) => {
            const { paper_id } = await validate(yup.object({ paper_id: yup.string().required() }), req.body);

            const paperAnalysis = await PaperService.paperAnalysisModel.findOne({ paper_id }).lean();

            if (paperAnalysis) {
                await Promise.all([
                    PaperService.paperAnalysisModel.deleteOne({ paper_id: paperAnalysis.paper_id }),
                    ResultService.resultAnalysisModel.deleteMany({ paper_id: paperAnalysis.paper_id }),
                ]);
            }

            const report = await ResultService.createAnalysisReport(paper_id);

            await sendSuccessResponse({
                response: res,
                msg: "Paper analysis generate successfully",
                data: report,
            });
        },
    });

    /**
     * @route   PUT "/api/v1/school/paper/declare-result"
     * @desc    declare resutl for paper
     */
    fastify.route({
        method: "PUT",
        url: "/school/paper/declare-result",
        handler: async (req, res) => {
            const adminId = req.payload.id;
            const { ids: evaluationCopyIds } = await validate(
                yup.object({ ids: yup.array().of(yup.string().required()).required() }),
                req.body
            );

            const results = await ResultService.createResultsFromCopyIds(evaluationCopyIds, adminId);

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
     * @route   POST "/api/v1/school/paper/upload-copy"
     * @desc    upload copyies
     */
    fastify.route({
        method: "POST",
        url: "/school/paper/upload-copy",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;
            const adminId = req.payload.id;

            const paper = await PaperService.findPaperById(body.paper);

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "no paper found" });
            }

            // for making student present in the specific exam
            let studentCopy = { ...body, is_exam_completed: true };

            const copy = await StudentCopyService.studentCopyModel
                .findOne({ student: body.student, paper: body.paper })
                .lean();

            if (copy) {
                studentCopy = await StudentCopyService.studentCopyModel.findByIdAndUpdate(copy._id, studentCopy, {
                    returnDocument: "after",
                });
            } else {
                studentCopy = await StudentCopyService.createStudentCopyFromCopyData(studentCopy);
            }

            // check for already submitted copy
            if (copy && copy.is_exam_completed) {
                return sendErrorResponse({ msg: "Copy already uploaded", response: res });
            }

            // delcare result in case of objective paper
            if (paper.type === "Objective" && paper.schedule_details?.result_declared_type === "auto") {
                await ResultService.createStudentResultCopy({
                    paper: studentCopy.paper,
                    student: studentCopy.student,
                    result_declared_type: studentCopy.result_declared_type,
                    is_result_declared: true,
                    is_exam_completed: true,
                    associate_teacher: studentCopy.associate_teacher,
                    submission_details: studentCopy.submission_details,
                    proctoring_details: studentCopy.proctoring_details,
                    created_by: adminId,
                });

                return sendSuccessResponse({ data: studentCopy.toObject(), response: res });
            }

            if (paper.schedule_details?.is_evaluator) {
                const evaluationCopy = await EvaluationCopyService.evaluationCopyModel
                    .findOne({
                        paper: studentCopy.paper,
                        student: studentCopy.student,
                        "associate_teacher.is_evaluator": true,
                    })
                    .lean();

                if (evaluationCopy) {
                    await EvaluationCopyService.evaluationCopyModel.findByIdAndUpdate(evaluationCopy._id, {
                        paper: studentCopy.paper,
                        student: studentCopy.student,
                        result_declared_type: studentCopy.result_declared_type,
                        is_result_declared: false,
                        is_exam_completed: true,
                        "associate_teacher.is_evaluator": true,
                        submission_details: studentCopy.submission_details,
                        proctoring_details: studentCopy.proctoring_details,
                        created_by: adminId,
                    });
                } else {
                    await EvaluationCopyService.createEvaluationCopy({
                        paper: studentCopy.paper,
                        student: studentCopy.student,
                        result_declared_type: studentCopy.result_declared_type,
                        is_result_declared: false,
                        is_exam_completed: true,
                        associate_teacher: {
                            is_evaluator: true,
                        },
                        submission_details: studentCopy.submission_details,
                        proctoring_details: studentCopy.proctoring_details,
                        created_by: adminId,
                    });
                }
            } else {
                await Promise.allSettled(
                    paper.schedule_details.copy_check_teachers.map(async (teacherId) => {
                        const evaluationCopy = await EvaluationCopyService.evaluationCopyModel
                            .findOne({
                                paper: studentCopy.paper,
                                student: studentCopy.student,
                                "associate_teacher.teacher_id": teacherId,
                            })
                            .lean();

                        if (evaluationCopy) {
                            return await EvaluationCopyService.evaluationCopyModel.findByIdAndUpdate(
                                evaluationCopy._id,
                                {
                                    paper: studentCopy.paper,
                                    student: studentCopy.student,
                                    result_declared_type: studentCopy.result_declared_type,
                                    is_result_declared: false,
                                    is_exam_completed: true,
                                    "associate_teacher.teacher_id": teacherId,
                                    submission_details: studentCopy.submission_details,
                                    proctoring_details: studentCopy.proctoring_details,
                                    created_by: adminId,
                                }
                            );
                        } else {
                            return await EvaluationCopyService.createEvaluationCopy({
                                paper: studentCopy.paper,
                                student: studentCopy.student,
                                result_declared_type: studentCopy.result_declared_type,
                                is_result_declared: false,
                                is_exam_completed: true,
                                associate_teacher: {
                                    teacher_id: teacherId,
                                },
                                submission_details: studentCopy.submission_details,
                                proctoring_details: studentCopy.proctoring_details,
                                created_by: adminId,
                            });
                        }
                    }) ?? []
                );
            }

            return sendSuccessResponse({ data: studentCopy, response: res });
        },
    });

    /**
     *  @rotue   GET "/api/v1/school/paper?batch&type"
     *  @desc    get All Papers of School by batch and type
     */
    fastify.route({
        method: "GET",
        url: "/school/paper",
        handler: async (req, res) => {
            const { batch, type } = req.query as { batch: string; type: string };
            const papers = await PaperService.findPapersByBatchIdAndType(batch, type);

            return sendSuccessResponse({
                data: papers,
                response: res,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/school/paper/update"
     *  @desc    update paper by id
     */
    fastify.route({
        method: "POST",
        url: "/school/paper/update",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({ _id: yup.string().required(), update: yup.object().required() }),
                req.body,
                { stripUnknown: false }
            );
            const result = await PaperService.paperModel.findByIdAndUpdate(body._id, body.update);

            return sendSuccessResponse({
                data: result,
                response: res,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/school/paper/create"
     *  @desc    create paper
     */
    fastify.route({
        method: "POST",
        url: "/school/paper/create",
        handler: async (req, res) => {
            const body = req.body;
            const result = await PaperService.createNewPaper(body);

            return sendSuccessResponse({
                data: result,
                response: res,
            });
        },
    });

    /**
     *  @rotue   DELETE "/api/v1/school/paper/delete?id"
     *  @desc    create paper
     */
    fastify.route({
        method: "DELETE",
        url: "/school/paper/delete",
        handler: async (req, res) => {
            const { id } = req.query as { id: string };
            const result = await PaperService.deletePaperById(id);

            return sendSuccessResponse({
                data: result,
                response: res,
            });
        },
    });

    /**
     *  @rotue   POST "/api/v1/school/getPaperByIds"
     *  @desc    get paper by ids
     */
    fastify.route({
        method: "POST",
        url: "/school/paper/getPaperByIds",
        handler: async (req, res) => {
            const { ids } = await validate(
                yup.object({ ids: yup.array().of(yup.string().required()).required() }),
                req.body
            );
            const papers = await PaperService.paperModel.find({ _id: { $in: ids } }).lean();

            return sendSuccessResponse({
                data: papers.filter((paper) => paper != null),
                response: res,
            });
        },
    });
};
