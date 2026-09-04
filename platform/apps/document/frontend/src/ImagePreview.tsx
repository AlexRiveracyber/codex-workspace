import React, { useEffect, useRef, useState } from 'react';

export const ImagePreview: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const image = new Image();
    image.onload = () => {
      const scanScale = Math.min(1, 640 / Math.max(image.naturalWidth, image.naturalHeight));
      const scan = document.createElement('canvas');
      scan.width = Math.max(1, Math.round(image.naturalWidth * scanScale));
      scan.height = Math.max(1, Math.round(image.naturalHeight * scanScale));
      const scanContext = scan.getContext('2d', { willReadFrequently: true });
      if (!scanContext) return setFailed(true);
      scanContext.drawImage(image, 0, 0, scan.width, scan.height);
      const pixels = scanContext.getImageData(0, 0, scan.width, scan.height).data;
      let left = scan.width; let top = scan.height; let right = -1; let bottom = -1;
      for (let y = 0; y < scan.height; y += 1) for (let x = 0; x < scan.width; x += 1) {
        const offset = (y * scan.width + x) * 4;
        if (pixels[offset + 3] > 10 && (pixels[offset] < 246 || pixels[offset + 1] < 246 || pixels[offset + 2] < 246)) {
          left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
      }
      const padding = 8;
      if (right < left || bottom < top) { left = 0; top = 0; right = scan.width - 1; bottom = scan.height - 1; }
      left = Math.max(0, left - padding); top = Math.max(0, top - padding);
      right = Math.min(scan.width - 1, right + padding); bottom = Math.min(scan.height - 1, bottom + padding);
      const sourceX = Math.floor(left / scanScale); const sourceY = Math.floor(top / scanScale);
      const sourceWidth = Math.min(image.naturalWidth - sourceX, Math.ceil((right - left + 1) / scanScale));
      const sourceHeight = Math.min(image.naturalHeight - sourceY, Math.ceil((bottom - top + 1) / scanScale));
      const outputScale = Math.min(1, 2048 / Math.max(sourceWidth, sourceHeight));
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.max(1, Math.round(sourceWidth * outputScale));
      canvas.height = Math.max(1, Math.round(sourceHeight * outputScale));
      canvas.getContext('2d')?.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    };
    image.onerror = () => setFailed(true);
    image.src = src;
    return () => { image.onload = null; image.onerror = null; };
  }, [src]);

  return failed ? <img src={src} alt={alt}/> : <canvas ref={canvasRef} role="img" aria-label={alt}/>;
};
