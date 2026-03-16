import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Canvas as FabricCanvas, FabricImage, FabricText } from 'fabric'

/**
 * LogoEditor — a Fabric.js 2D canvas overlaid on top of the shirt UV space.
 * The user drags/resizes/rotates the logo freely.
 * On every change, we call onCanvasUpdate(canvas) so the 3D texture updates live.
 */
const LogoEditor = forwardRef(({ shirtColor, logoSrc, onCanvasUpdate, visible }, ref) => {
  const canvasElRef = useRef(null)
  const fabricRef = useRef(null)
  const SIZE = 512 // texture resolution

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,
    snapshot: () => {
      if (!fabricRef.current) return null
      return fabricRef.current.toCanvasElement()
    }
  }))

  // Initialize Fabric canvas once
  useEffect(() => {
    if (!canvasElRef.current || fabricRef.current) return

    const fc = new FabricCanvas(canvasElRef.current, {
      width: SIZE,
      height: SIZE,
      backgroundColor: shirtColor,
      selection: true,
      preserveObjectStacking: true,
    })

    fabricRef.current = fc

    // Load logo image onto canvas
    FabricImage.fromURL(logoSrc, { crossOrigin: 'anonymous' }).then((img) => {
      const scale = (SIZE * 0.28) / Math.max(img.width, img.height)
      img.set({
        left: SIZE / 2,
        top: SIZE * 0.35,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
        cornerColor: '#c8a96e',
        cornerStrokeColor: '#c8a96e',
        cornerStyle: 'circle',
        cornerSize: 10,
        transparentCorners: false,
        borderColor: '#c8a96e',
        borderScaleFactor: 1.5,
      })
      fc.add(img)
      fc.setActiveObject(img)
      fc.renderAll()
      onCanvasUpdate(fc.toCanvasElement())
    })

    // Fire update on every object modification
    const fireUpdate = () => {
      onCanvasUpdate(fc.toCanvasElement())
    }

    fc.on('object:moving', fireUpdate)
    fc.on('object:scaling', fireUpdate)
    fc.on('object:rotating', fireUpdate)
    fc.on('object:modified', fireUpdate)

    return () => {
      fc.dispose()
      fabricRef.current = null
    }
  }, [])

  // Update background color when shirt color changes
  useEffect(() => {
    if (!fabricRef.current) return
    fabricRef.current.backgroundColor = shirtColor
    fabricRef.current.renderAll()
    onCanvasUpdate(fabricRef.current.toCanvasElement())
  }, [shirtColor])

  return (
    <div
      className="logo-editor-wrap"
      style={{ display: visible ? 'flex' : 'none' }}
    >
      <div className="logo-editor-inner">
        <div className="logo-editor-label">
          <span>DRAG · RESIZE · ROTATE LOGO</span>
          <span className="logo-editor-hint">Use handles to reposition</span>
        </div>
        <div className="logo-canvas-border">
          {/* Shirt silhouette overlay so user knows where the shirt is */}
          <svg className="shirt-silhouette" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            {/* T-shirt outline guide */}
            <path
              d="M 160 80 L 100 140 L 140 155 L 140 430 L 372 430 L 372 155 L 412 140 L 352 80 L 300 110 Q 256 130 212 110 Z"
              fill="none"
              stroke="rgba(200,169,110,0.25)"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
          </svg>
          <canvas ref={canvasElRef} />
        </div>
        <p className="logo-editor-tip">
          ↑ This preview maps directly onto the shirt front
        </p>
      </div>
    </div>
  )
})

LogoEditor.displayName = 'LogoEditor'
export default LogoEditor
