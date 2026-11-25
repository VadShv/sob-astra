"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { parseApiError } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            const msg = parseApiError(error);
            if (msg !== "Необходима авторизация") {
              console.error("[query]", msg);
            }
          },
        }),
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 30_000,
            refetchOnMount: true,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
