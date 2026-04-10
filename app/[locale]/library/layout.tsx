import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type * as React from "react";

const FeedbackFloatingWidget = dynamic(() =>
    import("@/components/feedback/feedback-floating-widget").then(
        (mod) => mod.FeedbackFloatingWidget
    )
);

export default function LibraryLayout({ children }: React.PropsWithChildren) {
    return (
        <NuqsAdapter>
            {children}
            <FeedbackFloatingWidget />
        </NuqsAdapter>
    );
}
