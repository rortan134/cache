import { cn } from "@/lib/cn";
import type * as React from "react";

const ApplicationShell = ({
    className,
    as: Comp = "main",
    ...props
}: React.ComponentProps<"main"> & { as?: React.ElementType }) => (
    <div
        className="relative isolate mx-3 w-full flex-1 overflow-hidden rounded-xl bg-white"
        style={{
            boxShadow:
                "lch(0 0 0 / 0.022) 0px 3px 6px -2px, lch(0 0 0 / 0.044) 0px 1px 1px",
        }}
    >
        <Comp
            {...props}
            className={cn(
                "root relative z-0 mx-auto flex size-full max-w-(--breakpoint-xl) flex-col justify-between outline-none [-webkit-user-drag:none] focus-visible:ring-2 focus-visible:ring-ring/50 lg:flex-row xl:w-[87.5%] 2xl:max-w-(--breakpoint-2xl)",
                className
            )}
            id="main"
            tabIndex={-1}
        />
    </div>
);

const PageShell = ({
    className,
    as: Comp = "main",
    ...props
}: React.ComponentProps<"main"> & { as?: React.ElementType }) => (
    <Comp
        {...props}
        className={cn(
            "relative isolate z-0 mx-auto flex size-full max-w-(--breakpoint-xl) flex-col justify-between gap-12 px-3 outline-hidden [-webkit-user-drag:none] focus-visible:outline-hidden sm:px-6 md:flex-col md:gap-3 lg:flex-col lg:gap-6 xl:gap-24 2xl:max-w-(--breakpoint-2xl)",
            className
        )}
        tabIndex={-1}
    />
);

export { ApplicationShell, PageShell };
