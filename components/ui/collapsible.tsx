import { cn } from "@/lib/utils";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import type React from "react";

export function Collapsible({
    className,
    ...props
}: CollapsiblePrimitive.Root.Props): React.ReactElement {
    return (
        <CollapsiblePrimitive.Root
            className={cn("flex flex-col gap-3", className)}
            data-slot="collapsible"
            {...props}
        />
    );
}

export function CollapsibleTrigger({
    className,
    ...props
}: CollapsiblePrimitive.Trigger.Props): React.ReactElement {
    return (
        <CollapsiblePrimitive.Trigger
            className={cn("group w-full cursor-pointer", className)}
            data-slot="collapsible-trigger"
            {...props}
        />
    );
}

export function CollapsiblePanel({
    className,
    ...props
}: CollapsiblePrimitive.Panel.Props): React.ReactElement {
    return (
        <CollapsiblePrimitive.Panel
            className={cn(
                "flex h-(--collapsible-panel-height) flex-col gap-1 overflow-hidden opacity-100 transition-[height,opacity,translate] will-change-[height,opacity,translate] data-ending-style:h-0 data-starting-style:h-0 data-ending-style:-translate-y-1 data-starting-style:-translate-y-1.5 data-ending-style:opacity-0 data-starting-style:opacity-0 data-closed:duration-360 data-open:duration-500 data-closed:ease-[cubic-bezier(0.4,0,0.2,1)] data-open:ease-[cubic-bezier(0.22,1.18,0.3,1)]",
                className
            )}
            data-slot="collapsible-panel"
            {...props}
        />
    );
}
