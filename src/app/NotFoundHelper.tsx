"use client"

export default function NotFoundHelper() {
  const url = new URL(window.location.href);

  return (
    <div>
      <code>
        {url.pathname}
      </code>
    </div>
  );
}
