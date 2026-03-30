import { NamedError } from "@/lib/error";
import * as z from "zod";

export const StripeError = NamedError.create(
    "StripeError",
    z.object({
        cause: z
            .union([z.instanceof(Error), z.instanceof(NamedError), z.any()])
            .optional(),
        message: z.string(),
        operation: z.string(),
    }),
);
