"use client";

import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { message } from "antd";
import { useState, type ReactNode } from "react";
import { parseApiError } from "@/lib/api";
import { logger } from "@/lib/logger";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            const msg = parseApiError(error);
            if (msg === "Необходима авторизация") return;
            logger.error("[query]", query.queryKey, msg);
            if (query.state.data === undefined) {
              message.error(msg);
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
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
