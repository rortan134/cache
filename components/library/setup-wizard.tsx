import { RadialChart } from "@/components/ui/radial-chart";
import {
    getIntegration,
    LIBRARY_BOOKMARK_SYNC_INTEGRATION_IDS,
} from "@/lib/integrations/supports";
import type { LibraryItemSource } from "@/prisma/client/enums";

/** Baseline fill so the ring reads as progress; attributes the first step to signing up. */
const SIGNUP_BASELINE_PERCENT = 10;

function integrationSetupProgressPercent(
    connectedCount: number,
    syncable: number
): number {
    if (syncable < 1) {
        return 0;
    }
    const clamped = Math.min(connectedCount, syncable);
    const integrationPortion =
        (clamped / syncable) * (100 - SIGNUP_BASELINE_PERCENT);
    return Math.round(SIGNUP_BASELINE_PERCENT + integrationPortion);
}

function syncableLibrarySourceTotal(): number {
    return LIBRARY_BOOKMARK_SYNC_INTEGRATION_IDS.length;
}

function formatEnglishList(items: readonly string[]): string {
    if (items.length === 0) {
        return "";
    }
    if (items.length === 1) {
        return items[0] ?? "";
    }
    if (items.length === 2) {
        return `${items[0] ?? ""} and ${items[1] ?? ""}`;
    }
    return `${items.slice(0, -1).join(", ")}, and ${items.at(-1) ?? ""}`;
}

function partitionLibrarySyncLabels(
    items: readonly { readonly source: LibraryItemSource }[]
): { connectedLabels: string[]; missingLabels: string[] } {
    const connectedLabels: string[] = [];
    const missingLabels: string[] = [];
    for (const id of LIBRARY_BOOKMARK_SYNC_INTEGRATION_IDS) {
        const count = items.filter((item) => item.source === id).length;
        const label = getIntegration(id).label;
        if (count > 0) {
            connectedLabels.push(label);
        } else {
            missingLabels.push(label);
        }
    }
    return { connectedLabels, missingLabels };
}

function integrationSetupHeadingText(args: {
    readonly syncable: number;
    readonly connectedCount: number;
    readonly connectedLabels: readonly string[];
    readonly missingLabels: readonly string[];
}): string {
    const { syncable, connectedCount, connectedLabels, missingLabels } = args;
    if (syncable < 1) {
        return "Connected accounts";
    }
    if (connectedCount === 0) {
        return "Get setup with your first account";
    }
    if (connectedCount < syncable) {
        return `Connect ${formatEnglishList(missingLabels)} to unify your saved posts in one library`;
    }
    return `You're set on ${formatEnglishList(connectedLabels)}—sync from the extension to stay up to date`;
}

export interface IntegrationSetupHeadingProps {
    readonly items: readonly { readonly source: LibraryItemSource }[];
}

export function IntegrationSetupHeading({
    items,
}: IntegrationSetupHeadingProps) {
    const syncable = syncableLibrarySourceTotal();
    const { connectedLabels, missingLabels } =
        partitionLibrarySyncLabels(items);
    const connectedCount = connectedLabels.length;
    const text = integrationSetupHeadingText({
        connectedCount,
        connectedLabels,
        missingLabels,
        syncable,
    });
    const progressPercent = integrationSetupProgressPercent(
        connectedCount,
        syncable
    );

    return (
        <div className="flex items-center gap-2 rounded-full bg-muted/90 px-2.5 py-1.5">
            <span aria-hidden="true" className="shrink-0 leading-none">
                <RadialChart size={36} value={progressPercent} />
            </span>
            <span className="font-medium text-sm">{text}</span>
        </div>
    );
}
