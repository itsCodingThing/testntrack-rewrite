/* eslint-disable @typescript-eslint/no-unused-vars */
const requiredServerEnvs = ["NODE_ENV"] as const;
type RequiredServerEnvKeys = (typeof requiredServerEnvs)[number];

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends Record<RequiredServerEnvKeys, string> {}
  }
}
