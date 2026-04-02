import { cn } from "@/lib/utils";
import type * as React from "react";

const presets = {
    attention: {
        backgroundColor: "var(--accent)",
        color: "var(--accent-foreground)",
    },
    default: {
        backgroundColor: "var(--muted)",
        color: "var(--muted-foreground)",
    },
    error: {
        backgroundColor: "var(--destructive)",
        color: "var(--destructive-foreground)",
    },
    warning: {
        backgroundColor: "var(--warning)",
        color: "var(--warning-foreground)",
    },
} as const;

const Marker = ({
    className,
    ...props
}: React.ComponentProps<"div"> & {
    preset?: keyof typeof presets;
}) => (
    <div
        {...props}
        className={cn(
            "relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
            className
        )}
        style={{
            backgroundColor: presets[props.preset ?? "default"].backgroundColor,
            color: presets[props.preset ?? "default"].color,
            ...props.style,
        }}
    />
);

export { Marker };
