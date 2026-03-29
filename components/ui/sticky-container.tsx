"use client";

import { Slot } from "@radix-ui/react-slot";
import { useComposedRefs } from "motion/react";
import { useStickyBox } from "react-sticky-box";

type StickyContainerProps = React.ComponentProps<typeof Slot> & {
    offsetTop?: number;
};

const StickyContainer = ({
    ref,
    offsetTop = 12,
    ...props
}: StickyContainerProps) => {
    const internalRef = useStickyBox({ offsetTop });
    const composedRefs = useComposedRefs(ref, internalRef);

    return <Slot {...props} ref={composedRefs} />;
};

export { StickyContainer };
