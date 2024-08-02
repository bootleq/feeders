"use client"

export default function StateLabel({ spotState, children }: {
  spotState: string,
  children?: React.ReactNode
}) {
  let cls = '';

  switch (spotState) {
    case 'dirty':
      cls = 'bg-amber-950';
      break;
    case 'clean':
      cls = 'bg-green-700';
      break;
    case 'tolerated':
      cls = 'bg-blue-700';
      break;
    default:
      cls = 'bg-current';
  }

  return (
    <span className={`inline-block rounded-md text-sm px-1 mr-1 text-white font-normal ${cls}`}>
      {children}
    </span>
  );
}
