import { model, Schema } from "mongoose";

const NotesSchema = new Schema(
    {
        batch_id: { type: String, required: [true, "batch id"] },
        teacher_id: { type: String, required: [true, "teacher id"] },
        title: { type: String, required: [true, "attendence title"] },
        type: { type: String, required: [true, "Notes type"] },
        url: { type: String, required: [true, "Notes Content Url"] },
        board: { type: String, required: [true, "Board"] },
        class: { type: String, required: [true, "Class"] },
        subject: { type: String, required: [true, "Subject"] },
        chapter: { type: String, required: [true, "Chapter"] },
        topics: { type: [String], default: [] },
        thumb_url: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export default model("notes", NotesSchema);
