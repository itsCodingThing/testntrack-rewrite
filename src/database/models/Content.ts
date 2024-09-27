import type { ArrayEleAsType } from "../../utils/types.js";
import mongoose, { Model } from "mongoose";

const { Schema, model } = mongoose;

export const mediaTypes = ["youtube", "video_link", "web_link", "audio", "pdf", "image", "video", "text"] as const;
export type MediaType = ArrayEleAsType<typeof mediaTypes>;

export interface IDBContent {
    title: string;
    board: string;
    class: string;
    subject: string;
    chapter: string;
    author_details: {
        author_name: string;
        author_id: string;
        publish_date: Date;
    };
    description: string;
    media_url: string;
    media_type: MediaType;
    banner_url: string;
    type: string;
    deleted: boolean;
    created_at: string;
    updated_at: string;
}

type TContentModel = Model<IDBContent>;

const ContentSchema = new Schema<IDBContent, TContentModel>(
    {
        title: { type: String, default: "" },
        board: {
            type: String,
            default: "",
        },
        class: {
            type: String,
            default: "",
        },
        subject: {
            type: String,
            default: "",
        },
        chapter: {
            type: String,
            default: "",
        },
        author_details: {
            author_name: { type: String, default: "" },
            author_id: { type: String, default: "" },
            publish_date: { type: Date, default: new Date() },
        },
        description: { type: String, default: "" },
        media_url: { type: String, default: "" },
        media_type: {
            type: String,
            enum: mediaTypes,
        },
        banner_url: { type: String, dafult: "" },
        type: { type: String, required: true },
        deleted: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const ContentModel = model<IDBContent, TContentModel>("Content", ContentSchema);
export default ContentModel;
