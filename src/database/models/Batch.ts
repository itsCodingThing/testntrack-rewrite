import mongoose, { Model, Types } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const { model, Schema } = mongoose;

export interface IDBBacth {
    _id: Types.ObjectId;
    school: Types.ObjectId;
    name: string;
    board: string;
    class: string;
    subject: Types.Array<string>;
    image: string;
    session: Types.ObjectId;
    teachers: Types.Array<{ _id: string; name: string; deleted: boolean }>;
    students: Types.Array<{ _id: string; name: string; deleted: boolean }>;
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TBatchModel = Model<IDBBacth>;

const BatchSchema = new Schema<IDBBacth, TBatchModel>(
    {
        school: { type: Schema.Types.ObjectId, ref: "School" },
        session: { type: Schema.Types.ObjectId },
        teachers: { type: [{ _id: Schema.Types.String, name: Schema.Types.String, deleted: Schema.Types.Boolean }] },
        students: { type: [{ _id: Schema.Types.String, name: Schema.Types.String, deleted: Schema.Types.Boolean }] },
        name: { type: String, required: true },
        board: { type: String, required: true },
        class: { type: String, required: true },
        subject: { type: [String], required: true },
        image: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

BatchSchema.plugin(mongooseAutoPopulate);
export const BatchModel = model<IDBBacth, TBatchModel>("Batch", BatchSchema);
export default BatchModel;
