export const findFact = (anchor?: string) => {
  if (!anchor) return;
  const timeline = document.querySelector('[data-role="timeline"]');
  const target = timeline?.querySelector(`[data-role='fact'][data-anchor='${anchor}']`);
  return target;
};
