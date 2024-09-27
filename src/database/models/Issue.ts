import mongoose, { Model, Types } from "mongoose";

const { model, Schema } = mongoose;

interface IIssue {
    type: string;
    issuer: {
        type: string;
        _id: string;
        name: string;
    };
    student: { _id: string; name: string; contact: string; school_name: string; school_id: string };
    issue_details: any;
    status: string;
    title: string;
    description: string;
    attachments: Types.Array<string>;
    is_resolved: boolean;
    feedback: string;
    issued_date: Date;
    resolved_date: Date;
    deleted: boolean;
}

type TIssue = Model<IIssue>;

const IssueSchema = new Schema<IIssue, TIssue>(
    {
        type: { type: String, required: true, enum: ["A", "B", "C"] },
        issuer: {
            type: { type: String },
            _id: String,
            name: String,
        },
        student: { _id: String, name: String, contact: String, school_name: String, school_id: String },
        issue_details: {},
        status: { type: String, enum: ["active", "resolved", "processing"], default: "active" },
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        attachments: { type: [String], default: [] },
        is_resolved: { type: Boolean, default: false },
        feedback: { type: String, default: "" },
        issued_date: { type: Date, default: new Date() },
        resolved_date: { type: Date },
        deleted: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const IssueModel = model<IIssue, TIssue>("Issue", IssueSchema);
export default IssueModel;
