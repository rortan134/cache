"use client";

import { IntegrationSetupWizard } from "@/components/library/setup-wizard";
import { SidebarIntegrationAction } from "@/components/library/sidebar-integration-action";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Collapsible,
    CollapsiblePanel,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    type IntegrationId,
    INTEGRATIONS,
    type SupportedIntegration,
} from "@/lib/integrations/supports";
import { useExtensionInstalled } from "@/hooks/use-extension-installed";
import type { LibraryItemSource } from "@/prisma/client/enums";

type LibrarySidebarIntegrationsProps = Readonly<{
    items: readonly { readonly source: LibraryItemSource }[];
    locale: string;
    parkedIntegrationIds?: readonly IntegrationId[];
    serverConnectedIntegrationIds: readonly IntegrationId[];
}>;

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
        <Collapsible defaultOpen>
            <div className="flex flex-col gap-3 text-balance">
                <CollapsibleTrigger
                    render={
                        <IntegrationSetupWizard
                            connectedIntegrationIds={connectedIntegrationIds}
                            items={items}
                        />
                    }
                />
                <CollapsiblePanel>
                    <ul className="flex flex-col gap-1">
                        {INTEGRATIONS.map(
                            ({ id, label, description, Icon }) => (
                                <li key={id}>
                                    <div className="flex items-center gap-2 rounded-xl py-2 pr-2">
                                        <Avatar
                                            aria-label={label}
                                            className="size-10 rounded-lg ring-1 ring-border/60"
                                        >
                                            <AvatarFallback className="rounded-lg bg-card text-foreground">
                                                <Icon
                                                    aria-hidden
                                                    className="size-5 shrink-0"
                                                />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <span className="font-medium text-sm">
                                                {label}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground leading-snug">
                                                {description}
                                            </span>
                                        </div>
                                        <SidebarIntegrationAction
                                            connected={connectedIntegrationIds.includes(
                                                id
                                            )}
                                            extensionInstalled={
                                                extensionInstalled
                                            }
                                            id={id}
                                            locale={locale}
                                            parked={parkedIntegrationIdSet.has(
                                                id
                                            )}
                                        />
                                    </div>
                                </li>
                            )
                        )}
                    </ul>
                </CollapsiblePanel>
            </div>
        </Collapsible>
    );
}
