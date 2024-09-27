import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBEvaluatorRatings {
    evaluator_details: {
        _id: Types.ObjectId;
        name: string;
    };
    rating: number;
    total_ratings: number;
    ratings_history: {
        result: Types.ObjectId;
        rating: number;
        reason: string;
        student_details: {
            _id: Types.ObjectId;
            name: string;
        };
        paper_details: {
            _id: Types.ObjectId;
            name: string;
        };
        school_details: {
            _id: Types.ObjectId;
            name: string;
            code: string;
        };
        batch_details: {
            _id: Types.ObjectId;
            name: string;
        };
        created_at: Date;
    }[];
}

type TEvaluatorRatings = Model<IDBEvaluatorRatings>;
const EvaluatorRatingSchema = new Schema<IDBEvaluatorRatings, TEvaluatorRatings>({
    evaluator_details: {
        _id: { type: Schema.Types.ObjectId, required: true },
        name: { type: Schema.Types.String, required: true },
    },
    rating: { type: Schema.Types.Number, default: 0 },
    total_ratings: { type: Schema.Types.Number, default: 0 },
    ratings_history: {
        type: [
            {
                result: { type: Schema.Types.ObjectId },
                rating: { type: Schema.Types.Number, required: true },
                reason: { type: Schema.Types.String, required: true },
                student_details: {
                    _id: { type: Schema.Types.ObjectId, required: true },
                    name: { type: Schema.Types.String, required: true },
                },
                paper_details: {
                    _id: { type: Schema.Types.ObjectId, required: true },
                    name: { type: Schema.Types.String, required: true },
                },
                school_details: {
                    _id: { type: Schema.Types.ObjectId, required: true },
                    name: { type: Schema.Types.String, required: true },
                    code: { type: Schema.Types.String, required: true },
                },
                batch_details: {
                    _id: { type: Schema.Types.ObjectId, required: true },
                    name: { type: Schema.Types.String, required: true },
                },
                created_at: { type: Schema.Types.Date, default: new Date() },
            },
        ],
        default: [],
    },
});

export const EvaluatorRatingsModel = model<IDBEvaluatorRatings, TEvaluatorRatings>(
    "EvaluatorRatings",
    EvaluatorRatingSchema
);
export default EvaluatorRatingsModel;
