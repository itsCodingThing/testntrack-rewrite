import { createMiddleware } from "hono/factory";
import { verifyJWT } from "project/utils/jwt";
import logger from "project/utils/logger";
import { parseAsync, zod } from "project/utils/validation";

export const authMiddleware = createMiddleware(async (ctx, next) => {
  const { authorization } = await parseAsync(
    zod.object({
      authorization: zod.string(),
    }),
    ctx.req.header(),
  );

  try {
    const token = authorization.split(" ")[1];
    const payload = await verifyJWT(token);
    logger.info(payload, "request payload");
  } catch (error) {
    throw new Error("Auth Error");
  }

  await next();
});
