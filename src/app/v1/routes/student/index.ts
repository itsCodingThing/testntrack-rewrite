import type { FastifyPluginAsync } from "fastify";

import { sendSuccessResponse } from "project/utils/serverResponse.js";
import { parseAsync, zod } from "project/utils/validation.js";
import { prisma } from "project/database/db.connection.js";

export const studentRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * @route GET "/student/:studentId"
   * @desc  Get student details
   */
  fastify.route({
    method: "GET",
    url: "/student/:studentId",
    handler: async (req, res) => {
      const params = await parseAsync(zod.object({ stduentId: zod.coerce.number() }), req.params);
      const student = await prisma.student.findFirst({ where: { id: params.stduentId } });

      return sendSuccessResponse({ data: student, response: res });
    },
  });

  /**
   * @rotue   GET "/api/v1/student?schoolId"
   * @desc    get all students in school
   */
  fastify.route({
    method: "GET",
    url: "/student",
    handler: async (req, res) => {
      const query = await parseAsync(
        zod.object({ schoolId: zod.coerce.number(), batchId: zod.coerce.number().optional() }),
        req.query
      );

      return sendSuccessResponse({
        response: res,
        data: await prisma.student.findMany({ where: { schoolId: query.schoolId } }),
      });
    },
  });

  /**
   * @rotue   POST "/api/v1/student/create"
   * @desc    create students
   */
  fastify.route({
    method: "POST",
    url: "/student/create",
    handler: async (req, res) => {
      const body = await parseAsync(
        zod.object({
          schoolId: zod.coerce.number(),
          batchId: zod.coerce.number().optional(),
          students: zod
            .array(
              zod.object({ name: zod.string(), contact: zod.string(), email: zod.string(), address: zod.string() })
            )
            .min(1)
            .max(30),
        }),
        req.body
      );

      const data = body.students.map((student) => ({ schoolId: body.schoolId, ...student }));
      await prisma.student.createMany({ data });

      return sendSuccessResponse({ response: res, msg: "student added successfully" });
    },
  });

  /**
   * @rotue   PUT "/api/v1/student/details"
   * @desc    Update student profile
   */
  fastify.route({
    method: "PUT",
    url: "/student/details",
    handler: async (req, res) => {
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
        req.body
      );

      await prisma.student.update({ where: { id: studentId }, data: update });
      return sendSuccessResponse({ response: res, msg: "student profile update successfull" });
    },
  });

  /**
   * @rotue   DELETE "/api/v1/student/:studentId/remove"
   * @desc    Remove student
   */
  fastify.route({
    method: "DELETE",
    url: "/student/:studentId/remove",
    handler: async (req, res) => {
      const params = await parseAsync(zod.object({ studentId: zod.coerce.number() }), req.params);
      await prisma.student.delete({ where: { id: params.studentId } });

      return sendSuccessResponse({ response: res });
    },
  });
};
