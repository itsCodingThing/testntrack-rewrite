import type { FastifyPluginAsync } from "fastify";

import { copiesRoutes } from "./copies.js";
import { profileRoutes } from "./profile.js";
import { loginRegisterRoutes } from "./loginRegister.js";
import { evaluatorReviewRotues } from "./review.js";

export const evaluatorRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.register(loginRegisterRoutes);
    fastify.register(profileRoutes);
    fastify.register(copiesRoutes);
    fastify.register(evaluatorReviewRotues);
};
