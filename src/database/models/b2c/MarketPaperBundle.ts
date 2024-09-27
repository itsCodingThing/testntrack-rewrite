import mongoose, { Model, Types } from "mongoose";
const { model, Schema } = mongoose;

interface IDBBundleDetails {
    _id: Types.ObjectId;
    price: number;
    discount: number;
    category: string;
    chapters: Types.Array<string>;
    topics: Types.Array<string>;
    deleted: boolean;
}
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

interface IDBBundlePaper {
    _id: Types.ObjectId;
    bundle_index: number;
    name: string;
    type: string;
    schedule_details: { start_time: Date; end_time: Date };
    question_details: {
        total_marks: number;
        no_of_questions: number;
        solution_pdf: string;
        solution_video: string;
        pdf: { paper: string };
    };
}

const BundlePaper = new Schema<IDBBundlePaper>({
    bundle_index: { type: Number },
    name: { type: String, default: "" },
    type: { type: String, default: "" },
    schedule_details: {
        start_time: { type: Date },
        end_time: { type: Date },
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
});

interface IDBMarketPaperBundle {
    bundle_type: "free" | "paid";
    name: string;
    status: string;
    deleted: boolean;
    banner_image: string;
    description: string;
    video_url: string;
    total_price: number;
    purchased_students: Types.Array<string>;
    total_discount: number;
    batch_details: {
        _id: Types.ObjectId;
        name: string;
        board: string;
        class: string;
        subject: Types.Array<string>;
    };
    bundle_details: IDBBundleDetails[];
    paper_list: IDBBundlePaper[];
    entity: Types.Array<string>;
    free_entity: Types.Array<string>;
    entity_details: any;
}

type TMarketPaperBundle = Model<
    IDBMarketPaperBundle,
    // eslint-disable-next-line @typescript-eslint/ban-types
    {},
    { paper_list: Types.DocumentArray<IDBBundlePaper>; bundle_details: Types.DocumentArray<IDBBundleDetails> }
>;

const MarketPaperBundleSchema = new Schema<IDBMarketPaperBundle, TMarketPaperBundle>(
    {
        bundle_type: { type: String, enum: ["free", "paid"], default: "free" },
        name: { type: String, default: "" },
        status: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
        banner_image: { type: String, default: "" },
        description: { type: String, default: "" },
        video_url: { type: String, default: "" },
        total_price: { type: Number, default: 0 },
        purchased_students: { type: [String], default: [] },
        total_discount: { type: Number, default: 0 },
        batch_details: {
            _id: Types.ObjectId,
            name: { type: String, default: "" },
            board: { type: String, default: "" },
            class: { type: String, default: "" },
            subject: { type: [String], default: [] },
        },
        bundle_details: { type: [BundleDetailsSchema], required: true },
        paper_list: [BundlePaper],
        entity: { type: [String], default: [] }, // ["paper", "answer_key", "lecture", "notes", "evaluation"]
        free_entity: { type: [String], default: [] },
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

export const MarketPaperBundleModel = model<IDBMarketPaperBundle, TMarketPaperBundle>(
    "marketpaperbundle",
    MarketPaperBundleSchema
);

export default MarketPaperBundleModel;
