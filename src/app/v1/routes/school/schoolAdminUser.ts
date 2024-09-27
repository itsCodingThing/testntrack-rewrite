import type { FastifyPluginAsync } from "fastify";

import { prisma } from "project/database/db.connection.js";
import { encryptPassword } from "project/utils/encrypt.js";
import { parseAsync, zod } from "project/utils/validation.js";
import { sendErrorResponse, sendSuccessResponse } from "project/utils/serverResponse.js";

export const schoolAdminUserRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * @rotue   GET "/api/v1/school/admin/:schoolAdminId/details"
   * @desc    Get admin details
   */
  fastify.route({
    method: "GET",
    url: "/school/admin/:schoolAdminId",
    handler: async (req, res) => {
      const params = await parseAsync(zod.object({ schooldAdminId: zod.coerce.number() }), req.params);
      const details = await prisma.schoolAdminUser.findMany({ where: { schoolId: params.schooldAdminId } });

      if (!details) {
        return sendErrorResponse({ msg: "User does not exists", code: 404, response: res });
      }

      return sendSuccessResponse({ data: details, response: res });
    },
  });

  /**
   * @rotue   GET "/api/v1/school/:schoolId/admins"
   * @desc    Get all admin list
   */
  fastify.route({
    method: "GET",
    url: "/school/:schoolId/admins",
    handler: async (req, res) => {
      const params = await parseAsync(zod.object({ schoolId: zod.coerce.number() }), req.params);
      const list = await prisma.schoolAdminUser.findMany({ where: { schoolId: params.schoolId } });

      return sendSuccessResponse({ data: list, response: res });
    },
  });

  /**
   * @rotue   POST "/api/v1/school/admin/create"
   * @desc    Add admin in school
   */
  fastify.route({
    method: "POST",
    url: "/school/admin/create",
    handler: async (req, res) => {
      const body = await parseAsync(
        zod.object({
          schoolId: zod.coerce.number(),
          email: zod.string(),
          password: zod.string(),
          name: zod.string(),
          contact: zod.string(),
        }),
        req.body
      );

      const exists = await prisma.schoolAdminUser.findFirst({
        where: { OR: [{ email: body.email }, { contact: body.contact }] },
      });
      if (exists) {
        return sendErrorResponse({
          code: 400,
          msg: "Email already register with us",
          response: res,
        });
      }

      const user = await prisma.schoolAdminUser.create({
        data: {
          schoolId: body.schoolId,
          name: body.name,
          email: body.email,
          contact: body.contact,
          password: encryptPassword(body.password),
        },
        select: {
          name: true,
          email: true,
        },
      });

      return sendSuccessResponse({ data: user, response: res });
    },
  });

  /**
   * @rotue   DELETE "/api/v1/school/:schoolId/admin/:schoolAdminId"
   * @desc    remove school admin
   */
  fastify.route({
    method: "DELETE",
    url: "/school/:schoolId/admin/:schoolAdminId/remove",
    handler: async (req, res) => {
      const body = await parseAsync(
        zod.object({ schoolId: zod.coerce.number(), schoolAdminId: zod.coerce.number() }),
        req.params
      );

      await prisma.schoolAdminUser.delete({ where: { schoolId: body.schoolId, id: body.schoolAdminId } });

      return sendSuccessResponse({ response: res });
    },
  });
};
