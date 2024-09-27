import mongoose from "mongoose";

const { model, Schema } = mongoose;

const EnquirySchema = new Schema(
    {
        name: { type: String, default: "" },
        contact: { type: String, default: "", unique: true },
        email: { type: String, default: "" },
        address: { type: String, default: "" },
        service: { type: String, default: "" },
        message: { type: String, default: "" },
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
const _EnquirySchema = EnquirySchema;
export { _EnquirySchema as EnquirySchema };

export default model("Enquiry", EnquirySchema);
