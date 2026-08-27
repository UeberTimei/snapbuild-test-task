import { z } from "zod";

export const ErrorBody = z.object({
  message: z.string().optional(),
  issues: z.array(z.string()).optional(),
});
export type ErrorBody = z.infer<typeof ErrorBody>;
