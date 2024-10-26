import { Hono } from "hono";
import { prisma } from "project/database/db.connection";
import { encryptPassword } from "project/utils/encrypt";
import { parseAsync, zod } from "project/utils/validation";
import { createResponse } from "project/utils/response";

const admin = new Hono();

/**
 *  @route  GET "/api/admin"
 *  @desc   Get all admins
 */
admin.get("/admin", async (ctx) => {
  const query = await parseAsync(
    zod.object({
      page: zod.coerce.number().min(1, "page can not be less then 1").default(1),
      count: zod.coerce.number().min(1, "count can not be less then 1").default(10),
    }),
    ctx.req.query(),
  );

  // this type of pagination is not scalable at large datasets (use cursor based pagination)
  let skip = 0;
  if (query.page > 1) {
    skip = query.page * query.count;
  }

  const results = await prisma.adminUser.findMany({
    select: { name: true, id: true, contact: true, email: true, created_at: true, status: true },
    skip: skip,
    take: query.count,
    orderBy: {
      created_at: "desc",
    },
  });

  return ctx.json(
    createResponse({
      data: results,
    }),
  );
});

/**
 *  @route  GET "/api/admin/:adminId"
 *  @desc   Get admin details
 */
admin.get("/admin/:adminId", async (ctx) => {
  const { adminId } = await parseAsync(zod.object({ adminId: zod.coerce.number() }), ctx.req.param());

  return ctx.json(
    createResponse({
      data: await prisma.adminUser.findFirst({
        where: { id: adminId },
        select: { name: true, id: true, contact: true, email: true, status: true },
      }),
    }),
  );
});

/**
 *  @rotue   POST "/api/admin/create"
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
 *  @rotue   PUT "/api/admin/update"
 *  @desc    update user
 */
admin.put("/admin/update", async (ctx) => {
  const { adminId, ...body } = await parseAsync(
    zod.object({
      adminId: zod.number({ required_error: "adminId is required" }),
      name: zod.string().min(1, "please enter admin name").optional(),
      email: zod.string().email("please enter a valid email").optional(),
      password: zod.string().min(8, "password must be 8 charactor long").optional(),
      contact: zod.string().length(10, "please enter valid contact number").optional(),
      status: zod
        .union([zod.literal("pending"), zod.literal("active"), zod.literal("deactive")], {
          errorMap: () => ({ message: "status accept only [pending, active, deactive]" }),
        })
        .optional(),
    }),
    await ctx.req.json(),
  );

  // check if the user exists with this email
  if (body.email) {
    const alreadyExistUser = await prisma.adminUser.findFirst({ where: { email: body.email, id: { not: adminId } } });
    if (alreadyExistUser) {
      const code = 500;
      ctx.status(code);
      return ctx.json(createResponse({ code, msg: "Email already register with us" }));
    }
  }

  // create new admin user
  const user = await prisma.adminUser.update({
    where: {
      id: adminId,
    },
    data: body,
  });

  return ctx.json(
    createResponse({
      data: user,
    }),
  );
});

/**
 * @route   DELETE "/api/admin/:adminId/remove"
 * @desc    Remove admin
 */
admin.delete("/admin/:adminId/remove", async (ctx) => {
  const { adminId } = await parseAsync(zod.object({ adminId: zod.coerce.number() }), ctx.req.param());
  await prisma.adminUser.delete({ where: { id: adminId } });

  return ctx.json(createResponse({ data: "admin deleted successfully" }));
});

export type AdminApiType = typeof admin;
export default admin;
