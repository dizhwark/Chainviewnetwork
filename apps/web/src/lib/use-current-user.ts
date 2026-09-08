"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";

export interface CurrentUser {
  userId: string;
  email: string;
  role: "CUSTOMER" | "PLUMBER" | "SUPPORT_AGENT" | "ADMIN" | "SUPER_ADMIN";
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        return await apiClient.get<CurrentUser>("/auth/me");
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) return null;
        throw err;
      }
    },
    retry: false,
  });
}
