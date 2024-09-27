import type { FastifyPluginAsync } from "fastify";

import { yup, validate } from "../../../../utils/validation.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";
import { findEvaluatorByContact, addEvaluator } from "../../../../services/db/evaluator.js";
import {
    getBoardList,
    getClassList,
    getSubjectList,
    getChapterList,
    getTopicList,
} from "../../../../services/master.js";

export const loginRegisterRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/evaluator/create"
     * @desc    Add Evaluator
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/create",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    name: yup.string().required(),
                    email: yup.string(),
                    contact: yup.string().required(),
                    boards: yup.array().of(yup.string()).required(),
                    subjects: yup.array().of(yup.string()).required(),
                    classes: yup.array().of(yup.string()).required(),
                    experience: yup.string().required(),
                    status: yup.string().oneOf(["active", "inactive"]).default("active"),
                }),
                req.body
            );

            const found = await findEvaluatorByContact(body.contact);

            if (!found) {
                const user = await addEvaluator(body);
                return sendSuccessResponse({ data: user, response: res });
            } else {
                return sendErrorResponse({
                    code: 400,
                    msg: "Evaluator already exists",
                    response: res,
                });
            }
        },
    });

    /**
     * @rotue   POST "/evaluator/getPrimaryData/:type"
     * @desc    get all board list
     */
    fastify.route({
        method: "POST",
        url: "/evaluator/getPrimaryData/:type",
        handler: async (req, res) => {
            const { type } = req.params as { type: string };
            const body = req.body as { board: string; class: string; subject: string; chapter: string };

            let list = [];

            switch (type) {
                case "board": {
                    list = await getBoardList();
                    break;
                }
                case "class": {
                    list = await getClassList(body);
                    break;
                }
                case "subject": {
                    list = await getSubjectList(body);
                    break;
                }
                case "chapter": {
                    list = await getChapterList(body);
                    break;
                }
                case "topic": {
                    list = await getTopicList(body);
                    break;
                }
                default: {
                    return sendErrorResponse({ msg: "invalid type", response: res });
                }
            }

            return sendSuccessResponse({ msg: "success", data: list, response: res });
        },
    });
};
