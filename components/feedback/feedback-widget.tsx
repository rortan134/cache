"use client";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { createFeedback } from "@/lib/feedback/actions";
import type { FeedbackActionState } from "@/lib/feedback/schema";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useHotkeys } from "react-hotkeys-hook";

const initialFeedbackActionState: FeedbackActionState = {
    message: "",
    status: "idle",
} satisfies FeedbackActionState;

export function FeedbackWidget(): React.ReactElement {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [state, formAction] = useActionState(
        createFeedback,
        initialFeedbackActionState
    );
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.status !== "success") {
            return;
        }

        formRef.current?.reset();
        setOpen(false);
    }, [state.status]);

    useHotkeys("F", () => {
        setOpen((prev) => !prev);
    });

    return (
        <div className="pointer-events-none fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
            <Popover onOpenChange={setOpen} open={open}>
                <PopoverTrigger
                    render={
                        <Button
                            className="pointer-events-auto rounded-full border-border/80 bg-background/95 pr-2 pl-4 shadow-black/5 shadow-lg backdrop-blur"
                            size="sm"
                            type="button"
                            variant="outline"
                        />
                    }
                >
                    <span className="font-medium text-sm">Feedback</span>
                    <Kbd>F</Kbd>
                </PopoverTrigger>
                <PopoverPopup
                    align="end"
                    className="w-[min(calc(100vw-2rem),24rem)] rounded-[1.6rem]"
                    sideOffset={10}
                >
                    <div className="space-y-4">
                        <form
                            action={formAction}
                            className="space-y-4"
                            ref={formRef}
                        >
                            <input
                                name="pagePath"
                                type="hidden"
                                value={pathname}
                            />
                            <label
                                className="sr-only"
                                htmlFor="feedback-message"
                            >
                                Feedback message
                            </label>
                            <Textarea
                                aria-describedby={
                                    state.status === "idle"
                                        ? undefined
                                        : "feedback-status"
                                }
                                id="feedback-message"
                                name="message"
                                placeholder="Have an idea to improve this page? Tell the Cache team"
                                required
                            />
                            <div className="flex items-center justify-between gap-3">
                                <p
                                    className={cn(
                                        "min-h-5 text-xs",
                                        state.status === "error"
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                    )}
                                    id="feedback-status"
                                    role={
                                        state.status === "idle"
                                            ? undefined
                                            : "status"
                                    }
                                >
                                    {state.message}
                                </p>
                                <SubmitButton />
                            </div>
                        </form>
                    </div>
                </PopoverPopup>
            </Popover>
        </div>
    );
}

function SubmitButton(): React.ReactElement {
    const { pending } = useFormStatus();

    return (
        <Button loading={pending} size="sm" type="submit">
            {!pending && <Send aria-hidden className="size-4" />}
            Send
        </Button>
    );
}
