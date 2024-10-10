import type { FastifyPluginAsync } from "fastify";

import { adminUserRoutes } from "./adminUser.js";

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(adminUserRoutes);
};
