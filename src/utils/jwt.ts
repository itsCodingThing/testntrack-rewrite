import jsonwebtoken, { type JwtPayload } from "jsonwebtoken";
import { config } from "./utils.js";

const { jwt } = config;

interface IPayload {
  id: string;
  school?: string;
  type: string;
}

export type JwtVerifyPayload = IPayload & JwtPayload;

export function generateJWT(payload: IPayload) {
  const token = jsonwebtoken.sign(payload, jwt.publicKey, { expiresIn: jwt.expiresIn });
  return token;
}

export function verifyJWT(token: string) {
  const payload = jsonwebtoken.verify(token, jwt.publicKey);
  return payload as JwtVerifyPayload;
}
