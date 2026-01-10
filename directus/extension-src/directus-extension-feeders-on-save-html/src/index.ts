import { defineHook } from '@directus/extensions-sdk';

import sanitizeHtml from 'sanitize-html';
import * as htmlparser2 from 'htmlparser2';
import { selectAll } from 'css-select';
import type { Element } from 'domhandler';

const targetFields: Record<string, string[]> = {
  facts: ['desc', 'summary', 'origin'],
  insights: ['content'],
  laws: ['summary', 'penalty', 'judgements'],
  blocks: ['content'],
};

const allowedAttributes = {
  ...sanitizeHtml.defaults.allowedAttributes,
  'a': [
    'href',
    'name',
    'target',
    'title',
    {
      name: 'rel',
      multiple: true,
      values: [
        'nofollow',
        'noopener',
        'noreferrer',
      ],
    }
  ],
  'iframe': [
    'src',
    'loading',
    'allow',
    'width',
    'height',
    'name',
    {
      name: 'allow',
      multiple: true,
      values: ['fullscreen', 'web-share'],
    }
  ],
  '*': ['class'],
};

const allowedClasses = {
  'table': ['feeders-mce-digit'],
  'figure': ['feeders-mce-figure'],
  'ol': ['feeders-mce-lengthy'],
  'ul': ['feeders-mce-lengthy'],
  'a': ['feeders-mce-lengthy'],
  'p': ['feeders-mce-iframe'],
  '*': ['font-mono', 'italic', 'underline', 'line-through', 'text-left'],
};

const allowedIframeHostnames = [
  'www.youtube.com',
  'bootleq.github.io',
];

const disallowedTagsMode = 'discard';

const tagsFigure = 'figure,figcaption'.split(',');
const tagsTable = 'table,colgroup,col,thead,th,tbody,tr,td'.split(',');
const tagsSimple = 'p,a,b,i,em,strong,blockquote,div,span,hr,ol,ul,li,br,code,kbd,details,summary'.split(',');
const tagsAdvanced = tagsSimple.concat(tagsFigure).concat(tagsTable).concat('h2,h3,h4,img,iframe'.split(','));
const tagsFacts = tagsSimple.concat(tagsTable);

const modelTagsMapping: Record<string, string[]> = {
  facts: tagsFacts,
  insights: tagsAdvanced,
  laws: tagsSimple,
};

const FILE_ID_FIELD_NAME = 'cms_file_ids';
const fileSelectors: Record<string, string> = {
  insights: '.feeders-mce-figure img[src]',
};


const eventScopes = Object.keys(modelTagsMapping).reduce((acc: string[], model: string) => {
  acc = acc.concat([`${model}.items.create`, `${model}.items.update`]);
  return acc;
}, []);

// Extract file (directus_files) id from Element,
// For example <img> with src="http://localhost:8055/assets/b64f2e08-ff55-4f98-9b1a-33900ad0d809.png?"
// has file id equals to the basename (without suffix) of image.
const extractFileId = (node: Element, publicURL: string) => {
  if (node.name === 'img') {
    const { src } = node.attribs;
    const prefix = `${publicURL}/assets/`;
    if (!src || !src.startsWith(prefix)) {
      return null;
    }

    const leaf = src.slice(prefix.length);
    const id = leaf.match(/^[\w-]+/)?.[0];
    return id;
  }

  return null;
};

export default defineHook(({ filter }, { env }) => {
  const { PUBLIC_URL } = env;
  if (!PUBLIC_URL) {
    throw new Error("No PUBLIC_URL defined, need it to determine file id.");
  }

	for (const eventScope of eventScopes) {
		filter(eventScope, run);
	}

	function run(input: any, { collection }: any) {
    const fileSelector = fileSelectors[collection];
    const fileIds: string[] = [];

    for (const field of targetFields[collection] || []) {
      if (input[field] === null) {
        continue;
      }

      const html = sanitize(input[field], collection);
      input[field] = html;

      if (fileSelector && html) {
        const dom = htmlparser2.parseDOM(html);
        const files = selectAll(fileSelector, dom).filter(node => node.type === 'tag');
        files.forEach(file => {
          const id = extractFileId(file as Element, PUBLIC_URL);
          if (id) {
            fileIds.push(id);
          }
        });
      }
    }
    if (fileIds.length) {
      input[FILE_ID_FIELD_NAME] = fileIds;
      // TODO: determine how to handle image removal (no ids while the files still exist)
    }

		return input;
	}

	function sanitize(val: any, collection: string) {
		switch (typeof val) {
			case 'string':
        const allowedTags = modelTagsMapping[collection] || tagsSimple;
				return sanitizeHtml(val, { allowedTags, disallowedTagsMode, allowedAttributes, allowedClasses, allowedIframeHostnames });
			case 'undefined':
        return val;
			default:
        throw new Error(`Unexpect value type (${typeof val}) during sanitize.`);
		}
	}
});
