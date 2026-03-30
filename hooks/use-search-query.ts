import { parseAsString, useQueryState } from "nuqs";

export function useSearchQuery() {
    return useQueryState("search", parseAsString.withDefault(""));
}
