import { useAtomValue } from 'jotai';
import { statusAtom } from '@/app/world/[[...path]]/store';
import AreaPickerControl from '@/app/world/[[...path]]/AreaPickerControl';

export default function Status(params: any) {
  const status = useAtomValue(statusAtom);
  let msg = '';
  let control = null;

  if (!status) {
    return null;
  }

  switch (status) {
    case 'areaPicker':
      msg = '正在編輯「我的區域」';
      control = <AreaPickerControl />;
      break;
    case 'spotForm':
      msg = '正在編輯新地點';
      control = null;
      break;
    case 'followupForm':
      msg = '正在新增跟進動態';
      control = null;
      break;
    case 'amendSpotForm':
      msg = '正在修改地點資料';
      control = null;
      break;
    case 'amendFollowupForm':
      msg = '正在修改跟進資料';
      control = null;
      break;
    default:
      break;
  }

  return (
    <div className='fixed flex flex-col items-end gap-y-1 top-1 right-2 z-[401]'>
      <div className='p-2 px-4 rounded bg-pink-200 opacity-80'>
        {msg}
      </div>

      {control &&
        <div className=''>
          {control}
        </div>
      }
    </div>
  );
}
