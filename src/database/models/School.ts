import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBSchool {
    _id: Types.ObjectId;
    name: string;
    primary_data: Types.DocumentArray<{ board: string; class: Types.Array<string> }>;
    email: string;
    contact: string;
    address: string;
    type: string;
    code: string;
    image: string;
    details: {
        total_batches: number;
        total_paper: number;
        total_students: number;
        total_teachers: number;
    };
    current_session: IDBSchoolSession;
    previous_sessions: Types.DocumentArray<IDBSchoolSession>;
    status: "active" | "inactive" | "pending";
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

interface IDBSchoolSession {
    _id: Types.ObjectId;
    name: string;
    created_at: string;
    updated_at: string;
}

type TSchoolModel = Model<IDBSchool>;

const SchoolSession = new Schema<IDBSchoolSession>(
    {
        name: Schema.Types.String,
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const SchoolSchema = new Schema<IDBSchool, TSchoolModel>(
    {
        name: { type: String, required: true },
        primary_data: [{ board: String, class: [String] }],
        email: { type: String, required: true },
        contact: { type: String, required: true },
        address: { type: String, required: true },
        type: { type: String, default: "" },
        code: { type: String, default: "" },
        image: { type: String, default: "" },
        current_session: { type: SchoolSession },
        previous_sessions: { type: [SchoolSession], default: [] },
        details: {
            total_batches: { type: Number, default: 0 },
            total_papers: { type: Number, default: 0 },
            total_students: { type: Number, default: 0 },
            total_teachers: { type: Number, default: 0 },
        },
        status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
        deleted: { type: Boolean, default: false },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
    },
    {
        timestamps: {
            updatedAt: "updated_at",
            createdAt: "created_at",
        },
    }
);

export const SchoolModel = model<IDBSchool, TSchoolModel>("School", SchoolSchema);
export default SchoolModel;
