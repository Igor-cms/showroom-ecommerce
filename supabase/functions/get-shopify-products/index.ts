import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  console.log('get-shopify-products function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
    const adminToken = Deno.env.get('SHOPIFY_ADMIN_TOKEN');

    console.log('Environment check - Domain exists:', !!shopifyDomain, 'Token exists:', !!adminToken);

    if (!shopifyDomain || !adminToken) {
      const errorMsg = `Missing Shopify credentials - Domain: ${!!shopifyDomain}, Token: ${!!adminToken}`;
      console.error(errorMsg);
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching products from Shopify:', shopifyDomain);

    const response = await fetch(`https://${shopifyDomain}/admin/api/2023-10/products.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': adminToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched products count:', data.products?.length || 0);

    // Only include products with status === 'active' (excludes draft and archived/unlisted)
    const activeProducts = data.products?.filter((product: any) => {
      console.log(`Product "${product.title}" status:`, product.status);
      return product.status === 'active';
    });
    console.log('Active products only:', activeProducts?.length || 0);

    // Transform Shopify products to our format
    const transformedProducts = activeProducts?.map((product: any) => {
      console.log('=== PRODUCT STRUCTURE ===');
      console.log('Title:', product.title);
      console.log('Tags:', product.tags);
      console.log('Product Type:', product.product_type);
      console.log('Description/Body HTML:', product.body_html ? product.body_html.substring(0, 200) + '...' : 'No description');
      console.log('Metafields:', product.metafields || 'No metafields');
      console.log('Variants:', product.variants?.map((v: any) => ({ title: v.title, price: v.price })) || 'No variants');
      console.log('========================');
      
      // Extract category from multiple possible sources
      let category = 'BASE'; // default
      
      // Method 1: Look for coffee-level: tag
      if (product.tags) {
        const tags = product.tags.split(',').map((tag: string) => tag.trim());
        console.log('Parsed tags:', tags);
        
        const categoryTag = tags.find((tag: string) => 
          tag.toLowerCase().startsWith('coffee-level:') || 
          tag.toLowerCase().startsWith('level:') ||
          tag.toLowerCase().startsWith('category:')
        );
        
        if (categoryTag) {
          const parts = categoryTag.split(':');
          if (parts.length > 1) {
            let rawCategory = parts[1].trim().toUpperCase();
            // Handle both TOP-SHELF and TOP SHELF formats
            if (rawCategory === 'TOP-SHELF') {
              category = 'TOP SHELF';
            } else {
              category = rawCategory;
            }
          }
        } else {
          // Method 2: Look for direct category tags
          const directCategory = tags.find((tag: string) => {
            const upperTag = tag.toUpperCase();
            return ['BASE', 'ESSENTIALS', 'TOP SHELF', 'TOP-SHELF', 'COMPETITION', 'EXOTIC', 'HYPER LIMITED', 'HYPER-LIMITED', 'BOX SETS', 'BOX-SETS', 'BOX SET', 'BOX-SET'].includes(upperTag);
          });
          
          if (directCategory) {
            let categoryName = directCategory.toUpperCase();
            // Normalize variations to standard names
            if (categoryName === 'TOP-SHELF') {
              category = 'TOP SHELF';
            } else if (categoryName === 'HYPER-LIMITED') {
              category = 'HYPER LIMITED';
            } else if (categoryName === 'BOX-SETS' || categoryName === 'BOX SET' || categoryName === 'BOX-SET') {
              category = 'BOX SETS';
            } else {
              category = categoryName;
            }
          }
        }
      }
      
      // Method 3: Use product type as fallback
      if (category === 'BASE' && product.product_type) {
        const productType = product.product_type.toUpperCase();
        if (['BASE', 'ESSENTIALS', 'TOP SHELF', 'COMPETITION', 'EXOTIC', 'HYPER LIMITED', 'HYPER-LIMITED', 'BOX SETS', 'BOX-SETS', 'BOX SET', 'BOX-SET'].includes(productType)) {
          if (productType === 'HYPER-LIMITED') category = 'HYPER LIMITED';
          else if (productType === 'BOX-SETS' || productType === 'BOX SET' || productType === 'BOX-SET') category = 'BOX SETS';
          else category = productType;
        }
      }
      
      // Method 4: Title-based fallback for Box Sets (overrides other categories)
      if (product.title && product.title.toLowerCase().includes('box set')) {
        category = 'BOX SETS';
      }

      console.log('Final category for', product.title, ':', category);

      // Extract coffee-specific data from metafields or product description
      const origin = extractMetafield(product, 'origin') || 'Unknown Origin';
      const producer = extractMetafield(product, 'producer') || 'Unknown Producer';
      const process = extractMetafield(product, 'process') || 'Unknown Process';
      const sensory = extractMetafield(product, 'sensory') || 'Tasting notes available upon request';
      const varietal = extractMetafield(product, 'varietal') || null;

      // Build prices object and variants mapping
      const prices: Record<string, number> = {};
      const variants: Record<string, any> = {}; // maps size to variant object with id and countryCode
      
      product.variants?.forEach((variant: any, index: number) => {
        // Add detailed logging for the first variant of each product to investigate structure
        if (index === 0) {
          console.log('\n=== VARIANT DEBUGGING FOR:', product.title, '===');
          console.log('Full variant object keys:', Object.keys(variant));
          console.log('Variant ID:', variant.id);
          console.log('Variant Title:', variant.title);
          console.log('Variant Price:', variant.price);
          console.log('Variant SKU:', variant.sku);
          console.log('Variant barcode:', variant.barcode);
          console.log('Variant country_code_of_origin:', variant.country_code_of_origin);
          console.log('Variant harmonized_system_code:', variant.harmonized_system_code);
          console.log('Variant shipping:', variant.shipping);
          console.log('Variant origin_country:', variant.origin_country);
          
          // Log any field that might contain country info
          const possibleCountryFields = Object.keys(variant).filter(key => 
            key.toLowerCase().includes('country') || 
            key.toLowerCase().includes('origin') ||
            key.toLowerCase().includes('shipping')
          );
          console.log('Fields containing country/origin/shipping:', possibleCountryFields);
          possibleCountryFields.forEach(field => {
            console.log(`  ${field}:`, variant[field]);
          });
          console.log('=== END VARIANT DEBUG ===\n');
        }
        
        if (variant.price) {
          const isDefaultVariant = !variant.title || variant.title.toLowerCase() === 'default title';
          const variantLabel = isDefaultVariant
            ? (product.title?.toLowerCase().includes('box set') ? 'Box Set' : 'Unit')
            : variant.title;

          prices[variantLabel] = parseFloat(variant.price);
          
          // Extract country code from variant shipping data
          // Try multiple possible locations
          const countryCode = variant.country_code_of_origin || 
                             variant.shipping?.country_code_of_origin || 
                             variant.origin_country ||
                             '';
          
          console.log(`Country code for ${product.title} - ${variant.title}:`, countryCode);
          
          // Store variant with country suffix to prevent overwriting
          // If title already has suffix, use as is; otherwise determine from context
          const variantKey = variantLabel;
          variants[variantKey] = {
            id: variant.id.toString(),
            countryCode: countryCode,
            option1: isDefaultVariant ? variantLabel : (variant.option1 || null),
            option2: variant.option2 || null,
            inventoryQuantity: variant.inventory_quantity || 0
          };
        }
      });

      // Parse tags into array
      const tags = product.tags ? product.tags.split(',').map((tag: string) => tag.trim().toLowerCase()) : [];
      
      return {
        id: product.id.toString(),
        name: product.title.toUpperCase(),
        origin,
        producer,
        process,
        sensory,
        varietal,
        prices,
        variants, // Add variants mapping
        available: product.status === 'active' && (
          product.variants?.some((v: any) => v.inventory_quantity > 0) || 
          product.variants?.[0]?.inventory_policy === 'continue'
        ),
        inventoryQuantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
        status: product.status !== 'active' ? 'MORE COMING SOON' : undefined,
        category,
        tags
      };
    }) || [];

    console.log('Transformed products:', transformedProducts.length);

    // Hardcoded override for Arcadia - Diego Bermudez (handles all name variations)
    transformedProducts.forEach((product: any) => {
      if (product.name.toUpperCase().includes('ARCADIA - DIEGO BERMUDEZ')) {
        console.log('🔧 Applying hardcoded data for ARCADIA - DIEGO BERMUDEZ to:', product.name);
        product.origin = 'Colombia';
        product.producer = 'Diego Bermudez';
        product.process = '60% Washed Castillo / 40% Double Anaerobic Thermal Shock Castillo';
        product.sensory = 'CHOCOLATE COVERED RASPBERRY, CREAMY, CHERRY, SWEET';
        product.varietal = 'Castillo';
      }

      // Hardcoded override for Ember - Diego Bermudez (handles all name variations)
      if (product.name.toUpperCase().includes('EMBER - DIEGO BERMUDEZ')) {
        console.log('🔧 Applying hardcoded data for EMBER - DIEGO BERMUDEZ to:', product.name);
        product.origin = 'Colombia';
        product.producer = 'Diego Bermudez';
        product.process = '90% Washed Castillo / 10% Double Anaerobic Thermal Shock Castillo';
        product.sensory = 'Chocolate Mousse, Puff Pastry, Cinnamon, Baked Apple';
        product.varietal = 'Castillo';
      }
    });

    // ── Metafield backfill ────────────────────────────────────────────────
    // Everything above can only ever read the product DESCRIPTION: the REST
    // products.json endpoint does not include metafields, so `product.metafields`
    // is always undefined and extractMetafield silently falls through to parsing
    // body_html. Products that keep this data in metafields instead (definitions
    // named "ORIGIN / PRODUCER", "PROCESS / VARIETAL", "SENSORY") therefore came
    // back as "Unknown …". Look those up per product, but only for the ones still
    // missing something, so we don't spend a request on every product.
    const PLACEHOLDER_ORIGIN = 'Unknown Origin';
    const PLACEHOLDER_PRODUCER = 'Unknown Producer';
    const PLACEHOLDER_PROCESS = 'Unknown Process';
    const PLACEHOLDER_SENSORY = 'Tasting notes available upon request';

    const isMissing = (product: any) =>
      product.origin === PLACEHOLDER_ORIGIN ||
      product.producer === PLACEHOLDER_PRODUCER ||
      product.process === PLACEHOLDER_PROCESS ||
      product.sensory === PLACEHOLDER_SENSORY ||
      !product.varietal;

    // Compare metafield keys/names loosely: the shop's definitions are named
    // "ORIGIN / PRODUCER" etc., so keys may be origin_producer, originProducer…
    const normalizeKey = (value: string) => (value || '').toLowerCase().replace(/[^a-z]/g, '');

    /* Split a combined "A / B" metafield into its two halves.
       ONLY line breaks and "|" count as separators — never "/", which appears
       inside real values such as "60% Washed / 40% Double Anaerobic Thermal
       Shock Castillo". When there is no separator the whole string is kept as
       the first half rather than guessing where it splits. */
    const splitCombined = (value: string): [string, string | null] => {
      const parts = value
        .split(/\r?\n|\|/)
        .map((part: string) => part.trim())
        .filter(Boolean);
      if (parts.length >= 2) return [parts[0], parts.slice(1).join(' ')];
      return [value.trim(), null];
    };

    const pendingProducts = transformedProducts.filter(isMissing);
    console.log(`Metafield backfill: ${pendingProducts.length} product(s) still missing data`);

    for (const product of pendingProducts) {
      try {
        const metafieldsResponse = await fetch(
          `https://${shopifyDomain}/admin/api/2023-10/products/${product.id}/metafields.json`,
          {
            headers: {
              'X-Shopify-Access-Token': adminToken,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!metafieldsResponse.ok) {
          console.log(`  ⚠️ ${product.name}: metafields HTTP ${metafieldsResponse.status}`);
          continue;
        }

        const { metafields = [] } = await metafieldsResponse.json();
        if (!metafields.length) continue;

        console.log(
          `  📇 ${product.name}: ${metafields.length} metafield(s) —`,
          metafields.map((m: any) => `${m.namespace}.${m.key}`).join(', '),
        );

        for (const metafield of metafields) {
          const value = typeof metafield.value === 'string' ? metafield.value.trim() : '';
          if (!value) continue;

          const key = normalizeKey(`${metafield.key} ${metafield.namespace}`);
          const has = (word: string) => key.includes(word);

          if (has('origin') || has('producer')) {
            // Two real values, one per line: "COLOMBIA" / "DIEGO BERMUDEZ".
            const [first, second] = splitCombined(value);
            if (product.origin === PLACEHOLDER_ORIGIN) product.origin = first;
            if (second && product.producer === PLACEHOLDER_PRODUCER) product.producer = second;
          } else if (has('process') || has('varietal')) {
            // NOT split: in this field the line break is where the process text
            // wraps, not a boundary between two values — the real content reads
            // "60% Washed /⏎40% Double Anaerobic Thermal Shock Castillo". Splitting
            // it published half a process as the varietal. Join the lines back and
            // leave varietal to a dedicated metafield or the description parser.
            if (product.process === PLACEHOLDER_PROCESS) {
              product.process = value
                .split(/\r?\n/)
                .map((line: string) => line.trim())
                .filter(Boolean)
                .join(' ');
            }
          } else if (has('sensory') || has('tastingnotes') || has('notes')) {
            if (product.sensory === PLACEHOLDER_SENSORY) product.sensory = value;
          }
        }
      } catch (metafieldError) {
        console.log(`  ⚠️ ${product.name}: metafield lookup failed —`, metafieldError.message);
      }
    }

    // Smart Fallback: Inherit data from non-"NEW" versions for "NEW -" products with Unknown values
    transformedProducts.forEach((product: any) => {
      if (product.name.startsWith('NEW - ')) {
        // Check if this product has unknown values
        const hasUnknownValues = 
          product.origin === 'Unknown Origin' ||
          product.producer === 'Unknown Producer' ||
          product.process === 'Unknown Process' ||
          product.sensory === 'Tasting notes available upon request';
        
        if (hasUnknownValues) {
          console.log(`\n🔍 SMART FALLBACK for "${product.name}"`);
          
          // Try multiple fallback patterns
          const fallbackPatterns = [
            product.name.replace('NEW - ', ''), // Try exact match: "NEW - WHOLESALE - X" -> "WHOLESALE - X"
            product.name.replace('NEW - WHOLESALE - ', ''), // Try without wholesale: "NEW - WHOLESALE - X" -> "X"
            product.name.replace('NEW - ', '').replace('WHOLESALE - ', '') // Remove both prefixes
          ];
          
          console.log(`  Trying fallback patterns:`, fallbackPatterns);
          
          let matchingProduct = null;
          for (const pattern of fallbackPatterns) {
            matchingProduct = transformedProducts.find((p: any) => 
              p.name === pattern && !p.name.startsWith('NEW - ')
            );
            if (matchingProduct) {
              console.log(`  ✅ Found match: "${matchingProduct.name}" using pattern "${pattern}"`);
              break;
            } else {
              console.log(`  ❌ No match for pattern: "${pattern}"`);
            }
          }
          
          if (matchingProduct) {
            console.log(`  Applying smart fallback: "${product.name}" inheriting from "${matchingProduct.name}"`);
            
            // Inherit missing data
            if (product.origin === 'Unknown Origin') {
              product.origin = matchingProduct.origin;
              console.log(`    - Inherited origin: ${matchingProduct.origin}`);
            }
            if (product.producer === 'Unknown Producer') {
              product.producer = matchingProduct.producer;
              console.log(`    - Inherited producer: ${matchingProduct.producer}`);
            }
            if (product.process === 'Unknown Process') {
              product.process = matchingProduct.process;
              console.log(`    - Inherited process: ${matchingProduct.process}`);
            }
            if (product.sensory === 'Tasting notes available upon request') {
              product.sensory = matchingProduct.sensory;
              console.log(`    - Inherited sensory: ${matchingProduct.sensory}`);
            }
            if (!product.varietal && matchingProduct.varietal) {
              product.varietal = matchingProduct.varietal;
              console.log(`    - Inherited varietal: ${matchingProduct.varietal}`);
            }
          } else {
            console.log(`  ⚠️ NO MATCHING BASE PRODUCT FOUND`);
            console.log(`  Available products:`, transformedProducts.map((p: any) => p.name).filter((n: string) => !n.startsWith('NEW - ')));
          }
        }
      }
    });

    // ── Final tidy-up ─────────────────────────────────────────────────────
    // Last line of defence, applied whatever the source was (metafield, product
    // description or hardcoded override): collapse whitespace and drop a
    // dangling separator so nothing ever ships as "60% Washed /". Values that
    // use "/" between two real halves keep it — only a leading/trailing one is
    // stripped.
    const tidy = (value: any) => {
      if (typeof value !== 'string') return value;
      const cleaned = value
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^[\/|,;·-]+\s*/, '')
        .replace(/\s*[\/|,;·-]+$/, '')
        .trim();
      return cleaned;
    };

    transformedProducts.forEach((product: any) => {
      product.origin = tidy(product.origin);
      product.producer = tidy(product.producer);
      product.process = tidy(product.process);
      product.sensory = tidy(product.sensory);
      product.varietal = tidy(product.varietal) || null;
    });

    return new Response(JSON.stringify({ products: transformedProducts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-shopify-products function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to extract metafields or parse from description
function extractMetafield(product: any, field: string): string | null {
  // Try to find in metafields first
  const metafield = product.metafields?.find((m: any) => 
    m.key?.toLowerCase() === field.toLowerCase()
  );
  
  if (metafield?.value) {
    return metafield.value;
  }

  // Fallback: try to parse from product description or body_html
  const content = product.body_html || product.description || '';
  
  if (!content) {
    return null;
  }
  
  // First, convert <br> tags to line breaks before stripping HTML
  let contentWithBreaks = content;
  let i = 0;
  while (i < contentWithBreaks.length) {
    if (contentWithBreaks.substring(i, i + 4).toLowerCase() === '<br>') {
      contentWithBreaks = contentWithBreaks.substring(0, i) + '\n' + contentWithBreaks.substring(i + 4);
      i++;
    } else if (contentWithBreaks.substring(i, i + 5).toLowerCase() === '<br/>') {
      contentWithBreaks = contentWithBreaks.substring(0, i) + '\n' + contentWithBreaks.substring(i + 5);
      i++;
    } else {
      i++;
    }
  }
  
  // Strip HTML tags to get clean text
  let cleanContent = '';
  let insideTag = false;
  for (i = 0; i < contentWithBreaks.length; i++) {
    const char = contentWithBreaks[i];
    if (char === '<') {
      insideTag = true;
    } else if (char === '>') {
      insideTag = false;
    } else if (!insideTag) {
      cleanContent += char;
    }
  }
  
  // Replace multiple spaces with single space (without regex)
  let normalizedContent = '';
  let prevWasSpace = false;
  for (i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    if (char === ' ' || char === '\t' || char === '\r') {
      if (!prevWasSpace) {
        normalizedContent += ' ';
        prevWasSpace = true;
      }
    } else if (char === '\n') {
      normalizedContent += '\n';
      prevWasSpace = false;
    } else {
      normalizedContent += char;
      prevWasSpace = false;
    }
  }
  
  console.log(`Extracting ${field} from:`, normalizedContent.substring(0, 300));
  
  // List of known field names in order they typically appear
  const knownFields = ['Origin', 'Producer', 'Estate', 'Region', 'Varietal', 'Process', 'Sensory'];
  
  // Handle sensory field variations
  const fieldVariations: Record<string, string[]> = {
    'sensory': ['Sensory', 'Tasting Notes', 'Flavor Profile', 'Cup Profile', 'Notes'],
    'origin': ['Origin'],
    'producer': ['Producer'],
    'estate': ['Estate'],
    'region': ['Region'], 
    'varietal': ['Varietal'],
    'process': ['Process']
  };
  
  const targetField = field.toLowerCase();
  const searchFields = fieldVariations[targetField] || [field];
  
  for (const searchField of searchFields) {
    // Look for "FieldName:" (case-insensitive)
    const fieldPattern = searchField + ':';
    let fieldIndex = -1;
    
    // Find the field pattern (case-insensitive)
    for (i = 0; i <= normalizedContent.length - fieldPattern.length; i++) {
      let match = true;
      for (let j = 0; j < fieldPattern.length; j++) {
        if (normalizedContent[i + j].toLowerCase() !== fieldPattern[j].toLowerCase()) {
          match = false;
          break;
        }
      }
      if (match) {
        fieldIndex = i;
        break;
      }
    }
    
    if (fieldIndex !== -1) {
      const startIndex = fieldIndex + fieldPattern.length;
      let endIndex = normalizedContent.length;
      
      // Find the next field by looking for any known field name followed by ":"
      let nextFieldStart = normalizedContent.length;
      for (const nextField of knownFields.concat(['Tasting Notes', 'Flavor Profile', 'Cup Profile', 'Notes'])) {
        const nextPattern = nextField + ':';
        
        // Search for the next field after our current field
        for (i = startIndex; i <= normalizedContent.length - nextPattern.length; i++) {
          let match = true;
          for (let j = 0; j < nextPattern.length; j++) {
            if (normalizedContent[i + j].toLowerCase() !== nextPattern[j].toLowerCase()) {
              match = false;
              break;
            }
          }
          if (match && i < nextFieldStart) {
            nextFieldStart = i;
            break;
          }
        }
      }
      
      endIndex = nextFieldStart;
      
      const extracted = normalizedContent.substring(startIndex, endIndex).trim();
      
      if (extracted) {
        console.log(`${searchField} extracted:`, extracted);
        return extracted;
      }
    }
  }
  
  console.log(`No ${field} information found`);
  return null;
}