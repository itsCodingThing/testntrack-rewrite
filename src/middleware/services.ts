import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import * as services from "../services/index.js";

const pluginAsync: FastifyPluginAsync = async (fastify) => {
    fastify.decorate("Services", services);
};

export default fp(pluginAsync, { name: "services" });
