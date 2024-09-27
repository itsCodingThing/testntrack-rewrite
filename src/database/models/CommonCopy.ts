import mongoose, { Model, Types } from "mongoose";
const { Schema } = mongoose;

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
    options: Types.DocumentArray<{ option_text: string; correct: boolean }>;
    solution: string;
    marks: number;
    neg_marks: number;
    locale: string;
    deleted: boolean;
}

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
        locale: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
    },
    { versionKey: false }
);

interface IAttemptedQuestionDetail {
    time_taken: number;
    selected_options: Types.Array<any>;
    is_correct: boolean;
    is_attempted: boolean;
    is_skipped: boolean;
    obtained_marks: number;
    audio_remarks: string;
    remarks: string;
    question: IDBQuestion;
}

const AttemptedQuestionDetailSchema = new Schema<IAttemptedQuestionDetail>({
    time_taken: { type: Number },
    selected_options: { type: [] },
    is_correct: { type: Boolean },
    is_attempted: { type: Boolean },
    is_skipped: { type: Boolean },
    obtained_marks: { type: Number },
    audio_remarks: { type: String },
    remarks: { type: String },
    question: { type: QuestionSchema, default: {} },
});

interface IProctoringDetails {
    rejoin: number;
    start_time: Date;
    end_time: Date;
    images_link: Types.Array<string>;
}

const ProctoringDetailsSchema = new Schema<IProctoringDetails>({
    rejoin: { type: Number },
    start_time: { type: Date },
    end_time: { type: Date },
    images_link: { type: [String], default: [] },
});

export interface IDBCommonCopy {
    _id: Types.ObjectId;
    paper: Types.ObjectId;
    student: Types.ObjectId;
    result_declared_type: string;
    submitted_type: string;
    is_result_declared: boolean;
    is_exam_completed: boolean;
    is_rated: boolean;
    omr_scanner_details: { checked_copy: string; submitted_copy: string };
    associate_teacher: {
        teacher_id: Types.ObjectId;
        checked_copy: string;
        is_evaluator: boolean;
        is_submitted: boolean;
        submitted_time: Date;
        check_details: Types.Array<any>;
        assigned_time: string;
    };
    submission_details: {
        batch: Types.ObjectId;
        subject: Types.Array<string>;
        type: string;
        paper_type: string;
        variant_type: string;
        submission_time: string;
        obtained_marks: number;
        total_marks: number;
        submitted_copy: string;
        pages: Types.Array<string>;
        section_lists: Types.Array<any>;
        question_list: Types.DocumentArray<IAttemptedQuestionDetail>;
    };
    proctoring_details: Types.DocumentArray<IProctoringDetails>;
    checked_teachers: Types.Array<Types.ObjectId>;
    rejection_details: {
        is_rejected: boolean;
        status: string;
        reason: string;
        rejected_date: Date;
    };
    evaluator_review_details: {
        review_id: string;
        reviewer_id: string;
        previous_check_details: string;
        reason: string;
        in_review: boolean;
        is_reviewed: boolean;
        status: "in-review" | "approved" | "rejected" | "re-checking" | "dropped" | "none";
        reviewed_date: Date;
        status_date: Date;
        status_duration: Date;
    };
    created_by: string;
    updated_by: string;
    deleted: boolean;
    created_at: string;
    updated_at: string;
}

export type TCommonCopyModel = Model<IDBCommonCopy>;

const CommonCopySchema = new Schema<IDBCommonCopy, TCommonCopyModel>(
    {
        paper: { type: Schema.Types.ObjectId, ref: "Paper" },
        student: { type: Schema.Types.ObjectId, ref: "Student" },
        result_declared_type: { type: String },
        submitted_type: { type: String, default: "Online" },
        is_result_declared: { type: Boolean, default: false },
        is_exam_completed: { type: Boolean, default: false },
        is_rated: { type: Boolean, default: false },
        omr_scanner_details: {
            checked_copy: { type: String, default: "" },
            submitted_copy: { type: String, default: "" },
        },
        associate_teacher: {
            teacher_id: { type: Schema.Types.ObjectId, ref: "Teacher" },
            checked_copy: { type: String, default: "" },
            is_evaluator: { type: Boolean, default: false },
            is_submitted: { type: Boolean, default: false },
            submitted_time: { type: Date, default: new Date() },
            check_details: { type: [{}], default: [] },
            assigned_time: { type: Date, default: new Date() },
        },
        submission_details: {
            batch: { type: Schema.Types.ObjectId, ref: "Batch" },
            subject: { type: [String] },
            type: { type: String },
            paper_type: { type: String },
            variant_type: { type: String },
            submission_time: { type: Date },
            obtained_marks: { type: Number },
            total_marks: { type: Number },
            submitted_copy: { type: String },
            pages: { type: [String], default: [] },
            sections_list: [],
            question_list: { type: [AttemptedQuestionDetailSchema], default: [] },
        },
        proctoring_details: { type: [ProctoringDetailsSchema], default: [] },
        checked_teachers: { type: [{ type: Schema.Types.ObjectId, ref: "Teacher" }] },
        rejection_details: {
            is_rejected: { type: Boolean, default: false },
            status: { type: String, default: "approved" }, // ["rejected", "re-uploaded", "approved"]
            reason: { type: String, default: "" },
            rejected_date: { type: Date, default: new Date() },
        },
        evaluator_review_details: {
            review_id: { type: String, default: "" },
            reviewer_id: { type: String, default: "" },
            previous_check_details: { type: String, default: "" },
            reason: { type: String, default: "" },
            in_review: { type: Boolean, default: false },
            is_reviewed: { type: Boolean, default: false },
            status: {
                type: String,
                enum: ["in-review", "approved", "rejected", "re-checking", "dropped", "none"],
                default: "none",
            },
            reviewed_date: { type: Date, default: new Date() },
            status_date: { type: Date, default: new Date() },
            status_duration: { type: Date, default: new Date() },
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

export default CommonCopySchema;
