import pino from "pino";

export const logger = pino({
    transport:
        process.env.NODE_ENV === "development"
            ? {
                  targets: [
                      {
                          target: "pino-pretty",
                          level: "info",
                          options: {
                              translateTime: "HH:MM:ss Z",
                              ignore: "pid,hostname",
                          },
                      },
                  ],
              }
            : undefined,
});

export default logger;
