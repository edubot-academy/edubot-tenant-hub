import { useCallback, useEffect, useRef, useState } from "react";

export function SignaturePad({
  disabled = false,
  onSave,
}: {
  disabled?: boolean;
  onSave: (file: File) => Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#1f2937";
  }, []);

  const getPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const clearPad = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setHasStroke(false);
  }, []);

  const beginStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pt = getPoint(e);
      if (!canvas || !ctx || !pt) return;
      isDrawingRef.current = true;
      lastPointRef.current = pt;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + 0.01, pt.y + 0.01);
      ctx.stroke();
      setHasStroke(true);
      canvas.setPointerCapture(e.pointerId);
    },
    [disabled, getPoint],
  );

  const moveStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || !isDrawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pt = getPoint(e);
      if (!canvas || !ctx || !pt) return;
      const last = lastPointRef.current ?? pt;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      lastPointRef.current = pt;
    },
    [disabled, getPoint],
  );

  const endStroke = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      canvasRef.current?.releasePointerCapture(e.pointerId);
    },
    [disabled],
  );

  const savePad = useCallback(async () => {
    const canvas = canvasRef.current;
    if (disabled || !canvas || !hasStroke) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    await onSave(new File([blob], `signature-drawn-${Date.now()}.png`, { type: "image/png" }));
  }, [disabled, hasStroke, onSave]);

  return (
    <div className="mt-2 rounded-2xl border-2 border-dashed border-border p-4 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="text-sm font-black">Draw your signature</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border-2 border-border bg-background text-xs font-black hover:bg-muted disabled:opacity-40"
            onClick={clearPad}
            disabled={disabled || !hasStroke}
          >
            Clear
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border-2 border-foreground bg-foreground text-background text-xs font-black disabled:opacity-40"
            onClick={savePad}
            disabled={disabled || !hasStroke}
          >
            {disabled ? "Saving…" : "Save Signature"}
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={960}
        height={240}
        className={`w-full h-36 rounded-xl border-2 border-border bg-[#fffdf8] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"} touch-none`}
        style={{
          backgroundImage: `linear-gradient(to bottom, transparent calc(50% - 0.5px), rgba(148,163,184,0.3) calc(50% - 0.5px), rgba(148,163,184,0.3) calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
        }}
        onPointerDown={beginStroke}
        onPointerMove={moveStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
    </div>
  );
}
