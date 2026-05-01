'use client';

import * as R from 'ramda';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import ExifReader from 'exifreader';

type Location = {
  lat: number | null;
  lon: number | null;
};

interface ProcessedImage {
  imageUrl: string | null;
  location: Location;
  time: string | null;
}

const SCALE_DOWN_STEP = 0.8;
const MAX_DIMENSION = 640;

async function stepScaleDown(img: HTMLImageElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get 2D context for temp canvas");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  let iterImg = img;

  while (iterImg.width > MAX_DIMENSION || iterImg.height > MAX_DIMENSION) {
    let nextW = Math.max(1, Math.round(iterImg.width * SCALE_DOWN_STEP));
    let nextH = Math.max(1, Math.round(iterImg.height * SCALE_DOWN_STEP));
    canvas.width = nextW;
    canvas.height = nextH;
    ctx.drawImage(iterImg, 0, 0, nextW, nextH);
    const intermediateImageUrl = canvas.toDataURL('image/jpeg', 0.9);

    iterImg = await new Promise((resolve, reject) => {
      const img = new (window as any).Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = intermediateImageUrl;
    });
  }

  canvas.width = iterImg.width;
  canvas.height = iterImg.height;
  ctx.drawImage(iterImg, 0, 0, iterImg.width, iterImg.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

const processFile = async (
  file: File,
  canvas: HTMLCanvasElement
): Promise<ProcessedImage> => {
  return new Promise(async (resolve, reject) => {
    let imageUrl: string | null = null;
    let location: Location = { lat: null, lon: null };
    let time = null;

    // 1. Read EXIF info
    try {
      const tags = await ExifReader.load(file, {
        expanded: true,
        includeTags: {
          gps: true,
          exif: ['DateTime'],
        }
      });
      const lat = tags.gps?.Latitude;
      const lon = tags.gps?.Longitude;
      if (lat && lon) {
        location = { lat, lon };
      }
      time = tags['exif']?.['DateTime']?.value[0] || null;
    } catch (err) {
      return reject(new Error('無法取得檔案中的 GPS 資訊', { cause: err }));
    }

    // 2. Load image and resize
    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      if (!src) {
        return reject(new Error('Error loading file src'));
      }

      const img = new (window as any).Image();
      img.onload = async () => {
        try {
          imageUrl = await stepScaleDown(img, canvas);
        } catch (err) {
          console.log("Error loading image (onload):", err);
          imageUrl = null;
        } finally {
          resolve({ imageUrl, location, time });
        }
      };
      img.onerror = () => {
        console.log("Error loading image (onerror):");
        imageUrl = null;
        resolve({ imageUrl, location, time });
      };
      // Async load the image
      img.src = src;
    };
    reader.onerror = (err) => {
      reject(new Error('Error reading file', {cause: err}));
    };
    reader.readAsDataURL(file);
  });
};

export default function Page() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<Location>({ lat: null, lon: null });
  const [time, setTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setLoading(true);
    setImageUrl(null);
    setLocation({ lat: null, lon: null });
    setTime(null);

    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setLoading(false);
      return;
    }

    setSelectedFile(file);

    try {
      if (canvasRef.current) {
        const result = await processFile(file, canvasRef.current);
        setImageUrl(result.imageUrl);
        setLocation(result.location);
        setTime(result.time);
      } else {
        setError('Canvas not ready.');
      }
    } catch (err: any) {
      console.log("Error processing file:", err);
      setError(err.message || '發生未知錯誤');
    } finally {
      setLoading(false);
    }
  }, [canvasRef]);

  const { lon, lat } = location;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">從照片新增地點</h1>

      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="mb-4 p-2 border rounded-md font-mono"
        disabled={loading}
      />

      {loading && <p>處理中...</p>}

      {error && <p className="text-red-500">錯誤：{error}</p>}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="mt-4">
        {imageUrl ? (
          <>
            <h2 className="text-lg font-semibold mb-2">照片縮圖（低畫質）</h2>
            <Image
              ref={imageRef}
              src={imageUrl}
              alt="已上傳的照片"
              width={640}
              height={480}
              className="border"
            />
          </>
        ) :
          <div>
            無法顯示照片內容
          </div>
        }
      </div>

      {(lat && lon) && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <div className="text-lg font-semibold mb-2">座標：</div>
          <p>經度 (longitude): <span className='font-mono'>{lon.toFixed(6)}</span></p>
          <p>緯度 (latitude): <span className='font-mono'>{lat.toFixed(6)}</span></p>
        </div>
      )}

      {time && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <div className="text-lg font-semibold mb-2">拍攝時間：</div>
          <span className='font-mono'>{time}</span>
        </div>
      )}
    </div>
  );
}
