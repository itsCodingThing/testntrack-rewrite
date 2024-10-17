import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import auth from "./auth";
import admin from "./admin";
import school from "./school";
import schoolAdmin from "./school-admin";
import logger from "project/utils/logger";
import { BaseError, createErrorResponse } from "project/utils/error";
import { authMiddleware } from "project/middleware/auth";

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
