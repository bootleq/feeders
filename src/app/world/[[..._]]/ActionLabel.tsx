"use client"

export default function ActionLabel({ action, className, children }: {
  action: string,
  className?: string,
  children?: React.ReactNode
}) {
  let cls = '';
  let t: { [key: string]: string } = {
    see: '看見',
    remove: '移除',
    talk: '溝通',
    investig: '調查',
    power: '公權力',
    coop: '互助',
    downvote: '扣分',
  };

  switch (action) {
    case 'see':
      cls = 'bg-slate-900 opacity-70';
      break;
    case 'talk':
      cls = 'bg-yellow-600';
      break;
    case 'remove':
      cls = 'bg-green-700';
      break;
    case 'investig':
      cls = 'bg-blue-700';
      break;
    case 'downvote':
      cls = 'bg-red-700';
      break;
    default:
      cls = 'bg-slate-900';
  }

  return (
    <span className={`inline-block rounded-lg px-2 text-white text-sm font-normal flex items-center ${cls} ${className}`}>
      {t[action]}
    </span>
  );
}

