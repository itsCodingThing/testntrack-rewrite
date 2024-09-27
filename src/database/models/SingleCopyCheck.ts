import mongoose, { Model, Types } from "mongoose";

const { Schema, model } = mongoose;

interface IDBSingleCopyCheck {
    copyId: Types.ObjectId;
    check_details: any;
    created_at: string;
    updated_at: string;
}

type TSingleCopyCheck = Model<IDBSingleCopyCheck>;

const CheckDetailsSchema = new Schema<IDBSingleCopyCheck, TSingleCopyCheck>(
    {
        copyId: { type: Schema.Types.ObjectId, ref: "TeacherEvaluationCopy" },
        check_details: { type: [] },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const SingleCopyCheckModel = model<IDBSingleCopyCheck, TSingleCopyCheck>("SingleCopyCheck", CheckDetailsSchema);
export default SingleCopyCheckModel;
