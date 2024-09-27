import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

export interface IDBAdminRatingAlert {
    message: string;
    evaluator: {
        _id: Types.ObjectId;
        name: string;
        experience: string;
        contact: string;
    };
    copy: string;
    details: {
        rating: string;
        reason: string;
        student: Types.ObjectId;
        _id: Types.ObjectId;
        created_at: Date;
        updated_at: Date;
    };
    school: {
        name: string;
        _id: Types.ObjectId;
    };
    paper: {
        name: string;
        _id: Types.ObjectId;
    };
    deleted: boolean;
    is_viewed: boolean;
}

type TAdminRatingAlert = Model<IDBAdminRatingAlert>;

const AdminRatingAlert = new Schema<IDBAdminRatingAlert, TAdminRatingAlert>(
    {
        copy: { type: Schema.Types.String, required: true },
        deleted: { type: Schema.Types.Boolean, default: false },
        is_viewed: { type: Schema.Types.Boolean, default: false },
        details: {
            rating: { type: Schema.Types.String },
            reason: { type: Schema.Types.String },

            student: { type: Schema.Types.ObjectId },
            created_at: { type: Schema.Types.Date, default: new Date() },
            updated_at: { type: Schema.Types.Date, default: new Date() },
        },
        evaluator: {
            name: { type: Schema.Types.String },
            _id: { type: Schema.Types.ObjectId },
            experience: { type: Schema.Types.String },
            contact: { type: Schema.Types.String },
        },
        paper: {
            name: { type: Schema.Types.String },
            _id: { type: Schema.Types.ObjectId },
        },
        school: {
            _id: { type: Schema.Types.ObjectId },
            name: { type: Schema.Types.String },
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const AdminRatingAlertModel = model<IDBAdminRatingAlert, TAdminRatingAlert>(
    "AdminRatingAlert",
    AdminRatingAlert
);

export default AdminRatingAlertModel;
