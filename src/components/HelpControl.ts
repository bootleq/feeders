import { createControlComponent } from "@react-leaflet/core";
import { Control, DomUtil, DomEvent, Util } from "leaflet";

import type { Map, ControlOptions } from "leaflet";

const iconSvg = `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"  xml:space="preserve">
<g transform="scale(0.7,0.7)" transform-origin="center center"><path class="" d="M396.138,85.295c-13.172-25.037-33.795-45.898-59.342-61.03C311.26,9.2,280.435,0.001,246.98,0.001
    c-41.238-0.102-75.5,10.642-101.359,25.521c-25.962,14.826-37.156,32.088-37.156,32.088c-4.363,3.786-6.824,9.294-6.721,15.056
    c0.118,5.77,2.775,11.186,7.273,14.784l35.933,28.78c7.324,5.864,17.806,5.644,24.875-0.518c0,0,4.414-7.978,18.247-15.88
    c13.91-7.85,31.945-14.173,58.908-14.258c23.517-0.051,44.022,8.725,58.016,20.717c6.952,5.941,12.145,12.594,15.328,18.68
    c3.208,6.136,4.379,11.5,4.363,15.574c-0.068,13.766-2.742,22.77-6.603,30.442c-2.945,5.729-6.789,10.813-11.738,15.744
    c-7.384,7.384-17.398,14.207-28.634,20.479c-11.245,6.348-23.365,11.932-35.612,18.68c-13.978,7.74-28.77,18.858-39.701,35.544
    c-5.449,8.249-9.71,17.686-12.416,27.641c-2.742,9.964-3.98,20.412-3.98,31.071c0,11.372,0,20.708,0,20.708
    c0,10.719,8.69,19.41,19.41,19.41h46.762c10.719,0,19.41-8.691,19.41-19.41c0,0,0-9.336,0-20.708c0-4.107,0.467-6.755,0.917-8.436
    c0.773-2.512,1.206-3.14,2.47-4.668c1.29-1.452,3.895-3.674,8.698-6.331c7.019-3.946,18.298-9.276,31.07-16.176
    c19.121-10.456,42.367-24.646,61.972-48.062c9.752-11.686,18.374-25.758,24.323-41.968c6.001-16.21,9.242-34.431,9.226-53.96
    C410.243,120.761,404.879,101.971,396.138,85.295z"/>
  <path class="st0" d="M228.809,406.44c-29.152,0-52.788,23.644-52.788,52.788c0,29.136,23.637,52.772,52.788,52.772 c29.136,0,52.763-23.636,52.763-52.772C281.572,430.084,257.945,406.44,228.809,406.44z"/>
</g></svg>
`; // from https://www.svgrepo.com/svg/479050/question-mark

export type HelpControlOptions = {
  title?: string;
  className?: string;
  onClick: any;
} & ControlOptions;

const _getControl = Control.extend({
  options: { position: 'bottomright', title: '使用說明', className: '', onClick: () => null },

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

    map.helpControl = this;

    return container;
  },
});

const _createControl = (props: HelpControlOptions) =>
  new _getControl(props);

export default createControlComponent<
  ReturnType<typeof _createControl>,
  HelpControlOptions
>(_createControl);
