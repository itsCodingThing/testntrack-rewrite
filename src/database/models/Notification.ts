import mongoose, { Model } from "mongoose";

const { model, Schema } = mongoose;

interface IDBNotification {
    user_id: string;
    school_id: string;
    batch_id: string;
    fcm_msg_id: string;
    message: string;
    data: {
        url: string;
        payload: any;
    };
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TNotification = Model<IDBNotification>;

const NotificationSchema = new Schema<IDBNotification, TNotification>(
    {
        user_id: { type: String, default: "" },
        school_id: { type: String, default: "" },
        batch_id: { type: String, default: "" },
        fcm_msg_id: { type: String, default: "" },
        message: { type: String, default: "" },
        data: {
            url: { type: String },
            payload: { type: Schema.Types.Mixed },
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

export const NotificationModel = model<IDBNotification, TNotification>("Notification", NotificationSchema);
export default NotificationModel;
