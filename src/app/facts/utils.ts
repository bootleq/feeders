import tlStyles from './timeline.module.scss';

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
