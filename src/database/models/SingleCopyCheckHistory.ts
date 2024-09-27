import mongoose, { Model, Types } from "mongoose";

const { Schema, model } = mongoose;

interface IDBCheckDetails {
    copy_id: Types.ObjectId;
    paper_id: Types.ObjectId;
    review_evaluator_id: Types.ObjectId;
    check_details: any;
    created_at: string;
    updated_at: string;
}

type TCheckDetails = Model<IDBCheckDetails>;

const CheckDetailsSchema = new Schema<IDBCheckDetails, TCheckDetails>(
    {
        copy_id: { type: Schema.Types.ObjectId, ref: "TeacherEvaluationCopy" },
        paper_id: { type: Schema.Types.ObjectId, ref: "Paper" },
        review_evaluator_id: { type: Schema.Types.ObjectId, ref: "Teacher" },
        check_details: { type: Schema.Types.Mixed, default: [] },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const CheckDetailsModel = model<IDBCheckDetails, TCheckDetails>("SingleCopyCheckHistory", CheckDetailsSchema);
export default CheckDetailsModel;
