import { useState } from 'react';
import { mockProducts } from '@/data/products';
import { useCart } from '@/contexts/CartContext';

const CARD_IMAGES = [
  '/rm-assets/image-a7e2857e-37fd-4343-8cbe-918d2b9d242a.png',
  '/rm-assets/image-3e476b9d-779d-4758-85b5-0d63617c97f6.png',
  '/rm-assets/image-aa0233eb-c710-4028-a049-dc08732bc6c9.png',
  '/rm-assets/image-a7e2857e-37fd-4343-8cbe-918d2b9d242a.png',
];

const CARD_LEFT = [-30, 277.99, 593, 907];

const DISPLAYED_PRODUCTS = mockProducts.slice(0, 4);

function ProductCard({ product, index }: { product: typeof mockProducts[0]; index: number }) {
  const [selectedWeight, setSelectedWeight] = useState(product.defaultWeight);
  const { addToCart, setIsCartOpen } = useCart();
  const left = CARD_LEFT[index];
  const textLeft = left + 49;

  const priceLabel = product.weights
    .map(w => `${w.toUpperCase()} - $${product.price}`)
    .join('  |  ');

  const cycleWeight = () => {
    const idx = product.weights.indexOf(selectedWeight);
    setSelectedWeight(product.weights[(idx + 1) % product.weights.length]);
  };

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      variantId: `${product.id}-${selectedWeight}`,
      name: product.title,
      size: selectedWeight,
      price: product.price,
      countryCode: 'US',
      displaySize: selectedWeight,
    });
    setIsCartOpen(true);
  };

  return (
    <>
      {/* Product image */}
      <div
        className="animation-container"
        style={{ left: `${left}px`, top: '599px', width: '308px', height: '286px', zIndex: 327 + index * 6 }}
      >
        <div className="rmwidget widget-picture fixMobileImageStretch" style={{ left: 0, top: 0, width: '308px', height: '286px', zIndex: 327 + index * 6 }}>
          <img
            src={product.image !== null ? product.image : CARD_IMAGES[index]}
            alt={product.title}
            className="viewable"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}
          />
        </div>
      </div>

      {/* Product info */}
      <div
        className="animation-container"
        style={{ left: `${textLeft}px`, top: '860px', width: '206px', height: '41px', zIndex: 328 + index * 6 }}
      >
        <div className="rmwidget widget-text-v3" style={{ left: 0, top: 0, width: '206px', height: '41px', zIndex: 328 + index * 6 }}>
          <div className="css-eg9ryz">
            <div className="text-viewer">
              <p style={{ lineHeight: '8px', fontFamily: 'custom_75141', fontWeight: 700, fontSize: '8px' }} className="view-mode unstyled align-center">
                <span style={{ fontWeight: 700, fontStyle: 'normal', fontFamily: 'custom_75141', fontSize: '8px', letterSpacing: '-0.1px', color: 'rgba(0,0,0,1)' }}>
                  {product.title}
                </span>
              </p>
              <p style={{ lineHeight: '11px', fontFamily: 'custom_75139', fontWeight: 400, fontSize: '7px' }} className="view-mode unstyled align-center">
                <span style={{ fontSize: '7px', fontStyle: 'normal', letterSpacing: '-0.1px', color: 'rgba(0,0,0,1)' }}>
                  {priceLabel}
                </span>
              </p>
              <p style={{ lineHeight: '8px' }} className="view-mode unstyled align-center"><br /></p>
              <p style={{ lineHeight: '7px', fontFamily: 'custom_75141', fontWeight: 700, fontSize: '6px' }} className="view-mode unstyled align-center">
                <span style={{ fontSize: '6px', letterSpacing: '-0.1px', fontWeight: 700, fontStyle: 'normal', fontFamily: 'custom_75141', color: 'rgba(0,0,0,1)' }}>
                  {product.process}
                </span>
              </p>
              <p style={{ lineHeight: '7px', fontFamily: 'custom_75142', fontWeight: 400, fontSize: '6px' }} className="view-mode unstyled align-center">
                <span style={{ fontWeight: 400, fontStyle: 'italic', fontFamily: 'custom_75142', fontSize: '6px', letterSpacing: '-0.1px', color: 'rgba(0,0,0,1)' }}>
                  {product.tastingNotes?.join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weight selector */}
      <div
        className="animation-container"
        style={{ left: `${left + 104}px`, top: '919px', width: '60px', height: '9px', zIndex: 329 + index * 6 }}
      >
        <div
          className="rmwidget widget-button"
          onClick={cycleWeight}
          style={{
            left: 0, top: 0, width: '60px', height: '9px', zIndex: 329 + index * 6,
            borderRadius: '6px', cursor: 'pointer', pointerEvents: 'auto',
          }}
        >
          <div className="common-button" style={{ flexDirection: 'row' }}>
            <div className="text" style={{ display: 'inline-block', width: 'auto', paddingLeft: 0, textIndent: 0, height: '9px', lineHeight: '9px' }}>
              {selectedWeight.toUpperCase()}  -  ${product.price}
            </div>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div
        className="animation-container"
        style={{ left: `${left + 168}px`, top: '919px', width: '36px', height: '9px', zIndex: 330 + index * 6 }}
      >
        <div
          className="rmwidget widget-button"
          onClick={handleAdd}
          style={{
            left: 0, top: 0, width: '36px', height: '9px', zIndex: 330 + index * 6,
            borderRadius: '6px', cursor: 'pointer', pointerEvents: 'auto',
          }}
        >
          <div className="common-button" style={{ flexDirection: 'row' }}>
            <div className="text" style={{ display: 'inline-block', width: 'auto', paddingLeft: 0, textIndent: 0, height: '9px', lineHeight: '9px' }}>
              ADD
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewDrops() {
  return (
    <>
      {/* Section label */}
      <div
        className="animation-container"
        style={{ left: '9.17px', top: '580px', width: '420px', height: '40px', zIndex: 312 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '14px',
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: '25px',
            lineHeight: '40px',
            color: '#000',
            textTransform: 'uppercase',
            letterSpacing: '0',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '25px',
              WebkitTextStroke: '0.6px currentColor',
              letterSpacing: '0',
            }}
          >
            01
          </span>
          <span style={{ fontWeight: 400, fontSize: '25px', letterSpacing: '0.05em' }}>
            NEW DROPS
          </span>
        </div>
      </div>



      {/* Product cards */}
      {DISPLAYED_PRODUCTS.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </>
  );
}
