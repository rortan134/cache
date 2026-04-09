import { cn } from "@/lib/utils";
import type * as React from "react";

const PageShell = ({
    className,
    as: Comp = "main",
    ...props
}: React.ComponentProps<"main"> & { as?: React.ElementType }) => (
    <Comp
        {...props}
        className={cn(
            "relative isolate z-0 mx-auto flex size-full min-h-screen flex-col leading-snug tracking-tight outline-hidden [-webkit-user-drag:none] focus-visible:outline-hidden",
            className
        )}
        tabIndex={-1}
    />
);

function PageSidebarShell({
    top,
    bottom,
    className,
    children,
    ...props
}: React.ComponentProps<"aside"> & {
    top: React.ReactNode;
    bottom?: React.ReactNode;
}) {
    return (
        <aside
            {...props}
            className={cn(
                "relative flex min-h-full w-full shrink-0 flex-col gap-8 p-8 lg:max-w-[400px] lg:justify-between",
                className
            )}
        >
            <div className="no-scrollbar flex max-h-full min-h-0 w-full flex-col gap-6 overflow-auto lg:sticky lg:top-8">
                {top}
                {children}
            </div>
            <div className="flex w-full flex-col gap-6 lg:sticky lg:bottom-8">
                {bottom}
            </div>
        </aside>
    );
}

export { PageShell, PageSidebarShell };
