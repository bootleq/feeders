import { createControlComponent } from "@react-leaflet/core";
import { Control, DomUtil, DomEvent, Util } from "leaflet";

import type { Map, ControlOptions } from "leaflet";

const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 24" fill="currentColor">
  <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
  <path fill-rule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
</svg>
`; // https://heroicons.com/solid

export type ShotControlOptions = {
  title?: string;
  className?: string;
  onClick: any;
} & ControlOptions;

const _getControl = Control.extend({
  options: { position: 'bottomright', title: '從照片新增地點', className: '', onClick: () => null },

  onAdd: function (map: Map) {
    const { title, className, onClick } = this.options;

    const container = DomUtil.create("div", `leaflet-bar ${className}`);
    const link = DomUtil.create("a", "", container);

    const linkAttrs = {
      title,
      href: "#",
    };

    Object.entries(linkAttrs).forEach(([k, v]) => {
      link.setAttribute(k, v);
    });

    link.innerHTML = iconSvg;

    DomEvent.on(link, "mousedown dblclick", DomEvent.stopPropagation)
      .on(link, "click", DomEvent.stop)
      .on(link, "click", onClick, this);

    map.shotControl = this;

    return container;
  },
});

const _createControl = (props: ShotControlOptions) =>
  new _getControl(props);

export default createControlComponent<
  ReturnType<typeof _createControl>,
  ShotControlOptions
>(_createControl);
