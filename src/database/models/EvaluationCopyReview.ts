import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

interface IDBCopyReviewHistory {
    status: string;
    check_details: string;
    created_at: Date;
}

const CopyReviewHistory = new Schema<IDBCopyReviewHistory>({
    status: Schema.Types.String,
    check_details: Schema.Types.String,
    created_at: { type: Schema.Types.Date, default: new Date() },
});

const ReviewStatusType = ["in-review", "approved", "reject", "dropped", "re-checking"] as const;
export type TReviewStatus = (typeof ReviewStatusType)[number];

export interface IDBEvaluationCopyReview {
    copy_id: Types.ObjectId;
    paper_id: Types.ObjectId;
    reviewer_id: Types.ObjectId;
    status: TReviewStatus;
    details: any;
    history: Types.DocumentArray<IDBCopyReviewHistory>;
    created_at: string;
    updated_at: string;
}

type TEvaluationCopyReviewModel = Model<IDBEvaluationCopyReview>;

const EvaluationCopyReviewSchema = new Schema<IDBEvaluationCopyReview, TEvaluationCopyReviewModel>(
    {
        copy_id: { type: Schema.Types.ObjectId },
        paper_id: { type: Schema.Types.ObjectId },
        reviewer_id: { type: Schema.Types.ObjectId },
        status: {
            type: Schema.Types.String,
            enum: ["in-review", "approved", "reject", "dropped", "re-checking"],
            default: "in-review",
        },
        details: { type: Schema.Types.Mixed, default: [] }, // review given by other evaluator,
        history: { type: [CopyReviewHistory], default: [] }, // review track
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const EvaluationCopyReviewModel = model<IDBEvaluationCopyReview, TEvaluationCopyReviewModel>(
    "EvaluationCopyReview",
    EvaluationCopyReviewSchema
);
export default EvaluationCopyReviewModel;
