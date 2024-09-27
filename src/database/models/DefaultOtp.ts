import mongoose, { Model } from "mongoose";

const { model, Schema } = mongoose;

interface IDBUserDefaultOtp {
    name: string;
    contact: string;
    otp: string;
    created_at: string;
    updated_at: string;
}

type TUserDefaultOtp = Model<IDBUserDefaultOtp>;

const UserDefaultOtpSchema = new Schema<IDBUserDefaultOtp, TUserDefaultOtp>(
    {
        name: { type: Schema.Types.String, required: true },
        contact: { type: Schema.Types.String, require: true, unique: true },
        otp: { type: Schema.Types.String, required: true },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const UserDefaultOtpModel = model<IDBUserDefaultOtp, TUserDefaultOtp>("UserDefaultOtp", UserDefaultOtpSchema);

export default UserDefaultOtpModel;
