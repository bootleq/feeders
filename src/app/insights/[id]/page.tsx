import * as R from 'ramda';
import { CMS_URL } from '@/lib/directus';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata, ResolvingMetadata } from 'next';
import parse, { HTMLReactParserOptions, Element, DOMNode, attributesToProps } from 'html-react-parser';
import { selectOne } from 'css-select';
import { parseSlug } from '@/lib/utils';
import { getInsights } from '@/app/insights/getInsights';
import { getInsightById } from './getInsightById';
import type { File } from './getInsightById';
import Article from './Article';

type Insight = {
  content: ReturnType<typeof parse>,
  [key: string]: any,
};

export async function generateStaticParams() {
  const insights = await getInsights();

  return insights.map((insight) => {
    const { id, slug } = insight;
    return {
      id: `/insights/${id}-${slug}/`,
    };
  });
}

const cmsFileIdFromSrc = (src: string) => {
  const prefix = `${CMS_URL}/assets/`;
  if (!src || !src.startsWith(prefix)) {
    return null;
  }

  const leaf = src.slice(prefix.length);
  const id = leaf.match(/^[\w-]+/)?.[0];
  return id;
};

const calcAspectRatio = (w: any, h: any) => {
  if (typeof w === 'string' && typeof h === 'string') {
    const width = Number.parseInt(w, 10);
    const height = Number.parseInt(h, 10);
    if (width && height) {
      return (width / height).toFixed(4);
    }
  }

  return null;
}

const makeParserOptions = (files: File[]) => {
  const fileIdMapping = files.reduce((acc, file) => {
    acc[file.id] = file;
    return acc;
  }, {});

  const replacer = (node: Element) => {
    const { type, name, attribs, children } = node;

    if (type === 'tag') {
      if (name === 'figure' && attribs.class.split(/\s+/).includes('feeders-mce-figure')) {
        const img = selectOne('img[src]', children);
        if (img?.type === 'tag') {
          const { src, alt } = img.attribs;
          const fileId = cmsFileIdFromSrc(src);
          if (fileId) {
            const file = fileIdMapping[fileId];
            if (file) {
              const { width, height } = file;
              return <Image src={src} alt={alt} className='feeders-mce-figure' { ...{ width, height }} />;
            }
          }
        }
        return <></>; // remove unrecognized node
      } else if (name === 'p' && attribs.class?.split(/\s+/).includes('feeders-mce-iframe')) {
        const iframe = selectOne('iframe[src]', children);

        if (iframe?.type === 'tag') {
          const props = attributesToProps(iframe.attribs);
          const { width, height } = props;
          const aspectRatio = calcAspectRatio(width, height);
          return <iframe {...props} className='feeders-mce-iframe' style={aspectRatio ? { aspectRatio } : {}} />;
        }
        return <></>; // remove unrecognized node
      }
    }

    return null; // no touch
  };

  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (domNode instanceof Element && domNode.attribs) {
        return replacer(domNode);
      }
    }
  };

  return options;
};

async function getInsight(id: number) {
  const { insight, files } = await getInsightById(id);

  const parserOptions = makeParserOptions(files);
  const content = parse(insight.content, parserOptions);
  return { ...insight, content } as Insight;
}

type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;
  const [id] = parseSlug(params.id);
  if (!id) notFound();
  const insight = await getInsight(id);

  return {
    title: insight.title,
    alternates: {
      canonical: `/insights/${id}-${insight.slug}/`,
    },
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const [id] = parseSlug(params.id);
  if (!id) notFound();
  const insight = await getInsight(id);
  const { title } = insight;

  return (
    <div className='container mx-auto peer-[[aria-expanded="false"]]:pt-5 sm:peer-[[aria-expanded="false"]]:pt-0'>
      <h1 className='text-4xl py-3 text-center'>
        {title}
      </h1>
      <Article post={insight} />
    </div>
  );
}
