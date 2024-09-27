import DeviceModel from "../../database/models/DeviceDetail.js";

export const deviceModel = DeviceModel;

export async function getMostRecentUserDevice(userId = "") {
    const doc = await DeviceModel.find({ user_id: userId, deleted: false }).sort({ created_at: -1 }).limit(1).lean();

    if (doc.length === 0) {
        return null;
    }

    return doc[0];
}

export async function getMostRecentUsersDevices(userIds = []) {
    const result = await Promise.allSettled(
        userIds.map(async (id) => {
            const doc = await DeviceModel.find({ user_id: id, deleted: false })
                .sort({ created_at: -1 })
                .limit(1)
                .lean();

            if (doc.length === 0) {
                return null;
            }

            return doc[0];
        })
    );

    return result.filter((r) => r.status === "fulfilled").map((v) => (v.status === "fulfilled" ? v.value : null));
}

export async function addNewDeviceDetail(body: $TSFixMe) {
    const doc = new DeviceModel(body);

    await doc.save();
    return doc.toObject();
}

export async function getUserDeviceDetailByFilter(filter: $TSFixMe) {
    const found = await DeviceModel.findOne({ ...filter, deleted: false }).lean();
    return found;
}

export async function replaceUserDeviceDetailByFilter(id: $TSFixMe, update: $TSFixMe) {
    const doc = await DeviceModel.replaceOne(id, update).lean();

    return doc;
}
