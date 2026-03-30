import { NuqsAdapter } from "nuqs/adapters/next/app";
import type * as React from "react";

export default function LibraryLayout({ children }: React.PropsWithChildren) {
    return <NuqsAdapter>{children}</NuqsAdapter>;
}
