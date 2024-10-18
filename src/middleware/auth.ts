import { createMiddleware } from "hono/factory";
import { ValidationError } from "project/utils/error";
import { verifyJWT } from "project/utils/jwt";
import { parseAsync, zod } from "project/utils/validation";

const NON_AUTH_URLS = ["/auth"];

export const authMiddleware = () =>
  createMiddleware(async (ctx, next) => {
    const authorized = !NON_AUTH_URLS.some((v) => ctx.req.url.toLowerCase().includes(v.toLocaleLowerCase()));
    if (authorized) {
      const headers = ctx.req.header();
      const { authorization } = await parseAsync(
        zod.object({
          authorization: zod
            .string({ required_error: "need authorization header" })
            .min(1, "invalid authorization header"),
        }),
        headers,
      );

      try {
        const token = authorization.split(" ")[1];
        await verifyJWT(token);
      } catch (error) {
        throw new ValidationError({ msg: "invalid auth token" });
      }
    }

    await next();
  });
