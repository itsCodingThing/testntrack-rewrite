import mongoose, { Model } from "mongoose";
const { model, Schema } = mongoose;

interface IDBPermission {
    path: string;
    name: string;
    module: string;
    submodule: string;
    operation: string;
    deleted: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

type TPermissionModel = Model<IDBPermission>;

const PermissionSchema = new Schema<IDBPermission, TPermissionModel>(
    {
        path: {
            type: String,
            default: "",
            required: true,
        },
        name: {
            type: String,
            default: "",
        },
        module: {
            type: String,
            default: "",
        },
        submodule: {
            type: String,
            default: "",
        },
        operation: {
            type: String,
            enum: ["create", "read", "update", "delete"],
            default: "",
            required: true,
        },
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

export const PermissionModel = model<IDBPermission, TPermissionModel>("Permission", PermissionSchema);
export default PermissionModel;
