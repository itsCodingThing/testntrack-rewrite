import StudentModel from "../../../database/models/Student.js";
import AttendenceModel from "../../../database/models/erp/Attendance.js";

export async function addAttendenceToBatch(batch_id: $TSFixMe, ref_date: $TSFixMe, attendence: $TSFixMe) {
    const classAttendence = await AttendenceModel.findOneAndUpdate(
        { batch_id: batch_id, ref_date: ref_date },
        attendence,
        { lean: true, upsert: true }
    );

    return classAttendence;
}

export async function getAttendenceByBatchId(batch_id: $TSFixMe, ref_date: $TSFixMe) {
    const batchAttendenceList = await AttendenceModel.findOne({ batch_id, ref_date }).lean();

    return batchAttendenceList ?? {};
}

const getAttendenceByStudentAndBatch = async (batchId: $TSFixMe, studentId: $TSFixMe) => {
    const list = await AttendenceModel.aggregate()
        .match({ batch_id: batchId, "attendence_list.user_id": studentId })
        .project({
            student_attendence: {
                $filter: {
                    input: "$attendence_list",
                    as: "list",
                    cond: { $eq: ["$$list.user_id", studentId] },
                },
            },
        })
        .unwind("student_attendence");

    return list.map((el: $TSFixMe) => ({
        ...el.student_attendence,
    }));
};

export const getAttendenceByStudentBatch = getAttendenceByStudentAndBatch;

export async function getStudentParentAttendence(studentId: $TSFixMe) {
    const student = await StudentModel.findOne({ _id: studentId }).populate("batch").lean();

    const result =
        student?.batch.map(async (e: $TSFixMe) => {
            const attendence = await getAttendenceByStudentAndBatch(e._id.toString(), studentId);

            return {
                batch_name: e.name,
                attendence: attendence,
            };
        }) ?? [];

    return await Promise.all(result);
}
