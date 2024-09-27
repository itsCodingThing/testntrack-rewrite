import mongoose, { Schema, Model } from "mongoose";

export interface IDBResultAnalysis {
    student_id: Schema.Types.ObjectId;
    student_name: string;
    school: string;
    board: string;
    class: string;
    subject: string[];
    rank: number;
    paper_id: Schema.Types.ObjectId;
    paper_name: string;
    variant: string;
    no_of_questions: number;
    total_marks: number;
    obtained_marks: number;
    questions: { obtained_marks: number; topics: string[]; chapter: string }[];
    topic_wise_marks: { topic: string; marks: number; chapters: string[] }[];
    paper_date: Date;
}

type TResultAnalysis = Model<IDBResultAnalysis>;

const StudentResultAnalysisSchema = new Schema<IDBResultAnalysis, TResultAnalysis>(
    {
        student_id: { type: Schema.Types.ObjectId },
        paper_id: { type: Schema.Types.ObjectId },
        student_name: { type: Schema.Types.String },
        school: { type: Schema.Types.String },
        board: { type: Schema.Types.String },
        class: { type: Schema.Types.String },
        subject: { type: [Schema.Types.String] },
        rank: { type: Schema.Types.Number },
        paper_name: { type: Schema.Types.String },
        variant: { type: Schema.Types.String },
        total_marks: { type: Schema.Types.Number },
        obtained_marks: { type: Schema.Types.Number },
        no_of_questions: { type: Schema.Types.Number },
        questions: {
            type: [
                { obtained_marks: Schema.Types.Number, topics: [Schema.Types.String], chapter: Schema.Types.String },
            ],
        },
        topic_wise_marks: {
            type: [{ topic: Schema.Types.String, marks: Schema.Types.Number, chapters: [Schema.Types.String] }],
        },
        paper_date: { type: Schema.Types.Date },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const ResultAnalysisModel = mongoose.model("result_analysis", StudentResultAnalysisSchema);
export default ResultAnalysisModel;
