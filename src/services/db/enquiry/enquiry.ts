import EnquiryModel from "../../../database/models/enquiry/Enquiry.js";

export const model = EnquiryModel;

// used to get all enquiry
export async function getEnquiryList() {
    const list = await EnquiryModel.find({ deleted: false })
        .select("-deleted -updated_by -created_by -updated_at")
        .sort({ created_at: -1 })
        .lean();
    return list;
}

// create new enquiry
export async function createEnquiry(body: $TSFixMe) {
    const user = await EnquiryModel.find({ contact: body.contact });

    if (user.length !== 0) {
        return null;
    }

    const Enquiry = new EnquiryModel(body);

    await Enquiry.save();
    return Enquiry.toObject();
}

// remove existing enquiry
export async function removeEnquiryById(id: $TSFixMe, updated_by: $TSFixMe) {
    return await EnquiryModel.updateMany({ _id: id }, { deleted: true, updated_by });
}
