import type { FastifyPluginAsync } from "fastify";
import * as BlogService from "../../../../services/db/blogs/blogs.js";
import { sendSuccessResponse, sendErrorResponse } from "../../../../utils/serverResponse.js";

export const blogRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   GET "/api/v1/blogs/list"
     * @desc    get all blogs
     */
    fastify.route({
        method: "GET",
        url: "/blogs/list",
        handler: async (req, res) => {
            const list = await BlogService.getBlogsList();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/blogs/allBlogs"
     * @desc    get all blogs
     */
    fastify.route({
        method: "GET",
        url: "/blogs/allBlogs",
        handler: async (req, res) => {
            const list = await BlogService.getAllBlogsList();
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/blogs/filterByCategory"
     * @desc    get all blogs by category
     */
    fastify.route({
        method: "POST",
        url: "/blogs/filterByCategory",
        handler: async (req, res) => {
            const categories = req.body as $TSFixMe;
            if (!categories) {
                return sendErrorResponse({ response: res, data: "categories is required" });
            }

            const list = await BlogService.getBlogsListByCategory(categories);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/blogs/getBlogsListByTags"
     * @desc    get all blogs by tags
     */
    fastify.route({
        method: "POST",
        url: "/blogs/filterByTags",
        handler: async (req, res) => {
            const tags = req.body as $TSFixMe;
            if (!tags) {
                return sendErrorResponse({ response: res, data: "tags is required" });
            }
            const list = await BlogService.getBlogsListByTags(tags);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue   GET "/api/v1/blogs/addCommentsToBlog"
     * @desc    get all blogs by category
     */
    fastify.route({
        method: "POST",
        url: "/blogs/addCommentsToBlog",
        handler: async (req, res) => {
            const { comment, blog_id } = req.body as $TSFixMe;
            if (!comment) {
                return sendErrorResponse({ response: res, data: "comment is required" });
            }
            if (!blog_id) {
                return sendErrorResponse({ response: res, data: "blog_id is required" });
            }
            const data = await BlogService.addCommentsToBlog(blog_id, [comment]);
            return sendSuccessResponse({ data: data, response: res });
        },
    });

    /**
     * @rotue  POST "/api/v1/blogs/add"
     * @desc   add new blog
     */
    fastify.route({
        method: "POST",
        url: "/blogs/add",
        handler: async (req, res) => {
            const data = req.body;

            if (!data) {
                return sendErrorResponse({ response: res, data: "body is required" });
            }

            const list = await BlogService.addBlog(data);
            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue  POST "/api/v1/blogs/removeBlog"
     * @desc   add new blog
     */
    fastify.route({
        method: "POST",
        url: "/blogs/removeBlog",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;
            const userId = req.payload.id;

            await BlogService.removeblogById({ id: body.id, updated_by: userId });
            return sendSuccessResponse({ response: res });
        },
    });

    /**
     * @rotue  GET "/api/v1/blogs/getBlogByTitle"
     * @desc   get blog by title
     */
    fastify.route({
        method: "POST",
        url: "/blogs/getBlogByTitle",
        handler: async (req, res) => {
            const { title } = req.body as $TSFixMe;

            if (!title) {
                return sendErrorResponse({ msg: "title is required", response: res });
            }

            const data = await BlogService.getBlogByTitle(title);
            return sendSuccessResponse({ response: res, data });
        },
    });

    /**
     * @rotue  POST "/api/v1/blogs/update"
     * @desc   update blog by id
     */
    fastify.route({
        method: "POST",
        url: "/blogs/update",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;

            await BlogService.updateBlogById(body.id, body.update);

            return sendSuccessResponse({ response: res });
        },
    });

    /** ************************************************** Blog Category ***************************************************************** **/

    /**
     * @rotue  POST "/api/v1/blogs/category/all"
     * @desc   get all category
     */
    fastify.route({
        method: "GET",
        url: "/blogs/category/all",
        handler: async (req, res) => {
            const list = await BlogService.category.find().lean();

            return sendSuccessResponse({ data: list, response: res });
        },
    });

    /**
     * @rotue  POST "/api/v1/blogs/category/add"
     * @desc   add new category
     */
    fastify.route({
        method: "POST",
        url: "/blogs/category/add",
        handler: async (req, res) => {
            const { title } = req.body as $TSFixMe;
            const category = await BlogService.addCategory(title);

            return sendSuccessResponse({ data: category, response: res });
        },
    });

    /**
     * @rotue  DELETE "/api/v1/blogs/category/remove"
     * @desc   remove category
     */
    fastify.route({
        method: "DELETE",
        url: "/blogs/category/remove/:title",
        handler: async (req, res) => {
            const { title } = req.params as $TSFixMe;
            const category = await BlogService.removeCategoryByTitle(title);

            return sendSuccessResponse({ data: category, response: res });
        },
    });
};
