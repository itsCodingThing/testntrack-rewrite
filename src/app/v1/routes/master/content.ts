import type { FastifyPluginAsync } from "fastify";

import { mediaTypes } from "../../../../database/models/Content.js";
import { ContentService } from "../../../../services/index.js";
import { validate, yup } from "../../../../utils/validation.js";
import { sendErrorResponse, sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const contentRoute: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/api/v1/app/content/type"
     * @desc    content title
     */
    fastify.route({
        method: "GET",
        url: "/app/content/type",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.string().required(),
                }),
                req.query
            );

            const distinctTitles = await ContentService.contentModel.distinct<string>("type", {
                board: body.board,
                class: body.class,
                subject: body.subject,
                deleted: false,
            });

            const contentTypes = await ContentService.contentTypeModel
                .find({ title: { $in: distinctTitles }, deleted: false })
                .lean();

            return sendSuccessResponse({
                response: res,
                data: contentTypes,
            });
        },
    });
    /**
     * @rotue   POST "/api/v1/app/content/type/all"
     * @desc    get all content by ids
     */
    fastify.route({
        method: "POST",
        url: "/app/content/type/all",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    ids: yup.array().required(),
                }),
                req.body
            );

            const contents = await Promise.all(
                body.ids.map(async (e) => await ContentService.contentModel.findById(e).lean())
            );

            return sendSuccessResponse({
                response: res,
                data: contents,
            });
        },
    });

    /**
     * @rotue   POST "/api/v1/content/create"
     * @desc    Upload Content
     */
    fastify.route({
        method: "POST",
        url: "/content/create",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    title: yup.string().required(),
                    board: yup.string().required(),
                    class: yup.string().required(),
                    subject: yup.string().required(),
                    chapter: yup.string(),
                    author_details: yup.object({
                        author_name: yup.string(),
                        author_id: yup.string(),
                        publish_date: yup.date(),
                    }),
                    type: yup.string().required(),
                    media_type: yup.string().oneOf(mediaTypes).required(),
                    description: yup.string(),
                    media_url: yup.string().required(),
                    banner_url: yup.string(),
                }),
                req.body,
                {
                    stripUnknown: false,
                }
            );

            const contentTitle = await ContentService.checkContentTypeExists(body.type);

            if (!contentTitle) {
                return sendErrorResponse({
                    response: res,
                    msg: "provide a valid title",
                });
            }

            const data = await ContentService.createContent(body, contentTitle.id);

            return sendSuccessResponse({ response: res, data: data });
        },
    });

    /**
     * @route   DELETE "/api/v1/content/:content_id/delete"
     * @desc    remove content by id
     */
    fastify.route({
        method: "DELETE",
        url: "/content/:content_id/delete",
        handler: async (req, res) => {
            const params = req.params as { content_id: string };

            await ContentService.removeContent(params.content_id);

            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/content/:type"
     * @desc    get content by type
     */
    fastify.route({
        method: "GET",
        url: "/content/:type_id",
        handler: async (req, res) => {
            const { type_id } = req.params as { type_id: string };
            const contentType = await ContentService.contentTypeModel.findById(type_id).lean();

            return sendSuccessResponse({
                response: res,
                data: await ContentService.contentModel.find({ type: contentType?.title ?? "", deleted: false }).lean(),
            });
        },
    });

    /**
     * @rotue   POST "/api/v1/content/type/create"
     * @desc    create content title
     */
    fastify.route({
        method: "POST",
        url: "/content/type/create",
        handler: async (req, res) => {
            const body = await validate(
                yup.object({
                    title: yup.string().required(),
                    description: yup.string(),
                    content: yup.array().of(yup.string().required()),
                    no_of_content: yup.number(),
                }),
                req.body,
                {
                    stripUnknown: false,
                }
            );

            const isTypeExists = await ContentService.checkContentTypeExists(body.title);
            if (isTypeExists) {
                return sendErrorResponse({ response: res, msg: "content type already exists." });
            }

            const data = await ContentService.createContentType(body);

            return sendSuccessResponse({ response: res, data: data });
        },
    });

    /**
     * @rotue   POST "/api/v1/content/type/update"
     * @desc    update content title
     */
    fastify.route({
        method: "POST",
        url: "/content/type/update",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;

            return sendSuccessResponse({
                response: res,
                data: await ContentService.contentTypeModel.findByIdAndUpdate(body.id, body.update),
            });
        },
    });

    /**
     * @rotue   POST "/api/v1/content/type/:id/delete"
     * @desc    delete content title
     */
    fastify.route({
        method: "DELETE",
        url: "/content/type/:id/delete",
        handler: async (req, res) => {
            const body = req.params as { id: string };

            const data = await ContentService.contentTypeModel.findByIdAndUpdate(body.id, { deleted: true });
            return sendSuccessResponse({ response: res, data: data });
        },
    });

    /**
     * @rotue   GET "/api/v1/content/type"
     * @desc    get all content types
     */
    fastify.route({
        method: "GET",
        url: "/content/type",
        handler: async (req, res) => {
            return sendSuccessResponse({ response: res, data: await ContentService.findAllContentTypes() });
        },
    });
};
