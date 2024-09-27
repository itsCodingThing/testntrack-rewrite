import mongoose from "mongoose";

const { model, Schema } = mongoose;

export const BlogCategorySchema = new Schema(
    {
        title: { type: String, required: true },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default model("BlogCategory", BlogCategorySchema);
