import mongoose from "mongoose";
import EvaluatorHistoryModel from "../../database/models/EvaluatorHistory.js";
import AdminRatingAlertModel from "../../database/models/AdminRatingAlert.js";
import EvaluatorRatingsModel from "../../database/models/EvaluatorRatings.js";
import PaperRatingsModel from "../../database/models/PaperRatings.js";
import PaperModel from "../../database/models/Paper.js";
import EvaluatorModel from "../../database/models/Evaluator.js";
import type { IDBSchool } from "../../database/models/School.js";
import type { IDBBacth } from "../../database/models/Batch.js";
import ResultCopyModel from "../../database/models/Result.js";
import StudentModel from "../../database/models/Student.js";

interface IUpdateRating {
    student_details: {
        name: string;
        _id: string;
    };
    paper: string;
    result: string;
    rating: number;
    reason: string;
    evaluator: string;
}

interface ICheckRating {
    paper: string;
    student: string;
}

export const paperRatingsModel = PaperRatingsModel;
export const adminRatingAlertModel = AdminRatingAlertModel;
export const evaluatorRatingsModel = EvaluatorRatingsModel;

export async function checkStudentRatingStatus(checkRating: ICheckRating) {
    const isRatingExist = await PaperRatingsModel.findOne({
        "paper_details._id": checkRating.paper,
        "ratings_history.student_details._id": checkRating.student,
    }).lean();

    if (isRatingExist) {
        return true;
    }

    return false;
}

export async function updateStudentRating(updateRating: IUpdateRating) {
    const [paper, evaluator] = await Promise.all([
        PaperModel.findById(updateRating.paper)
            .populate<{
                school: Pick<IDBSchool, "name" | "_id">;
                batch: Pick<IDBBacth, "name" | "_id">;
            }>([
                { path: "school", select: "name _id" },
                { path: "batch", select: "name _id" },
            ])
            .orFail()
            .lean(),
        EvaluatorModel.findById(updateRating.evaluator).orFail().lean(),
    ]);

    const updateRatingData = {
        result: new mongoose.Types.ObjectId(updateRating.result),
        reason: updateRating.reason,
        rating: updateRating.rating,
        evaluator_details: evaluator,
        paper_details: paper,
        student_details: {
            _id: new mongoose.Types.ObjectId(updateRating.student_details._id),
            name: updateRating.student_details.name,
        },
        batch_details: paper.batch,
        school_details: paper.school,
    };

    await PaperRatingsModel.findOneAndUpdate(
        {
            "paper_details._id": updateRating.paper,
        },
        {
            $set: {
                paper_details: paper,
            },
            $inc: { total_ratings: 1, rating: updateRating.rating },
            $push: {
                ratings_history: {
                    $postion: 0,
                    $each: [updateRatingData],
                },
            },
        },
        { upsert: true }
    );
    const result = await EvaluatorRatingsModel.findOneAndUpdate(
        {
            "evaluator_details._id": updateRating.evaluator,
        },
        {
            $set: {
                evaluator_details: evaluator,
            },
            $inc: { total_ratings: 1, rating: updateRating.rating },
            $push: {
                ratings_history: {
                    $postion: 0,
                    $each: [updateRatingData],
                },
            },
        },
        { upsert: true }
    );

    // if rating is less than 5 then we create an alert for admin
    if (updateRating.rating < 5) {
        await AdminRatingAlertModel.create({
            details: {
                rating: updateRating.rating,
                reason: updateRating.reason,
                student: updateRating.student_details._id,
            },
            copy: updateRating.result,
            evaluator: evaluator,
            paper: paper,
            school: paper.school,
        });
    }

    return result;
}

export async function getRatingsForPaper(paper: string) {
    const paperRatings = await PaperRatingsModel.findOne({ "paper_details._id": paper }).lean();

    return paperRatings;
}

export async function getRatingsForEvaluator(evaluator: string) {
    const evaluatorRatings = await EvaluatorRatingsModel.findOne({ "evaluator_details._id": evaluator }).lean();

    return evaluatorRatings;
}

export async function updateAdminRatingAlertViewed(id: string) {
    const result = await AdminRatingAlertModel.findByIdAndUpdate(id, {
        $set: {
            is_viewed: true,
        },
    }).lean();
    return result;
}

export async function migrateOldRating() {
    const oldRatings = await EvaluatorHistoryModel.find({ action: "Submitted", ratingHistory: { $ne: [] } }).lean();

    if (oldRatings.length > 0) {
        await Promise.all(
            oldRatings.map(async (oldRating) => {
                if (oldRating.ratingHistory == null) {
                    return;
                }

                if (oldRating.ratingHistory.length > 1) {
                    const studentRatings = oldRating.ratingHistory.splice(1);
                    const updateRatings = studentRatings.map(async (firstStudent) => {
                        const result = await ResultCopyModel.findOne({
                            paper: oldRating.paper,
                            student: firstStudent.student,
                        }).lean();

                        const student = await StudentModel.findById(firstStudent.student).lean();

                        if (student && result) {
                            const updateRating: IUpdateRating = {
                                evaluator: oldRating.evaluator.toString(),
                                paper: oldRating.paper.toString(),
                                rating: firstStudent.rating,
                                reason: firstStudent.reason.length == 0 ? "No ratings is given" : firstStudent.reason,
                                result: result._id.toString(),
                                student_details: {
                                    _id: student._id.toString(),
                                    name: student.name,
                                },
                            };
                            return await updateStudentRating(updateRating);
                        }
                    });

                    return await Promise.all(updateRatings);
                }
            })
        );
    }
}
