import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^[\d\s\-\(\)\+]+$/,
    "Please enter a valid phone number"
  )
  .min(10, "Phone number must be at least 10 digits");

export const amountSchema = z.coerce
  .number({
    required_error: "Amount is required",
    invalid_type_error: "Please enter a valid number",
  })
  .positive("Amount must be greater than 0")
  .finite("Please enter a valid amount");

export const requiredStringSchema = z
  .string()
  .min(1, "This field is required")
  .trim();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code");

export const dateNotFutureSchema = z.date().refine(
  (date) => date <= new Date(),
  "Date cannot be in the future"
);

export const urlSchema = z.string().url("Please enter a valid URL").optional().or(z.literal(""));

// Utility function to handle form errors
export function getFieldError(
  errors: any,
  fieldName: string
): string | undefined {
  return errors[fieldName]?.message;
}

// Utility to validate field on blur
export function createBlurHandler(trigger: (field: string) => void, field: string) {
  return () => trigger(field);
}
