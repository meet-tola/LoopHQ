import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const router = useRouter();

  const {
    setAuth,
    clearAuth,
    user,
    isAuthenticated,
    isLoadingStore,
  } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const refresh = await AuthService.refreshSession();
      const token = refresh.access_token;

      useAuthStore.getState().setAccessToken(token);

      const profile = await AuthService.getMe({
        headers: { Authorization: `Bearer ${token}` }
      });

      return {
        user: profile.data,
        token,
      };
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setAuth(data.user, data.token);
    }

    if (isError) {
      clearAuth();
      router.replace("/auth/login");
    }
  }, [data, isError]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isLoadingStore,
  };
}