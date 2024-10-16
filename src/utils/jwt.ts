import * as jose from "jose";
import { config } from "./utils";

const { jwt } = config;
const secret = new TextEncoder().encode(jwt.publicKey);

interface IPayload {
  id: string;
}

export async function generateJWT(payload: IPayload) {
  const sign = new jose.SignJWT({ id: payload.id });

  const token = await sign.setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
  return token;
}

export async function verifyJWT(token: string) {
  const payload = await jose.jwtVerify(token, secret);
  return payload;
}
