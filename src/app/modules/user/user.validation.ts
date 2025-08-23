import { z } from "zod";

export const createUserValidationSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: "Full name is required.",
      invalid_type_error: "Full name must be a string.",
    }),
    email: z
      .string({ required_error: "Email is required." })
      .email("Invalid email address."),
    password: z
      .string({
        required_error: "Password is required.",
        invalid_type_error: "Password must be a string.",
      })
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z
      .string({
        required_error: "Confirm Password is required.",
        invalid_type_error: "Confirm Password must be a string.",
      })
      .min(6, "Confirm Password must be at least 6 characters long."),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // error will appear under confirmPassword
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    gender: z
      .string({ invalid_type_error: "Gender must be a string." })
      .optional(),
    age: z
      .number({ invalid_type_error: "Age must be a number." })
      .optional(),
    height: z
      .number({ invalid_type_error: "Height must be a number." })
      .optional(),
    weight: z
      .number({ invalid_type_error: "Weight must be a number." })
      .optional(),
    level: z
      .string({ invalid_type_error: "Level must be a string." })
      .optional(),
  }),
});

const resendOtpValidationSchema = z.object({
	body: z.object({
		email: z.string().email({ message: "Invalid email address" }),
	}),
});


export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  resendOtpValidationSchema,
};
