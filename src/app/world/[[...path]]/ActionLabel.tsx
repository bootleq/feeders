"use client"

import { t } from '@/lib/i18n';

// Same as i18n translations, just to allow tailwind parsing in compile time
const ensureTWClassNames = {
  spotActionColor: {
    'see':      'bg-slate-900 opacity-70',
    'remove':   'bg-green-700',
    'talk':     'bg-yellow-600',
    'investig': 'bg-blue-700',
    'power':    'bg-slate-900',
    'coop':     'bg-red-400',
    'downvote': 'bg-red-700',
    'resolve':  'bg-green-900',
  },
};

export default function ActionLabel({ action, className, children }: {
  action: string,
  className?: string,
  children?: React.ReactNode
}) {
  let cls = t('spotActionColor', action);

  return (
    <span className={`rounded-lg px-2 text-white text-sm font-normal ${cls} ${className}`}>
      {t('spotAction', action)}
    </span>
  );
}
