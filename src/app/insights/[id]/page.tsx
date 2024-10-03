import * as R from 'ramda';
import { auth } from '@/lib/auth';
import directus, { CMS_URL } from '@/lib/directus';
import { readItem, readFiles } from '@directus/sdk';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata, ResolvingMetadata } from 'next';
import parse, { HTMLReactParserOptions, Element, DOMNode, attributesToProps } from 'html-react-parser';
import { selectOne } from 'css-select';
import { parseSlug, APP_URL } from '@/lib/utils';
import { getWorldUsers } from '@/models/users';
import Sidebar from '@/components/Sidebar';
import Alerts from '@/components/Alerts';
import { alertsAtom, dismissAlertAtom } from '@/components/store';
import Article from './Article';

export const runtime = 'edge';

type Insight = {
  content: ReturnType<typeof parse>,
  [key: string]: any,
};

type File = {
  [key: string]: any,
};

async function getUser(id: string | undefined) {
  if (id) {
    const users = await getWorldUsers(id);
    if (users) {
      return users[0];
    }
  }

  return null;
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
  const insight = await directus.request(readItem('insights', id, {
    fields: [
      'id',
      'title',
      'slug',
      'content',
      'publishedAt',
      'modifiedAt',
      'editors',
      'tags',
      'cms_file_ids',
      {
        'facts.Facts_id': [
          'id',
          'title',
          'date'
        ],
      },
    ]
  }));

  let files: File[] = [];

  try {
    files = await directus.request(readFiles({
      filter: {
        folder: { name: { _eq: 'public' } },
        id: {
          _in: JSON.parse(insight.cms_file_ids)
        }
      },
    }));
  } catch (e) {
    console.log("Failed reading files", e);
  }

  const parserOptions = makeParserOptions(files);
  const content = parse(insight.content, parserOptions);
  const facts = R.map(R.prop('Facts_id'), insight.facts);
  return { ...insight, content, facts } as Insight;
}

type Props = {
  params: { id: string }
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const [id] = parseSlug(params.id);
  if (!id) notFound();
  const insight = await getInsight(id);

  return {
    metadataBase: APP_URL,
    alternates: {
      canonical: `/insights/${id}-${insight.slug}`
    },
  };
}

export default async function Page({ params }: Props) {
  const [id] = parseSlug(params.id);
  if (!id) notFound();
  const session = await auth();
  const user = await getUser(session?.userId);
  const insight = await getInsight(id);
  const { title } = insight;

  return (
    <main className="flex min-h-screen flex-row items-start justify-start">
      <Sidebar user={user} navTitle='見解' defaultOpen={false} className={`max-h-screen scrollbar-thin flex flex-col pb-1 z-[410] bg-gradient-to-br from-stone-50 to-slate-200`}>
      </Sidebar>

      <div className='container mx-auto ring'>
        <h1 className='text-4xl py-3 text-center'>
          {title}
        </h1>
        <Article post={insight} />
      </div>

      <Alerts itemsAtom={alertsAtom} dismissAtom={dismissAlertAtom} />
    </main>
  );
}
