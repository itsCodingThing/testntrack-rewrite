import type { FastifyPluginAsync } from "fastify";

import {
    findAllIssues,
    findIssuesByIssuerId,
    findIssuesByStudentId,
    createIssue as createNewIssue,
    updateIssueStatus as updateIssueStatusById,
} from "../../../../services/db/issue.js";
import constants from "../../../../config/constants.js";
import { sendSuccessResponse } from "../../../../utils/serverResponse.js";

export const supportRoutes: FastifyPluginAsync = async (fastify) => {
    /**
     * @rotue   POST "/api/v1/support/issue/create"
     * @desc    create new issue
     */
    fastify.route({
        method: "POST",
        url: "/support/issue/create",
        handler: async (req, res) => {
            const body = req.body as $TSFixMe;
            return sendSuccessResponse({ response: res, data: await createNewIssue(body) });
        },
    });

    /**
     * @rotue   GET "/api/v1/support/issue"
     * @desc    get all available issues
     */
    fastify.route({
        method: "GET",
        url: "/support/issue",
        handler: async (req, res) => {
            return sendSuccessResponse({ response: res, data: await findAllIssues() });
        },
    });

    /**
     * @rotue   GET "/api/v1/support/issue/student/:studentId"
     * @desc    get all available issues
     */
    fastify.route({
        method: "GET",
        url: "/support/issue/student/:studentId",
        handler: async (req, res) => {
            const { studentId } = req.params as { studentId: string };

            return sendSuccessResponse({
                response: res,
                data: await findIssuesByStudentId(studentId),
            });
        },
    });

    /**
     * @route   GET "/api/v1/support/issuer/:issuerId"
     * @desc    get all available issues for a issuer
     */
    fastify.route({
        method: "GET",
        url: "/support/issuer/:issuerId",
        handler: async (req, res) => {
            const { issuerId } = req.params as { issuerId: string };

            return sendSuccessResponse({ response: res, data: await findIssuesByIssuerId(issuerId) });
        },
    });

    /**
     * @route   PUT "/api/v1/support/issue/update"
     * @desc    update issue status
     */
    fastify.route({
        method: "PUT",
        url: "/support/issue/update",
        handler: async (req, res) => {
            const { issue_id, status, feedback } = req.body as $TSFixMe;

            await updateIssueStatusById({ issueId: issue_id, status, feedback });
            return sendSuccessResponse({ response: res, msg: "issue updated" });
        },
    });

    /**
     * @route   GET "/api/v1/support/issue/types"
     * @desc    get available issue types
     */
    fastify.route({
        method: "GET",
        url: "/support/issue/types",
        handler: async (req, res) => {
            return sendSuccessResponse({ response: res, data: constants.issue_types });
        },
    });
};
