import SchoolAdminUserModel from "../../database/models/SchoolAdminUser.js";

export const schoolAdminUserModel = SchoolAdminUserModel;

export async function createSchoolAdminUser(body: $TSFixMe) {
    const user = await SchoolAdminUserModel.create({
        school: body.school,
        name: body.name,
        email: body.email,
        contact: body.contact,
        password: body.password,
        roles: body.roles,
        created_by: body.created_by,
        updated_by: body.updated_by,
    });
    return user.toObject();
}

export async function findSchoolAdminUserDetails(id = "") {
    const details = await SchoolAdminUserModel.findById(id)
        .select("-deleted -created_by -updated_by -updated_at")
        .lean({ autopopulate: true });
    return details;
}

export async function getAllAdminUsersBySchoolId(school_id = "") {
    const list = await SchoolAdminUserModel.find({ school: school_id, deleted: false })
        .select("-deleted -updated_by -created_by")
        .lean({ autopopulate: true });
    return list;
}

export async function getAdminUserById({ admin_id, school_id }: $TSFixMe) {
    const user = await SchoolAdminUserModel.find({ _id: admin_id, school: school_id }).lean();
    return user;
}

export async function findSchoolAdminUserByEmail(email: $TSFixMe) {
    const user = await SchoolAdminUserModel.findOne({ email, deleted: false }).lean();
    return user;
}

export async function removeAdminUsersById({ ids, updated_by }: $TSFixMe) {
    await SchoolAdminUserModel.updateMany({ _id: { $in: ids } }, { deleted: true, updated_by: updated_by });
}

export async function removeAdminUsersBySchoolId({ schoolId, updatedBy }: $TSFixMe) {
    await SchoolAdminUserModel.updateMany({ school: schoolId }, { deleted: true, updated_by: updatedBy });
}
