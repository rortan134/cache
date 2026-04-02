import { RadialChart } from "@/components/ui/radial-chart";
import {
    getIntegration,
    LIBRARY_BOOKMARK_SYNC_INTEGRATION_IDS,
} from "@/lib/integrations/supports";
import { cn } from "@/lib/utils";
import type { LibraryItemSource } from "@/prisma/client/enums";
import { ChevronDown } from "lucide-react";

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

function partitionLibrarySyncLabels(
    items: readonly { readonly source: LibraryItemSource }[]
): { connectedLabels: string[]; missingLabels: string[] } {
    const connectedLabels: string[] = [];
    const missingLabels: string[] = [];
    for (const id of LIBRARY_BOOKMARK_SYNC_INTEGRATION_IDS) {
        const count = items.filter((item) =>
            id === "chrome"
                ? item.source === "chrome_bookmarks"
                : item.source === id
        ).length;
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
    const { syncable, connectedCount } = args;
    if (syncable < 1) {
        return "Connected accounts";
    }
    if (connectedCount === 0) {
        return "Get setup with your first account";
    }
    if (connectedCount < syncable) {
        return "Connect more platforms to unify your saved posts in one library";
    }
    return `You're all set — sync from the extension to stay up to date`;
}

export interface IntegrationSetupHeadingProps
    extends React.ComponentProps<"button"> {
    readonly items: readonly { readonly source: LibraryItemSource }[];
}

export function IntegrationSetupWizard({
    items,
    className,
    ...props
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
        <button
            {...props}
            className={cn(
                "flex items-center gap-2 rounded-full bg-muted/94 px-2.5 py-1.5 text-left",
                className
            )}
            type="button"
        >
            <span
                aria-hidden="true"
                className="shrink-0 text-left leading-none"
            >
                <RadialChart size={36} value={progressPercent} />
            </span>
            <span className="select-none font-medium text-sm">{text}</span>
            <ChevronDown
                aria-hidden
                className="pointer-events-none inline-block size-4 shrink-0 transition-transform group-data-[panel-open]:rotate-180"
                focusable="false"
            />
        </button>
    );
}
