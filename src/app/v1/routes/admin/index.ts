import type { FastifyPluginAsync } from "fastify";

import { adminUserRoutes } from "./adminUser.js";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // fastify.register(adminOTPROutes);
  fastify.register(adminUserRoutes);
  // fastify.register(adminPaperRoutes);
  // fastify.register(adminEvaluatorRoutes);
  // fastify.register(adminMarketplaceCopiesRoutes);
};
