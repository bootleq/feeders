import { unstable_cache as original_unstable_cache } from 'next/cache';
import { parse, stringify } from 'superjson';

// Cover types like Date serialization.
// Ref source:
// https://github.com/vercel/next.js/issues/51613#issuecomment-2660139454

type Callback = (...args: any[]) => Promise<any>;

export function unstable_cache<T extends Callback>(
  fn: T,
  keyParts?: string[],
  opts?: { revalidate?: number | false; tags?: string[] }
): T {
  const wrap = async (params: Parameters<T>): Promise<string> => {
    const result = await fn(...params);
    return stringify(result);
  }

  return (async (...params: Parameters<T>) => {
    const keyPartsWithFn = [
      fn.toString(), // Use the function itself as part of the cache key
      ...(keyParts ?? []),
    ];
    const result = await original_unstable_cache(wrap, keyPartsWithFn, opts)(params);

    return parse(result);
  }) as T;
}
