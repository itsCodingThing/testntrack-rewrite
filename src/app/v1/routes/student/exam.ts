import type { FastifyPluginAsync } from "fastify";
import {
    declareResultOfBundlePaperByCopy,
    updatePaperStatusAndResultDetails,
} from "../../../../services/db/b2c/purchasepaperbundle.js";
import constants from "../../../../config/constants.js";
import { createStudentResultCopy } from "../../../../services/db/result.js";
import { createEvaluationCopy } from "../../../../services/db/evaluationCopy.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { findPaperById, isCopySubmitActive, paperModel } from "../../../../services/db/paper.js";
import { studentCopyModel, createStudentCopyByStudentIdAndPaperId } from "../../../../services/db/studentCopy.js";

export const studentExamRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route POST "/api/v1/student/exam/copy/:copy_id"
     * @desc  Get student copy by id
     */
    fastify.route({
        method: "GET",
        url: "/student/exam/copy/:copy_id",
        handler: async (req, res) => {
            const { copy_id: copyId } = req.params as { copy_id: string };
            const studentCopy = await studentCopyModel.findById(copyId).lean();

            if (!studentCopy) {
                return sendErrorResponse({ response: res, code: 400, msg: "No copy found" });
            }

            return sendSuccessResponse({ data: studentCopy, response: res });
        },
    });

    /**
     * @route POST "/api/v1/student/exam/copy/create"
     * @desc  Create student copy
     */
    fastify.route({
        method: "POST",
        url: "/student/exam/copy/create",
        handler: async (req, res) => {
            const { paper_id: paperId } = req.body as { paper_id: string };
            const currentStudentId = req.payload.id;

            const paper = await findPaperById(paperId);

            // check for valid paper
            if (!paper) {
                return sendErrorResponse({ response: res, msg: "No valid paper exists" });
            }

            if (!paper.is_b2c) {
                // check if paper is active
                if (!(await isCopySubmitActive(paper._id.toString()))) {
                    return sendErrorResponse({ response: res, msg: "Exam time completed" });
                }

                // check if student is in the exam
                if (
                    !paper.schedule_details?.student_list
                        ?.map((id: $TSFixMe) => id.toString())
                        .includes(currentStudentId)
                ) {
                    return sendErrorResponse({ response: res, msg: "Student is not allowed for this exam" });
                }
            }

            const studentCopy = await studentCopyModel.findOne({ paper: paperId, student: currentStudentId }).lean();

            // check for existing student copy
            if (!studentCopy) {
                const copy = await createStudentCopyByStudentIdAndPaperId({
                    paperId: paperId,
                    studentId: currentStudentId,
                });
                return sendSuccessResponse({ data: copy, response: res });
            }

            // check if student completed exam
            if (studentCopy.is_exam_completed) {
                return sendErrorResponse({ response: res, msg: "Student already submitted exam" });
            }

            // check for student rejoin
            // FIXME: ugly need a better way
            const rejoin = paper.schedule_details?.rejoin ?? 0;
            if (studentCopy.proctoring_details.length >= rejoin) {
                return sendErrorResponse({ response: res, msg: "Student rejoin completed", data: studentCopy });
            }

            return sendSuccessResponse({ response: res, msg: "Student copy already exists", data: studentCopy });
        },
    });

    /**
     * @route POST "/api/v1/student/exam/copy/update"
     * @desc  Update student copy
     */
    fastify.route({
        method: "POST",
        url: "/student/exam/copy/update",
        handler: async (req, res) => {
            const currentTeacherId = req.payload.id;
            const { copy_id: copyId, update } = req.body as { copy_id: string; update: $TSFixMe };

            const studentCopy = await studentCopyModel.findById(copyId).lean();

            if (!studentCopy) {
                return sendSuccessResponse({ response: res });
            }

            // check if paper is active
            if (!(await isCopySubmitActive(studentCopy.paper?.toString()))) {
                return sendErrorResponse({ msg: "Exam time completed", response: res });
            }

            // check if student already completed exam
            if (studentCopy.is_exam_completed) {
                return sendErrorResponse({ msg: "Student already submitted exam", response: res });
            }

            const updatedCopy = await studentCopyModel
                .findByIdAndUpdate(
                    copyId,
                    { ...update, is_exam_completed: false, updated_by: currentTeacherId },
                    { returnDocument: "after" }
                )
                .lean();

            return sendSuccessResponse({ data: updatedCopy, response: res });
        },
    });

    /**
     * @route POST "/api/v1/student/exam/copy/submit"
     * @desc  Submit student copy
     */
    fastify.route({
        method: "POST",
        url: "/student/exam/copy/submit",
        handler: async (req, res) => {
            const currentUserId = req.payload.id;
            const { copy_id: copyId, submitted_copy: submittedCopyLink = "" } = req.body as {
                copy_id: string;
                submitted_copy?: string;
            };

            let studentCopy = await studentCopyModel.findById(copyId).lean();

            // check for valid student copy
            if (!studentCopy) {
                return sendErrorResponse({ response: res, code: 500, msg: "No copy found" });
            }

            const paper = await paperModel.findById(studentCopy.paper).lean();

            if (!paper) {
                return sendErrorResponse({ response: res, code: 500, msg: "No copy found" });
            }

            const { type, schedule_details, is_b2c } = paper;

            if (!is_b2c) {
                // check if submit time completed
                if (!(await isCopySubmitActive(studentCopy.paper?.toString()))) {
                    return sendErrorResponse({ msg: "Copy submit duration completed", response: res });
                }
            }

            // check if student already completed exam
            if (studentCopy.is_exam_completed) {
                return sendErrorResponse({ msg: "Student already submitted exam", response: res });
            }

            studentCopy = await studentCopyModel
                .findByIdAndUpdate(
                    copyId,
                    {
                        is_exam_completed: true,
                        "submission_details.submitted_copy": submittedCopyLink,
                        created_by: currentUserId,
                    },
                    { returnDocument: "after" }
                )
                .lean();

            if (!studentCopy) {
                return sendErrorResponse({ response: res, code: 500, msg: "No copy found" });
            }

            const submittedCopy = {
                paper: studentCopy.paper,
                student: studentCopy.student,
                submitted_type: studentCopy.submitted_type,
                result_declared_type: studentCopy.result_declared_type,
                is_result_declared: true,
                is_exam_completed: true,
                associate_teacher: studentCopy.associate_teacher,
                submission_details: studentCopy.submission_details,
                proctoring_details: studentCopy.proctoring_details,
                created_by: currentUserId,
            };

            if (!type) {
                return sendErrorResponse({ response: res, code: 500, msg: "invalid paper type" });
            }

            if (type.toLowerCase() === "objective") {
                if (schedule_details?.result_declared_type?.toLowerCase() === "auto") {
                    // delcare result
                    const resultCopy = await createStudentResultCopy(submittedCopy);

                    if (is_b2c) {
                        await declareResultOfBundlePaperByCopy(resultCopy);
                    }
                } else {
                    // create evaluation copy
                    submittedCopy.is_result_declared = false;
                    submittedCopy.is_exam_completed = true;

                    // FIXME: ts-ignore comment is bad need to work on it
                    if (schedule_details?.is_evaluator) {
                        submittedCopy.associate_teacher.is_evaluator = true;
                    }

                    submittedCopy.associate_teacher.checked_copy = constants.paper.objective_no_copy;
                    submittedCopy.submission_details.submitted_copy = constants.paper.objective_no_copy;

                    const evaluationCopy = await createEvaluationCopy(submittedCopy);

                    if (is_b2c) {
                        // if paper is type of b2c then we will change the respective copy status and add the copy details to the student purchased paper bundle
                        await updatePaperStatusAndResultDetails(
                            { student_id: studentCopy.student, paper_id: studentCopy.paper },
                            {
                                status: "attempted",
                                result_details: {
                                    submitted_copy: submittedCopyLink,
                                    evaluation_copy_id: evaluationCopy._id,
                                },
                            }
                        );
                    }
                }
            }

            if (type.toLowerCase() === "subjective") {
                if (schedule_details?.is_evaluator) {
                    // assign copies to teacher
                    const evaluationCopy = await createEvaluationCopy({
                        ...studentCopy,
                        associate_teacher: {
                            is_evaluator: true,
                        },
                    });

                    if (is_b2c) {
                        // if paper is type of b2c then we will change the respective copy status and add the copy details to the student purchased paper bundle
                        await updatePaperStatusAndResultDetails(
                            { student_id: studentCopy.student, paper_id: studentCopy.paper },
                            {
                                status: "attempted",
                                result_details: {
                                    submitted_copy: submittedCopyLink,
                                    evaluation_copy_id: evaluationCopy._id,
                                },
                            }
                        );
                    }
                } else {
                    await Promise.allSettled(
                        paper?.schedule_details?.copy_check_teachers.map(async (teacherId: $TSFixMe) => {
                            const evaluationCopy = await createEvaluationCopy({
                                ...submittedCopy,
                                is_result_declared: false,
                                associate_teacher: {
                                    teacher_id: teacherId,
                                },
                            });

                            return evaluationCopy;
                        }) ?? []
                    );
                }
            }

            return sendSuccessResponse({ msg: "Copy submitted successfully", response: res });
        },
    });
};
