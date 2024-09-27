import lodash from "lodash";
import type { FastifyPluginAsync } from "fastify";

import { validate, yup } from "../../../../utils/validation.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";
import { PaperService, ResultService, EmailService, RatingService } from "../../../../services/index.js";

export const studentResultRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @route   GET "/student/result/paper/:paper_id"
     * @desc    Get results copy by paper id
     */
    fastify.route({
        method: "GET",
        url: "/student/result/paper/:paper_id",
        handler: async (req, res) => {
            const { paper_id: paperId } = req.params as { paper_id: string };

            const isActive = await PaperService.isPaperActive(paperId);

            if (isActive) {
                return sendSuccessResponse({ msg: "Paper is active. Please wait", response: res });
            }

            const list = await ResultService.resultModel.find({ paper: paperId }).populate("student", "name").lean();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route   GET "/student/result/:result_id"
     * @desc    get result by id result
     */
    fastify.route({
        method: "GET",
        url: "/student/result/:result_id",
        handler: async (req, res) => {
            const { result_id } = req.params as { result_id: string };

            const result = await ResultService.resultModel.findById(result_id).populate("student", "name").lean();
            return sendSuccessResponse({ data: result, response: res });
        },
    });

    /**
     * @route   GET "/student/result/student/:student_id"
     * @desc    Get results copy by student id
     */
    fastify.route({
        method: "GET",
        url: "/student/result/student/:student_id",
        handler: async (req, res) => {
            const { student_id: studentId } = req.params as { student_id: string };

            const list = await ResultService.resultModel
                .find({ student: studentId })
                .populate("student", "name")
                .lean();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @route   GET "/student/result/batch/:batch_id"
     * @desc    get result copy by batch id
     */
    fastify.route({
        method: "GET",
        url: "/student/result/batch/:batch_id",
        handler: async (req, res) => {
            const currentStudentId = req.payload.id;
            const { batch_id: batchId } = req.params as { batch_id: string };

            let resultCopyList = await ResultService.resultModel
                .find({ student: currentStudentId, "submission_details.batch": batchId })
                .populate("paper")
                .populate("student", "name")
                .sort("-created_at")
                .lean();

            // resultCopyList = resultCopyList.filter((copy) => copy.paper.batch.toString() === batchId);
            resultCopyList = resultCopyList.filter((copy: $TSFixMe) => {
                const paper = copy.paper;
                if (!paper) {
                    return false;
                } else
                    return !PaperService.isPaperActiveByDate(
                        paper.schedule_details.start_time,
                        paper.schedule_details.end_time
                    );
            });

            return sendSuccessResponse({ data: resultCopyList, response: res });
        },
    });

    /**
     * @route   GET "/student/result/paper/:paper_id/analysis"
     * @desc    paper result analysis
     */
    fastify.route({
        method: "GET",
        url: "/student/result/paper/:paper_id/analysis",
        handler: async (req, res) => {
            const currentStudentId = req.payload.id;
            const { paper_id: paperId } = req.params as { paper_id: string };

            const query = await validate(yup.object({ indepth_analysis: yup.boolean().default(false) }), req.query);

            const questionWiseAnalysis = await ResultService.studentQuestionWiseResultAnalysis(
                currentStudentId,
                paperId
            );

            if (!query.indepth_analysis) {
                return sendSuccessResponse({ data: questionWiseAnalysis, response: res });
            }

            const [paperAnalysis, studentsResultAnalysis, currentStudent] = await Promise.all([
                PaperService.paperAnalysisModel.findOne({ paper_id: paperId }).orFail().lean(),
                ResultService.resultAnalysisModel.find({ paper_id: paperId }).sort("rank").orFail().lean(),
                ResultService.resultAnalysisModel
                    .findOne({ paper_id: paperId, student_id: currentStudentId })
                    .orFail()
                    .lean(),
            ]);

            const topperStudent = studentsResultAnalysis[0];
            const weakAreas: {
                topic_name: string;
                max_marks: number;
                avg_marks: number;
                obtained_marks: number;
                topper: number;
                chapters: string[];
            }[] = [];

            const comparitiveAnalysis = paperAnalysis.topic_marks_analysis.map((topicAnalysis) => {
                const studentTopicMarks = currentStudent.topic_wise_marks.find(
                    (topic) => topic.topic === topicAnalysis.topic
                );
                const topperTopicMarks = topperStudent.topic_wise_marks.find(
                    (topic) => topic.topic === topicAnalysis.topic
                );

                const result = {
                    topic_name: topicAnalysis.topic,
                    max_marks: topicAnalysis.max_obtain_marks,
                    avg_marks: topicAnalysis.avg_obtain_marks,
                    obtained_marks: studentTopicMarks?.marks ?? 0,
                    topper: topperTopicMarks?.marks ?? 0,
                    chapters: studentTopicMarks?.chapters ?? [],
                };

                const marks = result?.obtained_marks ?? 0;

                if (marks < result.avg_marks) {
                    weakAreas.push(result);
                }

                return result;
            });

            const results = await ResultService.studentPastResults(currentStudentId, paperAnalysis.paper_id.toString());

            return sendSuccessResponse({
                response: res,
                data: {
                    student: currentStudent,
                    question_wise: questionWiseAnalysis,
                    topic_wise: comparitiveAnalysis,
                    micro_study_plans: {
                        topic_wise: weakAreas.map((topic) => topic.topic_name),
                        chapter_wise: lodash.uniq(weakAreas.map((topic) => topic.chapters).flat()),
                    },
                    past_results: results,
                },
            });
        },
    });

    /**
     * @route   POST "/student/result/paper/rank"
     * @desc    paper result rank
     */
    fastify.route({
        method: "POST",
        url: "/student/result/paper/rank",
        handler: async (req, res) => {
            const { paper_ids: paperIds } = req.body as { paper_ids: string[] };
            return sendSuccessResponse({
                data: await ResultService.calculateStudentsRankByPapers(paperIds),
                response: res,
            });
        },
    });

    /**
     * @route   GET "/student/result/paper/rank/batch/:batch_id"
     * @desc    paper result rank
     */
    fastify.route({
        method: "GET",
        url: "/student/result/paper/rank/batch/:batch_id",
        handler: async (req, res) => {
            const { batch_id: batchId } = req.params as { batch_id: string };
            const resultCopies = await ResultService.resultModel.find({ "submission_details.batch": batchId }).lean();

            if (resultCopies.length === 0) {
                return sendSuccessResponse({ data: [], response: res });
            }

            const paperList = {
                batch: { overall: resultCopies },
                paper_type: lodash.groupBy(resultCopies, (copy) => copy.submission_details.paper_type),
                exam_category: lodash.groupBy(resultCopies, (copy) => copy.submission_details.variant_type),
                subject: lodash.groupBy(resultCopies, (copy) => copy.submission_details.subject.join(",")),
            };

            let responseObj = {
                batch: [],
                subject: [],
                paper_type: [],
                exam_category: [],
            };

            for (const [type, groupedCopies] of Object.entries(paperList)) {
                let obj = {};

                for (const [key, copies] of Object.entries(groupedCopies)) {
                    const paperIds = copies.map((copy) => copy.paper.toString());
                    const paperRanks = await ResultService.calculateStudentsRankByPapers(paperIds);

                    obj = { ...obj, [key]: paperRanks };
                }

                responseObj = { ...responseObj, [type]: obj };
            }

            return sendSuccessResponse({
                data: {
                    batch: responseObj.batch,
                    subject: responseObj.subject,
                    "paper type": responseObj.paper_type,
                    "exam category": responseObj.exam_category,
                },
                response: res,
            });
        },
    });

    /**
     * @route GET "/student/result/paper/rating-status?student&paper"
     * @desc used to check the rating by student on particular paper
     */
    fastify.route({
        method: "GET",
        url: "/student/result/paper/rating-status",
        handler: async (req, res) => {
            const query = await validate(
                yup.object({
                    student: yup.string().required(),
                    paper: yup.string().required(),
                }),
                req.query
            );
            const isRatingExist = await RatingService.checkStudentRatingStatus(query);

            return sendSuccessResponse({
                response: res,

                data: { is_rated: isRatingExist },
            });
        },
    });

    /**
     * @route POST "/student/result/paper/update-rating"
     * @desc  use to update the rating of student on the basis of current paper
     */
    fastify.route({
        method: "POST",
        url: "/student/result/paper/update-rating",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    paper: yup.string().required(),
                    student_details: yup
                        .object({
                            name: yup.string().required(),
                            _id: yup.string().required(),
                        })
                        .required(),
                    result: yup.string().required(),
                    rating: yup.number().required(),
                    reason: yup.string().required(),
                    evaluator: yup.string().required(),
                }),
                req.body
            );
            const result = await RatingService.updateStudentRating(body);

            await sendSuccessResponse({
                response: res,
                data: result,
            });

            if (body.rating < 5) {
                const resultCopy = await ResultService.findResultCopyById(body.result);

                if (resultCopy) {
                    EmailService.sendStudentRatingMail({
                        student: resultCopy.student.toString(),
                        paper: resultCopy.paper.toString(),
                        teacher: body.evaluator,
                        rating: body.rating.toString(),
                        reason: body.reason,
                    });
                }
            }
        },
    });
};
