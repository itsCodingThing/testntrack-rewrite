import { firebaseConfig } from "../utils/utils.js";
import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, cert } from "firebase-admin/app";

const app = initializeApp({
    credential: cert({
        clientEmail: firebaseConfig.client_email,
        privateKey: firebaseConfig.private_key,
        projectId: firebaseConfig.project_id,
    }),
});

export const messaging = getMessaging(app);
