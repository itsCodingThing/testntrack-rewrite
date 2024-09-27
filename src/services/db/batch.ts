import BatchModel from "../../database/models/Batch.js";

import { updateSchoolAcademicCounts } from "./school.js";
import { removeBatchFromTeachers } from "./teacher.js";
import { removeBatchFromStudents } from "./student.js";

export const batchModel = BatchModel;

export async function getBatchByName({ schoolId, name }: $TSFixMe) {
    const doc = BatchModel.findOne({ name, school: schoolId, delete: false }).lean();
    return doc;
}

export async function getBatchListBySchoolId(school_id: string) {
    const list = await BatchModel.find({ deleted: false, school: school_id }).lean();
    return list;
}

export async function getBatchesBySchoolIdAndSessionId(schoolId: string, sessionId: string) {
    const batches = await BatchModel.find({ deleted: false, school: schoolId, session: sessionId }).lean();

    return batches;
}

export async function addBatch(body: {
    school: string;
    name: string;
    board: string;
    class: string;
    subject: string[];
    image?: string;
    session: string;
    created_by?: string;
}) {
    const batch = new BatchModel({
        school: body.school,
        session: body.session,
        name: body.name,
        board: body.board,
        class: body.class,
        subject: body.subject,
        image: body.image ?? "",
        created_by: body.created_by,
    });

    await batch.save();

    try {
        await updateSchoolAcademicCounts({
            type: "batch",
            action: "inc",
            schoolId: batch.school._id.toString(),
            amount: 1,
        });
    } finally {
        // continue regardless of error
    }

    return batch.toObject();
}

export async function removeBatchById({ id, updated_by }: $TSFixMe) {
    await BatchModel.findByIdAndUpdate(id, { deleted: true, updated_by });
    await removeBatchFromTeachers(id);
    await removeBatchFromStudents(id);
}

export async function updateBatchById(body: $TSFixMe) {
    await BatchModel.findByIdAndUpdate(body.id, body.update);
}

export async function getBatchById(id: $TSFixMe) {
    const result = await BatchModel.findOne({ _id: id, deleted: false }).lean();
    return result;
}

export async function getBatchBySchoolId(id: $TSFixMe) {
    const result = await BatchModel.find({ school: id }).lean();

    return result;
}
