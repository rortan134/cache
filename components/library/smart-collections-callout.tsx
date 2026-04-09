"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsiblePanel } from "@/components/ui/collapsible";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { Group, Info, Sparkles } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";

export function SmartCollectionsCallout(): ReactElement {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Collapsible onOpenChange={setIsOpen} open={isOpen}>
            <CollapsiblePanel>
                <div className="flex flex-col items-center justify-center gap-1 p-2">
                    <div className="flex -space-x-3">
                        <Avatar className="bg-muted/50">
                            <Sparkles className="inline-block size-4.5 shrink-0" />
                        </Avatar>
                        <Avatar className="border-2 border-white bg-muted">
                            <Info className="inline-block size-4.5 shrink-0" />
                        </Avatar>
                        <Avatar className="-z-1 bg-muted/50">
                            <Group className="inline-block size-4.5 shrink-0" />
                        </Avatar>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-xs">
                            <Popover>
                                <PopoverTrigger
                                    className="underline decoration-1 decoration-dotted underline-offset-2"
                                    openOnHover
                                >
                                    Smart Collections
                                </PopoverTrigger>
                                <PopoverPopup align="start" tooltipStyle>
                                    <div className="flex gap-2">
                                        <Info className="mt-0.5 inline-block size-4 shrink-0" />
                                        <div className="flex flex-col gap-2">
                                            <p className="text-foreground">
                                                Organize better by automatically
                                                grouping related entries
                                                contextually with AI.
                                            </p>
                                            <Button
                                                className="mt-2 ml-auto"
                                                size="xs"
                                                variant="destructive-outline"
                                            >
                                                Disable
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverPopup>
                            </Popover>{" "}
                            is active
                        </span>
                        <Button
                            onClick={() => setIsOpen(false)}
                            size="xs"
                            type="button"
                            variant="ghost"
                        >
                            Dismiss
                        </Button>
                    </div>
                </div>
            </CollapsiblePanel>
        </Collapsible>
    );
}
