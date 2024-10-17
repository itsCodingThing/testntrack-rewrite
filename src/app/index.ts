import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { authMiddleware } from "project/middleware/auth";
import { BaseError, createErrorResponse } from "project/utils/error";
import logger from "project/utils/logger";
import admin from "./admin";
import auth from "./auth";
import school from "./school";
import schoolAdmin from "./school-admin";
import teacher from "./teacher";
import student from "./student";

const api = new Hono().basePath("/api");

api.use(secureHeaders());
api.use(honoLogger());
api.use(cors());

// custom middleware setup
api.use(authMiddleware());

// routes setup
api.route("/", auth);
api.route("/", admin);
api.route("/", school);
api.route("/", schoolAdmin);
api.route("/", teacher);
api.route("/", student);

// common error handler
api.onError((error, ctx) => {
  if (!(error instanceof BaseError)) {
    logger.warn(error, "production level error");
    return ctx.json(createErrorResponse(), 500);
  }

  const resposne = createErrorResponse(error);
  // @ts-ignore
  // http status code type error beacuse of hono it doen't support number type
  return ctx.json(resposne, resposne.statusCode);
});

export default api;
