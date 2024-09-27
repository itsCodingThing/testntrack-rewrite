import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ActionSchema = new Schema(
    {
        title: { type: String, required: true },
        image_url: { type: String, required: true },
        is_app_page: { type: Boolean, required: true },
        launch_url: { type: String, required: true },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const ActionsDocumentSchema = new Schema({
    banners: { type: [ActionSchema], default: [] },
    nav_actions: { type: [ActionSchema], default: [] },
});

export default model("Actions", ActionsDocumentSchema);
