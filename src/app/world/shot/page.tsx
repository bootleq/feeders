'use client';

import * as R from 'ramda';
import Image from 'next/image';
import { useState, useRef, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import ExifReader from 'exifreader';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { TW_BOUNDS, TW_CENTER, googleMapURL } from '@/app/world/mapUtil';
import Sidebar from '@/components/Sidebar';
import LinkPreview from '@/components/LinkPreview';
import LazyMap from './LazyMap';
import { mergeTempMarkerAtom } from './store';
import { MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import siteIcon from '@/app/icon.svg'

import '@/components/leaflet/leaflet.css';  // import CSS here instead of inside SimpleMap for stability

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
].join(' ')

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
      } else {
        return reject(new Error('檔案中沒有 GPS 資訊'));
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
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);

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

  const onReLocate = useCallback(() => {
    const { lon, lat } = location;
    if (lon && lat) {
      setTempMarker({ visible: true, lat: lat, lon: lon });
    }
  }, [location, setTempMarker]);

  const { lon, lat } = location;

  return (
    <main className="flex min-h-screen flex-row items-start justify-between">
      <Sidebar defaultOpen fixed={false} className={`sm:w-fit lg:w-fit lg:max-w-[80%] max-h-screen scrollbar-thin flex flex-col pb-1 z-[810] bg-gradient-to-br from-stone-50 to-slate-200`}>
        <div className='flex'>
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">從照片新增地點</h1>

            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="mb-4 p-2 border rounded-md font-mono cursor-pointer"
              disabled={loading}
            />

            <div>
              {loading && <p>處理中...</p>}

              {error && <p className="text-red-500">錯誤：{error}</p>}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {
              selectedFile &&
                <div className="mt-4">
                  {imageUrl ? (
                    <>
                      <h2 className="text-lg font-semibold mb-2">畫面（低畫質）</h2>
                      <div className='max-h-[640px]'>
                        <Image
                          ref={imageRef}
                          src={imageUrl}
                          alt="已上傳的照片"
                          width={640}
                          height={480}
                          className="border max-h-full w-auto"
                        />
                      </div>
                    </>
                  ) :
                    <div>
                      無法顯示照片內容
                    </div>
                  }
                </div>
            }


            {(lat && lon) && (
              <div className="mt-4 p-3 bg-gradient-to-br from-stone-50 to-slate-200 rounded-md ring">
                <div className='grid grid-cols-[auto_1fr] items-center gap-4'>
                  <strong className='min-w-10'>座標</strong>
                  <div className='flex items-center flex-wrap gap-y-1'>
                    <Tooltip>
                      <TooltipTrigger><code className='text-base max-w-20 truncate hover:bg-yellow-300/50'>{lat}</code></TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>{lat}</TooltipContent>
                    </Tooltip>
                    <small className='text-base'>,</small>
                    <Tooltip>
                      <TooltipTrigger><code className='text-base ml-1 max-w-20 truncate hover:bg-yellow-300/50'>{lon}</code></TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>{lon}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <a
                          className='flex items-start mx-2 font-sans whitespace-nowrap rounded-full hover:bg-yellow-300/50'
                          aria-label='在 Google 地圖開啟座標'
                          href={googleMapURL(lat, lon)}
                          target='_blank'
                        >
                          <span className='text-base text-slate-700 px-1 font-bold'>G</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>在 Google 地圖開啟座標</TooltipContent>

                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <a
                          className='flex items-start shrink-0 font-sans whitespace-nowrap rounded-full hover:bg-yellow-300/50'
                          aria-label='在 Feeders 地圖開啟'
                          href={ `/world/area/@${lat},${lon}`}
                          target='_blank'
                        >
                          <Image src={siteIcon} alt='在 Feeders 地圖開啟' className='px-px py-0.5' width={17} height={17} />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent className={`${tooltipCls}`}>在 Feeders 地圖開啟</TooltipContent>
                    </Tooltip>

                    <button className='ml-auto btn bg-slate-100 ring-1 flex items-center hover:bg-white' onClick={onReLocate}>
                      重新定位
                      <MapPinIcon className='fill-red-600 ml-px shrink-0' height={18} />
                      <ArrowRightIcon className='shrink-0 hidden md:block' height={18} />
                    </button>
                  </div>

                  {time && (
                    <>
                      <strong className='min-w-10'>拍攝時間</strong>
                      <div className='flex items-center'>
                        <div className='font-mono'>{time}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className='mt-5 my-3 text-gray-700'>
              註：照片不會上傳到伺服器（暫時無此功能），只是讀取檔案資訊而已
            </div>
          </div>

        </div>
      </Sidebar>

      <div className='relative w-full h-[100vh] ml-auto'>
        {(lat && lon) &&
          <LazyMap
            preferCanvas={true}
            center={[lat, lon]}
            minZoom={15}
            zoom={18}
            maxZoom={20}
            maxBounds={TW_BOUNDS}
            maxBoundsViscosity={0.5}
            zoomControl={false}
          >
          </LazyMap>
        }
      </div>

      <LinkPreview />
    </main>
  );
}
