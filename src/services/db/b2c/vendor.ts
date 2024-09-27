import VendorModel from "../../../database/models/b2c/Vendor.js";

const getVendorByCode = async function (code: $TSFixMe) {
    const model = await VendorModel.findOne({ code: code, deleted: false });
    return model;
};

export const getVendorModelByCode = getVendorByCode;

export async function createVendorModel(data: $TSFixMe) {
    const isExist = await getVendorByCode(data?.code ?? "");

    if (isExist) {
        return;
    }

    const model = new VendorModel(data);
    await model.save();

    return model.toObject();
}

export async function updateVendorById(id: $TSFixMe, update: $TSFixMe) {
    return await VendorModel.findByIdAndUpdate(id, update);
}

export async function deleteVendorById(id: $TSFixMe) {
    return await VendorModel.findByIdAndUpdate(id, { deleted: true });
}

export async function getVendorList() {
    return await VendorModel.find().lean();
}
