import { Types } from "mongoose";
import { ServiceError } from "../../../utils/error.js";
import NotificationFcmService from "../../fcm.js";
import PurchasedPaperBundleModel from "../../../database/models/b2c/PurchasedPaperBundle.js";

export const purchasedPaperBundleModel = PurchasedPaperBundleModel;

export async function createPurchasedPaperBundle(bundleData: $TSFixMe) {
    const bundle = await PurchasedPaperBundleModel.create(bundleData);
    return bundle.toObject();
}

export async function findPurchasedBundleByStudentIdAndBundleId({
    studentId,
    marketBundleId,
}: {
    studentId: string;
    marketBundleId: string;
}) {
    return await PurchasedPaperBundleModel.findOne({
        market_bundle_id: marketBundleId,
        "student_details._id": studentId,
    }).lean();
}

export async function getPurchasedPaperBundleByStudent(student: $TSFixMe) {
    const list = await PurchasedPaperBundleModel.find({ "student_details._id": student, deleted: false }).lean();
    return list;
}

export async function getPurchasedPaperBundleByIds(ids: string[]) {
    return await PurchasedPaperBundleModel.find({ _id: { $in: ids } }).lean();
}

export async function deleteById(id: $TSFixMe) {
    const status = await PurchasedPaperBundleModel.findByIdAndUpdate(id, { deleted: true });
    return status;
}

export async function findPurchasedBundleById(id: string) {
    const model = await PurchasedPaperBundleModel.findById(id).lean();
    return model;
}

export async function findBundleByEvaluationCopy(copy_id: $TSFixMe) {
    const bundle = await PurchasedPaperBundleModel.findOne({
        "paper_list.result_details.evaluation_copy_id": copy_id,
    }).lean();

    return bundle;
}

export async function unlockNewPaperInBundle(bundleId: $TSFixMe, paperId: $TSFixMe) {
    const bundle = await PurchasedPaperBundleModel.findById(bundleId);
    if (!bundle) {
        return;
    }

    const paperIndex = bundle.paper_list.findIndex((paper: $TSFixMe) => paper._id.toString() === paperId);
    bundle.paper_list[paperIndex].status = "unlocked";
    await bundle.save();
}

type BundlePaperStatus =
    | "locked"
    | "unlocked"
    | "scheduled"
    | "missed"
    | "attempted"
    | "evaluating"
    | "rejected"
    | "completed";
export async function updatePaperStatusAndResultDetails(
    { student_id, paper_id }: $TSFixMe,
    { status = "attempted", result_details = {} }: { status: BundlePaperStatus; result_details: any }
) {
    const bundle = await PurchasedPaperBundleModel.findOne({
        "student_details._id": student_id,
        "paper_list._id": paper_id,
    });

    if (!bundle) {
        return;
    }

    const paperIndex = bundle.paper_list.findIndex((paper: $TSFixMe) => paper._id.toString() === paper_id.toString());

    bundle.paper_list[paperIndex].status = status;
    bundle.paper_list[paperIndex].result_details = result_details;

    await bundle.save();
}

// when copy is assigned to evaluator this method is called to change status to evaluating
export async function evaluateBundlePaperById(studentCopy: $TSFixMe) {
    const { _id, paper, student } = studentCopy;

    const bundle = await PurchasedPaperBundleModel.findOne({
        "paper_list.result_details.evaluation_copy_id": _id,
    });

    if (!bundle) {
        return;
    }

    const paperIndex = bundle.paper_list.findIndex(
        (bundlePaper: $TSFixMe) => bundlePaper._id.toString() === paper.toString()
    );
    bundle.paper_list[paperIndex].status = "evaluating";

    // updating bundle to database
    await bundle.save();

    // sending notification to student
    await NotificationFcmService.sendNotification({
        user_id: student,
        message: "Your exam copy was Assigned to evaluator for checking.",
    });
}

