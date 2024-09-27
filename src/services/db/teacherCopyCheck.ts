import ResultModel from "../../database/models/Result.js";
import SingleCopyCheck from "../../database/models/SingleCopyCheck.js";
import EvaluationCopy from "../../database/models/TeacherEvaluationCopy.js";

async function getCopyId(copyId: string) {
    const result = await ResultModel.findOne({ _id: copyId }).lean();

    // if we got result means this is result copy id not the evaluation one
    if (result) {
        // we need to find the respective evalution copy id for this result;
        const copy = await EvaluationCopy.findOne({
            paper: result.paper,
            student: result.student,
            is_result_declared: true,
            "associate_teacher.teacher_id": result.associate_teacher?.teacher_id,
        }).lean();

        return copy?._id;
    } else {
        return copyId;
    }
}

export async function updateByCopyId(copyId: string, checkDetails: any) {
    const id = await getCopyId(copyId);

    await SingleCopyCheck.updateOne(
        { copyId: id },
        {
            check_details: checkDetails,
        },
        { upsert: true }
    );
}

export async function getByCopyId(copyId: string) {
    const id = await getCopyId(copyId);
    const list = await SingleCopyCheck.findOne({ copyId: id }).lean();

    return list?.check_details ?? [];
}
