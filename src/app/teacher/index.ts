import { Hono } from "hono";
import { prisma } from "project/database/db.connection";
import { createResponse } from "project/utils/serverResponse";
import { parseAsync, zod } from "project/utils/validation";

const teacher = new Hono();

/**
 * @route GET "/api/teacher"
 * @desc  Get Teacher list
 */
teacher.get("/teacher", async (ctx) => {
  const { schoolId } = await parseAsync(zod.object({ schoolId: zod.coerce.number() }), ctx.req.query());

  return ctx.json(
    createResponse({
      data: await prisma.teacher.findMany({ where: { schoolId: schoolId } }),
    }),
  );
});

/**
 * @route POST "/api/teacher/create"
 * @desc  create teacher
 */
teacher.post("/teacher/create", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      schoolId: zod.coerce.number(),
      name: zod.string(),
      email: zod.string(),
      contact: zod.string(),
    }),
    await ctx.req.json(),
  );

  const school = await prisma.school.findFirst({ where: { id: body.schoolId } });
  if (!school) {
    return ctx.json(createResponse({ msg: "unable to find school", code: 500 }), 500);
  }

  const teacher = await prisma.teacher.findFirst({
    where: { OR: [{ email: body.email }, { contact: body.contact }] },
  });
  if (teacher) {
    return ctx.json(createResponse({ msg: "Email or Contact already exists", code: 500 }), 500);
  }

  await prisma.teacher.create({ data: body });
  return ctx.json(
    createResponse({
      msg: "teacher successfully created",
    }),
  );
});

/**
 * @route DELETE "/api/teacher/:teacherId/remove"
 * @desc  remove teacher
 */
teacher.delete("/teacher/:teacherId/remove", async (ctx) => {
  const params = await parseAsync(
    zod.object({
      teacherId: zod.coerce.number(),
    }),
    ctx.req.param(),
  );

  await prisma.teacher.delete({ where: { id: params.teacherId } });
  return ctx.json(
    createResponse({
      msg: "teacher successfully created",
    }),
  );
});

export type TeacherApiType = typeof teacher;
export default teacher;
