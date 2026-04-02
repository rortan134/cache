export const canUseDOM =
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof document.createElement === "function";

export function getOwnerWindow(node: Node | null) {
    if (!canUseDOM) {
        throw new Error("Cannot access window outside of the DOM");
    }
    return node?.ownerDocument?.defaultView ?? window;
}

export function getOwnerDocument(node: Node | null) {
    if (!canUseDOM) {
        throw new Error("Cannot access document outside of the DOM");
    }
    return node?.ownerDocument ?? document;
}
