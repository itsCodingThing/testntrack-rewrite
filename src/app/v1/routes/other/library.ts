import lodash from "lodash";
import type { FastifyPluginAsync } from "fastify";

import { uploadPdf } from "../../../../utils/service.js";
import { yup, validate } from "../../../../utils/validation.js";
import { LibraryService, PdfGenService } from "../../../../services/index.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

export const libraryRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/api/v1/library/pdf"
     * @desc    Get generate pdf for lib questions
     */
    fastify.route({
        method: "POST",
        url: "/library/pdf",
        handler: async (req, res) => {
            const paper = req.body;

            // Generate pdf buffer
            const pdfBuffer = await PdfGenService.generatePaperPdf(paper);
            // return await res.type("application/pdf").send(pdfBuffer);
            const result = await uploadPdf(pdfBuffer);
            return sendSuccessResponse({ msg: "Successfully generated pdf", data: result, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/library/questions"
     * @desc    Get library questions data
     */
    fastify.route({
        method: "POST",
        url: "/library/questions",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.array().of(yup.string().required()).required(),
                    chapter: yup.array().of(yup.string().required()).required(),
                    question_type: yup.array().of(yup.array().of(yup.string().required()).required()).required(), // [["question type", "count", "marks"]]
                }),
                req.body
            );
            const { question_type, ...restBody } = body;

            const data = await Promise.all(
                question_type.map((item) => {
                    if (item.length === 2) {
                        return LibraryService.getRandomQuestions({
                            match: restBody,
                            type: item[0],
                            count: Number(item[1]),
                        });
                    }

                    if (item.length === 3) {
                        return LibraryService.getRandomQuestionsWithMarks({
                            match: restBody,
                            type: item[0],
                            count: Number(item[1]),
                            marks: Number(item[2]),
                        });
                    }
                })
            );
            return sendSuccessResponse({ data: data, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/library/primarydata/:type"
     * @desc    Get primary data
     */
    fastify.route({
        method: "POST",
        url: "/library/primarydata/:type",
        handler: async (req, res) => {
            const { type = "" } = req.params as { type: string };

            if (!type.length) {
                return sendErrorResponse({ response: res });
            }

            const body = req.body;
            const result = await LibraryService.getPrimaryData(type, body);

            return sendSuccessResponse({ msg: "success", data: result, response: res });
        },
    });

    /**
     * @rotue   POST "/api/v1/library/primarydata/details"
     * @desc    Get primary data details
     */
    fastify.route({
        method: "POST",
        url: "/library/primarydata/details",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.array(yup.string().required()).required(),
                    chapter: yup.array().of(yup.string().required()).required(),
                }),
                req.body
            );

            // Get group by data based on filter
            const data = await LibraryService.getPrimaryDataDetails(body);

            // Groupby according to question_type
            const groupedByTypeList = lodash.groupBy(data, (item: $TSFixMe) => {
                return item.type;
            });

            const list = Object.entries(groupedByTypeList).map(([key, value]) => {
                const newValue: {
                    topics: string[];
                    count: number;
                    level: string[];
                    category: string[];
                    marks: number[];
                    type: string;
                } = {
                    topics: [],
                    count: 0,
                    level: [],
                    category: [],
                    marks: [],
                    type: "",
                };

                value.forEach((item) => {
                    newValue.count = newValue.count + item.count;
                    newValue.topics = [...new Set([...newValue.topics, ...item.topics.flat()])];
                    newValue.level = [...new Set([...newValue.level, item.level])];
                    newValue.category = [...new Set([...newValue.category, item.category])];
                    newValue.marks = [...new Set([...newValue.marks, item.marks])];
                    newValue.type = item.type;
                });

                return [key, newValue];
            });

            return sendSuccessResponse({ data: Object.fromEntries(list), response: res });
        },
    });

    /**
     * @rotue   POST "/library/"
     * @desc    add questions in library
     */
    fastify.route({
        method: "POST",
        url: "/library",
        handler: async (req, res) => {
            const { list } = req.body as $TSFixMe;
            const data = await LibraryService.addQuestions(list);

            return sendSuccessResponse({ msg: "successfully saved", data: data, response: res });
        },
    });

    /**
     * @rotue   GET "/library/all/"
     * @desc    get all questions details without -question -solution -options -locale -status -solution
     */
    fastify.route({
        method: "GET",
        url: "/library/all",
        handler: async (req, res) => {
            const data = await LibraryService.getAllQuestionsDetails();

            return sendSuccessResponse({ msg: "successfully retreive all documents.", data, response: res });
        },
    });

    /**
     * @rotue   GET "/library/question/:question_id"
     * @desc    get quesions by filters
     */
    fastify.route({
        method: "GET",
        url: "/library/question/:question_id",
        handler: async (req, res) => {
            const { question_id } = req.params as { question_id: string };
            const data = await LibraryService.getQuestionByIdOrIdList(question_id);

            if (!data) {
                return sendSuccessResponse({
                    code: 200,
                    msg: "document not exists.",
                    data: {},
                    response: res,
                    status: false,
                });
            }

            return sendSuccessResponse({ msg: "successfully retreive documents.", data, response: res });
        },
    });

    /**
     * @rotue   PUT "/library/"
     * @desc    edit questions
     */
    fastify.route({
        method: "PUT",
        url: "/library",
        handler: async (req, res) => {
            const { list } = req.body as $TSFixMe;
            await LibraryService.updateQuestions(list);

            return sendSuccessResponse({ msg: "successfully updated documents.", data: {}, response: res });
        },
    });

    /**
     * @rotue   POST "/library/delete/"
     * @desc    delete questions
     */
    fastify.route({
        method: "POST",
        url: "/library/delete",
        handler: async (req, res) => {
            const { ids } = req.body as { ids: string[] };
            await LibraryService.deleteQuestionsById(ids);

            return sendSuccessResponse({ msg: "successfully deleted documents.", data: {}, response: res });
        },
    });

    /**
     * @rotue   PUT "/library/question/ids/
     * @desc    get questions for ids
     */
    fastify.route({
        method: "PUT",
        url: "/library/questions/ids",
        handler: async (req, res) => {
            const { ids } = req.body as { ids: string[] };

            const data = await LibraryService.getQuestionByIdOrIdList(ids);

            if (!data) {
                return sendSuccessResponse({
                    code: 200,
                    msg: "documents not exists.",
                    data: {},
                    response: res,
                    status: false,
                });
            }
            return sendSuccessResponse({ msg: "successfully retreive document.", data, response: res });
        },
    });

    /**
     * @rotue   PUT "/library/question/ids/
     * @desc    get questions for ids
     */
    fastify.route({
        method: "POST",
        url: "/library/question/chapterGrouped",
        handler: async (req, res) => {
            const {
                board,
                subject,
                class: classModel,
            } = await validate(
                yup.object({
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.array(yup.string()).required(),
                }),
                req.body
            );

            const agg = [
                {
                    $match: {
                        board: board,
                        class: classModel,
                        subject: subject,
                        deleted: { $ne: true },
                    },
                },
                {
                    $group: {
                        _id: "$chapter",
                        count: {
                            $count: {},
                        },
                        questions: {
                            $push: {
                                _id: "$_id",
                                topics: "$topics",
                                level: "$level",
                                category: "$category",
                                marks: "$marks",
                            },
                        },
                    },
                },
            ];

            // returning the first result of aggregate
            const data = (await LibraryService.libQuestionModel.aggregate(agg).exec())[0];

            if (!data) {
                return sendSuccessResponse({
                    code: 200,
                    msg: "documents not exists.",
                    data: {},
                    response: res,
                    status: false,
                });
            }
            return sendSuccessResponse({ msg: "successfully retreive document.", data, response: res });
        },
    });
};
