"use client";

import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsiblePanel,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GradientWaveText } from "@/components/ui/gradient-wave-text";
import {
    Menu,
    MenuItem,
    MenuPopup,
    MenuSeparator,
    MenuSub,
    MenuSubPopup,
    MenuSubTrigger,
    MenuTrigger,
} from "@/components/ui/menu";
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover";
import { getColorFromName } from "@/lib/colors";
import { getSourceLabel } from "@/lib/integrations/supports";
import type { LibraryCollectionSummary } from "@/lib/library/types";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    Component,
    CopyIcon,
    EllipsisIcon,
    ExternalLinkIcon,
    FileSpreadsheetIcon,
    Group,
    Info,
    Sparkles,
    Trash2Icon,
} from "lucide-react";
import type { CSSProperties, ReactElement } from "react";
import { useState } from "react";

function getCollectionButtonStyle(
    name: string,
    isSelected: boolean
): CSSProperties {
    const assignedColor = getColorFromName(name);
    const backgroundOpacity = isSelected ? 20 : 7;

    return {
        "--focus-ring-color": `color-mix(in srgb, ${assignedColor}, black 20%)`,
        backgroundColor: `color-mix(in srgb, ${assignedColor} ${backgroundOpacity}%, transparent)`,
    } as CSSProperties;
}

export function CollectionsList({
    className,
    ...props
}: React.ComponentProps<typeof Collapsible>): ReactElement {
    return <Collapsible className={cn("gap-3", className)} {...props} />;
}

export function CollectionsListTrigger({
    className,
    ...props
}: React.ComponentProps<typeof CollapsibleTrigger>): ReactElement {
    return (
        <CollapsibleTrigger
            className={cn(
                "flex select-none items-center gap-3 rounded-full bg-muted/94 px-3 py-2.5 text-left text-foreground leading-tight",
                className
            )}
            type="button"
            {...props}
        >
            <Component
                aria-hidden
                className="inline-block size-5 shrink-0"
                focusable="false"
            />
            <span className="min-w-0 flex-1 font-medium text-sm">
                Collections
            </span>
            <ChevronDown
                aria-hidden
                className="pointer-events-none ml-auto inline-block size-4 shrink-0 transition-transform group-data-panel-open:rotate-180"
                focusable="false"
            />
        </CollapsibleTrigger>
    );
}

export function CollectionsListAction({
    className,
    ...props
}: React.ComponentProps<typeof Button>): ReactElement {
    return (
        <Button
            className={cn("rounded-full", className)}
            size="icon-xl"
            variant="secondary"
            {...props}
        />
    );
}

export function CollectionsListContent({
    className,
    ...props
}: React.ComponentProps<typeof CollapsiblePanel>): ReactElement {
    return <CollapsiblePanel className={cn(className)} {...props} />;
}

export function CollectionsListItem({
    collection,
    isSelected,
    onCopyLinks,
    onDelete,
    onExportCsv,
    onOpenLinks,
    onSelect,
}: {
    readonly collection: LibraryCollectionSummary;
    readonly isSelected: boolean;
    readonly onCopyLinks: () => void;
    readonly onDelete: () => void;
    readonly onExportCsv: () => void;
    readonly onOpenLinks: () => void;
    readonly onSelect: () => void;
}): ReactElement {
    const hasItems = collection.itemCount > 0;

    return (
        <div className="group relative flex select-none items-center">
            <Button
                className={cn(
                    "min-w-0 flex-1 justify-start rounded-full pr-10 pl-3.5 text-left focus-visible:ring-1 focus-visible:ring-[var(--focus-ring-color)]"
                )}
                onClick={onSelect}
                style={getCollectionButtonStyle(collection.name, isSelected)}
                type="button"
                variant="ghost"
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="truncate font-medium text-sm leading-tight">
                        {collection.name}
                    </span>
                    {collection.sources.length > 0 && (
                        <span className="truncate text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                            {collection.sources.map(getSourceLabel).join(", ")}
                        </span>
                    )}
                </div>
            </Button>
            <div className="absolute top-1/2 right-0.5 flex size-8 -translate-y-1/2 items-center justify-center">
                <span className="pointer-events-none text-nowrap text-xs tabular-nums opacity-80 transition-opacity focus-visible:opacity-0 group-focus-within:opacity-0 group-hover:opacity-0">
                    {collection.itemCount}
                </span>
                <Menu>
                    <MenuTrigger
                        render={
                            <Button
                                aria-label={`Collection actions for ${collection.name}`}
                                className="absolute rounded-full opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100 group-focus:opacity-100"
                                size="icon-sm"
                                variant="ghost"
                            />
                        }
                    >
                        <EllipsisIcon className="size-4.5" />
                    </MenuTrigger>
                    <MenuPopup className="min-w-48">
                        <MenuSub>
                            <MenuSubTrigger disabled={!hasItems}>
                                Export to...
                            </MenuSubTrigger>
                            <MenuSubPopup className="min-w-48">
                                <MenuItem closeOnClick onClick={onCopyLinks}>
                                    <CopyIcon className="size-4 text-muted-foreground" />
                                    Copy all links
                                </MenuItem>
                                <MenuItem closeOnClick onClick={onOpenLinks}>
                                    <ExternalLinkIcon className="size-4 text-muted-foreground" />
                                    Open all links
                                </MenuItem>
                                <MenuItem closeOnClick onClick={onExportCsv}>
                                    <FileSpreadsheetIcon className="size-4 text-muted-foreground" />
                                    Export to CSV
                                </MenuItem>
                                <MenuItem disabled>Send to Notion</MenuItem>
                            </MenuSubPopup>
                        </MenuSub>
                        <MenuSeparator />
                        <MenuItem
                            closeOnClick
                            onClick={onDelete}
                            variant="destructive"
                        >
                            <Trash2Icon className="size-4" />
                            Delete
                        </MenuItem>
                    </MenuPopup>
                </Menu>
            </div>
            <span className="sr-only">{collection.itemCount}</span>
        </div>
    );
}

