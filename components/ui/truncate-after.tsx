"use client";

import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as React from "react";

interface TruncateAfterProps {
    after?: number;
    children: React.ReactNode;
    className?: string;
}

const TruncateAfter = ({
    after = 5,
    children,
    className,
}: TruncateAfterProps) => {
    const count = React.Children.count(children);

    if (count === 0) {
        return null;
    }

    const displayed: React.ReactNode[] = [];
    const remaining: React.ReactNode[] = [];

    React.Children.map(children, (child, index) => {
        if (index < after) {
            displayed.push(child);
        } else {
            remaining.push(child);
        }
    });

    const numTruncated = remaining.length;

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {displayed}
            {numTruncated > 0 && (
                <Popover>
                    <PopoverTrigger
                        render={
                            <Badge
                                className="cursor-pointer tabular-nums"
                                render={<button type="button" />}
                                variant="outline"
                            />
                        }
                    >
                        +{numTruncated}
                    </PopoverTrigger>
                    <PopoverContent
                        align="end"
                        className="w-auto p-2"
                        side="top"
                    >
                        <div className="flex flex-col gap-2">{remaining}</div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
};

export { TruncateAfter };
