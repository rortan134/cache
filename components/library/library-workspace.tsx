"use client";

import {
    createCollection,
    deleteCollection,
    updateLibraryItemCollections,
    type CreateCollectionResult,
    type DeleteCollectionResult,
    type UpdateLibraryItemCollectionsResult,
} from "@/app/[locale]/library/actions";
import { LibraryBrowser } from "@/components/library/library-browser";
import { SmartCollectionsCallout } from "@/components/library/smart-collections-callout";
import {
    AlertDialog,
    AlertDialogClose,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogPopup,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsiblePanel,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogPanel,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageSidebarShell } from "@/components/ui/layouts";
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
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { getColorFromName } from "@/lib/colors";
import { saveFile } from "@/lib/file";
import type {
    LibraryCollectionSummary,
    LibraryCollectionTag,
    LibraryItemWithCollections,
} from "@/lib/library/types";
import { normalizeURL } from "@/lib/url";
import { cn } from "@/lib/utils";
import AppIconSmall from "@/public/cache-icon-small.png";
import {
    ChevronDown,
    ChevronRight,
    Component,
    CopyIcon,
    EllipsisIcon,
    ExternalLinkIcon,
    FileSpreadsheetIcon,
    PlusIcon,
    Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useCallback, useId, useMemo, useState, useTransition } from "react";

const COLLECTION_NAME_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
});

interface Props {
    readonly initialCollections: readonly LibraryCollectionSummary[];
    readonly initialItems: readonly LibraryItemWithCollections[];
    readonly locale: string;
    readonly sidebarBottom?: ReactNode;
    sidebarContent: ReactNode;
    readonly sidebarHeader?: ReactNode;
}

interface CollectionActionFeedback {
    readonly message: string;
    readonly tone: "error" | "success";
}

function sortCollectionsByName<T extends { readonly name: string }>(
    collections: readonly T[]
): T[] {
    return [...collections].sort((a, b) =>
        COLLECTION_NAME_COLLATOR.compare(a.name, b.name)
    );
}

function replaceItemCollections(
    items: readonly LibraryItemWithCollections[],
    itemId: string,
    collections: readonly LibraryCollectionTag[]
): LibraryItemWithCollections[] {
    return items.map((item) =>
        item.id === itemId
            ? {
                  ...item,
                  collections: [...collections],
              }
            : item
    );
}

function appendCollectionToItem(
    items: readonly LibraryItemWithCollections[],
    itemId: string,
    collection: LibraryCollectionTag
): LibraryItemWithCollections[] {
    return items.map((item) => {
        if (item.id !== itemId) {
            return item;
        }
        if (item.collections.some((entry) => entry.id === collection.id)) {
            return item;
        }
        return {
            ...item,
            collections: sortCollectionsByName([
                ...item.collections,
                collection,
            ]),
        };
    });
}

function deriveCollectionSummaries(
    collections: readonly LibraryCollectionTag[],
    items: readonly LibraryItemWithCollections[]
): LibraryCollectionSummary[] {
    const counts = new Map<string, number>();
    for (const item of items) {
        for (const collection of item.collections) {
            counts.set(collection.id, (counts.get(collection.id) ?? 0) + 1);
        }
    }

    return sortCollectionsByName(
        collections.map((collection) => ({
            description: collection.description ?? null,
            id: collection.id,
            itemCount: counts.get(collection.id) ?? 0,
            name: collection.name,
        }))
    );
}

function getCollectionButtonStyle(
    name: string,
    isSelected: boolean
): CSSProperties {
    const assignedColor = getColorFromName(name);
    const backgroundOpacity = isSelected ? 20 : 6;

    return {
        backgroundColor: `color-mix(in srgb, ${assignedColor} ${backgroundOpacity}%, transparent)`,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18)",
        color: "var(--color-foreground)",
    };
}

function openSavedItemInNewTab(url: string): void {
    try {
        if (typeof window.openai !== "undefined") {
            window.openai.openExternal({ href: url });
            return;
        }
    } catch {
        // Fall back to the browser when the desktop bridge isn't available.
    }

    window.open(url, "_blank", "noopener,noreferrer");
}

function getCollectionItemUrls(
    items: readonly LibraryItemWithCollections[]
): string[] {
    return items.map((item) => normalizeURL(item.url));
}

