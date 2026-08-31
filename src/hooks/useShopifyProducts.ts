import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShopifyVariant {
  id: string;
  countryCode: string;
  option1?: string | null;
  option2?: string | null;
  inventoryQuantity?: number;
}

export interface ShopifyProduct {
  id: string;
  name: string;
  origin: string;
  producer: string;
  process: string;
  sensory: string;
  varietal?: string | null;
  prices: Record<string, number>;
  variants: Record<string, ShopifyVariant>; // maps size to variant object with id and countryCode
  available: boolean;
  inventoryQuantity: number;
  status?: string;
  category: string;
  tags: string[];
}

export interface ProductsByCategory {
  BASE: ShopifyProduct[];
  ESSENTIALS: ShopifyProduct[];
  'TOP SHELF': ShopifyProduct[];
  COMPETITION: ShopifyProduct[];
  EXOTIC: ShopifyProduct[];
  'HYPER LIMITED': ShopifyProduct[];
  'BOX SETS': ShopifyProduct[];
}

export const useShopifyProducts = () => {
  return useQuery({
    queryKey: ['shopify-products'],
    queryFn: async (): Promise<ProductsByCategory> => {
      console.log('Fetching Shopify products...');
      
      const { data, error } = await supabase.functions.invoke('get-shopify-products');
      
      if (error) {
        console.error('Error fetching Shopify products:', error);
        throw new Error('Failed to fetch products from Shopify');
      }

      const products: ShopifyProduct[] = data?.products || [];
      console.log('Received products:', products.length);

      // Group products by category
      const productsByCategory: ProductsByCategory = {
        BASE: [],
        ESSENTIALS: [],
        'TOP SHELF': [],
        COMPETITION: [],
        EXOTIC: [],
        'HYPER LIMITED': [],
        'BOX SETS': []
      };

      // Filter products to show only those with "new" or "wholesale" tags
      products
        .filter(product => {
          const hasValidTag = product.tags.includes('new') && product.tags.includes('wholesale');
          
          return hasValidTag &&
            product.available &&
            Object.keys(product.prices).length > 0 &&
            Object.values(product.prices).some(price => price > 0);
        })
        .forEach(product => {
          const category = product.category as keyof ProductsByCategory;
          if (productsByCategory[category]) {
            productsByCategory[category].push(product);
          } else {
            // Default to BASE if category not recognized
            productsByCategory.BASE.push(product);
          }
        });

      console.log('Products grouped by category:', {
        BASE: productsByCategory.BASE.length,
        ESSENTIALS: productsByCategory.ESSENTIALS.length,
        'TOP SHELF': productsByCategory['TOP SHELF'].length,
        COMPETITION: productsByCategory.COMPETITION.length,
        EXOTIC: productsByCategory.EXOTIC.length,
        'HYPER LIMITED': productsByCategory['HYPER LIMITED'].length,
        'BOX SETS': productsByCategory['BOX SETS'].length
      });

      return productsByCategory;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};