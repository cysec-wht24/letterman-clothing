import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import Scene from './Scene'
import { PLACEMENT_ZONES } from './ShirtModel'
import { COLOR_PALETTE, CATEGORIES, DEFAULT_COLOR_ID } from './colors'
import './App.css'

function ColorSwatch({ color, isSelected, onClick }) {
  return (
    <button className={`color-swatch ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(color)} title={color.name}>
      <span className="swatch-inner" style={{ background: color.hex }} />
      {isSelected && <span className="swatch-check">✓</span>}
    </button>
  )
}

function ZoneCard({ zone, isSelected, onClick }) {
  return (
    <button className={`zone-card ${isSelected ? 'selected' : ''}`} onClick={() => onClick(zone)}>
      <div className="zone-preview">
        <svg viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg" className="zone-svg">
          <path d="M18 8 L8 20 L16 23 L16 62 L44 62 L44 23 L52 20 L42 8 L34 12 Q30 14 26 12 Z"
            fill="#2a2520" stroke="#3a3530" strokeWidth="0.8"/>
          <path d="M18 8 L8 20 L16 23 L18 18 Z" fill="#222" stroke="#3a3530" strokeWidth="0.6"/>
          <path d="M42 8 L52 20 L44 23 L42 18 Z" fill="#222" stroke="#3a3530" strokeWidth="0.6"/>
          {zone.id === 'left-chest'   && <rect x="18" y="22" width="11" height="9"  fill="#c8a96e" opacity="0.8" rx="1"/>}
          {zone.id === 'right-chest'  && <rect x="31" y="22" width="11" height="9"  fill="#c8a96e" opacity="0.8" rx="1"/>}
          {zone.id === 'back-center'  && <rect x="20" y="28" width="20" height="18" fill="#c8a96e" opacity="0.8" rx="1"/>}
          {zone.id === 'left-sleeve'  && <rect x="9"  y="13" width="8"  height="8"  fill="#c8a96e" opacity="0.8" rx="1"/>}
          {zone.id === 'right-sleeve' && <rect x="43" y="13" width="8"  height="8"  fill="#c8a96e" opacity="0.8" rx="1"/>}
        </svg>
      </div>
      <span className="zone-label">{zone.label}</span>
    </button>
  )
}

// Mobile size selector component
function MobileSizeSelector() {
  const [selected, setSelected] = useState('M')
  return (
    <div className="mobile-product-strip">
      <div className="mobile-strip-top">
        <div className="mobile-strip-row">
          <span className="mobile-strip-label">SIZE</span>
          <span className="mobile-strip-sub">CLASSIC CREW · RELAXED FIT</span>
        </div>
        <div className="size-grid">
          {['XS','S','M','L','XL','XXL'].map(s => (
            <button
              key={s}
              className={`size-btn ${selected === s ? 'size-selected' : ''}`}
              onClick={() => setSelected(s)}
            >{s}</button>
          ))}
        </div>
      </div>
      <div className="mobile-strip-details">
        {[['FABRIC','Supima Cotton'],['WEIGHT','230 GSM'],['ORIGIN','Portugal']].map(([k,v]) => (
          <div key={k} className="mobile-detail-item">
            <span className="mobile-detail-key">{k}</span>
            <span className="mobile-detail-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [selectedColorId, setSelectedColorId] = useState(DEFAULT_COLOR_ID)
  const [activeCategory, setActiveCategory] = useState('All')
  const [autoRotate, setAutoRotate] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [showColorName, setShowColorName] = useState(false)
  const [activeTab, setActiveTab] = useState('color')
  const [selectedZoneId, setSelectedZoneId] = useState(null)
  const [logoTexture, setLogoTexture] = useState(null)
  const nameTimerRef = useRef(null)

  const selectedColor = COLOR_PALETTE.find(c => c.id === selectedColorId)
  const filteredColors = activeCategory === 'All'
    ? COLOR_PALETTE
    : COLOR_PALETTE.filter(c => c.category === activeCategory)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(import.meta.env.BASE_URL + 'logo.png', (tex) => {
      const image = tex.image
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx.translate(image.width / 2, image.height / 2)
      ctx.rotate(Math.PI)
      ctx.drawImage(image, -image.width / 2, -image.height / 2)
      const rotatedTex = new THREE.CanvasTexture(canvas)
      rotatedTex.colorSpace = THREE.SRGBColorSpace
      rotatedTex.needsUpdate = true
      setLogoTexture(rotatedTex)
    })
  }, [])

  const handleColorSelect = useCallback((color) => {
    if (color.id === selectedColorId) return
    setSelectedColorId(color.id)
    setShowColorName(true)
    clearTimeout(nameTimerRef.current)
    nameTimerRef.current = setTimeout(() => setShowColorName(false), 2200)
  }, [selectedColorId])

  const handleInteractionChange = useCallback((val) => setIsInteracting(val), [])

  useEffect(() => {
    const handler = (e) => {
      const idx = COLOR_PALETTE.findIndex(c => c.id === selectedColorId)
      if (e.key === 'ArrowRight') handleColorSelect(COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length])
      if (e.key === 'ArrowLeft') handleColorSelect(COLOR_PALETTE[(idx - 1 + COLOR_PALETTE.length) % COLOR_PALETTE.length])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedColorId, handleColorSelect])

  const handleZoneSelect = (zone) => {
    setSelectedZoneId(prev => prev === zone.id ? null : zone.id)
  }

  const selectedZone = PLACEMENT_ZONES.find(z => z.id === selectedZoneId)

  return (
    <div className="app">
      <div className="bg-grid" />
      <div className="bg-vignette" />

      <header className="header">
        <div className="header-left">
          <span className="brand-mark">◈</span>
          <div className="brand-text">
            <span className="brand-name">STITCH</span>
          </div>
        </div>
        <div className="header-right" />
      </header>

      <main className="main">

        {/* LEFT PANEL — desktop only */}
        <aside className="panel panel-left">
          <div className="panel-section">
            <div className="panel-label">PRODUCT</div>
            <div className="product-details">
              {[['STYLE','Classic Crew'],['FIT','Relaxed'],['FABRIC','Supima Cotton'],['WEIGHT','230 GSM'],['ORIGIN','Made in Portugal']].map(([k,v]) => (
                <div className="detail-row" key={k}>
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="divider" />
          <div className="panel-section">
            <div className="panel-label">SIZE</div>
            <div className="size-grid">
              {['XS','S','M','L','XL','XXL'].map(s => (
                <button key={s} className={`size-btn ${s === 'M' ? 'size-selected' : ''}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="divider" />
          <div className="panel-section">
            <div className="panel-label">VIEWER</div>
            <button className={`toggle-btn ${autoRotate ? 'active' : ''}`}
              onClick={() => setAutoRotate(v => !v)}>
              <span className="toggle-icon">{autoRotate ? '⏸' : '▶'}</span>
              <span>{autoRotate ? 'PAUSE ROTATION' : 'AUTO ROTATE'}</span>
            </button>
            <p className="hint-text">Drag to orbit · Scroll to zoom</p>
          </div>
          {selectedZoneId && (
            <>
              <div className="divider" />
              <div className="panel-section">
                <div className="panel-label">ACTIVE PLACEMENT</div>
                <div className="active-zone-display">
                  <span className="active-zone-icon">{selectedZone?.icon}</span>
                  <div>
                    <div className="active-zone-name">{selectedZone?.label}</div>
                    <div className="active-zone-sub">Logo placed on shirt</div>
                  </div>
                  <button className="remove-btn" onClick={() => setSelectedZoneId(null)}>✕</button>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* VIEWPORT */}
        <div className="viewport">
          <div className="canvas-wrap" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
            <Suspense fallback={null}>
              <Scene
                color={selectedColor?.hex || '#F8F6F2'}
                autoRotate={autoRotate && !isInteracting}
                onInteractionChange={handleInteractionChange}
                selectedZoneId={selectedZoneId}
                logoTexture={logoTexture}
              />
            </Suspense>
          </div>
          <div className={`color-toast ${showColorName ? 'visible' : ''}`}>
            <span className="toast-swatch" style={{ background: selectedColor?.hex }} />
            <div className="toast-info">
              <span className="toast-name">{selectedColor?.name}</span>
              <span className="toast-cat">{selectedColor?.category}</span>
            </div>
          </div>
        </div>

        {/* MOBILE PRODUCT STRIP — shows between viewport and right panel */}
        <MobileSizeSelector />

        {/* RIGHT PANEL */}
        <aside className="panel panel-right">

          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab === 'color' ? 'active' : ''}`}
              onClick={() => setActiveTab('color')}>COLOR</button>
            <button className={`panel-tab ${activeTab === 'logo' ? 'active' : ''}`}
              onClick={() => setActiveTab('logo')}>LOGO</button>
          </div>

          <div className="panel-scroll-area">

            {activeTab === 'color' && (
              <>
                <div className="panel-section">
                  <div className="panel-label-row">
                    <span className="panel-label">COLOR</span>
                    <span className="panel-label-count">{filteredColors.length} SHADES</span>
                  </div>
                  <div className="selected-color-display">
                    <div className="selected-preview" style={{ background: selectedColor?.hex }} />
                    <div className="selected-info">
                      <span className="selected-name">{selectedColor?.name}</span>
                      <span className="selected-hex">{selectedColor?.hex}</span>
                      <span className="selected-cat">{selectedColor?.category}</span>
                    </div>
                  </div>
                </div>
                <div className="category-tabs">
                  {CATEGORIES.map(cat => (
                    <button key={cat}
                      className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}>
                      {cat === 'Statement' ? 'STATE' : cat.toUpperCase().slice(0,6)}
                    </button>
                  ))}
                </div>
                <div className="color-grid-wrap">
                  <div className="color-grid">
                    {filteredColors.map(color => (
                      <ColorSwatch key={color.id} color={color}
                        isSelected={color.id === selectedColorId}
                        onClick={handleColorSelect} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'logo' && (
              <div className="logo-tab-content">
                <div className="panel-section">
                  <div className="panel-label">LOGO PREVIEW</div>
                  <div className="logo-preview-card">
                    <img src={import.meta.env.BASE_URL + 'logo.png'} alt="Logo" className="logo-thumb" />
                    <div className="logo-preview-info">
                      <span className="logo-preview-name">Custom Logo</span>
                      <span className="logo-preview-sub">
                        {selectedZoneId ? `Placed on ${selectedZone?.label}` : 'Select a zone below'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="panel-section" style={{paddingBottom: 8}}>
                  <div className="panel-label">PLACEMENT ZONE</div>
                  <p className="hint-text" style={{marginBottom: 12}}>Select where to place your logo on the shirt</p>
                </div>
                <div className="zone-grid-wrap">
                  <div className="zone-grid">
                    {PLACEMENT_ZONES.map(zone => (
                      <ZoneCard key={zone.id} zone={zone}
                        isSelected={selectedZoneId === zone.id}
                        onClick={handleZoneSelect} />
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="panel-cta-wrap">
            <div className="divider" />
            <div className="panel-section cta-section">
              <div className="price-row">
                <span className="price">$89.00</span>
                <span className="price-tag">FREE SHIPPING</span>
              </div>
              <button className="cta-btn">
                <span>ADD TO BAG</span>
                <span className="cta-arrow">→</span>
              </button>
              <button className="wishlist-btn">
                <span>♡</span>
                <span>SAVE TO WISHLIST</span>
              </button>
            </div>
          </div>

        </aside>
      </main>
    </div>
  )
}
