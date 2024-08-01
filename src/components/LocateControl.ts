import { createControlComponent } from "@react-leaflet/core";
import { Control, DomUtil, DomEvent, Util, LatLngBounds } from "leaflet";

import type { Map, ControlOptions } from "leaflet";

const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid meet"><path d="M476.811,492.379L268.639,8.332c-2.172-5.047-7.141-8.328-12.641-8.328s-10.469,3.281-12.641,8.328 L35.186,492.379c-2.656,5.625-1.203,12.344,3.547,16.359c4.766,4.016,11.625,4.359,16.734,0.813l200.531-139.032l200.547,139.032 c5.109,3.547,11.969,3.203,16.734-0.813C478.029,504.723,479.467,498.004,476.811,492.379z" transform="scale(0.66,0.66) rotate(45,120,20)" transform-origin="center center" /></svg>';

export type LocateControlOptions = {
  title?: string;
  className?: string;
} & ControlOptions;

const _getControl = Control.extend({
  options: { position: 'bottomright', title: '定位我的位置', className: '' },

  onAdd: function (map: Map) {
    const { title, className } = this.options;

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
      .on(link, "click", this._locate, this);

    map.locateControl = this;

    return container;
  },

  _locate: function (this: {
    _map: Map;
  }) {
    this._map.locate();
  },
});

const _createControl = (props: LocateControlOptions) =>
  new _getControl(props);

export default createControlComponent<
  ReturnType<typeof _createControl>,
  LocateControlOptions
>(_createControl);
