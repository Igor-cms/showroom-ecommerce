interface NavOverlayProps {
  onClose: () => void;
}

const NAV_ITEMS = [
  { num: '01', label: 'HOME', href: 'https://thenativecoffeecompany.com/' },
  { num: '02', label: 'SHOP', href: '#shop' },
  { num: '03', label: 'ABOUT US', href: '#about' },
  { num: '04', label: 'PRODUCERS', href: '#producers' },
  { num: '05', label: 'PODCAST', href: '#podcast' },
  { num: '06', label: 'BLOG', href: '#blog' },
  { num: '07', label: 'WHOLESALE', href: '#wholesale' },
  { num: '08', label: 'CONTACT', href: '#contact' },
];

const SHOP_ITEMS = ['NEW DROPS', 'COFFEE', 'BREWING EQUIPMENT', 'GRINDERS', 'MERCH', 'GLASSWARE'];
const COFFEE_LEVELS = ['01  BASE', '02  TOP SHELF', '03  COMPETITION', '04  EXOTIC', '05  HYPER LIMITED'];
const INFO_ITEMS = ['OUR PHILOSOPHY', 'ROASTING STYLE', 'COFFEE SOURCING', 'PROFIT SHARE MODEL', 'BREWING', 'MEDIA KIT'];

export default function NavOverlay({ onClose }: NavOverlayProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#f8f5e4',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      fontFamily: 'custom_75139, Helvetica, Arial, sans-serif',
      overflow: 'auto',
    }}>
      {/* Left column — editorial photo */}
      <div style={{ position: 'relative', borderRight: '1px solid rgb(142,138,128)', overflow: 'hidden' }}>
        <img
          src="/rm-assets/image-b0714099-bafc-4d76-87d5-a3d69bee1d14.png"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
        />
        <div style={{
          position: 'absolute', bottom: 24, left: 24,
          fontFamily: 'custom_75139, Helvetica, sans-serif',
          fontSize: 9, color: 'rgba(0,0,0,0.6)', lineHeight: '14px',
          textTransform: 'uppercase', letterSpacing: '0.4px',
        }}>
          <div>Muse Magazine, September 2021</div>
          <div>Photo: Ben Beagent</div>
          <div style={{ marginTop: 8 }}>ISSUE #58 &nbsp;&nbsp; Concept</div>
          <div>Roosh &nbsp;&nbsp; 2024</div>
        </div>
      </div>

      {/* Middle column — nav items */}
      <div style={{ borderRight: '1px solid rgb(142,138,128)', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={item.href.startsWith('#') ? (e) => { e.preventDefault(); onClose(); } : undefined}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 4,
              cursor: 'pointer', textDecoration: 'none',
            }}
          >
            <span style={{ fontFamily: 'custom_75139', fontSize: 10, color: 'rgba(0,0,0,0.4)', letterSpacing: '-0.2px' }}>
              {item.num}
            </span>
            <span style={{
              fontFamily: 'custom_75139', fontWeight: 400,
              fontSize: item.label === 'ABOUT US' ? 56 : 72,
              lineHeight: 1, letterSpacing: '-2px',
              color: item.label === 'ABOUT US' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,1)',
              textTransform: 'uppercase',
            }}>
              {item.label}
            </span>
          </a>
        ))}
      </div>

      {/* Right column — sub-items */}
      <div style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Search */}
        <input
          type="text"
          placeholder="SEARCH"
          style={{
            fontFamily: 'custom_75139', fontSize: 9, letterSpacing: '0.6px',
            backgroundColor: 'transparent', border: '1px solid rgb(142,138,128)',
            padding: '6px 12px', color: '#000', outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />

        {/* SHOP */}
        <div>
          <div style={{ fontFamily: 'custom_75141', fontWeight: 700, fontSize: 9, letterSpacing: '0.6px', marginBottom: 8 }}>SHOP</div>
          {SHOP_ITEMS.map(item => (
            <div
              key={item}
              style={{
                fontFamily: item === 'NEW DROPS' ? 'custom_75141' : 'custom_75139',
                fontWeight: item === 'NEW DROPS' ? 700 : 400,
                fontSize: 9, letterSpacing: '0.4px', lineHeight: '18px',
                cursor: 'pointer',
                color: item === 'NEW DROPS' ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.7)',
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* COFFEE LEVELS */}
        <div>
          <div style={{ fontFamily: 'custom_75141', fontWeight: 700, fontSize: 9, letterSpacing: '0.6px', marginBottom: 8, textTransform: 'uppercase' }}>Coffee Levels</div>
          {COFFEE_LEVELS.map(item => (
            <div key={item} style={{ fontFamily: 'custom_75139', fontSize: 9, letterSpacing: '0.4px', lineHeight: '18px', cursor: 'pointer', color: 'rgba(0,0,0,0.7)' }}>{item}</div>
          ))}
        </div>

        {/* INFO */}
        <div>
          <div style={{ fontFamily: 'custom_75141', fontWeight: 700, fontSize: 9, letterSpacing: '0.6px', marginBottom: 8 }}>INFO</div>
          {INFO_ITEMS.map(item => (
            <div key={item} style={{ fontFamily: 'custom_75139', fontSize: 9, letterSpacing: '0.4px', lineHeight: '18px', cursor: 'pointer', color: 'rgba(0,0,0,0.7)' }}>{item}</div>
          ))}
        </div>

        {/* WHOLESALE PORTAL */}
        <div>
          <div style={{ fontFamily: 'custom_75141', fontWeight: 700, fontSize: 11, letterSpacing: '0.6px', marginBottom: 10, textTransform: 'uppercase' }}>Wholesale Portal</div>
          <button style={{
            fontFamily: 'custom_75141', fontWeight: 700, fontSize: 9,
            backgroundColor: '#000', color: '#f8f5e4',
            border: 'none', padding: '8px 24px', cursor: 'pointer', letterSpacing: '0.6px',
          }}>
            LOGIN
          </button>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          width: 32, height: 32, padding: 0, zIndex: 10000,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <line x1="4" y1="4" x2="20" y2="20" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" />
          <line x1="20" y1="4" x2="4" y2="20" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}
