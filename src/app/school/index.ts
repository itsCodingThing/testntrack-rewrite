import { Hono } from "hono";
import { prisma } from "project/database/db.connection";
import { parseAsync, zod } from "project/utils/validation";
import { encryptPassword } from "project/utils/encrypt";
import { createResponse } from "project/utils/serverResponse";

const school = new Hono();

/**
 * @route   GET "/api/school"
 * @desc    List school by admin
 */
school.get("/school", async (ctx) => {
  return ctx.json(createResponse({ data: await prisma.school.findMany() }));
});

/**
 * @route   POST "/api/school/create"
 * @desc    Create school by admin
 */
school.post("/school/create", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      name: zod.string().min(1, "Please enter name"),
      email: zod.string().email("Please enter a valid email"),
      contact: zod.string().length(10, "Please enter a valid contact"),
      address: zod.string().min(1, "Please enter a valid address").optional(),
      image: zod.string().optional(),
      code: zod.string().min(3, "Code must be atleast 3 digit long"),
      type: zod.string().min(1, "Please enter a valid type"),
      password: zod.string().min(8, "Password must be 8 charactor long"),
    }),
    await ctx.req.json(),
  );

  // check if school exists with email or code
  const school = await prisma.school.findFirst({
    select: { id: true, name: true },
    where: { OR: [{ email: body.email }, { code: body.code }] },
  });
  if (school) {
    return ctx.json(
      createResponse({
        code: 400,
        msg: "Email or Code already register with us",
      }),
      400,
    );
  }

  // create school with given info
  await prisma.school.create({
    data: {
      name: body.name,
      email: body.email,
      contact: body.contact,
      code: body.code,
      type: body.type,
      schoolAdminUser: {
        create: {
          name: body.name,
          email: body.email,
          password: encryptPassword(body.password),
          contact: body.contact,
        },
      },
      schoolDetails: {
        create: {},
      },
    },
  });

  return ctx.json(
    createResponse({
      data: "created successfully",
    }),
  );
});

/**
 * @route   PUT "/api/school/update"
 * @desc    Update school by admin
 */
school.put("/school/update", async (ctx) => {
  const body = await parseAsync(
    zod.object({
      id: zod.coerce.number(),
      name: zod.string().optional(),
      address: zod.string().optional(),
      email: zod.string().optional(),
      image: zod.string().optional(),
      contact: zod.string().optional(),
    }),
    await ctx.req.json(),
  );
  const { id, ...update } = body;

  if (body.email || body.contact) {
    const exists = await prisma.school.findFirst({
      where: { id: { not: id }, OR: [{ email: body.email }, { contact: body.contact }] },
    });

    if (exists) {
      return ctx.json(createResponse({ msg: "Email or Contact already exists" }), 400);
    }
  }

  await prisma.school.update({
    where: { id: id },
    data: update,
  });

  return ctx.json(
    createResponse({
      msg: "school details updated successfully",
    }),
  );
});

/**
 * @route   DELETE "/api/v1/school/:schoolId/remove"
 * @desc    Remove school by admin
 */
school.delete("/school/:schoolId/remove", async (ctx) => {
  const { schoolId } = await parseAsync(zod.object({ schoolId: zod.coerce.number() }), ctx.req.param());
  await prisma.schoolAdminUser.deleteMany({ where: { schoolId: schoolId } });
  await prisma.schoolDetails.deleteMany({ where: { schoolId: schoolId } });
  await prisma.school.delete({ where: { id: schoolId } });

  return ctx.json(createResponse({ msg: "school removed successfully" }));
});

export type SchoolApiType = typeof school;
export default school;
