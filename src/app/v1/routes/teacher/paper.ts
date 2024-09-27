import pMap from "p-map";
import type { FastifyPluginAsync } from "fastify";

import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

import { type IDBStudent } from "../../../../database/models/Student.js";

import {
    PaperService,
    ResultService,
    FcmService,
    StudentCopyService,
    EvaluationCopyService,
    StudentService,
} from "../../../../services/index.js";
import mongoose from "mongoose";

export const paperRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route Get "/api/v1/teacher/paper/list/batch/:batch_id"
     * @desc  Get paper list by batch id
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/list/batch/:batch_id",
        handler: async (req, res) => {
            const { batch_id } = req.params as { batch_id: string };

            const list = await PaperService.paperModel
                .find({ batch: batch_id, deleted: false })
                .sort("-schedule_details.start_time")
                .lean();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route Get "/api/v1/teacher/paper/list/teacher/:teacher_id"
     * @desc  Get teacher's paper list
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/list/teacher/:teacher_id",
        handler: async (req, res) => {
            const { teacher_id } = req.params as { teacher_id: string };

            const list = await PaperService.paperModel
                .find({ created_by: teacher_id, deleted: false })
                .sort("-schedule_details.start_time")
                .lean();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route Get "/api/v1/teacher/paper/list"
     * @desc  Get current teacher's paper list
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/list",
        handler: async (req, res) => {
            const list = await PaperService.paperModel
                .find({ created_by: req.payload.id, deleted: false })
                .sort("-schedule_details.start_time")
                .lean();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route Get "/api/v1/teacher/paper/schedule"
     * @desc  Schedule paper
     */
    fastify.route({
        method: "POST",
        url: "/teacher/paper/schedule",
        handler: async (req, res) => {
            const currentUser = req.payload;
            const body = await validate(
                yup.object({
                    school: yup.string().required(),
                    batch: yup.string().required(),
                    name: yup.string().required(),
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.array().of(yup.string().required()).required(),
                    type: yup.string().oneOf(["Subjective", "Objective"]).required(),
                    variant: yup.string().required(),
                    question_details: yup
                        .object({
                            type: yup.string().oneOf(["pdf", "individual", "section", "questions"]).required(),
                            total_marks: yup.number().required(),
                            pdf: yup.object({ paper: yup.string() }),
                            solution_pdf: yup.string(),
                            solution_video: yup.string(),
                        })
                        .required(),
                    schedule_details: yup.object({
                        type: yup.string().oneOf(["Online", "Offline", "Hybrid"]).required(),
                        rejoin: yup.number().required(),
                        student_list: yup.array().of(yup.string()).min(1).required(),
                        copy_check_teachers: yup.array().of(yup.string()).required(),
                        copy_upload_teachers: yup.array().of(yup.string()).required(),
                        result_declared_teachers: yup.array(),
                        start_time: yup.date().required(),
                        end_time: yup.date().required(),
                        copy_submit_time: yup.date().required(),
                    }),
                }),
                req.body,
                {
                    stripUnknown: false,
                }
            );

            // schedule paper or exam
            const scheduledPaper = await PaperService.createNewPaper({ ...body, created_by: currentUser.id });

            try {
                // send notification regardless of error
                const notificationList = scheduledPaper?.schedule_details?.student_list.map((userId) => ({
                    user_id: userId.toString(),
                    school_id: scheduledPaper.school?.toString(),
                    batch_id: scheduledPaper.batch?.toString(),
                    message: `Paper(${scheduledPaper.name} scheduled)`,
                    created_by: currentUser.id,
                }));

                if (notificationList) {
                    await FcmService.sendMultipleNotification(notificationList);
                }
            } catch {
                // continue regardless of error
            }

            return sendSuccessResponse({
                msg: "Exam scheduled successfully",
                data: scheduledPaper._id,
                response: res,
            });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/paper/:paper_id/attendence"
     * @desc    get student paper attendence
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/:paper_id/attendence",
        handler: async (req, res) => {
            const { paper_id } = req.params as { paper_id: string };

            const paper = await PaperService.findPaperById(paper_id);

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "no paper found" });
            }

            const studentList = paper.schedule_details?.student_list ?? [];

            const result = await Promise.allSettled(
                studentList.map(async (studentId) => {
                    const studentCopy = await StudentCopyService.studentCopyModel
                        .findOne({ paper: paper_id, student: studentId })
                        .lean();
                    const studentDetails = await StudentService.findStudentById(studentId.toString());

                    if (!studentDetails) {
                        return {
                            _id: studentId,
                            name: "",
                            status: "Absent",
                            contact: "",
                        };
                    }

                    if (!studentCopy) {
                        return {
                            _id: studentDetails._id,
                            name: studentDetails.name,
                            status: "Absent",
                            contact: studentDetails.contact,
                        };
                    }

                    if (studentCopy.is_exam_completed || studentCopy?.submission_details?.submitted_copy !== "") {
                        return {
                            _id: studentDetails._id,
                            name: studentDetails.name,
                            status: "Present",
                            contact: studentDetails.contact,
                        };
                    } else {
                        return {
                            _id: studentDetails._id,
                            name: studentDetails.name,
                            status: "No submission",
                            contact: studentDetails.contact,
                        };
                    }
                })
            );

            return sendSuccessResponse({
                response: res,
                data: result.map((p) => (p.status === "fulfilled" ? p.value : null)).filter(Boolean),
            });
        },
    });

    /**
     * @route   PUT "/api/v1/teacher/paper/remove-submission"
     * @desc    remote student submit copy
     */
    fastify.route({
        method: "PUT",
        url: "/teacher/paper/remove-submission",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    paper_id: yup.string().required(),
                    student_id: yup.string().required(),
                }),
                req.body
            );

            const paper = await PaperService.findPaperById(body.paper_id);

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "no paper found" });
            }

            if (paper.type !== "Objective") {
                return sendErrorResponse({ response: res, msg: "only objective copies allow to remove" });
            }

            if (process.env.NODE_ENV === "production") {
                const session = await mongoose.startSession();

                await session.withTransaction(async () => {
                    await Promise.all([
                        StudentCopyService.studentCopyModel.findOneAndDelete(
                            {
                                paper: body.paper_id,
                                student: body.student_id,
                            },
                            { session }
                        ),
                        EvaluationCopyService.evaluationCopyModel.findOneAndDelete(
                            {
                                paper: body.paper_id,
                                student: body.student_id,
                            },
                            { session }
                        ),
                        ResultService.resultModel.findOneAndDelete(
                            {
                                paper: body.paper_id,
                                student: body.student_id,
                            },
                            { session }
                        ),
                    ]);
                });
            } else {
                await Promise.all([
                    StudentCopyService.studentCopyModel.findOneAndDelete({
                        paper: body.paper_id,
                        student: body.student_id,
                    }),
                    EvaluationCopyService.evaluationCopyModel.findOneAndDelete({
                        paper: body.paper_id,
                        student: body.student_id,
                    }),
                    ResultService.resultModel.findOneAndDelete({
                        paper: body.paper_id,
                        student: body.student_id,
                    }),
                ]);
            }

            return sendSuccessResponse({ response: res, msg: "successfully removed submission copy." });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/paper/:paper_id/student/copies"
     * @desc    get student copies for current paper
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/:paper_id/student/copies",
        handler: async (req, res) => {
            const { paper_id } = req.params as { paper_id: string };

            const paper = await PaperService.findPaperById(paper_id);

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "no paper found" });
            }

            const studentList = paper.schedule_details?.student_list;

            const list = await Promise.allSettled(
                studentList.map(async (studentId) => {
                    const studentCopy = await StudentCopyService.studentCopyModel
                        .findOne({ paper: paper_id, student: studentId.toString() })
                        .populate<{ student: Pick<IDBStudent, "name" | "_id"> }>("student", "name")
                        .lean();

                    if (studentCopy) {
                        return studentCopy;
                    }

                    const student = await StudentService.findStudentById(studentId.toString());

                    return {
                        paper: paper_id,
                        student: { _id: studentId, name: student?.name ?? "" },
                        result_declared_type: paper.schedule_details?.result_declared_type,
                        is_result_declared: false,
                        is_exam_completed: false,
                        associate_teacher: {
                            teacher_id: "",
                            checked_copy: "",
                            submitted_time: new Date(),
                        },
                        submission_details: {
                            batch: paper.batch,
                            subject: paper.subject,
                            type: paper.schedule_details.type,
                            paper_type: paper.type,
                            variant_type: paper.variant,
                            submission_time: new Date(),
                            obtained_marks: 0,
                            total_marks: paper.question_details?.total_marks ?? 0,
                            submitted_copy: "",
                            sections_list: [],
                            question_list: paper.question_details.questions.map((question) => ({
                                time_taken: 0,
                                selected_options: [],
                                is_correct: false,
                                is_attempted: false,
                                is_skipped: false,
                                obtained_marks: 0,
                                audio_remarks: "",
                                remarks: "",
                                question: question,
                            })),
                        },
                    };
                })
            );

            return sendSuccessResponse({
                data: list.map((p) => (p.status === "fulfilled" ? p.value : null)).filter(Boolean),
                response: res,
            });
        },
    });

    /**
     * @route   POST "/api/v1/teacher/paper/student/copy/upload"
     * @desc    Upload student exam copy
     */
    fastify.route({
        method: "POST",
        url: "/teacher/paper/student/copy/upload",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;
            const currentTeacherId = req.payload.id;

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
                    created_by: currentTeacherId,
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
                        created_by: currentTeacherId,
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
                        created_by: currentTeacherId,
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
                                    created_by: currentTeacherId,
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
                                created_by: currentTeacherId,
                            });
                        }
                    }) ?? []
                );
            }

            return sendSuccessResponse({ data: studentCopy, response: res });
        },
    });

    /** k
     * @route   GET "/api/v1/teacher/paper/:paper_id/delete"
     * @desc    delete paper by id
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/:paper_id/delete",
        handler: async (req, res) => {
            const { paper_id } = req.params as { paper_id: string };

            await PaperService.deletePaperById(paper_id);

            return sendSuccessResponse({ response: res, msg: "Successfully Deleted Paper" });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/paper/:paper_id/student/offlineCopies"
     * @desc    get offline student copies for current paper
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/:paper_id/student/offlineCopies",
        handler: async (req, res) => {
            const { paper_id } = req.params as { paper_id: string };

            const paper = await PaperService.findPaperById(paper_id);

            if (!paper) {
                return sendErrorResponse({ response: res, msg: "no paper found" });
            }

            let studentList = paper.schedule_details?.student_list.map((id) => id.toString()) ?? [];

            const copies = await StudentCopyService.findStudentCopiesByPaperId(paper_id);
            const studentIds = copies.map((copy) => copy.student.toString());

            studentList = studentList.filter((studentId) => !studentIds.includes(studentId));

            const list = await Promise.allSettled(
                studentList.map(async (studentId: $TSFixMe) => {
                    const studentCopy = await StudentCopyService.studentCopyModel
                        .findOne({ paper: paper_id, student: studentId })
                        .populate<{ student: Pick<IDBStudent, "name" | "_id"> }>("student", "name")
                        .lean();

                    if (studentCopy) {
                        return studentCopy;
                    }

                    const student = await StudentService.findStudentById(studentId);

                    return {
                        paper: paper_id,
                        student: { _id: studentId, name: student?.name ?? "" },
                        result_declared_type: paper.schedule_details.result_declared_type,
                        is_result_declared: false,
                        is_exam_completed: false,
                        associate_teacher: {
                            teacher_id: "",
                            checked_copy: "",
                            submitted_time: new Date(),
                        },
                        submission_details: {
                            batch: paper.batch,
                            subject: paper.subject,
                            type: paper.schedule_details.type,
                            paper_type: paper.type,
                            variant_type: paper.variant,
                            submission_time: new Date(),
                            obtained_marks: 0,
                            total_marks: paper.question_details.total_marks,
                            submitted_copy: "",
                            sections_list: [],
                            question_list: [],
                        },
                    };
                })
            );

            return sendSuccessResponse({
                data: list.map((p) => (p.status === "fulfilled" ? p.value : null)).filter(Boolean),
                response: res,
            });
        },
    });

    /**
     * @route   POST "/api/v1/teacher/paper/:paper_id/student/submitOfflineCopies"
     * @desc    Submit offline student copies for current paper
     */
    fastify.route({
        method: "POST",
        url: "/teacher/paper/:paper_id/student/submitOfflineCopies",
        handler: async (req, res) => {
            const { type, list } = req.body as { type: string; list: unknown[] };

            for (const copy of list) {
                // create student exam copy for each student
                const studentCopy = await StudentCopyService.createStudentCopyFromCopyData(copy);

                const sCopy = studentCopy.toObject();

                if (type.toLowerCase() === "auto") {
                    await ResultService.createStudentResultCopy({
                        ...sCopy,
                        is_result_declared: true,
                        is_exam_completed: true,
                    });
                } else {
                    await EvaluationCopyService.createEvaluationCopy({
                        ...sCopy,
                        is_result_declared: false,
                        is_exam_completed: true,
                    });
                }
            }

            return sendSuccessResponse({ msg: "Copy submitted successfully", response: res });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/paper/:paper_id"
     * @desc    Get paper details
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/:paper_id",
        handler: async (req, res) => {
            const { paper_id } = req.params as { paper_id: string };
            return sendSuccessResponse({ data: await PaperService.findPaperById(paper_id), response: res });
        },
    });

    /**
     * @route   GET "/api/v1/teacher/paper/:paper_id/gap-analysis"
     * @desc    calculate paper gap analysis report
     */
    fastify.route({
        method: "GET",
        url: "/teacher/paper/:paper_id/gap-analysis",
        handler: async (req, res) => {
            const query = await validate(yup.object({ paper_id: yup.string().required() }), req.params);

            const [paperAnalysis, resultsAnalysis] = await Promise.all([
                PaperService.paperAnalysisModel.findOne({ paper_id: query.paper_id }).orFail().lean(),
                ResultService.resultAnalysisModel.find({ paper_id: query.paper_id }).sort("rank").orFail().lean(),
            ]);

            const studentStrength = Math.floor(paperAnalysis.no_attempted_students * 0.4);

            const redZone = await pMap(paperAnalysis.topic_marks_analysis, async (topic) => {
                const students = resultsAnalysis
                    .filter((studentResult) => {
                        const studentTopicWiseReport = studentResult.topic_wise_marks.find(
                            (t) => t.topic === topic.topic
                        );
                        const topicWiseMarks = studentTopicWiseReport?.marks ?? 0;
                        const studentTopicPers = (topicWiseMarks / topic.total_marks) * 100;

                        return studentTopicPers < 60;
                    })
                    .map((r) => ({ student_id: r.student_id, rank: r.rank }));

                let topicPerformaceStatus = "weak";

                if (students.length > studentStrength) {
                    topicPerformaceStatus = "weak";
                }

                if (students.length <= studentStrength) {
                    topicPerformaceStatus = "need_improvement";
                }

                return { ...topic, performance_status: topicPerformaceStatus, students };
            });

            return sendSuccessResponse({
                response: res,
                data: { paper_analysis: paperAnalysis, gap_analysis: redZone },
            });
        },
    });
};
