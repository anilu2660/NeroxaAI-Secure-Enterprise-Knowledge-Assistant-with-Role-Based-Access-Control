import { useEffect, useRef, useState } from "react";
import { Move, RotateCw, ZoomIn, ZoomOut, X, Check } from "lucide-react";

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
}

export function ImageCropModal({ imageSrc, onClose, onSave }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Load image object
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
      // Center image
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw crop preview on canvas
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Move to center of canvas
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw image centered with offsets
    const aspect = imageObj.width / imageObj.height;
    let drawW = size;
    let drawH = size;
    if (aspect > 1) {
      drawH = size / aspect;
    } else {
      drawW = size * aspect;
    }

    ctx.drawImage(
      imageObj,
      -drawW / 2 + position.x,
      -drawH / 2 + position.y,
      drawW,
      drawH,
    );

    ctx.restore();

    // Draw circular mask guide
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [imageObj, scale, rotation, position]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Crop & Export high resolution 300x300 image
  const handleCropAndSave = () => {
    if (!imageObj) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 300;
    exportCanvas.height = 300;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Draw circular clip path
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();

    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const aspect = imageObj.width / imageObj.height;
    let drawW = 300;
    let drawH = 300;
    if (aspect > 1) {
      drawH = 300 / aspect;
    } else {
      drawW = 300 * aspect;
    }

    ctx.drawImage(
      imageObj,
      -drawW / 2 + position.x * (300 / 280),
      -drawH / 2 + position.y * (300 / 280),
      drawW,
      drawH,
    );
    ctx.restore();

    const croppedDataUrl = exportCanvas.toDataURL("image/png");
    onSave(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-hairline bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-hairline pb-3">
          <h3 className="font-display text-[17px] font-medium text-foreground">
            Crop Profile Picture
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-hairline bg-secondary/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <p className="mt-2 text-[12px] text-muted-foreground">
          Drag to position your photo inside the circle, and use zoom/rotate controls below.
        </p>

        {/* Canvas Crop Area */}
        <div className="my-5 flex justify-center">
          <div
            className="relative size-[280px] cursor-grab select-none overflow-hidden rounded-full border-2 border-primary/50 shadow-2xl ring-4 ring-primary/10 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
              <Move className="size-8 text-white" />
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="space-y-4 rounded-xl border border-hairline bg-secondary/30 p-3.5">
          <div className="flex items-center gap-3">
            <ZoomOut className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.05}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
            />
            <ZoomIn className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-[42px] text-right font-mono text-[11px] text-foreground/80">
              {Math.round(scale * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-hairline/60 pt-3">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1.5 rounded-lg border border-hairline bg-secondary/40 px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
            >
              <RotateCw className="size-3.5" />
              Rotate 90°
            </button>
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
              }}
              className="text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Reset Position
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <footer className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-hairline bg-secondary/40 px-4 text-[12.5px] font-medium text-foreground/85 transition-colors hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropAndSave}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground shadow-md transition-opacity hover:opacity-90"
          >
            <Check className="size-4" />
            Save Profile Picture
          </button>
        </footer>
      </div>
    </div>
  );
}
