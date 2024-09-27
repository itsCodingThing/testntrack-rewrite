import mongoose from "mongoose";
import { BlogCommentSchema } from "./BlogComment.js";

const { model, Schema } = mongoose;

const ImageTagSchema = new Schema({
    title: { type: String, default: "" },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" },
    description: { type: String, default: "" },
});

const BlogSchema = new Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        meta_description: { type: String, required: true },
        feature_image: { type: String, default: "" },
        categories: { type: [String], default: [] },
        image_tag: {
            type: ImageTagSchema,
            default: {
                title: "",
                alt: "",
                caption: "",
                description: "",
            },
        },
        comments: { type: [BlogCommentSchema], default: [] },
        tags: { type: [String], default: [] },
        posted_by: { type: String, default: "Admin" },
        deleted: { type: Boolean, default: false },
    },
    { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default model("Blog", BlogSchema);
