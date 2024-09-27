import MarketPaperBundleModel from "../../../database/models/b2c/MarketPaperBundle.js";
import { Types } from "mongoose";

export const model = MarketPaperBundleModel;
export const marketPaperBundleModel = MarketPaperBundleModel;

export async function createMarketPaperBundle(data: $TSFixMe) {
    const model = await MarketPaperBundleModel.create(data);
    return model.toObject();
}

export async function getBundlesByIds(ids: string[]) {
    const bundles = await MarketPaperBundleModel.find({ _id: { $in: ids } }).lean();
    return bundles;
}

export async function getMarketPaperBundleByBatch(batch: $TSFixMe) {
    const list = await MarketPaperBundleModel.find({
        "batch_details._id": new Types.ObjectId(batch),
        deleted: false,
    }).lean();

    return list;
}

export async function getPopularMarketPaperBundle(batch: string[], student_id: string) {
    const list = await MarketPaperBundleModel.find({
        "batch_details._id": { $in: batch },
        deleted: false,
        bundle_type: "paid",
        purchased_students: { $ne: student_id },
    })
        .sort({ purchased_students: -1 })
        .lean();

    return list;
}

export async function getNewMarketPaperBundle(batch: string[], student_id: string) {
    const list = await MarketPaperBundleModel.find({
        "batch_details._id": { $in: batch },
        deleted: false,
        bundle_type: "paid",
        purchased_students: { $ne: student_id },
    })
        .sort({ created_at: -1 })
        .lean();

    return list;
}

export async function getSingleBundleDetailsBundles(batch: string[], student_id: string) {
    const list = await MarketPaperBundleModel.find({
        "batch_details._id": { $in: batch },
        bundle_details: { $size: 1 },
        deleted: false,
        total_price: { $gt: 0 },
        purchased_students: { $ne: student_id },
    })
        .sort({ created_at: -1 })
        .lean();

    return list;
}

export async function getDemoMarketPaperBundle(batch: string[], student_id: string) {
    const list = await MarketPaperBundleModel.find({
        "batch_details._id": { $in: batch.map((id) => new Types.ObjectId(id)) },
        deleted: false,
        bundle_type: "free",
        purchased_students: { $ne: student_id },
    }).lean();
    return list;
}

export async function getAllMarketPaperBundle() {
    return await MarketPaperBundleModel.find({ deleted: false }).lean();
}

export async function deleteMarketPaperBundleById(id: $TSFixMe) {
    const status = await MarketPaperBundleModel.findByIdAndUpdate(id, { deleted: true });
    return status;
}

export async function findMarketPaperBundleById(id: string) {
    const model = await MarketPaperBundleModel.findById(id).lean();
    return model;
}

export async function addStudentToBundle(student_id: $TSFixMe, id: $TSFixMe) {
    const model = await MarketPaperBundleModel.findByIdAndUpdate(id, {
        $addToSet: { purchased_students: [student_id] },
    });

    return model;
}
