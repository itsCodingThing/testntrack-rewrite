import mongoose, { Model, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const { model, Schema } = mongoose;

interface IDBSchoolAdminUser {
    school: Types.ObjectId;
    name: string;
    email: string;
    roles: Types.Array<Types.ObjectId>;
    contact: string;
    password: string;
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TSchoolAdminUserModel = Model<IDBSchoolAdminUser>;

const SchoolAdminUserSchema = new Schema<IDBSchoolAdminUser, TSchoolAdminUserModel>(
    {
        school: {
            type: Schema.Types.ObjectId,
            ref: "School",
            required: true,
            autopopulate: { select: "-deleted -updated_at -updated_by -created_by" },
        },
        name: { type: String, required: true },
        email: { type: String, required: true },
        roles: { type: [{ type: Schema.Types.ObjectId, ref: "Role", autopopulate: true }], default: [] },
        contact: { type: String, default: "" },
        password: { type: String, required: true },
        deleted: { type: Boolean, default: false },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
    },
    { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

SchoolAdminUserSchema.plugin(mongooseAutoPopulate);
export const SchoolAdminUserModel = model<IDBSchoolAdminUser, TSchoolAdminUserModel>(
    "SchoolAdminUser",
    SchoolAdminUserSchema
);
export default SchoolAdminUserModel;
