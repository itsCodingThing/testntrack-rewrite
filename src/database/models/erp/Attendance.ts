import { model, Schema } from "mongoose";

const AttendenceSchema = new Schema(
    {
        batch_id: { type: String, required: [true, "batch id"] },
        batch_name: { type: String, required: [true, "batch name"] },
        teacher_id: { type: String, required: [true, "teacher id"] },
        teacher_name: { type: String, required: [true, "teacher name"] },
        title: { type: String, required: [true, "attendence title"] },
        present: { type: Number, required: [true, "total number of presents"] },
        absent: { type: Number, required: [true, "total number of absents"] },
        total: { type: Number, required: [true, "total number of attendence"] },
        date: { type: Date, required: [true, "attendence date"] },
        ref_date: { type: String },
        attendence_list: [
            {
                user_id: { type: String, required: [true, "student id"] },
                user_name: { type: String, required: [true, "student name"] },
                roll_no: { type: String, required: [true, "roll number"] },
                user_type: { type: String, enum: ["Student", "Teacher"], required: [true, "user type"] },
                status: { type: String, enum: ["P", "A", "L"], required: [true, "attendence status"] },
                date: { type: Date, required: [true, "attendence date"] },
            },
        ],
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export default model("attendence", AttendenceSchema);
