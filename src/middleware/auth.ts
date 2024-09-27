import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyJWT } from "project/utils/jwt.js";
import { sendErrorResponse } from "project/utils/serverResponse.js";
import { parseAsync, zod } from "project/utils/validation.js";

const publicRoutes = [
  "/api/v1/auth/app",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/test",
  "/api/v1/role/list",
  "/api/v1/file",
  "/public/data",
  "/api/v1/app",
  "/api/v1/code",
  "/api/v1/notification",
  "/api/v1/evaluator/create",
  "/api/v1/evaluator/getPrimaryData/",
  "/api/v1/admin/evaluators",
  "/api/v1/admin/marketPlaceCopies",
  "/api/v1/admin/otp",
  "/api/v1/blogs/",
  "/api/v1/enquiry/",
  "/api/v1/library",
  "/api/v1/parent/create",
  "/api/v1/teacher/evaluation/copy/check-details",
  "/api/v1/schedule",
  "/api/v1/data/getBatchList",
  "/api/v1/student/vendor",
  "/api/v1/appLink",
  "api/v1/analytics/",
];

export async function noAuth(_req: FastifyRequest, res: FastifyReply) {
  return sendErrorResponse({
    response: res,
    msg: "Invalid authorization",
    code: 403,
  });
}

export async function publicRoute(req: FastifyRequest) {
  const NON_AUTH_URLS = publicRoutes;

  // check for exceptional routes
  if (NON_AUTH_URLS.some((v) => req.url.toLowerCase().includes(v.toLocaleLowerCase()))) {
    return;
  }

  throw new Error("Public routes error");
}

export async function testntrackAuth(req: FastifyRequest) {
  const { authorization } = await parseAsync(
    zod.object({
      authorization: zod.string(),
    }),
    req.headers
  );

  try {
    const token = authorization.split(" ")[1];
    const payload = verifyJWT(token);
    req.payload = payload;
    return;
  } catch (error) {
    throw new Error("Auth Error");
  }
}
