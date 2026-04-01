import * as z from "zod";

export const FeedbackInputSchema = z.object({
    message: z.string().trim().min(1).max(1000),
    pagePath: z.string().trim().min(1).max(512),
});

export interface FeedbackActionState {
    message: string;
    status: "error" | "idle" | "success";
}
