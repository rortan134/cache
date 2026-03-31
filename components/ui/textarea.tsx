"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps =
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        size?: "default" | "lg" | "sm";
    };

export function Textarea({
    className,
    size = "default",
    ...props
}: TextareaProps): React.ReactElement {
    return (
        <span
            className={cn(
                "relative inline-flex w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-within:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-within:border-ring has-disabled:opacity-64 has-focus-within:ring-[3px] has-focus-within:ring-ring/24 sm:text-sm dark:bg-input/32 dark:not-has-disabled:not-has-focus-within:before:shadow-[0_-1px_--theme(--color-white/6%)]",
                className
            )}
            data-size={size}
            data-slot="textarea-control"
        >
            <textarea
                className={cn(
                    "min-h-28 w-full resize-none rounded-[inherit] bg-transparent px-[calc(--spacing(3)-1px)] py-[calc(--spacing(2.5)-1px)] outline-none placeholder:text-muted-foreground/72",
                    size === "sm" && "min-h-24 px-[calc(--spacing(2.5)-1px)]",
                    size === "lg" && "min-h-32 px-[calc(--spacing(3.5)-1px)]"
                )}
                data-slot="textarea"
                {...props}
            />
        </span>
    );
}
