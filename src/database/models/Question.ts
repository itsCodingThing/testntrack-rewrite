import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBLibQuestion {
    board: string;
    class: string;
    subject: string;
    chapter: string;
    topics: string[];
    category: string;
    type: string;
    swat: string[];
    level: string;
    question: string;
    options: Types.DocumentArray<{ option_text: string; correct: boolean }>;
    solution: string;
    marks: number;
    locale: string;
    status: boolean;
    created_date: Date;
    modified_date: Date;
}

type TLibQuestionModel = Model<IDBLibQuestion>;

const QuestionSchema = new Schema<IDBLibQuestion>(
    {
        board: { type: String, required: true },
        class: { type: String, required: true },
        subject: { type: String, required: true },
        chapter: { type: String, required: true },
        topics: { type: [String], required: true },
        category: {
            type: String,
            required: true,
        },
        type: { type: String, required: true },
        swat: { type: [String], required: true },
        level: { type: String, required: true },
        question: { type: String, required: true },
        options: [{ option_text: String, correct: Boolean }],
        solution: { type: String, default: "" },
        marks: { type: Number, required: true },
        locale: { type: String, required: true },
        status: { type: Boolean, default: true },
        created_date: { type: Date, default: new Date() },
        modified_date: { type: Date, default: new Date() },
    },
    { versionKey: false }
);

export const LibQuestionModel = model<IDBLibQuestion, TLibQuestionModel>("Question", QuestionSchema);
export default LibQuestionModel;
