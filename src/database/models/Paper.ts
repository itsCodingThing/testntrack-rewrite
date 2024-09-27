import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBPaper {
    _id: Types.ObjectId;
    school: Types.ObjectId;
    batch: Types.ObjectId;
    name: string;
    board: string;
    class: string;
    subject: Types.Array<string>;
    type: "Subjective" | "Objective";
    variant: string;
    is_b2c: boolean;
    in_bundle: boolean;
    question_details: {
        is_descriptive_result: boolean;
        type: "pdf" | "individual" | "questions" | "sections";
        total_marks: number;
        no_of_questions: number;
        negative_marks: number;
        questions: IDBQuestion[];
        pdf: { paper: string; answer_key: Types.Array<string> };
        solution_pdf: string;
        solution_video: string;
    };
    schedule_details: {
        type: "Online" | "Offline" | "Hybrid";
        student_list: Types.Array<Types.ObjectId>;
        copy_check_teachers: Types.Array<Types.ObjectId>;
        copy_upload_teachers: Types.Array<Types.ObjectId>;
        copy_alter_teachers: Types.Array<Types.ObjectId>;
        copy_check_instructions: {
            instructions: Types.Array<string>;
            level_of_checking: string;
        };
        is_evaluator: boolean;
        result_declared_teachers: Types.Array<string>;
        result_declared_type: string;
        rejoin: number;
        start_time: Date;
        end_time: Date;
        copy_submit_time: Date;
    };
    created_by: string;
    updated_by: string;
    deleted: boolean;
    created_at: string;
    updated_at: string;
}

interface IDBQuestion {
    board: string;
    class: string;
    subject: string;
    chapter: string;
    topics: Types.Array<string>;
    category: string;
    time: number;
    level: string;
    swat: Types.Array<string>;
    question: string;
    options: Types.Array<{ option_text: string; correct: boolean }>;
    solution: string;
    marks: number;
    neg_marks: number;
    prerecorded_audio_url: string;
    locale: string;
    deleted: boolean;
}

type TPaperModel = Model<IDBPaper>;

const QuestionSchema = new Schema<IDBQuestion>(
    {
        board: { type: String, default: "" },
        class: { type: String, default: "" },
        subject: { type: String, default: "" },
        chapter: { type: String, default: "" },
        topics: { type: [String], default: [] },
        category: {
            type: String,
            default: "",
        },
        time: { type: Number, default: 0 },
        level: { type: String, default: "" },
        swat: { type: [String], default: [] },
        question: { type: String, default: "" },
        options: { type: [{ option_text: String, correct: Boolean }], default: [] },
        solution: { type: String, default: "" },
        marks: { type: Number, default: 0 },
        neg_marks: { type: Number, default: 0 },
        prerecorded_audio_url: { type: String, default: "" },
        locale: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
    },
    { versionKey: false }
);

export const PaperSchema = new Schema<IDBPaper, TPaperModel>(
    {
        batch: { type: Schema.Types.ObjectId, ref: "Batch" },
        school: { type: Schema.Types.ObjectId, ref: "School" },
        name: { type: String },
        board: { type: String },
        class: { type: String },
        subject: { type: [String] },
        type: { type: String, enum: ["Subjective", "Objective"] },
        variant: { type: String },
        is_b2c: { type: Boolean, default: false },
        in_bundle: { type: Boolean, default: false },
        question_details: {
            is_descriptive_result: { type: Boolean, default: false },
            type: { type: String, enum: ["pdf", "individual", "questions", "sections"] },
            total_marks: { type: Number },
            no_of_questions: { type: Number },
            negative_marks: { type: Number },
            sections: {
                type: [],
                default: [],
            },
            questions: { type: [QuestionSchema], default: [] },
            pdf: { type: { paper: String, answer_key: { type: [[String]], default: [] } }, default: "" },
            solution_pdf: { type: String, default: "" },
            solution_video: { type: String, default: "" },
        },
        schedule_details: {
            type: { type: String, enum: ["Online", "Offline", "Hybrid"] },
            student_list: { type: [{ type: Schema.Types.ObjectId, ref: "Student" }], default: [] },
            copy_check_teachers: { type: [{ type: Schema.Types.ObjectId, ref: "Teacher" }], default: [] },
            copy_upload_teachers: { type: [{ type: Schema.Types.ObjectId, ref: "Teacher" }], default: [] },
            copy_alter_teachers: { type: [{ type: Schema.Types.ObjectId, ref: "Teacher" }], default: [] },
            copy_check_instructions: {
                instructions: { type: [String], default: [] },
                level_of_checking: { type: String, default: "Moderate" },
            },
            is_evaluator: { type: Boolean, default: false },
            result_declared_teachers: { type: [String], default: [] },
            result_declared_type: { type: String },
            rejoin: { type: Number },
            start_time: { type: Date },
            end_time: { type: Date },
            copy_submit_time: { type: Date },
        },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const PaperModel = model<IDBPaper, TPaperModel>("Paper", PaperSchema);
export default PaperModel;
