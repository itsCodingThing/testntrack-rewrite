import mongoose, { Model } from "mongoose";
const { model, Schema } = mongoose;

interface IDBVendor {
    title: string;
    code: string;
    contact: string;
    status: string;
    discount: number;
    students: string[];
    deleted: boolean;
}

type TVendorModel = Model<IDBVendor>;

const VendorSchema = new Schema<IDBVendor, TVendorModel>(
    {
        title: { type: String, default: "" },
        code: { type: String, required: true },
        contact: { type: String, default: "" },
        status: { type: String, default: "" },
        discount: { type: Number, required: true },
        students: { type: [String], default: [] },
        deleted: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const VenderModel = model<IDBVendor, TVendorModel>("vendor", VendorSchema);
export default VenderModel;
