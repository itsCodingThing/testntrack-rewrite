import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import auth from "./auth";
import admin from "./admin";
import logger from "project/utils/logger";
import { BaseError, createErrorResponse } from "project/utils/error";

const api = new Hono();

api.use(secureHeaders());
api.use(honoLogger());
api.use(cors());

api.route("/api", auth);
api.route("/api", admin);

api.onError((error, ctx) => {
  if (!(error instanceof BaseError)) {
    logger.warn(error, "production level error");
  }

  return ctx.json(createErrorResponse(error), 500);
});

export default api;
