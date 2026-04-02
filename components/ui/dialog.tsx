"use client";

import { cn } from "@/lib/utils";
import { Dialog as DialogParts } from "@base-ui/react/dialog";
import type * as React from "react";

export const DialogCreateHandle: typeof DialogParts.createHandle =
    DialogParts.createHandle;

export const Dialog: typeof DialogParts.Root = DialogParts.Root;

export const DialogPortal: typeof DialogParts.Portal = DialogParts.Portal;

export function DialogTrigger(
    props: DialogParts.Trigger.Props
): React.ReactElement {
    return <DialogParts.Trigger data-slot="dialog-trigger" {...props} />;
}

export function DialogBackdrop({
    className,
    ...props
}: DialogParts.Backdrop.Props): React.ReactElement {
    return (
        <DialogParts.Backdrop
            className={cn(
                "fixed inset-0 z-50 bg-black/32 backdrop-blur-[2px] transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0",
                className
            )}
            data-slot="dialog-backdrop"
            {...props}
        />
    );
}

export function DialogViewport({
    className,
    ...props
}: DialogParts.Viewport.Props): React.ReactElement {
    return (
        <DialogParts.Viewport
            className={cn("fixed inset-0 z-50 grid p-4 sm:p-6", className)}
            data-slot="dialog-viewport"
            {...props}
        />
    );
}

export function DialogPopup({
    className,
    ...props
}: DialogParts.Popup.Props): React.ReactElement {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogViewport>
                <DialogParts.Popup
                    className={cn(
                        "relative row-start-2 mx-auto flex max-h-full min-h-0 w-full min-w-0 max-w-lg flex-col rounded-2xl border bg-popover not-dark:bg-clip-padding text-popover-foreground shadow-lg/8 outline-none transition-[scale,opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-2xl)-1px)] before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:translate-y-2 data-starting-style:translate-y-2 data-ending-style:scale-98 data-starting-style:scale-98 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:before:shadow-[0_-1px_--theme(--color-white/6%)]",
                        className
                    )}
                    data-slot="dialog-popup"
                    {...props}
                />
            </DialogViewport>
        </DialogPortal>
    );
}

export function DialogHeader({
    className,
    ...props
}: React.ComponentProps<"div">): React.ReactElement {
    return (
        <div
            className={cn("flex flex-col gap-2 px-6 pt-6", className)}
            data-slot="dialog-header"
            {...props}
        />
    );
}

export function DialogPanel({
    className,
    ...props
}: React.ComponentProps<"div">): React.ReactElement {
    return (
        <div
            className={cn("min-h-0 flex-1 px-6 py-4", className)}
            data-slot="dialog-panel"
            {...props}
        />
    );
}

export function DialogFooter({
    className,
    ...props
}: React.ComponentProps<"div">): React.ReactElement {
    return (
        <div
            className={cn(
                "flex items-center justify-end gap-2 border-border/70 border-t px-6 py-4",
                className
            )}
            data-slot="dialog-footer"
            {...props}
        />
    );
}

export function DialogTitle({
    className,
    ...props
}: DialogParts.Title.Props): React.ReactElement {
    return (
        <DialogParts.Title
            className={cn("font-semibold text-lg leading-none", className)}
            data-slot="dialog-title"
            {...props}
        />
    );
}

export function DialogDescription({
    className,
    ...props
}: DialogParts.Description.Props): React.ReactElement {
    return (
        <DialogParts.Description
            className={cn("text-muted-foreground text-sm", className)}
            data-slot="dialog-description"
            {...props}
        />
    );
}

export function DialogClose(
    props: DialogParts.Close.Props
): React.ReactElement {
    return <DialogParts.Close data-slot="dialog-close" {...props} />;
}
