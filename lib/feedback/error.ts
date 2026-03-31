import { NamedError } from "@/lib/error";
import * as z from "zod";

export const FeedbackError = NamedError.create(
    "FeedbackError",
    z.object({
        message: z.string(),
        operation: z.string(),
    })
);
