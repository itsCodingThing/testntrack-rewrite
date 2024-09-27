import chalk from "chalk";
import { batchModel } from "../services/db/batch.js";
import { schoolModel } from "../services/db/school.js";

export default async function playground() {
    console.log(chalk.bgBlueBright("------------------------------- Playground -----------------------------------"));

    const schools = await schoolModel.find({ deleted: false }, "_id").lean();

    for (const school of schools) {
        const updatedSchool = await schoolModel.findByIdAndUpdate(
            school._id,
            {
                $set: { current_session: { name: "session-00" }, previous_sessions: [] },
            },
            { returnDocument: "after", lean: true }
        );

        await batchModel.updateMany(
            { school: updatedSchool?._id },
            { session: updatedSchool?.current_session._id, teachers: [], students: [] }
        );
    }
}
