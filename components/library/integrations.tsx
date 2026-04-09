"use client";

import { IntegrationSetupWizardButton } from "@/components/library/setup-wizard";
import { SidebarIntegrationAction } from "@/components/library/sidebar-integration-action";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsiblePanel,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useExtensionInstalled } from "@/hooks/use-extension-installed";
import {
    type IntegrationId,
    INTEGRATIONS,
    type SupportedIntegration,
} from "@/lib/integrations/supports";
import type { LibraryItemSource } from "@/prisma/client/enums";
import { Info } from "lucide-react";

interface LibrarySidebarIntegrationsProps {
    items: readonly { readonly source: LibraryItemSource }[];
    locale: string;
    parkedIntegrationIds?: readonly IntegrationId[];
    serverConnectedIntegrationIds: readonly IntegrationId[];
}

const EXTENSION_INTEGRATION_IDS = [
    "chrome",
    "instagram",
    "tiktok",
    "youtube",
] as const;

function isConnectedOnClient(args: {
    extensionInstalled: boolean;
    id: SupportedIntegration["id"];
    serverConnectedIds: ReadonlySet<IntegrationId>;
}) {
    const { extensionInstalled, id, serverConnectedIds } = args;
    if (serverConnectedIds.has(id)) {
        return true;
    }

    return (
        extensionInstalled &&
        (EXTENSION_INTEGRATION_IDS as readonly string[]).includes(id)
    );
}

export function LibrarySidebarIntegrations({
    items,
    locale,
    parkedIntegrationIds = [],
    serverConnectedIntegrationIds,
}: LibrarySidebarIntegrationsProps) {
    const extensionInstalled = useExtensionInstalled();
    const parkedIntegrationIdSet = new Set(parkedIntegrationIds);
    const serverConnectedIds = new Set(serverConnectedIntegrationIds);
    const connectedIntegrationIds = INTEGRATIONS.flatMap(({ id }) =>
        isConnectedOnClient({ extensionInstalled, id, serverConnectedIds })
            ? [id]
            : []
    );

    return (
        <Collapsible className="flex flex-col gap-3" defaultOpen>
            <CollapsibleTrigger
                render={
                    <IntegrationSetupWizardButton
                        connectedIntegrationIds={connectedIntegrationIds}
                        items={items}
                    />
                }
            />
            <CollapsiblePanel className="flex flex-col gap-1">
                {INTEGRATIONS.map(({ id, label, description, Icon }) => (
                    <div className="flex items-center gap-2" key={id}>
                        <Avatar
                            aria-label={label}
                            className="size-10 rounded-lg ring-1 ring-border/60"
                        >
                            <AvatarFallback className="rounded-lg bg-card text-foreground">
                                <Icon aria-hidden className="size-5 shrink-0" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="font-medium text-sm">{label}</span>
                            <span className="text-[11px] text-muted-foreground leading-tight">
                                {description}
                            </span>
                        </div>
                        <SidebarIntegrationAction
                            connected={connectedIntegrationIds.includes(id)}
                            extensionInstalled={extensionInstalled}
                            id={id}
                            locale={locale}
                            parked={parkedIntegrationIdSet.has(id)}
                        />
                    </div>
                ))}
                <div className="mt-1 flex items-center gap-2 py-2 pl-3">
                    <Info className="inline-block size-3.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-tight">
                        Please only connect accounts you fully trust. Cache can
                        access what you choose to save with connected apps. You
                        can always change your mind.
                    </p>
                </div>
            </CollapsiblePanel>
        </Collapsible>
    );
}
