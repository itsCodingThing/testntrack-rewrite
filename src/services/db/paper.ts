import moment from "moment";
import { type PipelineStage, Types } from "mongoose";

import constants from "../../config/constants.js";
import { ServiceError } from "../../utils/error.js";

import type { IDBBacth } from "../../database/models/Batch.js";
import type { IDBSchool } from "../../database/models/School.js";
import PaperAnalysisModel from "../../database/models/PaperAnalysis.js";
import PaperModel, { type IDBPaper } from "../../database/models/Paper.js";

import * as SchoolService from "./school.js";
import * as StudentService from "./student.js";
import * as StudentCopyService from "./studentCopy.js";

export const paperModel = PaperModel;
export const paperAnalysisModel = PaperAnalysisModel;

export const createNewPaper = async (paperData: $TSFixMe) => {
    const scheduledPaper = new PaperModel(paperData);
    await scheduledPaper.save();

    try {
        // update paper count
        await SchoolService.updateSchoolAcademicCounts({
            type: "paper",
            schoolId: scheduledPaper.school.toString(),
            action: "inc",
            amount: 1,
        });
    } finally {
        // continue regardless of error
    }

    return scheduledPaper.toObject();
};

export const findPapersByBatchIdAndType = async (batch = "", type = "") => {
    const now = moment().toDate();

    if (type === constants.paper.get.previous) {
        return await PaperModel.find({
            batch: batch,
            deleted: false,
            "schedule_details.start_time": { $lt: now },
            "schedule_details.copy_submit_time": { $lt: now },
        })
            .sort({ created_at: -1 })
            .lean();
    }

    if (type === constants.paper.get.upcoming) {
        return await PaperModel.find({
            batch: batch,
            deleted: false,
            "schedule_details.start_time": { $gt: now },
            "schedule_details.end_time": { $gt: now },
        })
            .sort({ created_at: -1 })
            .lean();
    }

    if (type === constants.paper.get.current) {
        return await PaperModel.find({
            batch: batch,
            deleted: false,
            "schedule_details.start_time": { $lt: now },
            "schedule_details.copy_submit_time": { $gt: now },
        })
            .sort({ created_at: -1 })
            .lean();
    }

    /// if type is empty then it is used to get the all papers of batch without type and for bundle
    if (type === "") {
        return await PaperModel.find({
            deleted: false,
            batch: batch,
            in_bundle: { $ne: true },
        })
            .sort({ created_at: -1 })
            .lean();
    }
};

export const findPaperById = async (id: string) => {
    const doc = await PaperModel.findById(id).lean();
    return doc;
};

export const isPaperActive = async (paperId: string) => {
    const now = moment();
    const paper = await PaperModel.findById(paperId).lean();

    if (!paper) {
        throw new ServiceError({ msg: "unable to find paper" });
    }

    const paperStart = moment(paper.schedule_details?.start_time);
    const paperEnd = moment(paper.schedule_details?.end_time);

    return moment(now).isBetween(paperStart, paperEnd);
};

export const isPaperActiveByDate = (start_time = "", end_time = "") => {
    const now = moment();

    const paperStart = moment(start_time);
    const paperEnd = moment(end_time);

    return moment(now).isBetween(paperStart, paperEnd);
};

export const isCopySubmitActive = async (paperId: string) => {
    const now = moment();
    const paper = await PaperModel.findById(paperId).lean();
    if (!paper) {
        throw new ServiceError({ msg: "unable to find paper" });
    }

    if (paper.is_b2c) {
        return true;
    }

    const paperStart = moment(paper.schedule_details?.start_time);
    const paperEnd = moment(paper.schedule_details?.copy_submit_time);

    return moment(now).isBetween(paperStart, paperEnd);
};

export const addInstructionToPaper = async (paperId: string, instructions: string[], levelOfChecking = "Moderate") => {
    const paper = await PaperModel.findByIdAndUpdate(paperId, {
        "schedule_details.copy_check_instructions": { instructions: instructions, level_of_checking: levelOfChecking },
    });

    return paper;
};

export const deletePaperById = async (paperId = "") => {
    return await PaperModel.findByIdAndUpdate(paperId, {
        deleted: true,
    });
};

export const getPaperListByStudent = async (student = "", type = "") => {
    const now = moment().toDate();

    if (type === constants.paper.get.previous) {
        return await PaperModel.find({
            deleted: false,
            "schedule_details.start_time": { $lt: now },
            "schedule_details.copy_submit_time": { $lt: now },
            "schedule_details.student_list": { $in: [student] },
        })
            .sort({ created_at: -1 })
            .lean();
    }

    if (type === constants.paper.get.upcoming) {
        return await PaperModel.find({
            deleted: false,
            "schedule_details.start_time": { $gt: now },
            "schedule_details.end_time": { $gt: now },
            "schedule_details.student_list": { $in: [student] },
        })
            .sort({ created_at: -1 })
            .lean();
    }

    if (type === constants.paper.get.current) {
        return await PaperModel.find({
            deleted: false,
            "schedule_details.start_time": { $lt: now },
            "schedule_details.copy_submit_time": { $gt: now },
            "schedule_details.student_list": { $in: [student] },
        })
            .sort({ created_at: -1 })
            .lean();
    }
};