function escapeCsvCell(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
}

function buildCollectionCsv(
    collection: LibraryCollectionSummary,
    items: readonly LibraryItemWithCollections[]
): string {
    const header = [
        "Collection",
        "Caption",
        "URL",
        "Source",
        "Kind",
        "Saved At",
        "Posted At",
    ];

    const rows = items.map((item) => [
        collection.name,
        item.caption ?? "",
        normalizeURL(item.url),
        item.source,
        item.kind,
        item.createdAt.toISOString(),
        item.postedAt?.toISOString() ?? "",
    ]);

    return [header, ...rows]
        .map((row) => row.map((value) => escapeCsvCell(value)).join(","))
        .join("\n");
}

function collectionExportFileName(name: string): string {
    const slug = name
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");

    return slug.length > 0 ? `${slug}-links` : "collection-links";
}

export function LibraryWorkspace({
    initialCollections,
    initialItems,
    locale,
    sidebarBottom,
    sidebarHeader,
    sidebarContent,
}: Props): ReactElement {
    const [items, setItems] = useState<LibraryItemWithCollections[]>([
        ...initialItems,
    ]);
    const [collections, setCollections] = useState<LibraryCollectionTag[]>(
        sortCollectionsByName(
            initialCollections.map((collection) => ({
                description: collection.description,
                id: collection.id,
                name: collection.name,
            }))
        )
    );
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<
        string[]
    >([]);
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createDialogDraft, setCreateDialogDraft] = useState("");
    const [createDialogDescriptionDraft, setCreateDialogDescriptionDraft] =
        useState("");
    const [createDialogError, setCreateDialogError] = useState<string | null>(
        null
    );
    const [createDialogAssignItemId, setCreateDialogAssignItemId] = useState<
        string | null
    >(null);
    const [pendingCollectionItemIds, setPendingCollectionItemIds] = useState<
        string[]
    >([]);
    const [pendingDeleteCollection, setPendingDeleteCollection] =
        useState<LibraryCollectionSummary | null>(null);
    const [collectionActionFeedback, setCollectionActionFeedback] =
        useState<CollectionActionFeedback | null>(null);
    const [isCreatePending, startCreateTransition] = useTransition();
    const [isDeletePending, startDeleteTransition] = useTransition();
    const createInputId = useId();
    const createDescriptionId = useId();
    const { copyToClipboard } = useCopyToClipboard({
        onCopy: () => {
            setCollectionActionFeedback({
                message: "All collection links copied to the clipboard.",
                tone: "success",
            });
        },
    });

    const collectionSummaries = useMemo(
        () => deriveCollectionSummaries(collections, items),
        [collections, items]
    );
    const itemsByCollectionId = useMemo(() => {
        const map = new Map<string, LibraryItemWithCollections[]>();

        for (const item of items) {
            for (const collection of item.collections) {
                const entries = map.get(collection.id);
                if (entries) {
                    entries.push(item);
                } else {
                    map.set(collection.id, [item]);
                }
            }
        }

        return map;
    }, [items]);

    const handleCreateDialogOpenChange = useCallback(
        (open: boolean) => {
            if (!(open || isCreatePending)) {
                setCreateDialogDraft("");
                setCreateDialogDescriptionDraft("");
                setCreateDialogError(null);
                setCreateDialogAssignItemId(null);
            }
            setIsCreateDialogOpen(open);
        },
        [isCreatePending]
    );

    const handleCreateCollectionRequest = useCallback((itemId?: string) => {
        setCreateDialogAssignItemId(itemId ?? null);
        setCreateDialogDraft("");
        setCreateDialogDescriptionDraft("");
        setCreateDialogError(null);
        setIsCreateDialogOpen(true);
    }, []);

    const clearCollectionFilters = useCallback(() => {
        setSelectedCollectionIds([]);
    }, []);

    const handleRequestDeleteCollection = useCallback(
        (collection: LibraryCollectionSummary) => {
            setCollectionActionFeedback(null);
            setPendingDeleteCollection(collection);
        },
        []
    );

    const handleDeleteCollectionDialogOpenChange = useCallback(
        (open: boolean) => {
            if (!(open || isDeletePending)) {
                setPendingDeleteCollection(null);
            }
        },
        [isDeletePending]
    );

    const handleCopyCollectionLinks = useCallback(
        (collection: LibraryCollectionSummary) => {
            const collectionItems =
                itemsByCollectionId.get(collection.id) ?? [];
            const urls = getCollectionItemUrls(collectionItems);

            if (urls.length === 0) {
                setCollectionActionFeedback({
                    message: "There are no links in this collection yet.",
                    tone: "error",
                });
                return;
            }

            setCollectionActionFeedback(null);
            copyToClipboard(urls.join("\n"));
        },
        [copyToClipboard, itemsByCollectionId]
    );

    const handleOpenCollectionLinks = useCallback(
        (collection: LibraryCollectionSummary) => {
            const collectionItems =
                itemsByCollectionId.get(collection.id) ?? [];
            const urls = getCollectionItemUrls(collectionItems);

            if (urls.length === 0) {
                setCollectionActionFeedback({
                    message: "There are no links in this collection yet.",
                    tone: "error",
                });
                return;
            }

            setCollectionActionFeedback({
                message: `Opening ${urls.length} link${urls.length === 1 ? "" : "s"} from ${collection.name}.`,
                tone: "success",
            });

            for (const url of urls) {
                openSavedItemInNewTab(url);
            }
        },
        [itemsByCollectionId]
    );

    const handleExportCollectionToCsv = useCallback(
        async (collection: LibraryCollectionSummary) => {
            const collectionItems =
                itemsByCollectionId.get(collection.id) ?? [];

            if (collectionItems.length === 0) {
                setCollectionActionFeedback({
                    message: "There are no links in this collection yet.",
                    tone: "error",
                });
                return;
            }

            try {
                await saveFile(
                    new Blob(
                        [buildCollectionCsv(collection, collectionItems)],
                        {
                            type: "text/csv;charset=utf-8",
                        }
                    ),
                    {
                        description: "CSV file",
                        extension: "csv",
                        name: collectionExportFileName(collection.name),
                    }
                );

                setCollectionActionFeedback({
                    message: `${collection.name} exported as CSV.`,
                    tone: "success",
                });
            } catch {
                setCollectionActionFeedback({
                    message: "We couldn't export this collection right now.",
                    tone: "error",
                });
            }
        },
        [itemsByCollectionId]
    );

    const handleConfirmDeleteCollection = useCallback(() => {
        const targetCollection = pendingDeleteCollection;
        if (!targetCollection) {
            return;
        }

        startDeleteTransition(async () => {
            let result: DeleteCollectionResult;

            try {
                result = await deleteCollection({
                    collectionId: targetCollection.id,
                });
            } catch {
                result = {
                    message: "We couldn't delete this collection right now.",
                    status: "ERROR",
                };
            }

            if (result.status !== "DELETED") {
                setCollectionActionFeedback({
                    message: result.message,
                    tone: "error",
                });
                return;
            }

            setCollections((current) =>
                current.filter(
                    (collection) => collection.id !== result.collection.id
                )
            );
            setItems((current) =>
                current.map((item) => ({
                    ...item,
                    collections: item.collections.filter(
                        (collection) => collection.id !== result.collection.id
                    ),
                }))
            );
            setSelectedCollectionIds((current) =>
                current.filter((id) => id !== result.collection.id)
            );
            setPendingDeleteCollection(null);
            setCollectionActionFeedback({
                message: `${result.collection.name} deleted.`,
                tone: "success",
            });
        });
    }, [pendingDeleteCollection]);

    const handleCreateCollectionSubmit = useCallback(() => {
        startCreateTransition(async () => {
            let result: CreateCollectionResult;

            try {
                result = await createCollection({
                    assignToItemId: createDialogAssignItemId ?? undefined,
                    description: createDialogDescriptionDraft || undefined,
                    name: createDialogDraft,
                });
            } catch {
                result = {
                    message: "We couldn't create this collection right now.",
                    status: "ERROR",
                };
            }

            if (result.status !== "CREATED") {
                setCreateDialogError(result.message);
                return;
            }

            const nextCollection = {
                description: result.collection.description,
                id: result.collection.id,
                name: result.collection.name,
            } satisfies LibraryCollectionTag;

            setCollections((current) =>
                current.some(
                    (collection) => collection.id === nextCollection.id
                )
                    ? current
                    : sortCollectionsByName([...current, nextCollection])
            );

            if (result.assignedItemId) {
                const assignedItemId = result.assignedItemId;
                setItems((current) =>
                    appendCollectionToItem(
                        current,
                        assignedItemId,
                        nextCollection
                    )
                );
            }

            setCreateDialogDraft("");
            setCreateDialogDescriptionDraft("");
            setCreateDialogError(null);
            setCreateDialogAssignItemId(null);
            setIsCreateDialogOpen(false);
        });
    }, [
        createDialogAssignItemId,
        createDialogDescriptionDraft,
        createDialogDraft,
    ]);

    const handleUpdateItemCollections = useCallback(
        (itemId: string, collectionIds: string[]) => {
            const previousCollections =
                items.find((item) => item.id === itemId)?.collections ?? [];
            const optimisticCollections = sortCollectionsByName(
                collections.filter((collection) =>
                    collectionIds.includes(collection.id)
                )
            );

            setItems((current) =>
                replaceItemCollections(current, itemId, optimisticCollections)
            );
            setPendingCollectionItemIds((current) =>
                current.includes(itemId) ? current : [...current, itemId]
            );

            const runUpdate = async () => {
                let result: UpdateLibraryItemCollectionsResult;

                try {
                    result = await updateLibraryItemCollections({
                        collectionIds,
                        itemId,
                    });
                } catch {
                    result = {
                        message:
                            "We couldn't update collections for this item.",
                        status: "ERROR",
                    };
                }

                if (result.status === "UPDATED") {
                    setItems((current) =>
                        replaceItemCollections(
                            current,
                            itemId,
                            result.collections
                        )
                    );
                } else {
                    setItems((current) =>
                        replaceItemCollections(
                            current,
                            itemId,
                            previousCollections
                        )
                    );
                }

                setPendingCollectionItemIds((current) =>
                    current.filter((id) => id !== itemId)
                );
            };

            runUpdate().catch(() => {
                setItems((current) =>
                    replaceItemCollections(current, itemId, previousCollections)
                );
                setPendingCollectionItemIds((current) =>
                    current.filter((id) => id !== itemId)
                );
            });
        },
        [collections, items]
    );

    return (
        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:justify-between">
            <AlertDialog
                onOpenChange={handleDeleteCollectionDialogOpenChange}
                open={pendingDeleteCollection !== null}
            >
                <AlertDialogPopup>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete collection?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove{" "}
                            {pendingDeleteCollection?.name || "this collection"}{" "}
                            from Cache. Saved items will remain in your library,
                            but they won't belong to this collection anymore.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogClose
                            disabled={isDeletePending}
                            render={<Button size="sm" variant="ghost" />}
                        >
                            Cancel
                        </AlertDialogClose>
                        <Button
                            loading={isDeletePending}
                            onClick={handleConfirmDeleteCollection}
                            size="sm"
                            variant="destructive"
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogPopup>
            </AlertDialog>
            <PageSidebarShell bottom={sidebarBottom} top={sidebarHeader}>
                {sidebarContent}
                <Collapsible
                    className="flex flex-col gap-3"
                    onOpenChange={setIsCollectionsOpen}
                    open={isCollectionsOpen}
                >
                    <div className="flex w-full items-center gap-1.5">
                        <CollapsibleTrigger className="flex select-none items-center gap-3 rounded-[1.35rem] bg-muted/94 py-2.5 pr-3 pl-3.5 text-left text-foreground">
                            <Component
                                aria-hidden
                                className="inline-block size-5 shrink-0"
                                focusable="false"
                            />
                            <span className="min-w-0 flex-1 truncate font-medium text-sm leading-tight">
                                Collections
                            </span>
                            <ChevronDown
                                aria-hidden
                                className="pointer-events-none ml-auto inline-block size-4 shrink-0 transition-transform group-data-panel-open:rotate-180"
                                focusable="false"
                            />
                        </CollapsibleTrigger>
                        <Button
                            aria-label="Create new collection"
                            className="rounded-full"
                            onClick={() => handleCreateCollectionRequest()}
                            size="icon-xl"
                            variant="secondary"
                        >
                            <PlusIcon
                                aria-hidden
                                className="inline-block size-4 shrink-0"
                                focusable="false"
                            />
                            <span className="sr-only">
                                Create new collection
                            </span>
                        </Button>
                    </div>
                    <CollapsiblePanel className="flex flex-col gap-1">
                        <SmartCollectionsCallout />
                        {collectionSummaries.length > 0 ? (
                            <>
                                {collectionSummaries.map((collection) => {
                                    const isSelected =
                                        selectedCollectionIds.includes(
                                            collection.id
                                        );
                                    const hasItems = collection.itemCount > 0;

                                    return (
                                        <div
                                            className="group relative flex select-none items-center"
                                            key={collection.id}
                                        >
                                            <Button
                                                className={cn(
                                                    "min-w-0 flex-1 select-none justify-start rounded-full pr-11 pl-3.5 text-left transition-[filter,box-shadow] hover:brightness-95"
                                                )}
                                                onClick={() =>
                                                    setSelectedCollectionIds(
                                                        (current) =>
                                                            current.includes(
                                                                collection.id
                                                            )
                                                                ? current.filter(
                                                                      (id) =>
                                                                          id !==
                                                                          collection.id
                                                                  )
                                                                : [
                                                                      ...current,
                                                                      collection.id,
                                                                  ]
                                                    )
                                                }
                                                style={getCollectionButtonStyle(
                                                    collection.name,
                                                    isSelected
                                                )}
                                                type="button"
                                                variant="ghost"
                                            >
                                                <span className="min-w-0 flex-1 truncate font-medium text-sm leading-tight">
                                                    {collection.name}
                                                </span>
                                            </Button>
                                            <div className="absolute top-1/2 right-0.5 flex size-8 -translate-y-1/2 items-center justify-center">
                                                <span className="pointer-events-none text-nowrap text-xs tabular-nums opacity-50 transition-opacity duration-200 group-hover:opacity-0">
                                                    {collection.itemCount}
                                                </span>
                                                <Menu>
                                                    <MenuTrigger
                                                        render={
                                                            <Button
                                                                aria-label={`Collection actions for ${collection.name}`}
                                                                className="absolute rounded-full opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:translate-x-0 group-hover:opacity-100"
                                                                size="icon-sm"
                                                                variant="ghost"
                                                            />
                                                        }
                                                    >
                                                        <EllipsisIcon className="size-4" />
                                                    </MenuTrigger>
                                                    <MenuPopup className="min-w-48">
                                                        <MenuSub>
                                                            <MenuSubTrigger
                                                                disabled={
                                                                    !hasItems
                                                                }
                                                            >
                                                                Export to...
                                                            </MenuSubTrigger>
                                                            <MenuSubPopup className="min-w-48">
                                                                <MenuItem
                                                                    closeOnClick
                                                                    onClick={() =>
                                                                        handleCopyCollectionLinks(
                                                                            collection
                                                                        )
                                                                    }
                                                                >
                                                                    <CopyIcon className="size-4 text-muted-foreground" />
                                                                    Copy all
                                                                    links
                                                                </MenuItem>
                                                                <MenuItem
                                                                    closeOnClick
                                                                    onClick={() =>
                                                                        handleOpenCollectionLinks(
                                                                            collection
                                                                        )
                                                                    }
                                                                >
                                                                    <ExternalLinkIcon className="size-4 text-muted-foreground" />
                                                                    Open all
                                                                    links
                                                                </MenuItem>
                                                                <MenuItem
                                                                    closeOnClick
                                                                    onClick={() =>
                                                                        handleExportCollectionToCsv(
                                                                            collection
                                                                        )
                                                                    }
                                                                >
                                                                    <FileSpreadsheetIcon className="size-4 text-muted-foreground" />
                                                                    Export to
                                                                    CSV
                                                                </MenuItem>
                                                                <MenuItem
                                                                    disabled
                                                                >
                                                                    Send to
                                                                    Notion
                                                                </MenuItem>
                                                            </MenuSubPopup>
                                                        </MenuSub>
                                                        <MenuSeparator />
                                                        <MenuItem
                                                            closeOnClick
                                                            onClick={() =>
                                                                handleRequestDeleteCollection(
                                                                    collection
                                                                )
                                                            }
                                                            variant="destructive"
                                                        >
                                                            <Trash2Icon className="size-4" />
                                                            Delete
                                                        </MenuItem>
                                                    </MenuPopup>
                                                </Menu>
                                            </div>
                                            <span className="sr-only">
                                                {collection.itemCount}
                                            </span>
                                        </div>
                                    );
                                })}
                                {collectionActionFeedback ? (
                                    <div className="flex items-center justify-between gap-2 pt-1 pr-1 pl-3.5">
                                        <p
                                            className={cn(
                                                "text-xs",
                                                collectionActionFeedback.tone ===
                                                    "error"
                                                    ? "text-destructive"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {collectionActionFeedback.message}
                                        </p>
                                        <Button
                                            onClick={() =>
                                                setCollectionActionFeedback(
                                                    null
                                                )
                                            }
                                            size="xs"
                                            variant="ghost"
                                        >
                                            Dismiss
                                        </Button>
                                    </div>
                                ) : null}
                                {selectedCollectionIds.length > 0 ? (
                                    <div className="flex items-center justify-between gap-2 pr-1 pl-3.5">
                                        <p className="text-muted-foreground text-xs">
                                            Filtering by any selected collection
                                        </p>
                                        <Button
                                            onClick={clearCollectionFilters}
                                            size="xs"
                                            variant="ghost"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="rounded-xl border border-border/60 border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
                                Create your first collection to start grouping
                                saved items.
                            </div>
                        )}
                    </CollapsiblePanel>
                </Collapsible>
            </PageSidebarShell>
            <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
                <LibraryBrowser
                    collections={collectionSummaries}
                    items={items}
                    locale={locale}
                    onClearCollectionFilters={clearCollectionFilters}
                    onItemsChange={setItems}
                    onUpdateItemCollections={handleUpdateItemCollections}
                    pendingCollectionItemIds={pendingCollectionItemIds}
                    selectedCollectionIds={selectedCollectionIds}
                />
            </div>
            <Dialog
                onOpenChange={handleCreateDialogOpenChange}
                open={isCreateDialogOpen}
            >
                <DialogPopup showCloseButton>
                    <form
                        className="contents"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleCreateCollectionSubmit();
                        }}
                    >
                        <DialogHeader>
                            <div className="flex items-center gap-1">
                                <Badge size="lg" variant="outline">
                                    <Image
                                        alt=""
                                        height={12}
                                        src={AppIconSmall}
                                        width={12}
                                    />
                                    Cache
                                </Badge>
                                <ChevronRight className="inline-block size-3.5 shrink-0" />
                                <DialogTitle className="font-medium text-sm">
                                    New collection
                                </DialogTitle>
                            </div>
                        </DialogHeader>
                        <DialogPanel className="space-y-2">
                            <div>
                                <label
                                    className="sr-only font-medium text-sm"
                                    htmlFor={createInputId}
                                >
                                    Name
                                </label>
                                <Input
                                    autoFocus
                                    className="-mx-[calc(--spacing(3)-1px)] font-semibold text-xl"
                                    id={createInputId}
                                    maxLength={64}
                                    onChange={(event) => {
                                        setCreateDialogDraft(
                                            event.currentTarget.value
                                        );
                                        if (createDialogError) {
                                            setCreateDialogError(null);
                                        }
                                    }}
                                    placeholder="Collection title"
                                    required
                                    size="lg"
                                    unstyled
                                    value={createDialogDraft}
                                />
                            </div>
                            <div>
                                <label
                                    className="sr-only font-medium text-sm"
                                    htmlFor={createDescriptionId}
                                >
                                    Description (optional)
                                </label>
                                <Textarea
                                    className="-mx-[calc(--spacing(3)-1px)] *:resize-none"
                                    id={createDescriptionId}
                                    maxLength={1024}
                                    onChange={(event) => {
                                        setCreateDialogDescriptionDraft(
                                            event.currentTarget.value
                                        );
                                    }}
                                    placeholder="Add description..."
                                    size="lg"
                                    unstyled
                                    value={createDialogDescriptionDraft}
                                />
                            </div>
                        </DialogPanel>
                        <DialogFooter>
                            <DialogClose
                                disabled={isCreatePending}
                                render={<Button size="sm" variant="ghost" />}
                            >
                                Cancel
                            </DialogClose>
                            <Button
                                loading={isCreatePending}
                                size="sm"
                                type="submit"
                            >
                                Create collection
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogPopup>
            </Dialog>
        </div>
    );
}
