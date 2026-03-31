"use server";

import { submitFeedback } from "@/lib/feedback/submit-feedback";
import * as z from "zod";

const feedbackInputSchema = z.object({
    message: z.string().trim().min(1).max(1000),
    pagePath: z.string().trim().min(1).max(512),
});

export interface FeedbackActionState {
    message: string;
    status: "error" | "idle" | "success";
}

export const initialFeedbackActionState: FeedbackActionState = {
    message: "",
    status: "idle",
};

export async function createFeedback(
    _previousState: FeedbackActionState,
    formData: FormData
): Promise<FeedbackActionState> {
    const parsed = feedbackInputSchema.safeParse({
        message: formData.get("message"),
        pagePath: formData.get("pagePath"),
    });

    if (!parsed.success) {
        return {
            message: "Please enter a bit of feedback before sending.",
            status: "error",
        };
    }

    try {
        await submitFeedback(parsed.data);

        return {
            message: "Thanks for the feedback.",
            status: "success",
        };
    } catch {
        return {
            message: "We couldn't save your feedback. Please try again.",
            status: "error",
        };
    }
}
