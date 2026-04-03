"use client";

import {
    createCollection,
    updateLibraryItemCollections,
    type CreateCollectionResult,
    type UpdateLibraryItemCollectionsResult,
} from "@/app/[locale]/library/actions";
import { LibraryBrowser } from "@/components/library/library-browser";
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogPanel,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageSidebarShell } from "@/components/ui/layouts";
import { Textarea } from "@/components/ui/textarea";
import type {
    LibraryCollectionSummary,
    LibraryCollectionTag,
    LibraryItemWithCollections,
} from "@/lib/library/types";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown, Component, PlusIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { useCallback, useId, useMemo, useState, useTransition } from "react";

const COLLECTION_NAME_COLLATOR = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
});

interface Props {
    readonly initialCollections: readonly LibraryCollectionSummary[];
    readonly initialItems: readonly LibraryItemWithCollections[];
    readonly sidebarBottom?: ReactNode;
    readonly sidebarTop?: ReactNode;
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

export function LibraryWorkspace({
    initialCollections,
    initialItems,
    sidebarBottom,
    sidebarTop,
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
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
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
    const [isCreatePending, startCreateTransition] = useTransition();
    const createInputId = useId();
    const createDescriptionId = useId();

    const collectionSummaries = useMemo(
        () => deriveCollectionSummaries(collections, items),
        [collections, items]
    );

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
            <Dialog
                onOpenChange={handleCreateDialogOpenChange}
                open={isCreateDialogOpen}
            >
                <DialogPopup>
                    <form
                        className="contents"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleCreateCollectionSubmit();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Create new collection</DialogTitle>
                            <DialogDescription>
                                Give this collection a short name so you can
                                start grouping items right away.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogPanel className="space-y-3">
                            <div className="space-y-2">
                                <label
                                    className="font-medium text-sm"
                                    htmlFor={createInputId}
                                >
                                    Name
                                </label>
                                <Input
                                    autoFocus
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
                                    placeholder="Reading backlog"
                                    required
                                    value={createDialogDraft}
                                />
                            </div>
                            <div className="space-y-2">
                                <label
                                    className="font-medium text-sm"
                                    htmlFor={createDescriptionId}
                                >
                                    Description{" "}
                                    <span className="font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </label>
                                <Textarea
                                    id={createDescriptionId}
                                    maxLength={1024}
                                    onChange={(event) => {
                                        setCreateDialogDescriptionDraft(
                                            event.currentTarget.value
                                        );
                                    }}
                                    placeholder="e.g. Articles and videos I want to check out later"
                                    value={createDialogDescriptionDraft}
                                />
                            </div>
                            <p
                                className={cn(
                                    "min-h-5 text-sm",
                                    createDialogError
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                )}
                                role={createDialogError ? "alert" : undefined}
                            >
                                {createDialogError ??
                                    (createDialogAssignItemId
                                        ? "This new collection will also be assigned to the selected item."
                                        : "Collections work like tags, so each item can live in multiple groups.")}
                            </p>
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
            <PageSidebarShell
                bottom={sidebarBottom}
                top={
                    <>
                        {sidebarTop}
                        <div className="flex w-full items-start gap-1.5">
                            <Collapsible
                                className="w-full flex-1"
                                onOpenChange={setIsCollectionsOpen}
                                open={isCollectionsOpen}
                            >
                                <CollapsibleTrigger className="flex items-center gap-3 rounded-[1.35rem] bg-muted/94 py-2.5 pr-3 pl-3.5 text-left">
                                    <Component
                                        aria-hidden
                                        className="inline-block size-5 shrink-0"
                                        focusable="false"
                                    />
                                    <span className="min-w-0 select-none font-medium text-sm leading-tight">
                                        Collections
                                    </span>
                                    {selectedCollectionIds.length > 0 ? (
                                        <Badge
                                            className="rounded-full"
                                            size="sm"
                                            variant="secondary"
                                        >
                                            {selectedCollectionIds.length}{" "}
                                            active
                                        </Badge>
                                    ) : null}
                                    <ChevronDown
                                        aria-hidden
                                        className="pointer-events-none ml-auto inline-block size-4 shrink-0 transition-transform group-data-panel-open:rotate-180"
                                        focusable="false"
                                    />
                                </CollapsibleTrigger>
                                <CollapsiblePanel className="pt-2">
                                    <div className="flex flex-col gap-2 rounded-[1.35rem] border border-border/60 bg-card/50 p-2.5">
                                        {selectedCollectionIds.length > 0 ? (
                                            <div className="flex items-center justify-between gap-2 px-1">
                                                <p className="text-muted-foreground text-xs">
                                                    Filtering by any selected
                                                    collection
                                                </p>
                                                <Button
                                                    onClick={
                                                        clearCollectionFilters
                                                    }
                                                    size="xs"
                                                    variant="ghost"
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        ) : null}
                                        {collectionSummaries.length > 0 ? (
                                            collectionSummaries.map(
                                                (collection) => {
                                                    const isSelected =
                                                        selectedCollectionIds.includes(
                                                            collection.id
                                                        );

                                                    return (
                                                        <button
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/70 focus-visible:bg-accent/70 focus-visible:outline-none",
                                                                isSelected &&
                                                                    "bg-accent"
                                                            )}
                                                            key={collection.id}
                                                            onClick={() =>
                                                                setSelectedCollectionIds(
                                                                    (
                                                                        current
                                                                    ) =>
                                                                        current.includes(
                                                                            collection.id
                                                                        )
                                                                            ? current.filter(
                                                                                  (
                                                                                      id
                                                                                  ) =>
                                                                                      id !==
                                                                                      collection.id
                                                                              )
                                                                            : [
                                                                                  ...current,
                                                                                  collection.id,
                                                                              ]
                                                                )
                                                            }
                                                            type="button"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "flex size-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-primary",
                                                                    isSelected &&
                                                                        "border-primary/40 bg-primary/12"
                                                                )}
                                                            >
                                                                {isSelected ? (
                                                                    <CheckIcon className="size-3.5" />
                                                                ) : null}
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate font-medium text-sm">
                                                                    {
                                                                        collection.name
                                                                    }
                                                                </span>
                                                            </span>
                                                            <span className="text-muted-foreground text-xs tabular-nums">
                                                                {
                                                                    collection.itemCount
                                                                }
                                                            </span>
                                                        </button>
                                                    );
                                                }
                                            )
                                        ) : (
                                            <div className="rounded-xl border border-border/60 border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
                                                Create your first collection to
                                                start grouping saved items.
                                            </div>
                                        )}
                                    </div>
                                </CollapsiblePanel>
                            </Collapsible>
                            <Button
                                aria-label="Create new collection"
                                className="rounded-full"
                                onClick={() => handleCreateCollectionRequest()}
                                size="icon"
                                variant="secondary"
                            >
                                <span className="sr-only">
                                    Create new collection
                                </span>
                                <PlusIcon
                                    aria-hidden
                                    className="inline-block size-4 shrink-0"
                                    focusable="false"
                                />
                            </Button>
                        </div>
                    </>
                }
            />
            <div className="flex w-full max-w-[1024px] flex-col items-center gap-12 p-8 2xl:mx-auto">
                <LibraryBrowser
                    collections={collectionSummaries}
                    items={items}
                    onClearCollectionFilters={clearCollectionFilters}
                    onCreateCollectionRequest={handleCreateCollectionRequest}
                    onItemsChange={setItems}
                    onUpdateItemCollections={handleUpdateItemCollections}
                    pendingCollectionItemIds={pendingCollectionItemIds}
                    selectedCollectionIds={selectedCollectionIds}
                />
            </div>
        </div>
    );
}
