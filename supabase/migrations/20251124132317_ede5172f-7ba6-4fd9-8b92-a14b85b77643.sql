-- Fix database functions to include fixed search_path for security
-- This prevents search path manipulation attacks

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix get_daily_sales_aggregated function
CREATE OR REPLACE FUNCTION public.get_daily_sales_aggregated(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
RETURNS TABLE(date text, cumulative_retail numeric, cumulative_wholesale numeric, cumulative_total numeric)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH daily_totals AS (
    SELECT 
      DATE(sco.order_date) as order_date,
      COALESCE(
        SUM(CASE 
          WHEN sc.customer_type = 'wholesale' THEN sco.total_price 
          ELSE 0 
        END), 
        0
      ) as wholesale_revenue,
      COALESCE(
        SUM(CASE 
          WHEN sc.customer_type != 'wholesale' OR sc.customer_type IS NULL 
          THEN sco.total_price 
          ELSE 0 
        END), 
        0
      ) as retail_revenue
    FROM shopify_customer_orders sco
    LEFT JOIN shopify_customers sc ON sco.customer_id = sc.id
    WHERE sco.user_id = p_user_id
      AND sco.order_date >= p_start_date
      AND sco.order_date <= p_end_date
    GROUP BY DATE(sco.order_date)
  )
  SELECT 
    TO_CHAR(order_date, 'YYYY-MM-DD') as date,
    SUM(retail_revenue) OVER (ORDER BY order_date)::NUMERIC as cumulative_retail,
    SUM(wholesale_revenue) OVER (ORDER BY order_date)::NUMERIC as cumulative_wholesale,
    (SUM(retail_revenue) OVER (ORDER BY order_date) + 
     SUM(wholesale_revenue) OVER (ORDER BY order_date))::NUMERIC as cumulative_total
  FROM daily_totals
  ORDER BY order_date;
END;
$function$;