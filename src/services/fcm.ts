import { logger } from "../utils/logger.js";
import { messaging } from "./firebase.js";
import { getMostRecentUserDevice } from "./db/device.js";
import { createNotification } from "./db/notification.js";

interface ISendNotificationBody {
    user_id: string;
    school_id?: string;
    batch_id?: string;
    message?: string;
    url?: string;
    payload?: any;
    created_by?: string;
    updated_by?: string;
}

export const redirect = {
    tnp: {
        resultScreen: ({ paperId, resultId }: { paperId: string; resultId: string }) =>
            `https://com.test_n_prep/resultScreen?paperId=${paperId}&resultId=${resultId}`,
        paperListScreen: ({ bundleId }: { bundleId: string }) =>
            `https://com.test_n_prep/paperListScreen?bundleId=${bundleId}`,
    },
};

export async function sendNotification(notificationBody: ISendNotificationBody) {
    try {
        const device = await getMostRecentUserDevice(notificationBody.user_id);

        let msgId = "";

        if (device && device.fcm_id.length !== 0) {
            try {
                msgId = await messaging.send({
                    token: device.fcm_id,
                    notification: {
                        title: "TestNTrack",
                        body: notificationBody.message,
                    },
                    android: {
                        notification: {
                            clickAction: notificationBody.url ?? "https://com.test_n_prep/notification",
                        },
                    },
                    data: {
                        msg: notificationBody?.message ?? "",
                        url: notificationBody?.url ?? "",
                        data: notificationBody.payload ?? "",
                    },
                });
            } catch (e) {
                // continue regardless of error
                logger.error(e, "error in sending notification");
            }
        }

        const notificationDoc = await createNotification({
            fcm_msg_id: msgId,
            user_id: notificationBody.user_id,
            school_id: notificationBody.school_id,
            batch_id: notificationBody.batch_id,
            data: {
                url: notificationBody.url ?? "",
                payload: notificationBody.payload ?? "",
            },
            message: notificationBody.message,
        });

        return notificationDoc;
    } catch {
        // continue regardless of error
        return null;
    }
}

export async function sendNotificationWithToken(notificationBody = { message: "", fcm_id: "" }) {
    const msgId = await messaging.send({
        notification: {
            title: "TestNTrack",
            body: notificationBody.message,
        },
        data: {
            msg: notificationBody.message,
        },
        token: notificationBody.fcm_id,
    });

    return msgId;
}

export async function sendMultipleNotification(users: ISendNotificationBody[]) {
    const result = await Promise.allSettled(
        users.map(async (details) => {
            const resp = await sendNotification({
                user_id: details.user_id,
                message: details.message,
                batch_id: details.batch_id,
                school_id: details.school_id,
                created_by: details.created_by,
            });
            return resp;
        })
    );

    return result;
}

export default { sendNotification, sendNotificationWithToken, sendMultipleNotification, redirect };
