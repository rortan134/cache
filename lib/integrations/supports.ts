import {
    Instagram,
    Photos,
    // Pinterest, // disabled until Pinterest API approval
    TikTok,
} from "@/components/shared/integration-icons";
import type { ComponentType, SVGProps } from "react";

export type IntegrationCategory = "media" | "social";

export type IntegrationIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type IntegrationId =
    | "google-photos"
    | "instagram"
    // | "pinterest" // disabled until Pinterest API approval
    | "tiktok";

/**
 * Integrations that correspond to `LibraryItem.source` for extension bookmark sync.
 * Extend when Prisma adds a matching `LibraryItemSource` value.
 */
export const LIBRARY_BOOKMARK_SYNC_INTEGRATION_IDS = [
    "instagram",
    "tiktok",
] as const satisfies readonly IntegrationId[];

export interface SupportedIntegration {
    readonly capabilities: {
        readonly bookmarks: boolean;
    };
    readonly category: IntegrationCategory;
    readonly description: string;
    readonly Icon: IntegrationIcon;
    readonly id: IntegrationId;
    readonly label: string;
}

export const INTEGRATIONS = [
    {
        capabilities: { bookmarks: true },
        category: "social",
        description: "Posts you save to Favorites.",
        Icon: Instagram,
        id: "instagram",
        label: "Instagram",
    },
    {
        capabilities: { bookmarks: true },
        category: "social",
        description: "Videos in your Favorites.",
        Icon: TikTok,
        id: "tiktok",
        label: "TikTok",
    },
    {
        capabilities: { bookmarks: true },
        category: "media",
        description: "Photos and albums you have starred.",
        Icon: Photos,
        id: "google-photos",
        label: "Google Photos",
    },
    // Pinterest — disabled until API approval
    // {
    //     capabilities: { bookmarks: true },
    //     category: "social",
    //     description: "Pins you save to boards.",
    //     Icon: Pinterest,
    //     id: "pinterest",
    //     label: "Pinterest",
    // },
] satisfies readonly SupportedIntegration[];

const INTEGRATION_BY_ID = new Map<IntegrationId, SupportedIntegration>(
    INTEGRATIONS.map((item) => [item.id, item])
);

const INTEGRATION_ID_SET = new Set<IntegrationId>(
    INTEGRATIONS.map((item) => item.id)
);

export function isIntegrationId(value: unknown): value is IntegrationId {
    return (
        typeof value === "string" &&
        INTEGRATION_ID_SET.has(value as IntegrationId)
    );
}

export function assertIntegrationId(value: unknown): IntegrationId {
    if (!isIntegrationId(value)) {
        throw new TypeError(
            `Expected IntegrationId, received: ${String(value)}`
        );
    }
    return value;
}

export function getIntegration(id: IntegrationId): SupportedIntegration {
    const row = INTEGRATION_BY_ID.get(id);
    if (!row) {
        throw new TypeError(`Missing integration definition for id: ${id}`);
    }
    return row;
}

export function findIntegrationById(
    value: unknown
): SupportedIntegration | undefined {
    if (!isIntegrationId(value)) {
        return undefined;
    }
    return INTEGRATION_BY_ID.get(value);
}

export function listIntegrations(
    predicate?: (item: SupportedIntegration) => boolean
): readonly SupportedIntegration[] {
    return predicate ? INTEGRATIONS.filter(predicate) : INTEGRATIONS;
}

export function integrationsInCategory(
    category: IntegrationCategory
): readonly SupportedIntegration[] {
    return INTEGRATIONS.filter((item) => item.category === category);
}

export function integrationIds(): readonly IntegrationId[] {
    return INTEGRATIONS.map((item) => item.id);
}

export function filterToIntegrationIds(
    values: readonly string[]
): IntegrationId[] {
    return values.filter(isIntegrationId);
}

export function integrationCapability<
    K extends keyof SupportedIntegration["capabilities"],
>(id: IntegrationId, key: K): SupportedIntegration["capabilities"][K] {
    return getIntegration(id).capabilities[key];
}

export function integrationHasCapability<
    K extends keyof SupportedIntegration["capabilities"],
>(id: IntegrationId, key: K): boolean {
    return Boolean(getIntegration(id).capabilities[key]);
}

export function recordHasIntegrationId<K extends string>(
    record: Record<K, unknown>,
    key: K
): record is Record<K, IntegrationId> & typeof record {
    return isIntegrationId(record[key]);
}
