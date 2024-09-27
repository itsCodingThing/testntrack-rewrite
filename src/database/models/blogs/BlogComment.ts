import mongoose from "mongoose";

const { model, Schema } = mongoose;

export const BlogCommentSchema = new Schema(
    {
        title: { type: String, required: true },
        user: { type: String, default: "" },
        is_approved: { type: Boolean, default: false },
    },
    { versionKey: false, timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default model("BlogComment", BlogCommentSchema);
