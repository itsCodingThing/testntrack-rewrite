import type { FastifyPluginAsync } from "fastify";

// import { erpRoutes } from "./routes/erp/index.js";
// import { blogRoutes } from "./routes/blogs/index.js";
import { adminRoutes } from "project/app/v1/routes/admin/index.js";
// import { masterRoutes } from "./routes/master/index.js";
// import { schoolRoutes } from "./routes/school/index.js";
// import { parentRoutes } from "./routes/parent/index.js";
// import { teacherRoutes } from "./routes/teacher/index.js";
// import { studentRoutes } from "./routes/student/index.js";
import { authRoutes } from "./routes/other/auth.js";
// import { evaluatorRoutes } from "./routes/evaluator/index.js";
// import { deviceRoutes } from "./routes/other/device.js";
// import { libraryRoutes } from "./routes/other/library.js";
// import { anaylyticsRoutes } from "./routes/analytics/index.js";
// import { supportRoutes } from "./routes/other/support.js";
// import { fileStorageRoutes } from "./routes/other/file.js";
import { publicRoute, testntrackAuth, noAuth } from "project/middleware/auth.js";
import { schoolRoutes } from "./routes/school/index.js";
import { fileStorageRoutes } from "./routes/other/file.js";
import { teacherRoutes } from "./routes/teacher/index.js";
import { studentRoutes } from "./routes/student/index.js";

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
  //
  // /**
  //  * Library routes
  //  */
  // fastify.register(libraryRoutes);
  //
  // /**
  //  * Master routes
  //  */
  // fastify.register(masterRoutes);

  /**
   * Admin routes
   */
  fastify.register(adminRoutes);

  /**
   * School routes
   */
  fastify.register(schoolRoutes);

  /**
   * Teacher routes
   */
  fastify.register(teacherRoutes);

  /**
   * Student routes
   */
  fastify.register(studentRoutes);

  // /**
  //  * Device routes
  //  */
  // fastify.register(deviceRoutes);
  //
  // /**
  //  * Evaluator routes
  //  */
  // fastify.register(evaluatorRoutes);
  //
  // /**
  //  * Blog Routes
  //  */
  // fastify.register(blogRoutes);
  //
  // /**
  //  * Parent Routes
  //  */
  // fastify.register(parentRoutes);
  //
  // /**
  //  * Anaylytics Routes
  //  */
  // fastify.register(anaylyticsRoutes);
  //
  // /**
  //  * Erp Routes
  //  */
  // fastify.register(erpRoutes);
  //
  // /**
  //  * Support Routes
  //  */
  // fastify.register(supportRoutes);

  /**
   * File storage routes
   */
  fastify.register(fileStorageRoutes);
};
