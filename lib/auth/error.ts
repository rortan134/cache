import { NamedError } from "@/lib/error";
import * as z from "zod";

export const AccountError = NamedError.create(
    "AccountError",
    z.object({
        cause: z
            .union([z.instanceof(Error), z.instanceof(NamedError), z.any()])
            .optional(),
        message: z.string(),
        operation: z.string(),
    })
);
