import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import Scene from './Scene'
import LogoEditor from './LogoEditor'
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

export default function App() {
  const [selectedColorId, setSelectedColorId] = useState(DEFAULT_COLOR_ID)
  const [activeCategory, setActiveCategory] = useState('All')
  const [autoRotate, setAutoRotate] = useState(true)
  const [isInteracting, setIsInteracting] = useState(false)
  const [showColorName, setShowColorName] = useState(false)
  const [activeTab, setActiveTab] = useState('color') // 'color' | 'logo'
  const [textureCanvas, setTextureCanvas] = useState(null)
  const [logoEnabled, setLogoEnabled] = useState(false)
  const nameTimerRef = useRef(null)
  const logoEditorRef = useRef(null)

  const selectedColor = COLOR_PALETTE.find(c => c.id === selectedColorId)
  const filteredColors = activeCategory === 'All'
    ? COLOR_PALETTE
    : COLOR_PALETTE.filter(c => c.category === activeCategory)

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

  const handleCanvasUpdate = useCallback((canvas) => {
    if (logoEnabled) setTextureCanvas(canvas)
  }, [logoEnabled])

  const handleLogoToggle = (enabled) => {
    setLogoEnabled(enabled)
    if (!enabled) {
      setTextureCanvas(null)
    } else {
      // Trigger snapshot from fabric canvas if it exists
      if (logoEditorRef.current) {
        const snap = logoEditorRef.current.snapshot()
        if (snap) setTextureCanvas(snap)
      }
    }
  }

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
        <div className="header-center">
          <span className="header-tag">UNISEX CLASSIC TEE — SS25</span>
        </div>
        <div className="header-right" />
      </header>

      <main className="main">

        {/* LEFT PANEL */}
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
        </aside>

        {/* VIEWPORT */}
        <div className="viewport">
          <div className="canvas-wrap">
            <Suspense fallback={null}>
              <Scene
                color={selectedColor?.hex || '#F8F6F2'}
                autoRotate={autoRotate && !isInteracting}
                onInteractionChange={handleInteractionChange}
                textureCanvas={logoEnabled ? textureCanvas : null}
              />
            </Suspense>
          </div>

          {/* Logo Editor Panel — overlaid bottom of viewport */}
          <LogoEditor
            ref={logoEditorRef}
            shirtColor={selectedColor?.hex || '#F8F6F2'}
            logoSrc="/logo.jpg"
            onCanvasUpdate={handleCanvasUpdate}
            visible={activeTab === 'logo' && logoEnabled}
          />

          <div className={`color-toast ${showColorName ? 'visible' : ''}`}>
            <span className="toast-swatch" style={{ background: selectedColor?.hex }} />
            <div className="toast-info">
              <span className="toast-name">{selectedColor?.name}</span>
              <span className="toast-cat">{selectedColor?.category}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <aside className="panel panel-right">

          {/* Tab switcher */}
          <div className="panel-tabs">
            <button className={`panel-tab ${activeTab === 'color' ? 'active' : ''}`}
              onClick={() => setActiveTab('color')}>COLOR</button>
            <button className={`panel-tab ${activeTab === 'logo' ? 'active' : ''}`}
              onClick={() => setActiveTab('logo')}>LOGO</button>
          </div>

          {/* COLOR TAB */}
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

          {/* LOGO TAB */}
          {activeTab === 'logo' && (
            <div className="logo-tab-content">
              <div className="panel-section">
                <div className="panel-label-row">
                  <span className="panel-label">LOGO PLACEMENT</span>
                  <button
                    className={`toggle-small ${logoEnabled ? 'active' : ''}`}
                    onClick={() => handleLogoToggle(!logoEnabled)}>
                    {logoEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {!logoEnabled && (
                  <p className="hint-text" style={{marginTop: 8}}>
                    Toggle ON to place your logo on the shirt
                  </p>
                )}
                {logoEnabled && (
                  <div className="logo-instructions">
                    <div className="instruction-row">
                      <span className="inst-icon">↔</span>
                      <span className="inst-text">Drag to reposition</span>
                    </div>
                    <div className="instruction-row">
                      <span className="inst-icon">⤡</span>
                      <span className="inst-text">Corner handles to resize</span>
                    </div>
                    <div className="instruction-row">
                      <span className="inst-icon">↻</span>
                      <span className="inst-text">Top handle to rotate</span>
                    </div>
                    <div className="instruction-row">
                      <span className="inst-icon">◈</span>
                      <span className="inst-text">Preview updates on shirt live</span>
                    </div>
                  </div>
                )}
              </div>

              {logoEnabled && (
                <div className="panel-section">
                  <div className="panel-label">CURRENT COLOR</div>
                  <div className="logo-color-preview">
                    <div className="selected-preview small" style={{ background: selectedColor?.hex }} />
                    <span className="selected-name small">{selectedColor?.name}</span>
                  </div>
                  <p className="hint-text" style={{marginTop:6}}>
                    Switch to Color tab to change shirt color
                  </p>
                </div>
              )}
            </div>
          )}

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
        </aside>
      </main>
    </div>
  )
}
