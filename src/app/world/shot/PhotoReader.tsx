'use client';

import * as R from 'ramda';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import ExifReader from 'exifreader';
import { format } from '@/lib/date-fp';
import { parse, isValid } from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/Tooltip';
import { googleMapURL, TW_BOUNDS } from '@/app/world/mapUtil';
import { sidebarOpenedAtom } from '@/components/store';
import { photoLocationAtom, photoDateAtom, mergeTempMarkerAtom } from './store';
import type { Location } from './store';
import { MapPinIcon, ArrowRightIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import siteIcon from '@/app/icon.svg'

const tooltipCls = [
  'text-xs p-1 px-2 rounded box-border w-max max-w-[calc(100vw_-_10px)] z-[1002]',
  'bg-gradient-to-br from-stone-50 to-slate-100 ring-2 ring-offset-1 ring-slate-300',
].join(' ')

interface ProcessedImage {
  imageUrl: string | null;
  location: Location;
  time: Date | null;
}

const SCALE_DOWN_STEP = 0.8;
const MAX_DIMENSION = 640;

function isWithinBounds(lat: number, lon: number, bounds: number[][]) {
  const [sw, ne] = bounds; // South West / North East
  const isLatInRange = lat >= sw[0] && lat <= ne[0];
  const isLonInRange = lon >= sw[1] && lon <= ne[1];
  return isLatInRange && isLonInRange;
}

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
        if (isWithinBounds(lat, lon, TW_BOUNDS)) {
          location = { lat, lon };
        } else {
          return reject(new Error('離台灣太遠，暫不支援'));
        }
      } else {
        return reject(new Error('檔案中沒有 GPS 資訊'));
      }
      const date = tags['exif']?.['DateTime']?.value[0];
      if (date) {
        let parsedDate;
        try {
          parsedDate = parse(date, 'yyyy:MM:dd HH:mm:ss', new Date());
        } catch {
        }
        if (parsedDate && isValid(parsedDate)) {
          time = parsedDate;
        }
      }
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

export default function PhotoReader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useAtom(photoLocationAtom);
  const [time, setTime] = useAtom(photoDateAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTempMarker = useSetAtom(mergeTempMarkerAtom);
  const [sidebarOpen, setSidebarOpen] = useAtom(sidebarOpenedAtom);

  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onClearPhoto = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setImageUrl(null);
    setSelectedFile(null);
    setLocation({ lat: null, lon: null });
    setError(null);
  }, [setLocation]);

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    setError(null);
    setLoading(true);
    setImageUrl(null);
    setTime(null);

    if (!files || files.length === 0) {
      setSelectedFile(null);
      setLoading(false);
      return;
    }

    const file = files[0];
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
  }, [setLocation, setTime]);

  const onFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    await handleFiles(files);
  }, [handleFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onReLocate = useCallback(() => {
    const { lon, lat } = location;
    if (lon && lat) {
      const defaultDate = time;
      setTempMarker({ visible: true, lat: lat, lon: lon, ...defaultDate });
    }
  }, [location, time, setTempMarker]);

  const onCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  useEffect(() => {
    setLocation({ lat: null, lon: null });
  }, [setLocation]);

  const { lon, lat } = location;
  const filename = selectedFile?.name;

  return (
    <div className="flex flex-col h-full overflow-auto scrollbar-thin px-3 py-4">
      <h1 className="text-2xl font-bold mb-4">從照片新增地點</h1>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`
          relative mb-4 px-2 py-3 border-3 rounded-md cursor-pointer
          flex flex-col items-center justify-center
          transition-colors duration-200 ease-in-out
          ring ring-slate-300
          ${isDragging ? 'border-rose-300 bg-pink-200' : 'border-gray-500 bg-white'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {isDragging ? (
          <p className="text-blue-600">放下吧</p>
        ) : (
          <p className="text-gray-600">
            拖曳照片到此處，或點擊選擇檔案
          </p>
        )}
        { filename &&
          <div className='flex items-center mt-2'>
            <div className='font-mono truncate'>
              {filename}
            </div>
            <button className='btn z-30 text-xs ml-3 my-px p-0.5 flex items-center hover:ring-1 hover:bg-slate-100' onClick={onClearPhoto}>
              <XMarkIcon className='opacity-50 hover:opacity-100 hover:stroke-black' height={18} />
            </button>
          </div>
        }
      </div>

      {
        error &&
        <div className='flex items-center bg-red-200 text-slate-700 p-2 rounded-sm'>
          錯誤：
          <div className='text-red-800'>
            {error}
          </div>
        </div>
      }

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {
        selectedFile &&
          <div className="mt-4">
            {imageUrl ? (
              <>
                <h2 className="text-lg font-semibold mb-2">畫面（低畫質）</h2>
                <div className='max-h-[640px] resize overflow-auto'>
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
                  <div className='font-mono'>{format({}, 'yyyy-MM-dd HH:mm:SS', time)}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {
        (lat && lon) && sidebarOpen &&
          <button type='button' onClick={onCloseSidebar}
            className='md:hidden block w-max mx-auto mt-5 p-1 px-5 leading-6 text-slate-600 bg-gradient-to-br from-stone-50 to-stone-200 ring-4 ring-pink-400 rounded-2xl shadow-2xl z-[1002] opacity-90 hover:opacity-100'
          >
            點這裡
            <span className='text-slate-900'>關閉側邊欄</span>
            <br />
            （因為<strong>地圖</strong>在後面）
          </button>
      }

      <div className='mt-auto mb-4 py-3 w-fit text-gray-700 flex-col gap-y-3'>
        <div className='flex items-center my-2'>
          <InformationCircleIcon className='shrink-0 mr-2' height={22} />
          <div className='text-balance'>
            照片不會上傳到伺服器（暫無此功能），只是讀取檔案資訊而已
          </div>
        </div>

        <div className='flex items-center my-2'>
          <InformationCircleIcon className='shrink-0 mr-2' height={22} />
          <div className='text-balance'>
            距離太近的點，請盡量不要新增記錄；前往<Link href='/world/' className='text-nowrap underline hover:bg-yellow-300/50 text-inherit'>世界地圖</Link>，在原本的點位新增「跟進」比較清楚
          </div>
        </div>

        <div className='flex items-center my-2'>
          <InformationCircleIcon className='shrink-0 mr-2' height={22} />
          <div className='text-balance'>
            本頁是照片專用，完整地圖功能（行政區等）請使用<Link href='/world/' className='text-nowrap underline hover:bg-yellow-300/50 text-inherit'>世界地圖</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
