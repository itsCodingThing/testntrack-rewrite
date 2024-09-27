import mongoose, { Model, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const { model, Schema } = mongoose;

export interface IDBTeacher {
    _id: Types.ObjectId;
    school: Types.ObjectId;
    batch: Types.Array<Types.ObjectId>;
    name: string;
    email: string;
    contact: string;
    address: string;
    image: string;
    otp: string;
    status: string;
    deleted: boolean;
    dob: string;
    blood_group: string;
    nationality: string;
    aadhaar_details: string;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TTeacherModel = Model<IDBTeacher>;

const TeacherSchema = new Schema<IDBTeacher, TTeacherModel>(
    {
        school: { type: Schema.Types.ObjectId, ref: "School", autopopulate: true },
        batch: [{ type: Schema.Types.ObjectId, ref: "Batch", autopopulate: true }],
        name: { type: String, required: true },
        email: { type: String, default: "" },
        contact: { type: String, required: true },
        address: { type: String, default: "" },
        image: { type: String, default: "" },
        otp: { type: String, default: "" },
        status: { type: String, enum: ["active", "pending", "inactive"], default: "active" },
        deleted: { type: Boolean, default: false },
        dob: { type: String, default: "" },
        blood_group: { type: String, default: "" },
        nationality: { type: String, default: "" },
        aadhaar_details: { type: String, default: "" },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

TeacherSchema.plugin(mongooseAutoPopulate);
export const TeacherModel = model<IDBTeacher, TTeacherModel>("Teacher", TeacherSchema);
export default TeacherModel;
