import * as R from 'ramda';
import { useEffect } from 'react';
import { useAnimate } from 'framer-motion';
import type { AnyFunction } from '@/lib/utils';

export function AnimateOnce({ onComplete, className, children }: {
  onComplete: AnyFunction,
  className?: string,
  children?: React.ReactNode,
}) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      scope.current,
      { opacity: 0 },
      {
        delay: 1,
        duration: 1.5
      }
    ).then(onComplete);
  }, [scope, animate, onComplete]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
