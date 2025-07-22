export interface TextNodePosition {
  node: Text;
  start: number;
  end: number;
}

function getAllTextNodes(container: Node): Text[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let curr: Node | null;
  while ((curr = walker.nextNode())) {
    nodes.push(curr as Text);
  }
  return nodes;
}

function buildNodeMap(nodes: Text[]): TextNodePosition[] {
  const map: TextNodePosition[] = [];
  let pos = 0;
  for (const node of nodes) {
    const len = node.textContent?.length ?? 0;
    map.push({ node, start: pos, end: pos + len });
    pos += len;
  }
  return map;
}

export function findRanges(container: Node, keyword: string): Range[] {
  if (!keyword) return [];
  const textNodes = getAllTextNodes(container);
  const nodeMap = buildNodeMap(textNodes);
  const fullText = textNodes.map(n => n.textContent).join('').toLowerCase();
  const ranges: Range[] = [];

  const keywordLowerCase = keyword.toLowerCase();

  let index = 0;
  while ((index = fullText.indexOf(keywordLowerCase, index)) !== -1) {
    let startInfo: TextNodePosition | undefined, endInfo: TextNodePosition | undefined;
    for (const entry of nodeMap) {
      if (!startInfo && index >= entry.start && index < entry.end) {
        startInfo = entry;
      }
      if (index + keyword.length > entry.start && index + keyword.length <= entry.end) {
        endInfo = entry;
        break;
      }
    }
    if (startInfo && endInfo) {
      const range = document.createRange();
      range.setStart(startInfo.node, index - startInfo.start);
      range.setEnd(endInfo.node, index + keyword.length - endInfo.start);
      ranges.push(range);
    }
    index += keyword.length;
  }
  return ranges;
}
