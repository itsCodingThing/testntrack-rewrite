import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBPaperRatings {
    paper_details: {
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
        evaluator_details: {
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

type TPaperRatings = Model<IDBPaperRatings>;
const PaperRatingSchema = new Schema<IDBPaperRatings, TPaperRatings>({
    paper_details: {
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
                evaluator_details: {
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

export const PaperRatingsModel = model<IDBPaperRatings, TPaperRatings>("PaperRatings", PaperRatingSchema);
export default PaperRatingsModel;
