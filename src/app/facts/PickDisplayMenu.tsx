import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { Tooltip, TooltipTrigger, TooltipContentMenu, menuHoverProps } from '@/components/Tooltip';
import { tooltipClass, tooltipMenuCls } from '@/lib/utils';
import { pickDisplayAtom } from './store';
import type { PicksDisplay } from './store';
import { EyeIcon } from '@heroicons/react/24/outline';

const btnCls = 'p-2 w-full cursor-pointer flex items-center gap-1 rounded hover:bg-amber-200 disabled:opacity-50 disabled:cursor-default';

export default function PickDisplayMenu({ className }: {
  className?: string,
}) {
  const setView = useSetAtom(pickDisplayAtom);

  const onSwitch = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const to = String(e.currentTarget?.dataset.to);
    if (['', 'header'].includes(to)) {
      setView(to as PicksDisplay);
    }
  }, [setView]);

  return (
    <Tooltip placement='top-start' hoverProps={menuHoverProps} role='menu'>
      <TooltipTrigger className=''>
        <button type='button' className={`hidden md:block text-slate-400/85 hover:text-slate-600 ${className || ''}`} aria-label='顯示方式'>
          <EyeIcon height={20} />
        </button>
      </TooltipTrigger>
      <TooltipContentMenu className={tooltipClass('text-sm drop-shadow-md')}>
        <div className={tooltipMenuCls()}>
          <button data-to={''} type='button' className={btnCls} onClick={onSwitch}>
            預設顯示
          </button>
          <button data-to={'header'} type='button' className={btnCls} onClick={onSwitch}>
            只顯示標題列
          </button>
        </div>
      </TooltipContentMenu>
    </Tooltip>
  );
};
