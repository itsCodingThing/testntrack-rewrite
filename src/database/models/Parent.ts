import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

interface IDBParent {
    name: string;
    contact: string;
    image: string;
    address: string;
    email: string;
    deleted: boolean;
    otp: string;
    students: Types.DocumentArray<Types.ObjectId>;
    occupation: string;
    city: string;
    state: string;
    alternative_contact: string;
    created_at: string;
    updated_at: string;
}

type TParentModel = Model<IDBParent>;

const ParentSchema = new Schema<IDBParent, TParentModel>(
    {
        name: { type: String, required: true },
        contact: { type: String, required: true },
        image: { type: String, default: "" },
        address: { type: String, default: "" },
        email: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
        otp: { type: String, default: "" },
        students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
        occupation: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        alternative_contact: { type: String, default: "" },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const ParentModel = model<IDBParent, TParentModel>("Parent", ParentSchema);
export default ParentModel;
