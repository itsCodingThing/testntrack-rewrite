import { Hono } from "hono";
import { parseAsync, zod } from "project/utils/validation";
import { prisma } from "project/database/db.connection";
import { createResponse } from "project/utils/serverResponse";

const student = new Hono();

/**
 * @route GET "/api/student/:studentId"
 * @desc  Get student details
 */
student.get("/student/:studentId", async (ctx) => {
  const params = await parseAsync(zod.object({ stduentId: zod.coerce.number() }), ctx.req.param());
  const student = await prisma.student.findFirst({ where: { id: params.stduentId } });

  return ctx.json(createResponse({ data: student }));
});

/**
 * @rotue   GET "/api/student?schoolId"
 * @desc    get all students in school
 */
student.get("/student", async (ctx) => {
  const query = await parseAsync(
    zod.object({ schoolId: zod.coerce.number(), batchId: zod.coerce.number().optional() }),
    ctx.req.query(),
  );

  return ctx.json(
    createResponse({
      data: await prisma.student.findMany({ where: { schoolId: query.schoolId } }),
    }),
  );
});

/**
 * @rotue   POST "/api/student/create"
 * @desc    create students
 */
student.post("/student/create", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      schoolId: zod.coerce.number(),
      batchId: zod.coerce.number().optional(),
      students: zod
        .array(zod.object({ name: zod.string(), contact: zod.string(), email: zod.string(), address: zod.string() }))
        .min(1)
        .max(30),
    }),
    await ctx.req.json(),
  );

  const data = body.students.map((student) => ({ schoolId: body.schoolId, ...student }));
  await prisma.student.createMany({ data });

  return ctx.json(createResponse({ msg: "student added successfully" }));
});

/**
 * @rotue   PUT "/api/student/details"
 * @desc    Update student profile
 */
student.put("/student/details", async (ctx) => {
  const { studentId, ...update } = await parseAsync(
    zod.object({
      studentId: zod.coerce.number(),
      name: zod.string(),
      dob: zod.string(),
      email: zod.string(),
      contact: zod.string(),
      address: zod.string(),
      image: zod.string(),
    }),
    await ctx.req.json(),
  );

  await prisma.student.update({ where: { id: studentId }, data: update });
  return ctx.json(createResponse({ msg: "student profile update successfull" }));
});

/**
 * @rotue   DELETE "/api/student/:studentId/remove"
 * @desc    Remove student
 */
student.delete("/student/:studentId/remove", async (ctx) => {
  const params = await parseAsync(zod.object({ studentId: zod.coerce.number() }), ctx.req.query());
  await prisma.student.delete({ where: { id: params.studentId } });

  return ctx.json(createResponse({ msg: "delete successfully" }));
});

export type StudentApiType = typeof student;
export default student;
