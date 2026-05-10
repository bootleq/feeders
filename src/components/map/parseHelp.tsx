import parse, { HTMLReactParserOptions, Element, Text, DOMNode } from 'html-react-parser';
import { MapPinIcon } from '@heroicons/react/24/solid';

const helpBodyIconSize = 24;

const helpHtmlParserOption: HTMLReactParserOptions = {
  replace(domNode) {
    if (domNode instanceof Element && domNode.attribs) {
      const { type, name, attribs, children } = domNode;

      if (type === 'tag') {
        if (name === 'span' && attribs.class === 'font-mono italic') {
          const text = (domNode.firstChild as Text).data;
          switch (text) {
            case 'MAP-PIN':
              return <img src="/assets/map-pin.svg" alt='地圖點' className='translate-x-[1px]' width={helpBodyIconSize} height={helpBodyIconSize} />;
              break;
            case 'MAP-PIN-DONE':
              return <img src="/assets/location-check.svg" alt='完成地圖點' className='-translate-y-[1px]' width={helpBodyIconSize} height={helpBodyIconSize} />;
              break;
            case 'MAP-PIN-NEW':
              return <MapPinIcon className='inline fill-red-500 align-text-bottom -mx-[5px]' width={helpBodyIconSize} height={helpBodyIconSize} />
              break;
          }
          return <></>; // remove unrecognized node
        }
      }
      return null; // no touch
    }
  }
};

export default function parseHelp(html: string) {
  const content = parse(html, helpHtmlParserOption);
  return content;
}
