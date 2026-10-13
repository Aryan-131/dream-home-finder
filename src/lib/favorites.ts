import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites(userId: string | undefined) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: ids = [] } = useQuery({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("property_id");
      return (data ?? []).map((f) => f.property_id);
    },
  });
  const toggle = async (propertyId: string) => {
    if (!userId) {
      toast("Sign in to save favorites");
      navigate({ to: "/auth" });
      return;
    }
    if (ids.includes(propertyId)) {
      await supabase.from("favorites").delete().eq("property_id", propertyId).eq("user_id", userId);
    } else {
      await supabase.from("favorites").insert({ property_id: propertyId, user_id: userId });
      toast.success("Saved to favorites");
    }
    qc.invalidateQueries({ queryKey: ["favorites"] });
  };
  return { ids, toggle };
}
