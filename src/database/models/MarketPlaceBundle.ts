import mongoose, { Model, Types } from "mongoose";
const { model, Schema } = mongoose;

interface IDBEvaluatorCopyList {
    teacher_id: string;
    copies: Types.Array<string>;
    assigned_time: Date;
}

const EvaluatorCopyListSchema = new Schema<IDBEvaluatorCopyList>({
    teacher_id: { type: String, default: "" },
    copies: { type: [String], default: [] },
    assigned_time: { type: Date, default: new Date() },
});

interface IDBMarketPlaceBundle {
    paper: any;
    no_of_copies: number;
    checked_copies: {
        copies: Types.DocumentArray<IDBEvaluatorCopyList>;
        no_of_copies: number;
    };
    assigned_copies: {
        copies: Types.DocumentArray<IDBEvaluatorCopyList>;
        no_of_copies: number;
    };
    submitted_copies: {
        copies: Types.DocumentArray<IDBEvaluatorCopyList>;
        no_of_copies: number;
    };
    inreview_copies: {
        copies: Types.DocumentArray<IDBEvaluatorCopyList>;
        no_of_copies: number;
    };
    un_assigned_copies: {
        copies: Types.DocumentArray<IDBEvaluatorCopyList>;
        no_of_copies: number;
    };
    copies: Types.Array<string>;
    deleted: boolean;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

type TMarketPlaceBundle = Model<IDBMarketPlaceBundle>;

const MarketPlaceBundleSchema = new Schema<IDBMarketPlaceBundle, TMarketPlaceBundle>(
    {
        paper: { type: {} },
        no_of_copies: { type: Number, default: 0 },
        checked_copies: {
            copies: { type: [EvaluatorCopyListSchema], default: [] },
            no_of_copies: { type: Number, default: 0 },
        },
        assigned_copies: {
            copies: { type: [EvaluatorCopyListSchema], default: [] },
            no_of_copies: { type: Number, default: 0 },
        },
        submitted_copies: {
            copies: { type: [EvaluatorCopyListSchema], default: [] },
            no_of_copies: { type: Number, default: 0 },
        },
        inreview_copies: {
            copies: { type: [EvaluatorCopyListSchema], default: [] },
            no_of_copies: { type: Number, default: 0 },
        },
        un_assigned_copies: {
            copies: { type: [String], default: [] },
            no_of_copies: { type: Number, default: 0 },
        },
        copies: { type: [String], default: [] },
        deleted: { type: Boolean, default: false },
        completed: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const MarketPlaceBundleModel = model<IDBMarketPlaceBundle, TMarketPlaceBundle>(
    "MarketPlaceBundle",
    MarketPlaceBundleSchema
);
export default MarketPlaceBundleModel;