export const getAttendenceByPaperId = async (paperId = "") => {
    const paper = await PaperModel.findById(paperId).lean();
    if (!paper) {
        throw new ServiceError({ msg: "unable to find paper" });
    }

    const studentList = paper.schedule_details?.student_list ?? [];

    let result = await Promise.allSettled(
        studentList.map(async (studentId: $TSFixMe) => {
            const studentDetails = await StudentService.findStudentById(studentId);

            if (!studentDetails) {
                return {
                    _id: studentId,
                    name: "unknown",
                    status: "Absent",
                    contact: "",
                };
            }

            const studentCopy = await StudentCopyService.studentCopyModel
                .findOne({ paper: paperId, student: studentId })
                .lean();

            if (!studentCopy) {
                return {
                    _id: studentDetails._id,
                    name: studentDetails.name,
                    status: "Absent",
                    contact: studentDetails.contact,
                };
            }

            if (studentCopy?.is_exam_completed) {
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

    result = result.map((p: $TSFixMe) => p.value);

    return result;
};

export const findPapersBySchoolIdAndType = async (school: string, type: string) => {
    const now = moment().toDate();

    if (type === constants.paper.get.previous) {
        return await PaperModel.find({
            deleted: false,
            "schedule_details.start_time": { $lt: now },
            "schedule_details.copy_submit_time": { $lt: now },
            school: school,
        })
            .sort({ created_at: -1 })
            .lean();
    }

    if (type === constants.paper.get.upcoming) {
        return await PaperModel.find({
            deleted: false,
            "schedule_details.start_time": { $gt: now },
            "schedule_details.end_time": { $gt: now },
            school: school,
        })
            .sort({ created_at: -1 })
            .lean();
    }

    if (type === constants.paper.get.current) {
        return await PaperModel.find({
            deleted: false,
            "schedule_details.start_time": { $lt: now },
            "schedule_details.copy_submit_time": { $gt: now },
            school: school,
        })
            .sort({ created_at: -1 })
            .lean();
    }
};

export const updatePaperbyId = async (paper: $TSFixMe) => {
    const { _id, update } = paper;

    const result = await PaperModel.findByIdAndUpdate(_id, update);
    return result;
};

export async function getPopulatedBatchSchoolPaperById(id: string) {
    const paper = await PaperModel.findById(id)
        .populate<{ school: IDBSchool; batch: IDBBacth }>([{ path: "school" }, { path: "batch" }])
        .lean();

    if (!paper) {
        throw new ServiceError({ msg: "unable to find paper" });
    }

    return { ...paper, school: paper.school?.name ?? "unknown", batch: paper.batch?.name ?? "unknown" };
}

export async function addPapersToMarketPaperBundle(paperIds: string[]) {
    const paper = await PaperModel.updateMany({ _id: { $in: paperIds } }, { in_bundle: true }).lean();
    return paper;
}

export async function groupedPapersBySchoolAndBatch(filter?: {
    board: string;
    class: string;
    subject: string;
    school?: string;
}) {
    const pipelines: PipelineStage[] = [
        {
            $match: filter
                ? {
                      board: filter.board,
                      class: filter.class,
                      subject: filter.subject,
                      ...(filter.school && { school: new Types.ObjectId(filter.school) }),
                  }
                : {},
        },
        {
            $project: {
                _id: 1,
                batch: 1,
                school: 1,
                name: 1,
                board: 1,
                class: 1,
                type: 1,
                variant: 1,
                subject: 1,
                question_details: {
                    type: 1,
                    total_marks: 1,
                    no_of_questions: 1,
                },
                schedule_details: {
                    type: 1,
                    result_declared_type: 1,
                },
            },
        },
        {
            $group: {
                _id: {
                    school: "$school",
                    batch: "$batch",
                },
                papers: {
                    $push: "$$CURRENT",
                },
            },
        },
        {
            $group: {
                _id: "$_id.school",
                batches: {
                    $push: "$$CURRENT",
                },
            },
        },
        {
            $project: {
                _id: -1,
                school: "$_id",
                batches: {
                    $map: {
                        input: "$batches",
                        as: "batch",
                        in: {
                            batch: "$$batch._id.batch",
                            papers: "$$batch.papers",
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: "schools",
                localField: "school",
                foreignField: "_id",
                as: "school",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            code: 1,
                            address: 1,
                            image: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                school: {
                    $first: "$school",
                },
            },
        },
        {
            $lookup: {
                from: "batches",
                localField: "batches.batch",
                foreignField: "_id",
                as: "batches_details",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                        },
                    },
                ],
            },
        },
    ];

    interface GroupedPapers {
        _id: Types.ObjectId;
        school: { _id: Types.ObjectId; name: string; address: string; code: string; image: string };
        batches: { batch: Types.ObjectId; papers: IDBPaper }[];
        batches_details: { _id: Types.ObjectId; name: string }[];
    }

    const results: GroupedPapers[] = await PaperModel.aggregate(pipelines);

    return results.map((group) => {
        const batches = group.batches.map((batch) => {
            return {
                batch: group.batches_details.find((detail) => detail._id.toString() === batch.batch._id.toString()),
                paper: batch.papers,
            };
        });

        return {
            _id: group._id,
            school: group.school,
            batches: batches,
        };
    });
}
