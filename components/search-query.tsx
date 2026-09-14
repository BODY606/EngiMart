"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchQueryValue = {
  query: string;
  setQuery: (value: string) => void;
  submit: (value?: string) => void;
};

const SearchQueryContext = createContext<SearchQueryValue | null>(null);

const idleSearch: SearchQueryValue = {
  query: "",
  setQuery: () => {},
  submit: () => {},
};

function SearchQueryOnPath({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const submit = useCallback(
    (value?: string) => {
      const next = (value ?? query).trim();
      setQuery(next);
      const url = next ? `/?q=${encodeURIComponent(next)}` : "/";
      if (pathname === "/") {
        window.history.replaceState(null, "", url);
        return;
      }
      router.push(url);
    },
    [pathname, query, router],
  );

  const value = useMemo(
    () => ({ query, setQuery, submit }),
    [query, submit],
  );

  return (
    <SearchQueryContext.Provider value={value}>
      {children}
    </SearchQueryContext.Provider>
  );
}

function SearchQueryInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <SearchQueryOnPath key={pathname}>{children}</SearchQueryOnPath>;
}

export function SearchQueryProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <SearchQueryContext.Provider value={idleSearch}>
          {children}
        </SearchQueryContext.Provider>
      }
    >
      <SearchQueryInner>{children}</SearchQueryInner>
    </Suspense>
  );
}

export function useSearchQuery() {
  const ctx = useContext(SearchQueryContext);
  if (!ctx) {
    throw new Error("useSearchQuery must be used within SearchQueryProvider");
  }
  return ctx;
}