export function CollectionsListFeedback({
    message,
    onDismiss,
    tone,
}: {
    readonly message?: string;
    readonly onDismiss: () => void;
    readonly tone?: "error" | "success";
}): ReactElement | null {
    if (!message) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-2 pt-1 pr-1 pl-3.5">
            <p
                className={cn(
                    "text-xs",
                    tone === "error"
                        ? "text-destructive"
                        : "text-muted-foreground"
                )}
            >
                {message}
            </p>
            <Button onClick={onDismiss} size="xs" variant="ghost">
                Dismiss
            </Button>
        </div>
    );
}

export function CollectionsListFilterClear({
    isVisible,
    onClear,
}: {
    readonly isVisible: boolean;
    readonly onClear: () => void;
}): ReactElement | null {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-2 pr-1 pl-3.5">
            <p className="text-muted-foreground text-xs">
                Filtering by any selected collection
            </p>
            <Button onClick={onClear} size="xs" variant="ghost">
                Clear
            </Button>
        </div>
    );
}

export function CollectionsListEmpty(): ReactElement {
    return (
        <p className="rounded-xl border border-border/60 border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
            Create your first collection to start grouping saved items.
        </p>
    );
}

export function SmartCollectionsCallout(): ReactElement {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Collapsible onOpenChange={setIsOpen} open={isOpen}>
            <CollapsiblePanel className="items-center justify-center p-2">
                <AvatarGroup>
                    <Avatar className="bg-muted/90">
                        <Sparkles className="inline-block size-4.5 shrink-0" />
                    </Avatar>
                    <Avatar className="border-2 border-white bg-muted">
                        <Info className="inline-block size-4.5 shrink-0" />
                    </Avatar>
                    <Avatar className="-z-1 bg-muted/90">
                        <Group className="inline-block size-4.5 shrink-0" />
                    </Avatar>
                </AvatarGroup>
                <div className="flex items-center justify-center gap-1">
                    <span className="font-medium text-xs">
                        <Popover>
                            <PopoverTrigger
                                className="underline decoration-1 decoration-dotted underline-offset-2"
                                openOnHover
                            >
                                <GradientWaveText
                                    ariaLabel="Smart Collections"
                                    delay={0}
                                    speed={2.2}
                                >
                                    Smart Collections
                                </GradientWaveText>
                            </PopoverTrigger>
                            <PopoverPopup align="start" tooltipStyle>
                                <div className="flex gap-2">
                                    <Info className="mt-0.5 inline-block size-4 shrink-0" />
                                    <div className="flex flex-col gap-2">
                                        <p className="text-foreground">
                                            Let Cache do the organizing: AI now
                                            groups your related saves into
                                            focused, contextual ready-to-use
                                            collections.
                                        </p>
                                        <Button
                                            className="ml-auto"
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
            </CollapsiblePanel>
        </Collapsible>
    );
}
