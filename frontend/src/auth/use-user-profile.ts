import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile } from "@/api/workspace-service";
import { useAuth } from "./auth-context";

export function useUserProfile() {
  const { session, status } = useAuth();
  const user = session?.user ?? null;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-profile", user?.id ?? "", user?.email ?? ""],
    queryFn: () => getUserProfile(user),
    enabled: !!user,
    staleTime: 0,
  });

  useEffect(() => {
    const handleAvatarUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    };
    window.addEventListener("neroxa:user-avatar-updated", handleAvatarUpdate);
    return () => {
      window.removeEventListener("neroxa:user-avatar-updated", handleAvatarUpdate);
    };
  }, [queryClient]);

  return {
    profile: query.data ?? null,
    isPending: !!user && query.isPending,
    session,
    authStatus: status,
  };
}
