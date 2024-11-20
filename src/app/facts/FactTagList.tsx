"use client"

import { getTagColor } from './colors';

export default function FactTagList({ tags, className }: {
  tags: string[] | null,
  className?: string,
}) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <ul data-role='tags' className={`flex flex-wrap items-center justify-end gap-y-1 text-xs ${className || ''}`}>
      {tags.map(tag => (
        <li key={tag} className={`${getTagColor(tag).join(' ')} rounded-full px-1 p-px mx-px border text-nowrap`}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
