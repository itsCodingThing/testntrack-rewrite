import { Hono } from "hono";
import { prisma } from "project/database/db.connection";
import { encryptPassword } from "project/utils/encrypt";
import { parseAsync, zod } from "project/utils/validation";
import { createResponse } from "project/utils/response";

const admin = new Hono();

/**
 *  @route  GET "/api/v1/admin"
 *  @desc   Get all admins
 */
admin.get("/admin", async (ctx) => {
  return ctx.json(
    createResponse({
      data: await prisma.adminUser.findMany({ select: { name: true, id: true, contact: true, email: true } }),
    }),
  );
});

/**
 *  @route  GET "/api/v1/admin/:adminId"
 *  @desc   Get admin details
 */
admin.get("/admin/:adminId", async (ctx) => {
  const { adminId } = await parseAsync(zod.object({ adminId: zod.coerce.number() }), ctx.req.param());

  return ctx.json(
    createResponse({
      data: await prisma.adminUser.findFirst({
        where: { id: adminId },
        select: { name: true, id: true, contact: true, email: true },
      }),
    }),
  );
});

/**
 *  @rotue   POST "/api/v1/admin/create"
 *  @desc    Create new user
 */
admin.post("/admin/create", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      name: zod.string().min(1, "please enter admin name"),
      email: zod.string().email("please enter a valid email"),
      password: zod.string().min(8, "password must be 8 charactor long"),
      contact: zod.string().length(10, "please enter valid contact number"),
    }),
    await ctx.req.json(),
  );

  // check if the admin user exists with this email
  const alreadyExistUser = await prisma.adminUser.findFirst({ where: { email: body.email } });
  if (alreadyExistUser) {
    const code = 500;
    ctx.status(code);
    return ctx.json(createResponse({ code, msg: "Email already register with us" }));
  }

  // create new admin user
  const user = await prisma.adminUser.create({
    data: {
      ...body,
      password: encryptPassword(body.password),
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return ctx.json(
    createResponse({
      data: user,
    }),
  );
});

/**
 * @route   DELETE "/api/v1/admin/user/remove/:id"
 * @desc    Remove admin
 */
admin.delete("/admin/:adminId/remove", async (ctx) => {
  const { adminId } = await parseAsync(zod.object({ adminId: zod.coerce.number() }), ctx.req.param());
  await prisma.adminUser.delete({ where: { id: adminId } });

  return ctx.json(createResponse({ data: "admin deleted successfully" }));
});

export type AdminApiType = typeof admin;
export default admin;
