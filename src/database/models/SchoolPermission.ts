import mongoose, { Types } from "mongoose";
import constants from "../../config/constants.js";

const { model, Schema } = mongoose;

interface IDBSelectedTeacher {
    name: string;
    id: string;
    added_date: string;
    papers_allowed: number;
}

interface IDBSchoolPermission {
    school_id: Types.ObjectId;
    erp: {
        attendence: boolean;
        notes: boolean;
    };
    is_b2c: boolean;
    paper: {
        create_paper: boolean;
        paper_variant_list: Types.Array<string>;
        paper_type_list: Types.Array<string>;
        swot_anaylysis_list: Types.Array<string>;
        question_anaylysis_list: Types.Array<string>;
        paper_scheduled_type_list: Types.Array<string>;
        paper_result_type_list: Types.Array<string>;
        evaluator: boolean;
        descriptive: boolean;
        paper_limit: {
            subjective: number;
            objective: number;
        };
    };
    evaluation: any;
    content: {
        is_teacher: boolean;
        is_student: boolean;
    };
    paper_generator: {
        is_enabled: boolean;
        selected_teachers: Types.Array<IDBSelectedTeacher>;
        paper_allowed_count: number;
        paper_created_count: number;
    };

    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

const SchoolPermissionSchema = new Schema<IDBSchoolPermission>(
    {
        school_id: { type: Schema.Types.ObjectId, ref: "schools", required: true },
        erp: {
            attendence: { type: Boolean, default: true },
            notes: { type: Boolean, default: true },
        },
        is_b2c: { type: Boolean, default: false },
        paper: {
            create_paper: { type: Boolean },
            paper_variant_list: { type: [String], default: constants.listVariantType },
            paper_type_list: { type: [String], default: constants.listPaperType },
            swot_anaylysis_list: { type: [String], default: constants.listSwotAnalysis },
            question_anaylysis_list: { type: [String], default: constants.listQuestionAnalysis },
            paper_scheduled_type_list: { type: [String], default: constants.listSchedulingType },
            paper_result_type_list: { type: [String], default: constants.listResultDeclareType },
            evaluator: { type: Boolean, default: true },
            descriptive: { type: Boolean, default: true },
            paper_limit: {
                subjective: { type: Number, default: 200 },
                objective: { type: Number, default: 200 },
            },
        },
        evaluation: { type: Schema.Types.Mixed },
        content: {
            is_student: { type: Schema.Types.Boolean },
            is_teacher: { type: Schema.Types.Boolean },
        },
        paper_generator: {
            is_enabled: { type: Schema.Types.Boolean },
            selected_teachers: [
                {
                    added_date: { type: Schema.Types.String },
                    id: { type: Schema.Types.String },

                    name: { type: Schema.Types.String },
                    papers_allowed: { type: Schema.Types.Number },
                },
            ],
            paper_allowed_count: { type: Schema.Types.Number },
            paper_created_count: { type: Schema.Types.Number },
        },

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

export default model("SchoolPermission", SchoolPermissionSchema);
