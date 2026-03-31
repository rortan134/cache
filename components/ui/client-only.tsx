"use client";

import * as React from "react";

// biome-ignore lint/suspicious/noEmptyBlockStatements: NOOP
const doNothing = () => {};

const useClientOnlyValue = <T,>(value: T, fallback?: T): T | null => {
    const getSnapshots = React.useMemo(
        () => [() => "client", () => "server"] as const,
        [],
    );
    const boundaryValue = React.useSyncExternalStore(
        () => doNothing,
        getSnapshots[0],
        getSnapshots[1],
    );
    return boundaryValue === "server" ? (fallback ?? null) : value;
};

function ClientOnly(props: React.PropsWithChildren) {
    const getSnapshots = React.useMemo(
        () => [() => "client", () => "server"] as const,
        [],
    );
    const boundaryValue = React.useSyncExternalStore(
        () => doNothing,
        getSnapshots[0],
        getSnapshots[1],
    );
    return boundaryValue === "server" ? null : <React.Fragment {...props} />;
}

export { ClientOnly, useClientOnlyValue };
