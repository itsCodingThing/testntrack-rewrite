import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

interface IDBRating {
    rating: number;
    reason: string;
    student: string;
}

const RatingSchema = new Schema<IDBRating>(
    {
        rating: { type: Number, default: 5 },
        reason: { type: String, default: "" },
        student: { type: String, default: "" },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export interface IDBEvaluatorHistory {
    action: string;
    copies: Types.Array<Types.ObjectId>;
    no_of_copies: number;
    evaluator: Types.ObjectId;
    paper: Types.ObjectId;
    deleted: boolean;
    paid: boolean;
    is_rated: boolean;
    amount: number;
    bonus: number;
    penalty: number;
    rating: number;
    reason: string;
    ratingHistory: Types.DocumentArray<IDBRating>;
}

type TEvaluatorHistoryModel = Model<IDBEvaluatorHistory>;

const EvaluatorHistory = new Schema<IDBEvaluatorHistory, TEvaluatorHistoryModel>(
    {
        action: {
            type: String,
            enum: ["Assigned", "Withdrawn", "Submitted", "Recheck", "Inreview", "Dropped", "Reviewed", "Reverted"],
        },
        copies: { type: [{ type: Schema.Types.ObjectId, ref: "TeacherEvaluationCopy" }], default: [] },
        no_of_copies: { type: Number, required: true },
        evaluator: { type: Schema.Types.ObjectId, ref: "Evaluator", required: true },
        paper: { type: Schema.Types.ObjectId, ref: "Paper", required: true },
        deleted: { type: Boolean, default: false },
        paid: { type: Boolean, default: false },
        is_rated: { type: Boolean, default: false },
        amount: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        penalty: { type: Number, default: 0 },
        rating: { type: Number, default: 5 },
        reason: { type: String, default: "" },
        ratingHistory: {
            type: [RatingSchema],
            default: [
                {
                    rating: 5,
                    reason: "Rated By Admin Inititaly",
                    student: "",
                },
            ],
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const EvaluatorHistoryModel = model<IDBEvaluatorHistory, TEvaluatorHistoryModel>(
    "EvaluatorHistory",
    EvaluatorHistory
);
export default EvaluatorHistoryModel;
