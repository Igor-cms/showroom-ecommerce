import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface LineItem {
  product_name: string;
  variant_title: string;
  quantity: number;
  price: number;
  total_price: number;
}

export interface CouponOrder {
  order_number: string;
  order_id: number;
  customer_name: string;
  discount_codes: string;
  total_discount: number;
  total_price: number;
  subtotal_price: number;
  shipping_total: number;
  tax_total: number;
  order_date: string;
  financial_status: string;
  currency: string;
  items_count: number;
  line_items: LineItem[];
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export const useCouponOrders = (couponCode?: string, dateRange?: DateRange) => {
  return useQuery({
    queryKey: ['coupon-orders', couponCode, dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-coupon-orders', {
        body: { 
          coupon_code: couponCode,
          start_date: dateRange?.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined,
          end_date: dateRange?.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined
        }
      });

      if (error) throw error;
      
      return data.orders as CouponOrder[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
