import Graceful from "@ladjs/graceful";
import chalk from "chalk";

import { config } from "project/utils/utils.js";
import { buildServer } from "project/app/app.js";
import { prisma } from "project/database/db.connection.js";

/**
 * Connect To DB
 */
await prisma.$connect();
console.log(chalk.bgMagentaBright("Connected to database 🚀"));

/**
 * Build Server
 */
const server = buildServer();

/**
 * Server Listen
 */
await server.listen({ port: config.server.port, host: config.server.host });

/**
 * Graceful Listen
 */
const graceful = new Graceful({
  servers: [server],
  customHandlers: [
    async () => {
      await prisma.$disconnect();
    },
  ],
});
graceful.listen();

console.log(chalk.bgGreen(`Api running on: http://${config.server.host}:${config.server.port}`));
console.log(chalk.bgCyan(`enviroment: ${process.env.NODE_ENV}`));
