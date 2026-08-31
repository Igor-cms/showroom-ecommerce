import { useEffect, useRef, useState } from "react";

interface ShopifyBuyButtonProps {
  productId: string;
  variantId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    ShopifyBuy?: any;
  }
}

const ShopifyBuyButton = ({ 
  productId, 
  variantId, 
  quantity = 1, 
  disabled = false,
  className = ""
}: ShopifyBuyButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🛒 ShopifyBuyButton mounted:', { productId, variantId, quantity, disabled });
    
    const initShopify = () => {
      console.log('🔄 Attempting Shopify initialization...');
      console.log('📦 ShopifyBuy object:', window.ShopifyBuy);
      
      if (window.ShopifyBuy?.UI) {
        try {
          const domain = '40c504-61.myshopify.com';
          const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
          
          console.log('🔧 Building Shopify client with:', { domain, tokenLength: token.length });
          
          const shopifyClient = window.ShopifyBuy.buildClient({
            domain: domain,
            storefrontAccessToken: token,
          });
          
          console.log('✅ Shopify client created:', shopifyClient);
          setClient(shopifyClient);
          setIsLoading(false);
        } catch (err) {
          console.error('❌ Error creating Shopify client:', err);
          setError('Failed to initialize Shopify');
          setIsLoading(false);
        }
      } else {
        console.log('⏳ ShopifyBuy not ready, retrying...');
        setTimeout(initShopify, 100);
      }
    };

    initShopify();
  }, []);

  useEffect(() => {
    console.log('🎯 Button effect triggered:', { client: !!client, buttonRef: !!buttonRef.current, disabled, productId, variantId });
    
    if (!client || !buttonRef.current || disabled || !productId || !variantId) {
      console.log('⏭️ Skipping button creation:', { 
        hasClient: !!client, 
        hasButtonRef: !!buttonRef.current, 
        disabled, 
        hasProductId: !!productId, 
        hasVariantId: !!variantId 
      });
      return;
    }

    try {
      console.log('🎨 Creating Shopify UI component...');
      console.log('📥 Raw IDs received:', { productId, variantId, quantity });
      
      const ui = window.ShopifyBuy.UI.init(client);
      
      // Strip any existing GID prefixes and extract the numeric ID
      const cleanProductId = productId
        .replace(/gid:\/\/shopify\/Product\//g, '')
        .trim();
      const cleanVariantId = variantId
        .replace(/gid:\/\/shopify\/ProductVariant\//g, '')
        .trim();
      
      console.log('🧹 Cleaned IDs:', { cleanProductId, cleanVariantId });
      
      // Now add the proper GID format once
      const gidProductId = `gid://shopify/Product/${cleanProductId}`;
      const gidVariantId = `gid://shopify/ProductVariant/${cleanVariantId}`;
      
      console.log('✅ Final GID format:', { gidProductId, gidVariantId, quantity });
      
      ui.createComponent('product', {
        id: gidProductId,
        node: buttonRef.current,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
          product: {
            iframe: false,
            variantId: gidVariantId,
            quantity: quantity,
            contents: {
              img: false,
              title: false,
              price: false,
              description: false,
              options: false,
              quantityInput: false,
            },
            text: {
              button: 'ADD TO CART',
            },
            styles: {
              button: {
                'font-family': 'Inter, sans-serif',
                'font-size': '14px',
                'padding': '8px 16px',
                'border-radius': '9999px',
                'background-color': '#F5F1E8',
                'color': '#1A1A1A',
                ':hover': {
                  'background-color': '#E8E4DA',
                },
                ':disabled': {
                  'background-color': '#E5E7EB',
                  'color': '#9CA3AF',
                  'cursor': 'not-allowed',
                },
              },
            },
          },
          cart: {
            styles: {
              button: {
                'font-family': 'Inter, sans-serif',
                'font-size': '14px',
                'padding': '12px 24px',
                'border-radius': '8px',
                'background-color': '#1A1A1A',
                'color': '#F5F1E8',
                ':hover': {
                  'background-color': '#333333',
                },
              },
            },
          },
          toggle: {
            styles: {
              toggle: {
                'background-color': '#1A1A1A',
                ':hover': {
                  'background-color': '#333333',
                },
              },
            },
          },
        },
      });
      
      console.log('✅ Shopify component created successfully');
    } catch (err) {
      console.error('❌ Error creating Shopify component:', err);
      setError('Failed to create buy button');
    }

    return () => {
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
      }
    };
  }, [client, productId, variantId, quantity, disabled]);

  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <button
        onClick={() => window.open(`https://40c504-61.myshopify.com/products/${productId}`, '_blank')}
        className="px-4 py-2 rounded-full text-sm font-medium bg-bg-cream text-ink hover:bg-bg-cream/80 transition-colors"
      >
        VIEW PRODUCT
      </button>
    );
  }

  if (disabled) {
    console.log('🚫 Rendering disabled state');
    return (
      <button
        disabled
        className="px-4 py-2 rounded-full text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed"
      >
        UNAVAILABLE
      </button>
    );
  }

  if (isLoading) {
    console.log('⏳ Rendering loading state');
    return (
      <button
        disabled
        className="px-4 py-2 rounded-full text-sm font-medium bg-bg-cream text-ink"
      >
        LOADING...
      </button>
    );
  }

  console.log('✅ Rendering button container');
  return <div ref={buttonRef} className={className} />;
};

export default ShopifyBuyButton;
