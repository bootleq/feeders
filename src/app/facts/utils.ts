import tlStyles from './timeline.module.scss';

export const BASE_META = {
  title: '事實記錄',
  description: '台灣地區與遊蕩犬、流浪狗相關的歷史事件表列',
  alternates: {
    canonical: `/facts`
  },
};

export const findFactElement = (anchor?: string) => {
  if (!anchor) return;
  const timeline = document.querySelector('[data-role="timeline"]');
  const target = timeline?.querySelector(`[data-role='fact'][data-anchor='${anchor}']`);
  return target;
};

export const clearMarkIndicators = () => {
  const cls = tlStyles['peeking-target'];
  document.querySelectorAll(`[data-role="fact-date"].${cls}`).forEach(el => el.classList.remove(cls));
  const tl = document.querySelector('[data-role="timeline"]') as HTMLElement;
  if (tl) {
    delete tl.dataset.markOffscreen;
  }
};
