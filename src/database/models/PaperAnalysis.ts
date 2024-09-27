import mongoose, { Model, Schema } from "mongoose";

export interface IDBPaperAnalysis {
    paper_id: Schema.Types.ObjectId;
    name: string;
    school: string;
    board: string;
    class: string;
    subject: string[];
    type: string;
    variant: string;
    no_of_questions: number;
    no_students: number;
    no_attempted_students: number;
    total_marks: number;
    rankings: {
        image: string;
        student_id: string;
        name: string;
        rank: number;
        obtained: number;
        total: number;
    }[];
    topic_marks_analysis: {
        topic: string;
        chapters: string[];
        total_marks: number;
        max_obtain_marks: number;
        avg_obtain_marks: number;
    }[];
    paper_date: Date;
}

type TPaperAnalysisModel = Model<IDBPaperAnalysis>;

export const PaperAnalysisSchema = new Schema<IDBPaperAnalysis, TPaperAnalysisModel>(
    {
        paper_id: { type: Schema.Types.ObjectId, unique: true, required: true },
        name: { type: Schema.Types.String },
        school: { type: Schema.Types.String },
        board: { type: Schema.Types.String },
        class: { type: Schema.Types.String },
        subject: { type: [Schema.Types.String] },
        type: { type: Schema.Types.String },
        variant: { type: Schema.Types.String },
        no_of_questions: { type: Schema.Types.Number },
        total_marks: { type: Schema.Types.Number },
        no_students: { type: Schema.Types.Number },
        no_attempted_students: { type: Schema.Types.Number },
        rankings: {
            type: [
                {
                    image: Schema.Types.String,
                    student_id: Schema.Types.String,
                    name: Schema.Types.String,
                    rank: Schema.Types.Number,
                    obtained: Schema.Types.Number,
                    total: Schema.Types.Number,
                },
            ],
        },
        topic_marks_analysis: {
            type: [
                {
                    topic: Schema.Types.String,
                    chapters: [Schema.Types.String],
                    total_marks: Schema.Types.Number,
                    max_obtain_marks: Schema.Types.Number,
                    avg_obtain_marks: Schema.Types.Number,
                },
            ],
        },
        paper_date: {
            type: Schema.Types.Date,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const PaperAnalysisModel = mongoose.model("paper_analysis", PaperAnalysisSchema);
export default PaperAnalysisModel;
