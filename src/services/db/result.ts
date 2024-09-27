import pMap from "p-map";
import lodash from "lodash";
import mongoose from "mongoose";

import PaperModel from "../../database/models/Paper.js";
import ResultCopyModel from "../../database/models/Result.js";
import type { IDBSchool } from "../../database/models/School.js";
import type { IDBStudent } from "../../database/models/Student.js";
import PaperAnalysisModel from "../../database/models/PaperAnalysis.js";
import ResultAnalysisModel from "../../database/models/ResultAnalysis.js";

import { ServiceError } from "../../utils/error.js";
import { EvaluationCopyService } from "../index.js";

import { PaperService, ResultService } from "../../services/index.js";

interface IPastResultAgg {
    student: string;
    paper: string;
    obtained_marks: number;
    total_marks: number;
    created_at: string;
    percentage: number;
}

export const resultModel = ResultCopyModel;
export const resultAnalysisModel = ResultAnalysisModel;

export async function createStudentResultCopy(data: $TSFixMe) {
    const result = await ResultCopyModel.findOne({ paper: data.paper, student: data.student }).lean();

    if (result) {
        return result;
    }

    const newResultCopy = await ResultCopyModel.create({
        paper: data.paper,
        student: data.student,
        result_declared_type: data.result_declared_type,
        is_result_declared: true,
        is_exam_completed: true,
        associate_teacher: data.associate_teacher,
        submission_details: data.submission_details,
        proctoring_details: data.proctoring_details,
        checked_teachers: data.checked_teachers,
        created_by: data.created_by,
    });
    return newResultCopy.toJSON();
}

export async function findResultCopyById(id: string) {
    const result = await ResultCopyModel.findById(id).lean();
    return result;
}

export async function findResultCopyByPaperId(paperId: $TSFixMe) {
    const result = await ResultCopyModel.findOne({ paper: paperId }).lean();
    return result;
}

export async function findResultCopiesByPaperId(paperId: $TSFixMe) {
    const result = await ResultCopyModel.find({ paper: paperId }).lean();
    return result;
}

export async function studentQuestionWiseResultAnalysis(studentId: string, paperId: string) {
    const paper = await PaperModel.findById(paperId).lean();
    const currentStudentResult = await ResultCopyModel.findOne({ paper: paperId, student: studentId }).lean();

    if (!paper) {
        throw new ServiceError({ msg: "Unable to generate result analysis" });
    }

    if (!currentStudentResult) {
        throw new ServiceError({ msg: "Unable to generate result analysis" });
    }

    const otherResults = await ResultCopyModel.find({ paper: paperId })
        .populate<{ student: Pick<IDBStudent, "name" | "_id"> }>("student", "name")
        .lean();

    if (!otherResults.length) {
        throw new ServiceError({ msg: "Unable to generate result analysis" });
    }

    return await pMap(paper.question_details?.questions, async (question, index) => {
        const details = otherResults.map((doc) => {
            const student = doc.student;
            const questionDetails = doc.submission_details.question_list[index];

            return {
                student_name: student.name,
                student_id: student._id.toString(),
                obtained_marks: questionDetails.obtained_marks,
                time_taken: questionDetails.time_taken,
                is_attempted: questionDetails.is_attempted,
                is_skipped: questionDetails.is_skipped,
                full_marks: question.marks === questionDetails.obtained_marks,
            };
        });

        return {
            question_no: index + 1,
            question_marks: question.marks,
            question_time: currentStudentResult?.submission_details?.question_list?.[index].question.time,
            avg_marks: details.length > 0 ? details.map((doc) => doc.obtained_marks) : 0,
            avg_attempted_time: details.length > 0 ? details.map((doc) => doc.time_taken) : 0,
            student_with_fullmarks: details.length > 0 ? details.filter((doc) => doc.full_marks) : 0,
            student_without_fullmarks: details.length > 0 ? details.filter((doc) => !doc.full_marks) : 0,
            current_student_time: currentStudentResult?.submission_details?.question_list[index].time_taken,
            swat: question?.swat ?? [],
        };
    });
}

export async function calculateStudentsRankByPapers(paperIds: string[]) {
    const papers = await PaperModel.find({ _id: paperIds }).lean();
    const allPapersTotalMarks = papers.reduce((acc, curr) => acc + curr.question_details.total_marks, 0);

    let allResults = await ResultCopyModel.find({ paper: paperIds })
        .populate<{ student: Pick<IDBStudent, "name" | "image" | "_id"> }>("student", "name image")
        .lean();

    // filter result for null student
    allResults = allResults.filter((user) => user.student);

    // groupby result by student id
    const result = lodash.groupBy(allResults, (resultDoc) => resultDoc.student._id.toString());

    const studentResultDetails = Object.entries(result).map((value) => {
        const studentId = value[0];
        const studentCopies = value[1];

        // result is groupby by student
        const studentDetails = studentCopies[0].student;
        const totalObatianedMarks = studentCopies.reduce(
            (acc, curr) => acc + curr.submission_details.obtained_marks,
            0
        );

        return {
            image: studentDetails?.image ?? "",
            student_id: studentId,
            name: studentDetails?.name ?? "",
            rank: 0,
            obtained: totalObatianedMarks,
            total: allPapersTotalMarks,
        };
    });

    const groupByObtainedMarks = lodash.groupBy(studentResultDetails, (doc) => doc.obtained);

    return Object.entries(groupByObtainedMarks)
        .sort((s1, s2) => Number(s2[0]) - Number(s1[0]))
        .map(([, rankedPlace], i) => {
            return rankedPlace.map((student) => ({
                ...student,
                rank: i + 1,
            }));
        })
        .flat();
}

