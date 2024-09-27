import { ServiceError } from "../../utils/error.js";
import { Types } from "mongoose";
import StudentModel, { type IDBStudent } from "../../database/models/Student.js";
import { updateSchoolAcademicCounts } from "./school.js";
import type { IDBSchool } from "../../database/models/School.js";

export const studentModel = StudentModel;

export async function findStudentById(id: string) {
    const doc = await StudentModel.findById(id).lean<Omit<IDBStudent, "school"> & { school: IDBSchool }>({
        autopopulate: true,
    });
    return doc;
}

export async function getStudentOtpById(id: string) {
    const doc = await StudentModel.findOne({ _id: id, deleted: false }).lean();

    if (!doc) {
        return null;
    }

    return doc.otp;
}

export async function getStudentBySchoolIdAndContact({ contact, schoolId }: { contact: string; schoolId: string }) {
    const doc = await StudentModel.findOne({ contact, school: schoolId, deleted: false }).lean();
    return doc;
}

export async function addStudent(body: $TSFixMe) {
    const student = new StudentModel({
        school: body.school,
        batch: body.batch,
        email: body.email,
        name: body.name,
        contact: body.contact,
        created_by: body.created_by,
    });
    await student.save();

    try {
        await updateSchoolAcademicCounts({
            type: "student",
            action: "inc",
            schoolId: student.school._id.toString(),
            amount: 1,
        });
    } catch {
        // continue regardless of error
    }

    return student.toObject();
}

export async function updateStudentOtp({ id, otp }: { id: string; otp: string }) {
    const doc = await StudentModel.findByIdAndUpdate(id, { otp }, { new: true }).lean({ autopopulate: true });
    return doc;
}

export async function updateStudentEmailOrContactById({ id, update }: $TSFixMe) {
    await StudentModel.findByIdAndUpdate(id, update);
}

export async function updateStudentsBatchByIds({ ids, batch }: $TSFixMe) {
    await StudentModel.updateMany({ _id: { $in: ids } }, { batch: batch });
}

export async function updateStudentsBatch({ ids, batch, action }: $TSFixMe) {
    if (action === "add") {
        await StudentModel.updateMany({ _id: { $in: ids } }, { $addToSet: { batch } });
    }

    if (action === "remove") {
        await StudentModel.updateMany({ _id: { $in: ids } }, { $pull: { batch } });
    }
}

export async function getStudentByFilter(filter: $TSFixMe) {
    const result = await StudentModel.findOne({ ...filter, deleted: false })
        .populate("school")
        .populate("batch")
        .lean();
    return result;
}

export async function getStudentByEmailOrContact({ email = "", contact = 0 }) {
    let list;

    if (email.length !== 0) {
        list = await StudentModel.findOne({ email, deleted: false }).lean();
        return list;
    }

    if (contact !== 0) {
        list = await StudentModel.findOne({ contact, deleted: false }).lean();
        return list;
    }

    return list;
}

export async function removeStudentById({ id, updated_by }: $TSFixMe) {
    await StudentModel.findByIdAndUpdate(id, { deleted: true, updated_by });
}

export async function removeStudentsByIds({ ids, updated_by }: { ids: string[]; updated_by: string }) {
    await StudentModel.updateMany({ _id: { $in: ids } }, { deleted: true, updated_by });
}

export async function removeStudentBatch(userId: string, batchId: string) {
    const student = await StudentModel.findById(userId, {}, { autopopulate: false });

    if (!student) {
        throw new ServiceError({ msg: "unable to find student" });
    }

    if (student.batch.length === 1) {
        student.deleted = true;
    } else {
        student.batch = student.batch.filter((batch) => batch.toString() !== batchId) as Types.Array<Types.ObjectId>;
    }

    await student.save();
    return student.id;
}

export async function removeBatchFromStudents(batchId = "") {
    const result = await StudentModel.updateMany({ batch: { $in: [batchId] } }, { $pullAll: { batch: [batchId] } });

    return result;
}

export async function getStudentsByBatchId(batchId: $TSFixMe) {
    const result = await StudentModel.find({ batch: batchId, deleted: false }).lean({ autopopulate: true });
    return result;
}

export async function getStudentByParentId(parentId: $TSFixMe) {
    const result = await StudentModel.findOne({ parents: parentId, deleted: false }).lean();
    return result;
}

export async function getStudentsByIdList(list: $TSFixMe) {
    const result = await StudentModel.find({ _id: { $in: list } })
        .select("-device_details")
        .lean();
    return result;
}

export async function getAllStudentsBySchoolId(schoolId: string) {
    const result = await StudentModel.find({ school: schoolId, deleted: false }).lean({ autopopulate: true });
    return result;
}

export async function updateStudentProfileById(studentId: string, update: $TSFixMe) {
    return await StudentModel.findByIdAndUpdate(studentId, update, { returnDocument: "after" }).lean();
}

export async function checkContactExistsByStudentId(studentId: string, contact: string) {
    const student = await StudentModel.findById(studentId).select("school").lean();
    if (!student) {
        throw new ServiceError({ msg: "unable to find student" });
    }

    const exists = await StudentModel.exists({ school: student.school, contact: contact, deleted: false });

    if (!exists) {
        return false;
    }

    return true;
}
