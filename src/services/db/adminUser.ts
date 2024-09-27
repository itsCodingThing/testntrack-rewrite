import AdminUserModel from "../../database/models/AdminUser.js";

export const model = AdminUserModel;
export const adminUserModel = AdminUserModel;

export async function addAdminUser(data: {
    name?: string;
    email: string;
    contact?: string;
    password: string;
    created_by?: string;
}) {
    const user = new AdminUserModel({
        name: data.name,
        email: data.email,
        contact: data.contact,
        password: data.password,
        created_by: data.created_by,
    });
    await user.save();

    return user.toObject();
}

export async function getAllAdminUsers() {
    const list = await AdminUserModel.find({ deleted: false })
        .select("-deleted -password -created_by -updated_by -updated_at")
        .lean();
    return list;
}

export async function getAdminUserById(id = "") {
    const user = await AdminUserModel.findById(id).lean({ autopopulate: true });
    return user;
}

export async function findAdminUserByEmail(email: string) {
    const user = await AdminUserModel.findOne({ email, deleted: false }).lean();
    return user;
}

export async function removeAdminUserById({ id, updated_by }: { id: string; updated_by: string }) {
    await AdminUserModel.findByIdAndUpdate(id, { deleted: true, updated_by: updated_by });
}
