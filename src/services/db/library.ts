import LibraryQuestionModel from "../../database/models/Question.js";
import type { IDBLibQuestion } from "../../database/models/Question.js";

export const libQuestionModel = LibraryQuestionModel;

export async function getRandomQuestions({
    match,
    type,
    count,
}: {
    match: { board: string; class: string; subject: string[]; chapter: string[] };
    type: string;
    count: number;
}) {
    const result = await LibraryQuestionModel.aggregate<IDBLibQuestion>()
        .match({
            board: match.board,
            class: match.class,
            subject: { $in: match.subject },
            chapter: { $in: match.chapter },
            type: type,
        })
        .sample(count);
    return result;
}

export async function getRandomQuestionsWithMarks({
    match,
    type,
    count,
    marks,
}: {
    match: { board: string; class: string; subject: string[]; chapter: string[] };
    type: string;
    count: number;
    marks: number;
}) {
    const result = await LibraryQuestionModel.aggregate<IDBLibQuestion>()
        .match({
            board: match.board,
            class: match.class,
            subject: { $in: match.subject },
            chapter: { $in: match.chapter },
            type: type,
            marks: marks,
        })
        .sample(count);
    return result;
}

export async function getPrimaryDataDetails(primaryData: {
    board: string;
    class: string;
    subject: string[];
    chapter: string[];
}) {
    const result = await LibraryQuestionModel.aggregate<{
        level: string;
        category: string;
        marks: number;
        type: string;
        count: number;
        topics: string[];
    }>()
        .match({
            board: primaryData.board,
            class: primaryData.class,
            subject: { $in: primaryData.subject },
            chapter: { $in: primaryData.chapter },
        })
        .group({
            _id: { level: "$level", category: "$category", marks: "$marks", type: "$type" },
            topics: { $push: "$topics" },
            count: { $sum: 1 },
        })
        .project({
            _id: 0,
            level: "$_id.level",
            category: "$_id.category",
            marks: "$_id.marks",
            type: "$_id.type",
            count: 1,
            topics: 1,
        });

    return result;
}

export async function getPrimaryData(type: $TSFixMe, body: $TSFixMe) {
    let list = [];

    switch (type) {
        case "board": {
            list = await LibraryQuestionModel.distinct("board").lean();
            break;
        }
        case "class": {
            list = await LibraryQuestionModel.distinct("class", body).lean();
            break;
        }
        case "subject": {
            list = await LibraryQuestionModel.distinct("subject", body).lean();
            break;
        }
        case "chapter": {
            list = await LibraryQuestionModel.distinct("chapter", body).lean();
            break;
        }
        default: {
            return [];
        }
    }
    return list;
}

export async function getAllQuestionsDetails() {
    const result = await LibraryQuestionModel.find()
        .select("-question -solution -options -locale -status -solution -created_date -modified_date")
        .lean();

    return result;
}

export async function addQuestions(list: $TSFixMe) {
    const newList = list.map((item: $TSFixMe) => {
        return {
            board: item.board,
            class: item.class,
            subject: item.subject,
            chapter: item.chapter,
            topics: item.topics,
            category: item.category,
            level: item.level,
            question: item.question,
            solution: item.solution,
            marks: item.marks,
            locale: item.locale,
            type: item.type,
            swat: item.swat,

            ...(item.options && { options: item.options }),
        };
    });
    const result = await LibraryQuestionModel.insertMany(newList);

    return result.map((item: $TSFixMe) => item._id);
}

export async function findRandomQuestions(filter: $TSFixMe, sample: $TSFixMe) {
    const result = await LibraryQuestionModel.aggregate().match(filter).sample(sample);

    if (result.length === 0) {
        return null;
    }

    return result;
}

export const getQuestionByIdOrIdList = async function (body: any) {
    if (Array.isArray(body)) {
        const result = [];

        for (const id of body) {
            const response = await libQuestionModel.findById(id).lean();
            if (response) result.push(response);
        }

        if (result.length === 0) {
            return null;
        } else {
            return result;
        }
    }

    const result = await libQuestionModel.findById(body).lean();
    return result;
};

export const updateQuestions = async function (list: any) {
    for (const item of list) {
        await libQuestionModel.findByIdAndUpdate(item.id, item.update, { new: true });
    }
};

export const deleteQuestionsById = async function (list: any) {
    for (const id of list) {
        await libQuestionModel.findByIdAndDelete(id);
    }
};
