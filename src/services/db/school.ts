import lodash from "lodash";

import { ServiceError } from "../../utils/error.js";
import * as BatchService from "./batch.js";
import * as PaperService from "./paper.js";
import * as StudentService from "./student.js";
import * as TeacherService from "./teacher.js";
import SchoolModel, { type IDBSchool } from "../../database/models/School.js";
import SchoolPermissionModel from "../../database/models/SchoolPermission.js";

export const schoolModel = SchoolModel;

export async function createSchoolPermissionsForAllSchools() {
    const schools = await SchoolModel.find({ deleted: false }).lean();
    const masterPermission = await SchoolPermissionModel.findOne({ type: "master" }).lean();

    const restPermission = lodash.omit(masterPermission, ["_id", "school_id"]);

    await SchoolPermissionModel.updateMany(
        { school_id: { $in: schools.map((school) => school._id.toString()) } },
        { ...restPermission }
    );
}

async function createSchoolPermissionById(id: string) {
    const masterPermission = await SchoolPermissionModel.findOne({ type: "master" }).lean();
    const restPermission = lodash.omit(masterPermission, ["_id", "school_id"]);

    const permission = await SchoolPermissionModel.create({ school_id: id, ...restPermission });
    return permission;
}

export async function updateSchoolAcademicCounts({
    type,
    action = "inc",
    amount = 1,
    schoolId,
}: {
    type: "student" | "teacher" | "batch" | "paper";
    action: "inc" | "dec";
    amount: number;
    schoolId: string;
}) {
    const school = await SchoolModel.findById(schoolId).lean();

    if (!school) {
        throw new ServiceError({ msg: "unable to find school" });
    }

    // if details is not present then create it with default or calculate it
    if (!school.details) {
        const counts = await Promise.all([
            BatchService.batchModel.countDocuments({ school: schoolId, deleted: false }),
            PaperService.paperModel.countDocuments({ school: schoolId, deleted: false }),
            TeacherService.teacherModel.countDocuments({ school: schoolId, deleted: false }),
            StudentService.studentModel.countDocuments({ school: schoolId, deleted: false }),
        ]);

        await SchoolModel.findByIdAndUpdate(schoolId, {
            details: {
                total_batches: counts[0],
                total_papers: counts[1],
                total_teachers: counts[2],
                total_students: counts[3],
            },
        });
    } else {
        if (type === "student") {
            if (action === "inc") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_students": amount } });
            }

            if (action === "dec") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_students": -amount } });
            }
        }

        if (type === "teacher") {
            if (action === "inc") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_teachers": amount } });
            }

            if (action === "dec") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_teachers": -amount } });
            }
        }

        if (type === "batch") {
            if (action === "inc") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_batches": amount } });
            }

            if (action === "dec") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_batches": -amount } });
            }
        }

        if (type === "paper") {
            if (action === "inc") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_papers": amount } });
            }

            if (action === "dec") {
                await SchoolModel.findByIdAndUpdate(schoolId, { $inc: { "details.total_papers": -amount } });
            }
        }
    }
}

export async function getSchoolsList() {
    const list = await SchoolModel.find({ deleted: false })
        .select("-deleted -created_by -updated_by -updated_at")
        .lean();
    return list;
}

export async function getSchoolPermissionById({ id }: { id: string }) {
    const permission = await SchoolPermissionModel.findOne({ school_id: id }).lean();
    return permission;
}

export async function updateSchoolPermission({ id, update }: { id: string; update: any }) {
    // update school permission for the school
    const permission = await SchoolPermissionModel.findOneAndUpdate(
        { school_id: id },
        {
            ...update,
        }
    );

    return permission;
}

export async function createSchool(body: $TSFixMe) {
    const school = new SchoolModel(body);
    await school.save();

    // creating school permission model for respective school
    await createSchoolPermissionById(school.id);
    return school.toObject();
}

export async function findSchoolByCode(code: string) {
    const school = await SchoolModel.findOne({ code: code, deleted: false }).lean();
    return school;
}

export async function getSchoolByEmail(email: string) {
    const school = await SchoolModel.findOne({ email, deleted: false }).lean();
    return school;
}

export async function getSchoolById(id: string) {
    const school = await SchoolModel.findById(id);
    return school;
}

export async function updateSchoolDetailsById({ id, update }: { id: string; update: any }) {
    return await SchoolModel.findByIdAndUpdate(id, update, { returnDocument: "after" });
}

export async function removeSchoolById({ id, updated_by }: { id: string; updated_by: string }) {
    await SchoolModel.findByIdAndUpdate(id, { deleted: true, updated_by });
}

export async function findSchoolSessionById(school_id: string) {
    const school = await SchoolModel.findById(school_id, "previous_sessions current_session").lean();

    if (!school) {
        return null;
    }

    return { current_session: school.current_session, previous_sessions: school.previous_sessions };
}

export async function createDefaultSession(schoolId: string) {
    const school = await schoolModel.findById(schoolId).lean();

    if (!school) {
        throw new ServiceError({ msg: "unable to find school" });
    }

    if (school.current_session) {
        return school;
    }

    // add a default session
    const updatedSchool = await schoolModel.findByIdAndUpdate(
        schoolId,
        {
            $set: { current_session: { name: "session-00" }, previous_sessions: [] },
        },
        { returnDocument: "after" }
    );

    if (!updatedSchool) {
        throw new ServiceError({ msg: "unable to find school" });
    }

    await BatchService.batchModel.updateMany(
        { school: updatedSchool._id },
        { $set: { session: updatedSchool.current_session._id, teachers: [], students: [] } }
    );

    return updatedSchool.toJSON();
}

export async function updateCurrentSession(
    schoolId: string,
    update: Omit<Partial<IDBSchool["current_session"]>, "_id">
) {
    return await SchoolModel.findByIdAndUpdate(
        schoolId,
        { current_session: update },
        { returnDocument: "after", lean: true }
    );
}
