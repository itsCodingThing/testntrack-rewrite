import mongoose, { Model, Types } from "mongoose";
const { model, Schema } = mongoose;

interface IDBBundleDetails {
    price: number;
    discount: number;
    category: string;
    chapters: Types.Array<string>;
    topics: Types.Array<string>;
    deleted: boolean;
}

interface IDBBundlePaper {
    _id: Types.ObjectId;
    bundle_index: number;
    name: string;
    type: string;
    status: "locked" | "unlocked" | "scheduled" | "missed" | "attempted" | "evaluating" | "rejected" | "completed";
    schedule_details: { start_time: Date; end_time: Date };
    question_details: {
        total_marks: number;
        no_of_questions: number;
        solution_pdf: string;
        solution_video: string;
        pdf: { paper: string };
    };
    rejection_details: Types.DocumentArray<{
        copy_id: Types.ObjectId;
        rejected_copy: string;
        status: "rejected" | "re-uploaded" | "approved";
        reason: string;
        rejected_date: Date;
    }>;
    result_details: {
        total_marks: number;
        obtained_marks: number;
        percentage: number;
        result_id: string;
        evaluation_copy_id: string;
        submitted_copy: string;
    };
}

interface IDBMarketPaperBundle {
    market_bundle_id: string;
    bundle_type: string;
    name: string;
    status: string;
    deleted: boolean;
    banner_image: string;
    description: string;
    video_url: string;
    total_price: number;
    expiry_date: Date;
    purchased_students: Types.Array<string>;
    total_discount: number;
    batch_details: {
        _id: Types.ObjectId;
        name: string;
        board: string;
        class: string;
        subject: Types.Array<string>;
    };
    student_details: {
        _id: Types.ObjectId;
        name: string;
        image: string;
        email: string;
    };
    bundle_details: Types.DocumentArray<IDBBundleDetails>;
    paper_list: Types.DocumentArray<IDBBundlePaper>;
    entity: Types.Array<string>;
    free_entity: Types.Array<string>;
    purchased_entity: Types.Array<string>;
    entity_details: any;
}

type TMarketPaperBundle = Model<IDBMarketPaperBundle>;

const BundlePaper = new Schema<IDBBundlePaper>({
    name: { type: String, default: "" },
    bundle_index: { type: Number },
    type: { type: String, default: "" },
    status: {
        type: String,
        enum: ["locked", "unlocked", "scheduled", "missed", "attempted", "evaluating", "rejected", "completed"],
        default: "unlocked",
    },
    schedule_details: {
        start_time: { type: Date },
        end_time: { type: Date },
    },
    rejection_details: {
        type: [
            {
                copy_id: { type: Schema.Types.ObjectId },
                rejected_copy: { type: String },
                status: { type: String, enum: ["rejected", "re-uploaded", "approved"] },
                reason: { type: String },
                rejected_date: { type: Date },
            },
        ],
        default: [],
    },
    question_details: {
        total_marks: { type: Number, default: 0 },
        no_of_questions: { type: Number, default: 0 },
        solution_pdf: { type: String, default: "" },
        solution_video: { type: String, default: "" },
        pdf: {
            paper: { type: String, default: "" },
        },
    },
    result_details: {
        total_marks: { type: Number, defaul: 0 },
        obtained_marks: { type: Number, defaul: 0 },
        percentage: { type: Number, defaul: 0 },
        result_id: { type: String, deafult: "" },
        evaluation_copy_id: { type: String, deafult: "" },
        submitted_copy: { type: String, deafult: "" },
    },
});

const BundleDetailsSchema = new Schema<IDBBundleDetails>(
    {
        price: { type: Number, required: true },
        discount: { type: Number, required: true },
        category: { type: String, required: true },
        chapters: { type: [String], default: [] },
        topics: { type: [String], default: [] },
        deleted: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const PurchasedPaperBundleSchema = new Schema<IDBMarketPaperBundle, TMarketPaperBundle>(
    {
        bundle_type: { type: String, enum: ["free", "paid"], default: "free" },
        market_bundle_id: { type: String, default: "" },
        name: { type: String, default: "" },
        status: { type: String, default: "" },
        banner_image: { type: String, default: "" },
        description: { type: String, default: "" },
        video_url: { type: String, default: "" },
        expiry_date: { type: Date, required: true },
        total_price: { type: Number, default: 0 },
        total_discount: { type: Number, default: 0 },
        deleted: { type: Boolean, default: false },
        batch_details: {
            _id: Types.ObjectId,
            name: { type: String, default: "" },
            board: { type: String, default: "" },
            class: { type: String, default: "" },
            subject: { type: [String], default: [] },
        },
        student_details: {
            _id: Types.ObjectId,
            name: { type: String, default: "" },
            image: { type: String, default: "" },
            email: { type: String, default: "" },
        },
        bundle_details: { type: [BundleDetailsSchema], required: true },
        paper_list: [BundlePaper],
        entity: { type: [String], default: [] }, // ["paper", "answer_key", "lecture", "notes", "evaluation"]
        free_entity: { type: [String], default: [] },
        purchased_entity: { type: [String], default: [] },
        entity_details: {
            type: [{}],
            default: [],
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const PurchasedPaperBundleModel = model<IDBMarketPaperBundle, TMarketPaperBundle>(
    "purchasedPaperBundle",
    PurchasedPaperBundleSchema
);
export default PurchasedPaperBundleModel;
