import type { FastifyPluginAsync } from "fastify";
import { profileRoutes } from "./profile.js";
import { studentRoutes } from "./student.js";
import { loginRegisterRoutes } from "./loginRegister.js";

export const parentRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.register(profileRoutes);
    fastify.register(studentRoutes);
    fastify.register(loginRegisterRoutes);
};
