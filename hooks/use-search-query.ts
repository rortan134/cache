import { parseAsString, useQueryState } from "nuqs";

function useSearchQuery() {
    return useQueryState("search", parseAsString.withDefault(""));
}

export { useSearchQuery };
