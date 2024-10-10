import type { FastifyPluginAsync } from "fastify";

import { adminRoutes } from "project/app/v1/routes/admin/index.js";
import { authRoutes } from "./routes/other/auth.js";
import { publicRoute, testntrackAuth, noAuth } from "project/middleware/auth.js";
import { schoolRoutes } from "./routes/school/index.js";
import { fileStorageRoutes } from "./routes/other/file.js";
import { teacherRoutes } from "./routes/teacher/index.js";
import { studentRoutes } from "./routes/student/index.js";
import { schoolAdminUserRoutes } from "./routes/school-admin/index.js";

export const tntRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * App request decorator
   */
  fastify.decorateRequest("payload", null);

  /**
   * App prehandler hook
   */
  fastify.addHook("preHandler", fastify.auth([publicRoute, testntrackAuth, noAuth]));

  /**
   * Auth routes
   */
  fastify.register(authRoutes);

  /**
   * Admin routes
   */
  fastify.register(adminRoutes);

  /**
   * School routes
   */
  fastify.register(schoolRoutes);

  /**
   * School routes
   */
  fastify.register(schoolAdminUserRoutes);

  /**
   * Teacher routes
   */
  fastify.register(teacherRoutes);

  /**
   * Student routes
   */
  fastify.register(studentRoutes);

  /**
   * File storage routes
   */
  fastify.register(fileStorageRoutes);
};
