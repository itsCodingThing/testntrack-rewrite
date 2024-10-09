import type { FastifyPluginAsync } from "fastify";

import { prisma } from "project/database/db.connection.js";
import { parseAsync, zod } from "project/utils/validation.js";
import { schoolAdminUserRoutes } from "./schoolAdminUser.js";
import { sendErrorResponse, sendSuccessResponse } from "project/utils/serverResponse.js";
import { encryptPassword } from "project/utils/encrypt.js";

export const schoolRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(schoolAdminUserRoutes);

  /**
   * @route   GET "/api/v1/schools"
   * @desc    List school by admin
   */
  fastify.route({
    method: "GET",
    url: "/schools",
    handler: async (_req, res) => {
      return sendSuccessResponse({ response: res, data: await prisma.school.findMany() });
    },
  });

  /**
   * @route   POST "/api/v1/school/create"
   * @desc    Create school by admin
   */
  fastify.route({
    method: "POST",
    url: "/school/create",
    handler: async (req, res) => {
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
        req.body
      );

      // check if school exists with email or code
      const school = await prisma.school.findFirst({
        select: { id: true, name: true },
        where: { OR: [{ email: body.email }, { code: body.code }] },
      });
      if (school) {
        return sendErrorResponse({
          code: 400,
          msg: "Email or Code already register with us",
          response: res,
        });
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

      return sendSuccessResponse({
        response: res,
        data: "created successfully",
      });
    },
  });

  /**
   * @route   PUT "/api/v1/school/update"
   * @desc    Update school by admin
   */
  fastify.route({
    method: "PUT",
    url: "/school/update",
    handler: async (req, res) => {
      const body = await parseAsync(
        zod.object({
          id: zod.coerce.number(),
          name: zod.string().optional(),
          address: zod.string().optional(),
          email: zod.string().optional(),
          image: zod.string().optional(),
          contact: zod.string().optional(),
        }),
        req.body
      );
      const { id, ...update } = body;

      if (body.email || body.contact) {
        const exists = await prisma.school.findFirst({
          where: { id: { not: id }, OR: [{ email: body.email }, { contact: body.contact }] },
        });

        if (exists) {
          return sendErrorResponse({ response: res, msg: "Email or Contact already exists" });
        }
      }

      await prisma.school.update({
        where: { id: id },
        data: update,
      });

      return sendSuccessResponse({
        response: res,
        msg: "school details updated successfully",
      });
    },
  });

  /**
   * @route   DELETE "/api/v1/school/:schoolId/remove"
   * @desc    Remove school by admin
   */
  fastify.route({
    method: "DELETE",
    url: "/school/:schoolId/remove",
    handler: async (req, res) => {
      const { schoolId } = await parseAsync(zod.object({ schoolId: zod.coerce.number() }), req.params);
      await prisma.schoolAdminUser.deleteMany({ where: { schoolId: schoolId } });
      await prisma.schoolDetails.deleteMany({ where: { schoolId: schoolId } });
      await prisma.school.delete({ where: { id: schoolId } });

      return sendSuccessResponse({ response: res, msg: "school removed successfully" });
    },
  });
};
