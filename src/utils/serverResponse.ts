import type { FastifyReply } from "fastify";

interface IResponse {
    code?: number | 200 | 500;
    msg?: string;
    data?: any;
    status?: boolean;
}

interface ISendResponse extends IResponse {
    response: FastifyReply;
}

export function createResponse(params: IResponse) {
    const { code = 200, msg, data = {}, status } = params;
    if (Array.isArray(data)) {
        return { statusCode: code, message: msg, data: data, status, count: data.length };
    }

    return { statusCode: code, message: msg, data: data, status };
}

export function sendResponse(params: ISendResponse): FastifyReply {
    const { code = 200, msg, data = {}, response, status } = params;

    if (response.sent) {
        return response;
    }

    return response.code(code).send(createResponse({ code, msg, data, status }));
}

export function sendSuccessResponse(params: ISendResponse) {
    const { code = 200, msg = "success", data = {}, response } = params;
    return sendResponse({ response, code, msg, data, status: true });
}

export function sendErrorResponse(params: ISendResponse) {
    const { code = 500, msg = "error", data = {}, response } = params;
    return sendResponse({ response, code, msg, data, status: false });
}
