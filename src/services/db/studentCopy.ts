import { findPaperById } from "./paper.js";
import StudentCopyModel from "../../database/models/StudentCopy.js";
import { ServiceError } from "../../utils/error.js";
import { Types } from "mongoose";

export const studentCopyModel = StudentCopyModel;

export async function createStudentCopyFromCopyData(copy: $TSFixMe) {
    const studentCopyDocument = new StudentCopyModel(copy);
    await studentCopyDocument.save();
    return studentCopyDocument;
}

export async function getStudentCopyById(copyId = "") {
    const copy = await StudentCopyModel.findById(copyId).lean();
    return copy;
}

export async function createStudentCopyByStudentIdAndPaperId({ studentId = "", paperId = "" }) {
    const paper = await findPaperById(paperId);

    if (!paper) {
        throw new ServiceError({ msg: "unable to find paper" });
    }

    const copy = await StudentCopyModel.create({
        paper: paperId,
        student: studentId,
        result_declared_type: paper.schedule_details?.result_declared_type ?? "",
        is_result_declared: false,
        is_exam_completed: false,
        associat_teacher: {
            checked_copy: "",
        },
        submission_details: {
            batch: paper.batch,
            subject: paper.subject,
            type: paper.question_details?.type,
            paper_type: paper.type,
            variant_type: paper.variant,
            obtained_marks: 0,
            total_marks: paper.question_details?.total_marks ?? 0,
            submitted_copy: "",
            question_list: paper.question_details.questions.map((question) => ({
                time_taken: 0,
                selected_options: [],
                is_correct: false,
                is_attempted: false,
                is_skipped: false,
                obtained_marks: 0,
                audio_remarks: "",
                remarks: "",
                question: question,
            })),
        },
        created_by: studentId,
    });

    return copy.toObject();
}

export async function findStudentCopiesByPaperId(paperId: string) {
    const copies = await StudentCopyModel.find({ paper: paperId }).lean();
    return copies;
}

export async function deleteStudentCopyByStudentIdAndPaperId({
    studentId,
    paperId,
}: {
    studentId: string;
    paperId: string;
}) {
    return await StudentCopyModel.deleteOne({
        paper: new Types.ObjectId(paperId),
        student: new Types.ObjectId(studentId),
    });
}
