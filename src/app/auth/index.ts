import { Hono } from "hono";

import { compareHashPassword, encryptPassword } from "project/utils/encrypt";
import { generateJWT } from "project/utils/jwt";
import { createResponse } from "project/utils/serverResponse";
import { parseAsync, zod } from "project/utils/validation";
import { prisma } from "project/database/db.connection";

const auth = new Hono();

/**
 * @rotue   POST "/api/v1/auth/register"
 * @desc    Register admin user
 */
auth.post("/auth/register", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      email: zod.string(),
      password: zod.string(),
      name: zod.string().optional(),
      contact: zod.string().optional(),
    }),
    await ctx.req.json(),
  );

  const user = await prisma.adminUser.findUnique({ where: { email: body.email } });
  if (user) {
    const response = createResponse({ code: 500, msg: "Email already register with us" });
    ctx.status(500);

    return ctx.json(response);
  }

  return ctx.json(
    createResponse({
      data: await prisma.adminUser.create({
        data: {
          email: body.email,
          password: encryptPassword(body.password),
          name: body.name ?? "admin",
          contact: "9876543210",
        },
      }),
    }),
  );
});

/**
 * @rotue   POST "/api/v1/auth/login
 * @desc    Login admin user
 */
auth.post("/auth/login", async (ctx) => {
  const body = await parseAsync(
    zod.discriminatedUnion(
      "type",
      [
        zod.object({
          type: zod.literal("admin"),
          email: zod.string().email("enter a valid email"),
          password: zod.string().min(8, "please enter password min 8 charactor long"),
        }),
        zod.object({
          type: zod.literal("school"),
          email: zod.string().email("enter a valid email"),
          password: zod.string().min(8, "please enter password min 8 charactor long"),
          code: zod.string().min(3, "code must atleast be 3 charactor long"),
        }),
      ],
      {
        errorMap: () => ({ message: "invalid user type" }),
      },
    ),
    await ctx.req.json(),
  );

  const admin = await prisma.adminUser.findFirst({ where: { email: body.email } });
  if (!admin) {
    const code = 500;
    ctx.status(code);

    return ctx.json(createResponse({ code, msg: "Admin does not exists" }));
  }

  if (!compareHashPassword(body.password, admin.password)) {
    const code = 500;
    ctx.status(code);

    return ctx.json(
      createResponse({
        code,
        msg: "Invalid password. Please enter correct password and try again",
      }),
    );
  }

  const token = await generateJWT({ id: admin.id.toString() });
  return ctx.json(createResponse({ data: { token, id: admin.id, name: admin.name, type: "admin" } }));
});

export type AuthService = typeof auth;
export default auth;
