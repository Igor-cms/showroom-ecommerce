import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface VaultApplication {
  id: string;
  name: string;
  cell: string;
  email: string;
  shop: string;
  instagram: string | null;
  price_range_min: number;
  price_range_max: number;
  lot_size: string;
  sensory_profile: string[];
  status: string;
  notes: string | null;
  created_at: string;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export const useVaultApplications = (dateRange?: DateRange, status?: string) => {
  return useQuery({
    queryKey: ['vault-applications', dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString(), status],
    queryFn: async () => {
      let query = supabase
        .from('vault_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateRange?.startDate) {
        query = query.gte('created_at', format(dateRange.startDate, 'yyyy-MM-dd'));
      }

      if (dateRange?.endDate) {
        query = query.lte('created_at', format(dateRange.endDate, 'yyyy-MM-dd') + 'T23:59:59');
      }

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return data as VaultApplication[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
