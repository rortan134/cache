"use client";

import {
    createFeedback,
    initialFeedbackActionState,
} from "@/app/[locale]/feedback/actions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export function FeedbackWidgetClient(): React.ReactElement {
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
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[11px] text-muted-foreground">
                        F
                    </span>
                </PopoverTrigger>
                <PopoverPopup
                    align="end"
                    className="w-[min(calc(100vw-2rem),24rem)] rounded-[1.6rem] p-0"
                    sideOffset={10}
                >
                    <div className="space-y-4 p-4">
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
