import mongoose from "mongoose";

const { model, Schema } = mongoose;

const PrimaryDataSchema = new Schema(
    {
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
        topic: {
            type: String,
            default: "",
        },
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export default model("PrimaryData", PrimaryDataSchema);
