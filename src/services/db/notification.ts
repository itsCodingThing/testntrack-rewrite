import NotificationModel from "../../database/models/Notification.js";

export const notificationModel = NotificationModel;

interface ICreateNotification {
    user_id: string;
    fcm_msg_id: string;
    school_id?: string;
    batch_id?: string;
    message?: string;
    data?: {
        url: string;
        payload: any;
    };
}

export async function createNotification(data: ICreateNotification) {
    const doc = new NotificationModel(data);
    await doc.save();
    return doc.toObject();
}

export async function findNotificationsByUserId(userId: string) {
    return await NotificationModel.find({ user_id: userId }).sort({ created_at: -1 }).lean();
}
