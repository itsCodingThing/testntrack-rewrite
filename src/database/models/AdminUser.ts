import mongoose, { Model } from "mongoose";

const { model, Schema } = mongoose;

interface IDBAdminUser {
    name: string;
    email: string;
    contact: string;
    password: string;
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TAdminUserModel = Model<IDBAdminUser>;

const AdminUserSchema = new Schema<IDBAdminUser, TAdminUserModel>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        contact: { type: String, require: true },
        password: { type: String, required: true },
        deleted: { type: Boolean, default: false },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const AdminUserModel = model<IDBAdminUser, TAdminUserModel>("AdminUser", AdminUserSchema);
export default AdminUserModel;
