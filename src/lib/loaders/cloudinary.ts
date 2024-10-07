const cmsPrefix = `${process.env.NEXT_PUBLIC_CMS_URL}/assets/`;
const r2Prefix = process.env.NEXT_PUBLIC_R2_URL_PATH;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

// Upload settings, should match config in Cloudinary UI
const uploadFolder = 'feedersrc';
const uploadURLPrefix = r2Prefix!;

// ref: Auto-Upload or Fetch
// https://cloudinary.com/documentation/fetch_remote_images#comparing_fetch_to_auto_upload

export default function CloudinaryImageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  if (src.startsWith(cmsPrefix)) {
    // Transform local src => r2 src, e.g.:
    //  http://localhost:8055/assets/b64f2e08-ff55-4f98-9b1a-33900ad0d809.png?
    //                        ^^^^^^
    //  https://feedersrc.example.com/b64f2e08-ff55-4f98-9b1a-33900ad0d809.png
    const basename = src.substring(cmsPrefix.length).match(/[\w-]+\.[\w]+/)?.[0];
    const r2Src = `${r2Prefix}${basename}`;

    // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports#image-optimization
    const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`]

    // 1) Fetch way
    // return `https://res.cloudinary.com/${cloudName}/image/fetch/${params.join(',')}/${encodeURIComponent(r2Src)}`;

    // 2) Auto-Upload way
    const mappedUploadFolder = uploadFolder;
    const partialPath = r2Src.slice(uploadURLPrefix.length);
    return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(',')}/${mappedUploadFolder}/${encodeURIComponent(partialPath)}`;
  }

  return src;
}
