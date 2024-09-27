import mongoose from "mongoose";

const { model, Schema } = mongoose;

const ScheduleDetailsSchema = new Schema(
    {
        url: { type: String, default: "" },
        when: { type: Date, default: new Date() },
        params: { type: Schema.Types.Mixed, deafult: {} },
        completed: { type: Boolean, default: false },
        deleted: { type: Boolean, default: false },
    },
    {
        minimize: false,
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export default model("schedule", ScheduleDetailsSchema);
