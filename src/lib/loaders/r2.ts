const cmsPrefix = `${process.env.NEXT_PUBLIC_CMS_URL}/assets/`;
const r2Prefix = process.env.NEXT_PUBLIC_R2_URL_PATH;

// Transform local src => r2 src, e.g.:
//  http://localhost:8055/assets/b64f2e08-ff55-4f98-9b1a-33900ad0d809.png
//                        ^^^^^^
//  https://feedersrc.example.com/b64f2e08-ff55-4f98-9b1a-33900ad0d809.png

export default function R2ImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (src.startsWith(cmsPrefix)) {
    const basename = src.substring(cmsPrefix.length);

    // Do no optimization
    return `${r2Prefix}${basename}`;
  }

  return '';
}
