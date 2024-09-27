import type { FastifyPluginAsync } from "fastify";
import { notesRoutes } from "./notes.js";
import { attendenceRoutes } from "./attendence.js";

export const erpRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.register(notesRoutes);
    fastify.register(attendenceRoutes);
};
