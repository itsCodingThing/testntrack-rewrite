import NotesModel from "../../../database/models/erp/Notes.js";

export async function getNotesListByBatch(batch_id: $TSFixMe) {
    const list = await NotesModel.find({ batch_id, deleted: false });
    return list;
}

export async function addNotes(body: $TSFixMe) {
    const Notes = new NotesModel(body);
    await Notes.save();
    return Notes.toObject();
}

export async function updateNotesById(notesId: $TSFixMe, update: $TSFixMe) {
    const data = await NotesModel.findByIdAndUpdate(notesId, update);
    return data;
}

export async function removeNotesById(id: $TSFixMe) {
    await NotesModel.findByIdAndUpdate(id, { deleted: true });
}
