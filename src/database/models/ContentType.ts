import mongoose, { Model } from "mongoose";

const { Schema, model } = mongoose;

export interface IDBContentType {
    title: string;
    description: string;
    content: string[];
    no_of_content: number;
    deleted: boolean;
    created_at: string;
    updated_at: string;
}

type TContentTypeModel = Model<IDBContentType>;

const ContentTypeSchema = new Schema<IDBContentType, TContentTypeModel>(
    {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        content: { type: [String], default: [] },
        no_of_content: { type: Number, default: 0 },
        deleted: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const ContentTypeModel = model<IDBContentType, TContentTypeModel>("ContentType", ContentTypeSchema);
export default ContentTypeModel;
