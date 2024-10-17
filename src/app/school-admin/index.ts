import { Hono } from "hono";
import { prisma } from "project/database/db.connection";
import { encryptPassword } from "project/utils/encrypt";
import { createResponse } from "project/utils/serverResponse";
import { parseAsync, zod } from "project/utils/validation";

const schoolAdmin = new Hono();

/**
 *  @route  GET "/api/v1/school-admins?schoolId"
 *  @desc   Get all admins
 */
schoolAdmin.get("/school-admins", async (ctx) => {
  const query = await parseAsync(
    zod.object({
      schoolId: zod.coerce.number(),
    }),
    ctx.req.query(),
  );

  const school = await prisma.school.findFirst({ where: { id: query.schoolId } });
  if (!school) {
    return ctx.json(createResponse({ msg: "Thers is no school registered with this id", code: 500 }), 500);
  }

  return ctx.json(
    createResponse({
      data: await prisma.schoolAdminUser.findMany({
        where: { schoolId: school.id },
        select: { name: true, id: true, contact: true, email: true },
        orderBy: { name: "asc" },
      }),
    }),
  );
});

/**
 *  @route  GET "/api/v1/admin/:adminId"
 *  @desc   Get admin details
 */
schoolAdmin.get("/school-admin/:adminId", async (ctx) => {
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
schoolAdmin.post("/school-admin/create", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      schoolId: zod.number().min(1, "please enter a valid school id"),
      name: zod.string().min(1, "please enter admin name"),
      email: zod.string().email("please enter a valid email"),
      password: zod.string().min(8, "password must be 8 charactor long"),
      contact: zod.string().length(10, "please enter valid contact number"),
    }),
    await ctx.req.json(),
  );

  // check if the admin user exists with this email
  const alreadyExistUser = await prisma.schoolAdminUser.findFirst({
    where: { email: body.email, schoolId: body.schoolId },
  });
  if (alreadyExistUser) {
    return ctx.json(createResponse({ msg: "Email already register with us", code: 500 }), 500);
  }

  // create new admin user
  const user = await prisma.schoolAdminUser.create({
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
 * @route   DELETE "/api/school-admin/:adminId/remove"
 * @desc    Remove admin
 */
schoolAdmin.delete("/school-admin/:adminId/remove", async (ctx) => {
  const { adminId } = await parseAsync(zod.object({ adminId: zod.coerce.number() }), ctx.req.param());
  await prisma.adminUser.delete({ where: { id: adminId } });

  return ctx.json(createResponse({ data: "admin deleted successfully" }));
});

export type SchoolAdminApiType = typeof schoolAdmin;
export default schoolAdmin;
