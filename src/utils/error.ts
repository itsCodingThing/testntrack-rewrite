import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { sendErrorResponse } from "./serverResponse.js";
import type { ObjValueAsType } from "./types.js";

const ErrorNames = {
  validation: "ValidationError",
  api: "ApiError",
  service: "ServiceError",
  internal: "InternalServerError",
} as const;
export type ErrorName = ObjValueAsType<typeof ErrorNames>;

interface BaseErrorParams {
  name: ErrorName;
  code?: number;
  status?: boolean;
  msg?: string;
  data?: any;
}

export type ResponseErrorMsg = `${ErrorName}: ${string}`;

export class BaseError extends Error {
  code: number;
  msg: string;
  status: boolean;
  data: any;
  name: ErrorName;

  constructor(errorParams: BaseErrorParams) {
    super(errorParams.msg);
    this.status = errorParams.status ?? false;
    this.msg = errorParams.msg ?? "";
    this.name = errorParams.name;
    this.code = errorParams.code ?? 500;
    this.data = errorParams.data;

    Error.captureStackTrace(this);
  }
}

export class ValidationError extends BaseError {
  constructor({ msg = "", data }: Partial<Pick<BaseErrorParams, "msg" | "data">> = { msg: "", data: [] }) {
    super({ name: ErrorNames.validation, code: 400, msg, data });
  }
}

export class ApiError extends BaseError {
  constructor({ msg = "", data }: Partial<Pick<BaseErrorParams, "msg" | "data">> = { msg: "", data: [] }) {
    super({ name: ErrorNames.api, msg, data });
  }
}

export class ServiceError extends BaseError {
  constructor({ msg = "", data }: Partial<Pick<BaseErrorParams, "msg" | "data">> = { msg: "", data: [] }) {
    super({ name: ErrorNames.service, msg, data });
  }
}

export async function errorHandler(error: FastifyError, req: FastifyRequest, res: FastifyReply) {
  if (process.env.NODE_ENV === "development") req.log.error(error);

  if (error instanceof ValidationError) {
    return sendErrorResponse({
      response: res,
      code: error.code,
      msg: error.name,
      data: error.data,
    });
  }

  if (error instanceof BaseError) {
    return sendErrorResponse({
      response: res,
      code: error.code,
      msg: `${error.name}: ${error.msg}`.trim(),
      data: error.data,
    });
  }

  return sendErrorResponse({ msg: ErrorNames.internal, data: error.toString(), response: res });
}
