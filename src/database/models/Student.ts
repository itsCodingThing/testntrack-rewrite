import mongoose, { Model, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const { model, Schema } = mongoose;

export interface IDBStudent {
    _id: Types.ObjectId;
    name: string;
    school: Types.ObjectId;
    batch: Types.Array<Types.ObjectId>;
    dob: string;
    bloodGroup: string;
    nationality: string;
    rollNo: string;
    aadhaar_details: string;
    email: string;
    contact: string;
    address: string;
    address_details: {
        per_address: string;
        perm_pincode: string;
        alternate_address: string;
        alternate_pincode: string;
    };
    image: string;
    parents: Types.Array<Types.ObjectId>;
    parent_details: {
        name: string;
        email: string;
        contact: string;
    };
    star_student: boolean;
    deleted: boolean;
    status: "active" | "pending" | "inactive";
    otp: string;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

export type TStudentModel = Model<IDBStudent>;

const StudentSchema = new Schema<IDBStudent, TStudentModel>(
    {
        name: { type: String, required: true },
        school: { type: Schema.Types.ObjectId, ref: "School", autopopulate: true },
        batch: [{ type: Schema.Types.ObjectId, ref: "Batch", autopopulate: true }],
        dob: { type: String, default: "" },
        bloodGroup: { type: String, default: "" },
        nationality: { type: String, default: "" },
        rollNo: { type: String, default: "" },
        aadhaar_details: { type: String, default: "" },
        email: { type: String, default: "" },
        contact: { type: String, required: true },
        address: { type: String, default: "" },
        address_details: {
            per_address: { type: String, default: "" },
            perm_pincode: { type: String, default: "" },
            alternate_address: { type: String, default: "" },
            alternate_pincode: { type: String, default: "" },
        },
        image: { type: String, default: "" },
        parents: [{ type: Schema.Types.ObjectId, ref: "Parent" }],
        parent_details: {
            name: { type: String, default: "" },
            email: { type: String, default: "" },
            contact: { type: String, default: "" },
        },
        star_student: { type: Boolean, default: false },
        deleted: { type: Boolean, default: false },
        status: { type: String, enum: ["active", "pending", "inactive"], default: "active" },
        otp: { type: String, default: "" },
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

StudentSchema.plugin(mongooseAutoPopulate);

export const StudentModel = model<IDBStudent, TStudentModel>("Student", StudentSchema);
export default StudentModel;
