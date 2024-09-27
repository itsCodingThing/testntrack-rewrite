import type { PipelineStage } from "mongoose";
import {
    getStudentRankByResultIds,
    getGroupedResultByVariantByStudentId,
    getGroupedResultBySubjectByResultIds,
    getStudentReportCardDataByResultIds,
} from "../../pipelines/student.js";
import ParentModel from "../../../database/models/Parent.js";
import { studentModel } from "../student.js";
import { resultModel } from "../result.js";
import { schoolModel } from "../school.js";

export async function findParentById(id: $TSFixMe) {
    const doc = await ParentModel.findOne({ _id: id, deleted: false }).lean();
    return doc;
}

export async function addParent(body: $TSFixMe) {
    const doc = new ParentModel(body);
    await doc.save();
    return doc.toObject();
}

export async function updateParentById({ id, update }: $TSFixMe) {
    const doc = await ParentModel.findByIdAndUpdate(id, update, { returnDocument: "after" }).lean();
    return doc;
}

export async function removeParentById({ id, updated_by }: $TSFixMe) {
    const doc = await ParentModel.findByIdAndUpdate(id, { deleted: true, updated_by }, { new: true }).lean();
    return doc;
}

export async function updateParentOtp({ id, otp }: { id: string; otp: string }) {
    const doc = await ParentModel.findByIdAndUpdate(id, { otp }, { new: true }).lean({ autopopulate: true });
    return doc;
}

export async function getParentOtpById(id = "") {
    const doc = await ParentModel.findOne({ _id: id, deleted: false }).lean();

    if (!doc) {
        return null;
    }

    return doc.otp;
}

export async function getParentByFilter(filter: $TSFixMe) {
    const result = await ParentModel.findOne({ ...filter, deleted: false }).lean();
    return result;
}

export async function findParentByContact(contact: string) {
    const result = await ParentModel.findOne({ contact, deleted: false }).lean();
    return result;
}

export async function getStudentToAddByContact(parentId: string, contact: string) {
    const parent = await ParentModel.findById(parentId);

    if (!parent) {
        return [];
    }

    const pipeline: PipelineStage[] = [
        {
            $match: {
                contact: contact,
                deleted: false,
            },
        },
        {
            $lookup: {
                from: "batches",
                let: { batchList: "$batch" },
                as: "batch",
                pipeline: [{ $match: { $expr: { $in: ["$_id", "$$batchList"] } } }],
            },
        },
        {
            $project: {
                name: 1,
                already_added: { $in: ["$_id", parent.students] },
                school: 1,
                contact: 1,
                email: 1,
                image: 1,
                batch: {
                    $map: {
                        input: "$batch",
                        as: "batch",
                        in: "$$batch.name",
                    },
                },
            },
        },
        {
            $lookup: {
                from: "schools",

                let: { schoolId: "$school" },
                as: "school",
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$$schoolId", "$_id"] },
                        },
                    },
                    {
                        $project: {
                            name: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$school",
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$$ROOT",
                        {
                            school: "$school.name",
                        },
                    ],
                },
            },
        },
    ];

    const studentList = await studentModel.aggregate(pipeline);
    return studentList;
}

export async function getStudentListByParent(parentId: string) {
    const parent = await ParentModel.findById(parentId);

    if (!parent) {
        return [];
    }

    const pipeline: PipelineStage[] = [
        {
            $match: {
                deleted: false,
                $expr: { $in: ["$_id", parent.students] },
            },
        },
        {
            $lookup: {
                from: "batches",
                let: { batchList: "$batch" },
                as: "batch",
                pipeline: [{ $match: { $expr: { $in: ["$_id", "$$batchList"] } } }],
            },
        },
        {
            $project: {
                name: 1,
                already_added: { $in: ["$_id", parent.students] },
                school: 1,
                contact: 1,
                email: 1,
                image: 1,
                batch: {
                    $map: {
                        input: "$batch",
                        as: "batch",
                        in: "$$batch.name",
                    },
                },
            },
        },
        {
            $lookup: {
                from: "schools",

                let: { schoolId: "$school" },
                as: "school",
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$$schoolId", "$_id"] },
                        },
                    },
                    {
                        $project: {
                            name: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$school",
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$$ROOT",
                        {
                            school: "$school.name",
                        },
                    ],
                },
            },
        },
    ];

    const studentList = await studentModel.aggregate(pipeline);
    return studentList;
}

const calculateStudentRank = async (student: $TSFixMe, resultIds: $TSFixMe) => {
    const rankList = await resultModel.aggregate(getStudentRankByResultIds(resultIds)).exec();

    const rank = rankList.findIndex((e: $TSFixMe) => e._id.toString() === student.toString()) + 1;

    return rank;
};

export async function getPerformanceVariantList(student: $TSFixMe) {
    let result = await resultModel.aggregate(getGroupedResultByVariantByStudentId(student)).exec();

    const op = result.map(async (e: $TSFixMe) => {
        const rank = await calculateStudentRank(student, e.results);

        return {
            rank,
            ...e,
        };
    });

    result = await Promise.all(op);

    return result;
}

export async function getPerformanceSubjectList(student: $TSFixMe, resultIds: $TSFixMe) {
    let result = await resultModel.aggregate(getGroupedResultBySubjectByResultIds(resultIds));

    const op = result.map(async (e: $TSFixMe) => {
        const rank = await calculateStudentRank(student, e.results);

        return {
            rank,
            ...e,
        };
    });

    result = await Promise.all(op);

    return result;
}

export async function getReportCardListByStudent(student: $TSFixMe) {
    const result = await resultModel.aggregate(getGroupedResultByVariantByStudentId(student));
    return result;
}

export async function getReportCardDetails(student: $TSFixMe, resultIds: $TSFixMe) {
    const studentData = await studentModel
        .findById(student)
        .select("name image email contact created_at school")
        .lean();

    const schoolData = await schoolModel
        .findById(studentData?.school ?? "")
        .select("name address email code image created_at")
        .lean();

    const resultData = await resultModel.aggregate(getStudentReportCardDataByResultIds(resultIds));
    const rank = await calculateStudentRank(student, resultIds);

    return {
        student: studentData ?? [],
        school: schoolData,
        rank: rank,
        report_card: resultData,
    };
}

export async function findParentsByStudentId(student_id: $TSFixMe) {
    const parentList = await ParentModel.find({ students: student_id });
    return parentList;
}
