import { createResponse } from "./serverResponse.js";
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

export function createErrorResponse(error?: Error) {
  if (error instanceof BaseError) {
    return createResponse({
      code: error.code,
      msg: `${error.name}: ${error.msg}`.trim(),
      data: error.data,
    });
  }

  return createResponse({ msg: ErrorNames.internal, code: 500 });
}