export async function updateCopyRatingStatus(copyIds: string[]) {
    const result = await ResultCopyModel.updateMany(
        { _id: { $in: copyIds } },
        {
            is_rated: true,
        },
        {
            returnDocument: "after",
        }
    ).lean();

    return result;
}

const getRecentResultByStudent = async (studentId: string) => {
    const result = await ResultCopyModel.find({
        student: studentId,
    })
        .sort({ created_at: -1 })
        .limit(1)
        .lean();

    return result[0].paper;
};

export async function getResultsRankByStudent(studentId: string) {
    const paperId = await getRecentResultByStudent(studentId);

    const list = await ResultCopyModel.find({ paper: paperId })
        .sort({
            "submission_details.obtained_marks": -1,
        })
        .select("-proctoring_details -submission_details.question_list -associate_teacher")
        .populate("student", "name image -school -batch ")
        .populate("paper", "name");

    return list;
}

export async function createResultsFromCopyIds(evaluationCopyIds: string[], userId: string) {
    const copyResults = evaluationCopyIds.map(async (copyId) => {
        const teacherEvaluationCopy = await EvaluationCopyService.evaluationCopyModel.findById(copyId).lean();

        if (!teacherEvaluationCopy) {
            throw new ServiceError({ msg: "unable to find evaluation copy" });
        }

        const result = await resultModel
            .findOne({ paper: teacherEvaluationCopy.paper, student: teacherEvaluationCopy.student })
            .lean();

        // check if student result already exists
        if (!result) {
            // create new result copy for student
            const copy = await EvaluationCopyService.evaluationCopyModel
                .findByIdAndUpdate(
                    copyId,
                    {
                        is_result_declared: true,
                    },
                    { returnDocument: "after" }
                )
                .lean();

            if (!copy) {
                throw new ServiceError({ msg: "unable to find evaluation copy" });
            }

            return await createStudentResultCopy({
                ...copy,
                checked_teachers: [copy.associate_teacher.teacher_id],
            });
        } else {
            // update previous evalaution copy with current result
            await EvaluationCopyService.evaluationCopyModel.updateMany(
                {
                    paper: teacherEvaluationCopy.paper,
                    student: teacherEvaluationCopy.student,
                },
                { is_result_declared: false }
            );

            const newEvaluationCopy = await EvaluationCopyService.evaluationCopyModel
                .findByIdAndUpdate(
                    copyId,
                    {
                        is_result_declared: true,
                    },
                    { returnDocument: "after" }
                )
                .lean();

            if (!newEvaluationCopy) {
                throw new ServiceError({ msg: "unable to find evaluation copy" });
            }

            // replace result with new result
            return await resultModel
                .findOneAndUpdate(
                    { _id: result._id.toString() },
                    {
                        associate_teacher: teacherEvaluationCopy.associate_teacher,
                        submission_details: newEvaluationCopy.submission_details,
                        checked_teachers: [],
                        updated_by: userId,
                    },
                    { returnDocument: "after" }
                )
                .lean();
        }
    });

    const resultList = await Promise.allSettled(copyResults);

    return resultList.flatMap((result) => {
        if (result.status === "fulfilled") {
            return [result.value];
        }

        return [];
    });
}

