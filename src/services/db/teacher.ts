import { Types } from "mongoose";
import TeacherModel from "../../database/models/Teacher.js";
import { updateSchoolAcademicCounts } from "./school.js";

export const teacherModel = TeacherModel;

export async function getTeacherBatchListById(id: $TSFixMe) {
    const doc = await TeacherModel.findById(id).lean({ autopopulate: true });

    if (!doc) {
        return [];
    }

    return doc.batch;
}

export async function findTeacherById(id: string) {
    return await TeacherModel.findById(id).lean({ autopopulate: true });
}

export async function addTeacher(body: $TSFixMe) {
    const teacher = new TeacherModel(body);
    await teacher.save();

    try {
        await updateSchoolAcademicCounts({
            type: "teacher",
            action: "inc",
            schoolId: teacher.school._id.toString(),
            amount: 1,
        });
    } finally {
        // continue regardless of error
    }

    return teacher.toObject();
}

export async function getTeacherOtpById(id: string) {
    const doc = await TeacherModel.findById({ _id: id, deleted: false }).lean();
    return doc?.otp;
}

export async function updateTeacherProfile({ id, update }: $TSFixMe) {
    const doc = await TeacherModel.findByIdAndUpdate(id, update, { new: true }).lean();

    return doc;
}

export async function updateTeacherById({ id, update }: $TSFixMe) {
    const doc = await TeacherModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return doc;
}

export async function updateTeacherOtp({ id, otp }: { id: string; otp: string }) {
    const doc = await TeacherModel.findByIdAndUpdate(id, { otp }, { new: true }).lean({ autopopulate: true });
    return doc;
}

export async function addOrRemoveTeacherBatch({
    ids,
    action,
    batch,
}: {
    ids: string[];
    action: "add" | "remove";
    batch: string;
}) {
    if (action === "add") {
        await TeacherModel.updateMany({ _id: { $in: ids } }, { $addToSet: { batch } });
    }

    if (action === "remove") {
        await TeacherModel.updateMany({ _id: { $in: ids } }, { $pull: { batch } });
    }
}

export async function removeBatchFromTeacher(teacherId: string, batchId: string) {
    const teacher = await TeacherModel.findById(teacherId, {}, { autopopulate: false });

    if (!teacher) {
        return teacherId;
    }

    if (teacher.batch.length === 1) {
        teacher.deleted = true;
    } else {
        teacher.batch = teacher.batch.filter((batch) => batch.toString() !== batchId) as Types.Array<Types.ObjectId>;
    }

    await teacher.save();

    return teacher.id;
}

export async function removeBatchFromTeachers(batchId: string) {
    return await TeacherModel.updateMany({ batch: { $in: [batchId] } }, { $pullAll: { batch: [batchId] } });
}

export async function removeTeacherById({ id, updated_by }: { id: string; updated_by: string }) {
    const doc = await TeacherModel.findByIdAndUpdate(id, { deleted: true, updated_by }, { new: true }).lean();
    return doc;
}

export async function findTeachersByBatchId(id: string) {
    return await TeacherModel.find({ batch: id, deleted: false }).lean({ autopopulate: true });
}

export async function findTeacherBySchoolId(id: string) {
    const docs = await TeacherModel.find({ school: id, deleted: false }).lean({ autopopulate: true });
    return docs;
}

export async function findTeacherBySchoolIdAndContact({ contact, schoolId }: { contact: string; schoolId: string }) {
    const doc = await TeacherModel.findOne({ contact, school: schoolId, deleted: false });
    return doc;
}
