"use client"

import { AppProgressBar } from 'next-nprogress-bar';

const targetPreprocessor = (url: URL) => {
  const currentURL = new URL(window.location.href);
  console.log('tx', url);

  return currentURL;
};

export default function ProgressBar() {
  return (
    <AppProgressBar
      height='3px'
      color='#000'
    />
  );
}