export async function createAnalysisReport(paperId: string) {
    const [paper, rankings, results] = await Promise.all([
        PaperService.paperModel
            .findById(paperId)
            .populate<{ school: Pick<IDBSchool, "name" | "code" | "_id" | "current_session"> }>({
                path: "school",
                select: "name code current_session",
                transform: (doc, id) => (doc == null ? { _id: id, name: "", code: "", current_session: {} } : doc),
            })
            .lean(),
        ResultService.calculateStudentsRankByPapers([paperId]),
        ResultService.resultModel
            .find({ paper: paperId })
            .sort("-created_at")
            .select("submission_details paper student")
            .lean(),
    ]);

    if (!paper) {
        throw new ServiceError({ msg: "unable to generate analysis" });
    }

    const paperBasicDetails = {
        paper_id: paper._id.toString(),
        paper_name: paper.name,
        school: paper.school.name,
        board: paper.board,
        class: paper.class,
        subject: paper.subject,
        variant: paper.variant,
        no_of_questions: paper.question_details.no_of_questions,
        total_marks: paper.question_details.total_marks,
        paper_date: paper.schedule_details.start_time,
    };
    const paperQuestions = paper.question_details.questions;
    const totalStudents = paper.schedule_details.student_list.length;
    const totalAttemptedStudents = rankings.length;
    const topics = lodash.uniq(paperQuestions.map((question) => question.topics).flat());

    // topic wise marks and chapter totals and grouping
    const topicSegregation = topics.map((topic) => {
        const totalMarks = paperQuestions.reduce((acc, curr) => {
            if (curr.topics.includes(topic) && curr.topics.length > 1) {
                return curr.marks / curr.topics.length + acc;
            }

            if (curr.topics.includes(topic) && curr.topics.length === 1) {
                return curr.marks + acc;
            }

            return acc;
        }, 0);

        const chapters = lodash.uniq(
            paperQuestions.filter((quesion) => quesion.topics.includes(topic)).map((question) => question.chapter)
        );

        return {
            topic,
            chapters,
            total_marks: lodash.round(totalMarks ?? 0, 2),
        };
    });

    const studentsResultAnalysis = await pMap(results, async (studentResult) => {
        const studentRanking = rankings.find((ranking) => ranking.student_id === studentResult.student.toString());

        const questionsDetails = studentResult.submission_details.question_list.map((q) => ({
            obtained_marks: q.obtained_marks,
            topics: q.question.topics,
            chapter: q.question.chapter,
        }));

        const topicWiseMarks = await pMap(topicSegregation, async (topicInfo) => {
            const topicMarks = questionsDetails.reduce((acc, curr) => {
                if (curr.topics.includes(topicInfo.topic) && curr.topics.length > 1) {
                    return acc + curr.obtained_marks / curr.topics.length;
                }

                if (curr.topics.includes(topicInfo.topic) && curr.topics.length === 1) {
                    return acc + curr.obtained_marks;
                }

                return acc;
            }, 0);

            return { marks: lodash.round(topicMarks, 2), topic: topicInfo.topic, chapters: topicInfo.chapters };
        });

        return {
            ...paperBasicDetails,
            student_id: studentResult.student.toString(),
            student_name: studentRanking?.name,
            rank: studentRanking?.rank,
            obtained_marks: studentRanking?.obtained,
            questions: questionsDetails,
            topic_wise_marks: topicWiseMarks,
        };
    });

    const perTopicMarksAnalysis = await pMap(topicSegregation, async (topicAnalysis) => {
        const topicMaxNTotalObtainMarks = studentsResultAnalysis.reduce(
            (prev, curr) => {
                const studentTopicAnalysis = curr.topic_wise_marks.find((topic) => topic.topic === topicAnalysis.topic);
                const studentTopicMarks = studentTopicAnalysis?.marks ?? 0;

                if (prev.max > studentTopicMarks) {
                    return { max: prev.max, total: prev.total + studentTopicMarks };
                }

                return {
                    max: studentTopicMarks,
                    total: prev.total + studentTopicMarks,
                };
            },
            { total: 0, max: 0 }
        );

        return {
            ...topicAnalysis,
            max_obtain_marks: topicMaxNTotalObtainMarks.max,
            avg_obtain_marks: lodash.round(topicMaxNTotalObtainMarks.total / rankings.length, 2),
        };
    });

    const paperAnalysis = {
        ...paperBasicDetails,
        name: paperBasicDetails.paper_name,
        no_students: totalStudents,
        no_attempted_students: totalAttemptedStudents,
        topic_marks_analysis: perTopicMarksAnalysis,
        rankings,
    };

    await ResultAnalysisModel.insertMany(studentsResultAnalysis);
    return await PaperAnalysisModel.create(paperAnalysis);
}

export async function studentPastResults(studentId: string, paperId: string) {
    const paper = await PaperModel.findById(paperId).lean();

    if (!paper) {
        return [];
    }

    const papers = await PaperModel.find({
        school: paper.school,
        class: paper.class,
        variant: paper.variant,
        type: paper.type,
        subject: { $in: paper.subject },
        "schedule_details.student_list": studentId,
    })
        .select("name")
        .sort({ created_at: -1 })
        .limit(5)
        .lean();

    const papersObjectId = papers.map((paper) => paper._id);

    const results = await ResultCopyModel.aggregate<IPastResultAgg>([
        {
            $match: {
                paper: { $in: [papersObjectId[2]] },
                student: new mongoose.Types.ObjectId(studentId),
            },
        },
        {
            $lookup: {
                from: "paper",
                localField: "paper",
                foreignField: "_id",
                pipeline: [{ $project: { name: 1 } }],
                as: "paper",
            },
        },
        {
            $project: {
                student: 1,
                paper: { $arrayElemAt: ["$paper", 0] },
                created_at: 1,
                obtained_marks: "$submission_details.obtained_marks",
                total_marks: "$submission_details.total_marks",
            },
        },
        {
            $sort: {
                created_at: -1,
            },
        },
        {
            $addFields: {
                percentage: { $multiply: [100, { $divide: ["$obtained_marks", "$total_marks"] }] },
            },
        },
    ]);

    return results;
}
