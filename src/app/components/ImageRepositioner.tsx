import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageRepositionerProps {
  initialImage: string;
  onConfirm: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for banner
  frameSize?: { width: number; height: number }; // in pixels
  title?: string;
}

export function ImageRepositioner({
  initialImage,
  onConfirm,
  onCancel,
  aspectRatio = 1,
  frameSize = { width: 300, height: 300 },
  title = "Reposition Image",
}: ImageRepositionerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Center the image initially
      const imgAspect = img.width / img.height;
      const frameAspect = frameSize.width / frameSize.height;
      
      if (imgAspect > frameAspect) {
        const initialScale = frameSize.height / img.height;
        setScale(initialScale);
        setOffsetX((frameSize.width - img.width * initialScale) / 2);
      } else {
        const initialScale = frameSize.width / img.width;
        setScale(initialScale);
        setOffsetY((frameSize.height - img.height * initialScale) / 2);
      }
    };
    img.src = initialImage;
  }, [initialImage, frameSize]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, frameSize.width, frameSize.height);

    // Draw image
    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      image.width * scale,
      image.height * scale
    );

    // Draw frame border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, frameSize.width, frameSize.height);
  }, [image, scale, offsetX, offsetY, frameSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setOffsetX((prev) => prev + deltaX);
    setOffsetY((prev) => prev + deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleReset = () => {
    if (!image) return;
    const imgAspect = image.width / image.height;
    const frameAspect = frameSize.width / frameSize.height;

    if (imgAspect > frameAspect) {
      const initialScale = frameSize.height / image.height;
      setScale(initialScale);
      setOffsetX((frameSize.width - image.width * initialScale) / 2);
      setOffsetY(0);
    } else {
      const initialScale = frameSize.width / image.width;
      setScale(initialScale);
      setOffsetX(0);
      setOffsetY((frameSize.height - image.height * initialScale) / 2);
    }
  };

  const handleConfirm = () => {
    if (!canvasRef.current) return;
    onConfirm(canvasRef.current.toDataURL("image/jpeg"));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-white/20 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>

        <div className="mb-4 flex justify-center">
          <canvas
            ref={canvasRef}
            width={frameSize.width}
            height={frameSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move border border-white/30 rounded-lg"
            style={{ maxWidth: "100%" }}
          />
        </div>

        <p className="text-xs text-white/50 mb-4 text-center">Drag to move • Use buttons to zoom and reset</p>

        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={handleZoomOut}
            className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:border-white/40 transition-colors"
          >
            <ZoomOut className="w-4 h-4" /> Zoom Out
          </button>
          <button
            onClick={handleZoomIn}
            className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:border-white/40 transition-colors"
          >
            <ZoomIn className="w-4 h-4" /> Zoom In
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:border-white/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/15 rounded-lg text-white/70 hover:border-white/30 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-white text-zinc-900 rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
