import IssueModel from "../../database/models/Issue.js";

export const model = IssueModel;

export async function createIssue(payload: $TSFixMe) {
    const issue = await IssueModel.create(payload);
    return issue;
}

export async function findAllIssues() {
    const issues = await IssueModel.find({ deleted: false }).sort("-created_at").lean();
    return issues;
}

export async function updateIssueStatus({ issueId, feedback, status }: $TSFixMe) {
    if (status === "processing") {
        await IssueModel.findByIdAndUpdate(issueId, {
            status: status,
            feedback,
        });
    }

    if (status === "resolved") {
        await IssueModel.findByIdAndUpdate(issueId, {
            status: status,
            is_resolved: true,
            resolved_date: new Date(),
            feedback,
        });
    }
}

export async function findIssuesByIssuerId(issuerId: $TSFixMe) {
    const issues = await IssueModel.find({ "issuer._id": issuerId, deleted: false }).sort("-created_at").lean();
    return issues;
}

export async function findIssuesByStudentId(studentId: $TSFixMe) {
    const issues = await IssueModel.find({ "student._id": studentId, deleted: false }).sort("-created_at").lean();
    return issues;
}
