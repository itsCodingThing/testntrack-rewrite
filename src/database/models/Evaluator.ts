import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBEvaluator {
    _id: Types.ObjectId;
    boards: Types.Array<string>;
    classes: Types.Array<string>;
    subjects: Types.Array<string>;
    name: string;
    experience: string;
    rating: number;
    badges: Types.Array<string>;
    email: string;
    blood_group: string;
    aadhar: string;
    nationality: string;
    pin_code: string;
    contact: string;
    address: string;
    image: string;
    max_copy_limit: number;
    otp: string;
    status: string;
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TEvaluatorModel = Model<IDBEvaluator>;

const EvaluatorSchema = new Schema<IDBEvaluator, TEvaluatorModel>(
    {
        boards: { type: [String], required: true },
        classes: { type: [String], required: true },
        subjects: { type: [String], required: true },
        name: { type: String, required: true },
        experience: { type: String, required: true },
        rating: { type: Number, default: 5 },
        badges: { type: [String], default: [] },
        email: { type: String, default: "" },
        blood_group: { type: String, default: "" },
        aadhar: { type: String, default: "" },
        nationality: { type: String, default: "" },
        pin_code: { type: String, default: "" },
        contact: { type: String, required: true },
        address: { type: String, default: "" },
        image: { type: String, default: "" },
        max_copy_limit: { type: Number, default: 20 },
        otp: { type: String, default: "" },
        status: { type: String, enum: ["active", "pending", "inactive"], default: "active" },
        deleted: { type: Boolean, default: false },
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

export const EvaluatorModel = model<IDBEvaluator, TEvaluatorModel>("Evaluator", EvaluatorSchema);
export default EvaluatorModel;
