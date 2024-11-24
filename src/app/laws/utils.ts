import styles from './laws.module.scss';

export const findLawElement = (anchor?: string) => {
  if (!anchor) return;
  const acts = document.querySelector('[data-role="acts"]');
  const target = acts?.querySelector(`[data-role='law'][data-anchor='${anchor}']`);
  return target;
};

export const clearMarkIndicators = () => {
  const cls = styles['peeking-target'];
  document.querySelectorAll(`[data-role="article"].${cls}`).forEach(el => el.classList.remove(cls));

  const acts = document.querySelector('[data-role="acts"]') as HTMLElement;
  if (acts) {
    delete acts.dataset.markOffscreen;
  }
};
