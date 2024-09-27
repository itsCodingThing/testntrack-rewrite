import PrimaryDataModel from "../database/models/PrimaryData.js";

export const primaryDataModel = PrimaryDataModel;

export async function getBoardList() {
    const result = await PrimaryDataModel.distinct("board").lean();
    return result;
}

export async function getClassList(body: { board: string }) {
    const result = await PrimaryDataModel.distinct("class", { board: body.board }).lean();
    return result;
}

export async function getSubjectList(body: { board: string; class: string }) {
    const result = (await PrimaryDataModel.distinct<string>("subject", {
        board: body.board,
        class: body.class,
    }).lean()) as string[];

    return result;
}

export async function getChapterList(body: { board: string; class: string; subject: string }) {
    const result = (await PrimaryDataModel.distinct("chapter", {
        board: body.board,
        class: body.class,
        subject: body.subject,
    }).lean()) as string[];
    return result;
}

export async function getTopicList(body: { board: string; class: string; subject: string; chapter: string }) {
    const result = await PrimaryDataModel.distinct("topic", {
        board: body.board,
        class: body.class,
        subject: body.subject,
        chapter: body.chapter,
    }).lean();
    return result;
}

export async function addPrimaryData(body: any) {
    await PrimaryDataModel.insertMany([body]);
}

export async function updatePrimaryData(body: any) {
    await PrimaryDataModel.findOneAndUpdate(body, body);
}

export async function removePrimaryData(body: any) {
    await PrimaryDataModel.deleteMany(body);
}

export async function updateManyPrimaryData(updateFilter: any, prevFilter: any) {
    await PrimaryDataModel.updateMany(prevFilter, {
        ...updateFilter,
    });
}
