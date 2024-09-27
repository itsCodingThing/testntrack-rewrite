/* eslint-disable @typescript-eslint/no-unused-vars */
import { JwtVerifyPayload } from "#utils/jwt.js";
import { FastifyRequest, FastifyInstance } from "fastify";
import * as services from "./services/index.js";

declare module "fastify" {
    export interface FastifyRequest {
        payload: JwtVerifyPayload;
    }
}

const requiredServerEnvs = ["NODE_ENV"] as const;
type RequiredServerEnvKeys = (typeof requiredServerEnvs)[number];

declare global {
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ProcessEnv extends Record<RequiredServerEnvKeys, string> {}
    }
}
