import { useRef, useState, type PointerEvent } from 'react'

export function SignaturePad({ label, onSignedChange }: { label: string; onSignedChange: (signed: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasInk, setHasInk] = useState(false)
  const strokedRef = useRef(false)

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    const start = point(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    context.beginPath()
    context.moveTo(start.x, start.y)
    context.strokeStyle = '#071d3d'
    context.lineWidth = 5
    context.lineCap = 'round'
    context.lineJoin = 'round'
    drawingRef.current = true
    strokedRef.current = false
  }

  const continueDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const context = event.currentTarget.getContext('2d')
    if (!context) return
    const next = point(event)
    context.lineTo(next.x, next.y)
    context.stroke()
    strokedRef.current = true
  }

  const finishDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!strokedRef.current) return
    setHasInk(true)
    onSignedChange(true)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onSignedChange(false)
  }

  const useDemoSignature = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.beginPath()
    context.moveTo(110, 145)
    context.bezierCurveTo(180, 40, 190, 210, 250, 110)
    context.bezierCurveTo(295, 35, 305, 190, 360, 105)
    context.bezierCurveTo(400, 55, 420, 145, 510, 100)
    context.strokeStyle = '#071d3d'
    context.lineWidth = 5
    context.lineCap = 'round'
    context.stroke()
    setHasInk(true)
    onSignedChange(true)
  }

  return (
    <div className={`signature-pad${hasInk ? ' signature-pad--signed' : ''}`}>
      <canvas ref={canvasRef} width={640} height={220} aria-label={`${label} signature pad`} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={finishDrawing} onPointerCancel={finishDrawing} />
      <span className="signature-line">Sign above</span>
      <div className="signature-pad-actions"><button type="button" onClick={clearSignature} disabled={!hasInk}>Clear</button><button type="button" onClick={useDemoSignature}>Use demo signature</button></div>
    </div>
  )
}
