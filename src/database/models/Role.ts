import mongoose from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

const { model, Schema } = mongoose;

const RoleSchema = new Schema(
    {
        role_type: {
            type: String,
            default: "",
        },
        name: {
            type: String,
            default: "",
        },
        permissions: [
            {
                type: Schema.Types.ObjectId,
                ref: "Permission",
                autopopulate: true,
            },
        ],
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

RoleSchema.plugin(mongooseAutoPopulate);
export default model("Role", RoleSchema);
