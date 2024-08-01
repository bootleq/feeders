// Refer from https://github.com/20tab/react-leaflet-resetview/

import { createControlComponent } from "@react-leaflet/core";
import { Control, DomUtil, DomEvent, Util, LatLngBounds } from "leaflet";

import type { Map, ControlOptions } from "leaflet";

// Converted from https://www.twicon.page/icons.html
const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet"><path d="M401 696C404 697 409 700 413 700H416C420 700 424 697 426 694L438 678C439 675 446 672 450 672L485 660C489 660 492 657 495 654L506 635C510 634 507 629 506 626L484 603C482 601 480 595 477 592L473 572V558L477 549C480 545 481 539 481 535L482 529C482 526 482 519 481 515L470 490C469 487 465 482 464 478L441 420C438 416 438 409 438 405C438 401 439 396 438 393C432 356 416 266 413 258L395 206C393 203 390 196 390 192C387 181 389 178 383 170L349 113C348 110 343 105 341 104L315 75C314 72 310 68 309 64L285 3C284 -1 284 -8 284 -10V-74C284 -79 282 -83 281 -87L277 -101C275 -104 271 -106 268 -104L256 -98C254 -96 248 -94 245 -90L240 -87C239 -83 237 -79 237 -74L240 -57C240 -53 240 -48 239 -44L225 -14C224 -10 221 -6 216 -2L186 25C182 29 177 30 173 30H172C169 30 164 33 162 37L140 68C138 71 137 76 135 80L129 102C129 105 127 112 127 115V138C127 142 126 146 122 147L105 161C101 162 100 169 100 172L101 183C101 187 104 192 104 196L107 212C107 215 111 220 111 223L114 225C117 229 119 233 117 237L114 305C114 308 114 313 117 316L233 520C235 524 239 529 242 532L268 562C271 564 275 569 277 572L306 637C307 640 313 644 315 644L345 655C349 657 354 659 360 660L378 663C382 665 386 669 386 672C386 675 387 681 390 685Z" transform="scale(1, -1) translate(200, -800)" /></svg>';

const LAND_BOUNDS = new LatLngBounds([
  [25.358922696131195, 122.10206185685385],  // northEast
  [21.76970719378202, 119.92127572404134],  // southWest
]);

export type ResetViewControlOptions = {
  /**
   * The control title.
   */
  title?: string;
  className?: string;
} & ControlOptions;

const _getControl = Control.extend({
  options: { position: "bottomright", title: "Reset map view", className: '' },

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
      .on(link, "click", this._resetView, this);

    map.resetViewControl = this;

    return container;
  },

  _resetView: function (this: {
    _map: Map;
  }) {
    return this._map.fitBounds(LAND_BOUNDS);
  },
});

const _createControl = (props: ResetViewControlOptions) =>
  new _getControl(props);

export default createControlComponent<
  ReturnType<typeof _createControl>,
  ResetViewControlOptions
>(_createControl);