// when copy is submitted to the institute by our marketplace then this method will be called to save the result of paperSubmission for the student
export async function declareResultOfBundlePaperByCopy(resultCopy: $TSFixMe) {
    const { student, paper, _id, submission_details } = resultCopy;
    const bundle = await PurchasedPaperBundleModel.findOne({
        "student_details._id": student,
        "paper_list._id": paper,
    });

    if (!bundle) {
        return;
    }

    const paperIndex = bundle.paper_list.findIndex(
        (bundlePaper: $TSFixMe) => bundlePaper._id.toString() === paper.toString()
    );

    bundle.paper_list[paperIndex].status = "completed";
    bundle.paper_list[paperIndex].result_details = {
        ...bundle.paper_list[paperIndex].result_details,
        total_marks: submission_details.total_marks,
        obtained_marks: submission_details.obtained_marks,
        percentage: submission_details.obtained_marks / submission_details.total_marks,
        result_id: _id,
    };

    await bundle.save();

    // sending notification to student
    await NotificationFcmService.sendNotification({
        user_id: student,
        message: "Your result is declared tap to check",
        url: NotificationFcmService.redirect.tnp.resultScreen({ paperId: paper, resultId: _id }),
        payload: resultCopy,
    });
}

export async function getPaperForBundle(bundleId: $TSFixMe, paperId: $TSFixMe) {
    const bundle = await PurchasedPaperBundleModel.findById(bundleId).lean();
    if (!bundle) {
        throw new ServiceError({ msg: "unable to find bundle" });
    }

    const paperIndex = bundle.paper_list.findIndex((value: $TSFixMe) => value._id.toString() === paperId);

    return bundle.paper_list[paperIndex];
}

export async function getPaperStatusForBundle(bundleId: $TSFixMe, paperId: $TSFixMe) {
    const bundle = await PurchasedPaperBundleModel.findById(bundleId).lean();
    if (!bundle) {
        throw new ServiceError({ msg: "unable to find bundle" });
    }

    const paperIndex = bundle.paper_list.findIndex((value: $TSFixMe) => value._id.toString() === paperId);
    const paper = bundle.paper_list[paperIndex];

    return paper.status;
}

export async function updateBundlePaperStatus(rejectionPayload: $TSFixMe) {
    const { bundleId, paperId, status, rejectedCopy, reason, copyId } = rejectionPayload;

    const bundle = await PurchasedPaperBundleModel.findById(bundleId);
    if (!bundle) {
        throw new ServiceError({ msg: "unable to find bundle" });
    }

    const paperIndex = bundle.paper_list.findIndex((value: $TSFixMe) => value._id.toString() === paperId);

    const paper = bundle.paper_list[paperIndex];

    if (status === "rejected") {
        paper.status = status;
        paper.rejection_details.unshift({
            copy_id: copyId,
            rejected_copy: rejectedCopy,
            status: status,
            reason: reason,
            rejected_date: new Date(),
        });
    }

    if (status === "re-uploaded") {
        paper.rejection_details[0].status = status;
    }

    if (status === "approved") {
        paper.status = "evaluating";
        paper.rejection_details[0].status = status;
    }

    if (status === "missed") {
        paper.status = "missed";
    }

    bundle.paper_list[paperIndex] = paper;
    await bundle.save();
}

export async function addEntityFromMarketBundle(
    { bundleId, studentId, entities = [] }: { bundleId: string; studentId: string; entities: string[] },
    marketBundle: any
) {
    const purchasedBundle = await PurchasedPaperBundleModel.findOne({
        market_bundle_id: bundleId,
        "student_details._id": studentId,
    });

    if (!purchasedBundle) {
        throw new ServiceError({ msg: "unable to find purchase bundle" });
    }

    const availableEntities: string[] = [];
    entities.forEach((entity) => {
        if (!purchasedBundle.purchased_entity.includes(entity)) {
            availableEntities.push(entity);
        }
    });

    purchasedBundle.purchased_entity = [
        ...purchasedBundle.purchased_entity,
        ...availableEntities,
    ] as Types.Array<string>;

    purchasedBundle.entity_details = purchasedBundle.entity_details.concat(
        marketBundle.entity_details.filter((entity: $TSFixMe) => availableEntities.includes(entity.type))
    );
    purchasedBundle.markModified("entity_details");

    await purchasedBundle.save();
    return purchasedBundle.toObject();
}
