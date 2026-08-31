import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coupon_code: couponCode, start_date: startDate, end_date: endDate } = await req.json().catch(() => ({}));
    
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const adminToken = Deno.env.get('SHOPIFY_ADMIN_TOKEN');

    if (!shopifyDomain || !adminToken) {
      throw new Error('Shopify credentials not configured');
    }

    console.log('Fetching orders from Shopify Admin API', { startDate, endDate, couponCode });

    // Build Shopify URL with date filters
    let shopifyUrl = `https://${shopifyDomain}/admin/api/2024-01/orders.json?status=any&limit=250`;
    
    if (startDate) {
      shopifyUrl += `&created_at_min=${startDate}T00:00:00Z`;
    }
    if (endDate) {
      shopifyUrl += `&created_at_max=${endDate}T23:59:59Z`;
    }
    
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error:', errorText);
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.orders?.length || 0} total orders`);

    // Filter orders that have discount codes
    let ordersWithCoupons = data.orders.filter((order: any) => 
      order.discount_codes && order.discount_codes.length > 0
    );

    console.log(`Found ${ordersWithCoupons.length} orders with discount codes`);

    // If specific coupon code is provided, filter further
    if (couponCode) {
      ordersWithCoupons = ordersWithCoupons.filter((order: any) =>
        order.discount_codes.some((dc: any) => 
          dc.code.toLowerCase() === couponCode.toLowerCase()
        )
      );
      console.log(`Filtered to ${ordersWithCoupons.length} orders with coupon: ${couponCode}`);
    }

    // Transform orders - grouped by order with line_items array
    const transformedOrders = ordersWithCoupons.map((order: any) => ({
      order_number: order.name,
      order_id: order.id,
      customer_name: order.customer 
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Guest'
        : 'Guest',
      discount_codes: order.discount_codes.map((dc: any) => dc.code).join(', '),
      total_discount: parseFloat(order.total_discounts || '0'),
      total_price: parseFloat(order.total_price || '0'),
      subtotal_price: parseFloat(order.subtotal_price || '0'),
      shipping_total: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
      tax_total: parseFloat(order.total_tax || '0'),
      order_date: order.created_at,
      financial_status: order.financial_status,
      currency: order.currency,
      items_count: order.line_items.length,
      line_items: order.line_items.map((item: any) => ({
        product_name: item.title,
        variant_title: item.variant_title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total_price: parseFloat(item.price) * item.quantity,
      }))
    }));

    console.log(`Returning ${transformedOrders.length} orders with coupon codes`);

    return new Response(
      JSON.stringify({ orders: transformedOrders }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in get-coupon-orders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
