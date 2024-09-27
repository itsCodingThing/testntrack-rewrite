import mongoose, { Model } from "mongoose";

const { model, Schema } = mongoose;

interface IDBDeviceDetail {
    user_id: string;
    ipv4: string;
    device_id: string;
    device_token: string;
    fcm_id: string;
    os_type: string;
    device_type: string;
    mobile_brand: string;
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TDeviceModel = Model<IDBDeviceDetail>;

const DeviceDetailSchema = new Schema<IDBDeviceDetail, TDeviceModel>(
    {
        user_id: { type: String, required: true },
        ipv4: { type: String, default: "" },
        device_id: { type: String, default: "", required: true },
        device_token: { type: String, default: "" },
        fcm_id: { type: String, default: "" },
        os_type: { type: String, default: "" },
        device_type: { type: String, default: "" },
        mobile_brand: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
        created_by: { type: String, default: "" },
        updated_by: { type: String, default: "" },
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

export const DeviceDetailModel = model<IDBDeviceDetail, TDeviceModel>("Device", DeviceDetailSchema);
export default DeviceDetailModel;
