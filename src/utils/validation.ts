import { ValidationError } from "project/utils/error.js";
import * as Yup from "yup";
import { Schema, ValidationError as YupValidationError, type ValidateOptions } from "yup";
import { z, ZodError } from "zod";

export const yup = Yup;
export async function validate<T>(schema: Schema<T>, value: unknown, options?: ValidateOptions) {
  try {
    return await schema.validate(value, { stripUnknown: true, abortEarly: false, ...options });
  } catch (error) {
    if (error instanceof YupValidationError) {
      throw new ValidationError({ data: error.errors });
    } else {
      throw new ValidationError();
    }
  }
}

export const zod = z;
export async function parseAsync<TSchema extends z.ZodTypeAny>(schema: TSchema, value: unknown) {
  try {
    const safeValues = await schema.parseAsync(value);
    return safeValues as z.infer<TSchema>;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError({ data: error.issues });
    } else {
      throw new ValidationError();
    }
  }
}
