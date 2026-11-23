(() => {
  // web/js/shell/icons.jsx
  var makeIcon = (children, { filled = false, defaultClass = "", defaultSize = 16 } = {}) => {
    const IconComponent = ({ size = defaultSize, strokeWidth = 1.75, className = "" }) => /* @__PURE__ */ React.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: filled ? "currentColor" : "none",
        stroke: filled ? "none" : "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: `bw-icon shrink-0 ${defaultClass} ${className}`,
        "aria-hidden": "true",
        focusable: "false"
      },
      children
    );
    return IconComponent;
  };
  var ShellIcons = {
    Library: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m16 6 4 14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v14" }), /* @__PURE__ */ React.createElement("path", { d: "M8 8v12" }), /* @__PURE__ */ React.createElement("path", { d: "M4 4v16" }))),
    AuditEye: makeIcon(
      /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.25", fill: "currentColor" }))
    ),
    Cue: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 22V3" }), /* @__PURE__ */ React.createElement("path", { d: "M4 4h12.5l-2.8 4.5 2.8 4.5H4" }), /* @__PURE__ */ React.createElement("circle", { cx: "4", cy: "4", r: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "4", cy: "21", r: "1.25", fill: "currentColor" }))),
    Turntable: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3.2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3.5v5.3M12 15.2v5.3" }))),
    Flow: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 15V6" }), /* @__PURE__ */ React.createElement("path", { d: "M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 12H3" }), /* @__PURE__ */ React.createElement("path", { d: "M16 6H3" }), /* @__PURE__ */ React.createElement("path", { d: "M12 18H3" }))),
    Map: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 3v16a2 2 0 0 0 2 2h16" }), /* @__PURE__ */ React.createElement("circle", { cx: "8", cy: "15", r: "1.25" }), /* @__PURE__ */ React.createElement("circle", { cx: "11.5", cy: "9.5", r: "1.25" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "13", r: "1.25" }), /* @__PURE__ */ React.createElement("circle", { cx: "19", cy: "6", r: "1.25" }))),
    Spotify: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /* @__PURE__ */ React.createElement("path", { d: "m7 10 5 5 5-5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 15V3" }))),
    Download: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /* @__PURE__ */ React.createElement("path", { d: "m7 10 5 5 5-5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 15V3" }))),
    Radar: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M19.07 4.93A10 10 0 0 0 6.99 3.34" }), /* @__PURE__ */ React.createElement("path", { d: "M4 6h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M2.29 9.62A10 10 0 1 0 21.31 8.35" }), /* @__PURE__ */ React.createElement("path", { d: "M16.24 7.76A6 6 0 1 0 8.23 16.67" }), /* @__PURE__ */ React.createElement("path", { d: "M12 18h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M17.99 11.66A6 6 0 0 1 15.77 16.67" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /* @__PURE__ */ React.createElement("path", { d: "m13.41 10.59 5.66-5.66" }))),
    Routing: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "3", width: "20", height: "5", rx: "1" }), /* @__PURE__ */ React.createElement("path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }), /* @__PURE__ */ React.createElement("path", { d: "M10 12h4" }))),
    Folder: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" })),
    Terminal: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m4 17 6-6-6-6" }), /* @__PURE__ */ React.createElement("path", { d: "M12 19h8" }))),
    Play: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" }), { filled: true }),
    Pause: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "5.5", y: "4", width: "4.5", height: "16", rx: "1.25" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "4", width: "4.5", height: "16", rx: "1.25" })), { filled: true }),
    Sliders: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 4h-7" }), /* @__PURE__ */ React.createElement("path", { d: "M10 4H3" }), /* @__PURE__ */ React.createElement("path", { d: "M21 12h-9" }), /* @__PURE__ */ React.createElement("path", { d: "M8 12H3" }), /* @__PURE__ */ React.createElement("path", { d: "M21 20h-5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 20H3" }), /* @__PURE__ */ React.createElement("path", { d: "M14 2v4" }), /* @__PURE__ */ React.createElement("path", { d: "M8 10v4" }), /* @__PURE__ */ React.createElement("path", { d: "M16 18v4" }))),
    Gear: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }))),
    Check: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M20 6 9 17l-5-5" }), { defaultClass: "text-emerald-400" }),
    Warning: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }), /* @__PURE__ */ React.createElement("path", { d: "M12 9v4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 17h.01" })), { defaultClass: "text-amber-400" }),
    Excel: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }), /* @__PURE__ */ React.createElement("path", { d: "M8 13h2" }), /* @__PURE__ */ React.createElement("path", { d: "M14 13h2" }), /* @__PURE__ */ React.createElement("path", { d: "M8 17h2" }), /* @__PURE__ */ React.createElement("path", { d: "M14 17h2" }))),
    Mic: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" }), /* @__PURE__ */ React.createElement("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 19v3" }))),
    Trends: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M22 7 13.5 15.5 8.5 10.5 2 17" }), /* @__PURE__ */ React.createElement("path", { d: "M16 7h6v6" }))),
    Knowledge: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 7v14" }), /* @__PURE__ */ React.createElement("path", { d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" }))),
    Menu: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4 6h16" }), /* @__PURE__ */ React.createElement("path", { d: "M4 12h16" }), /* @__PURE__ */ React.createElement("path", { d: "M4 18h16" })), { defaultSize: 18 }),
    Search: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" })), { defaultSize: 14 }),
    Close: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M18 6 6 18" }), /* @__PURE__ */ React.createElement("path", { d: "m6 6 12 12" })), { defaultSize: 18 }),
    ZoomIn: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }), /* @__PURE__ */ React.createElement("path", { d: "M11 8v6" }), /* @__PURE__ */ React.createElement("path", { d: "M8 11h6" }))),
    ZoomOut: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }), /* @__PURE__ */ React.createElement("path", { d: "M8 11h6" }))),
    Moon: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" })),
    Film: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 3v18" }), /* @__PURE__ */ React.createElement("path", { d: "M3 7.5h4" }), /* @__PURE__ */ React.createElement("path", { d: "M3 12h18" }), /* @__PURE__ */ React.createElement("path", { d: "M3 16.5h4" }), /* @__PURE__ */ React.createElement("path", { d: "M17 3v18" }), /* @__PURE__ */ React.createElement("path", { d: "M17 7.5h4" }), /* @__PURE__ */ React.createElement("path", { d: "M17 16.5h4" }))),
    Notebook: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 6h4" }), /* @__PURE__ */ React.createElement("path", { d: "M2 10h4" }), /* @__PURE__ */ React.createElement("path", { d: "M2 14h4" }), /* @__PURE__ */ React.createElement("path", { d: "M2 18h4" }), /* @__PURE__ */ React.createElement("rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M16 2v20" }))),
    Help: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }), /* @__PURE__ */ React.createElement("path", { d: "M12 17h.01" }))),
    Globe: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12h20" }))),
    User: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "8", r: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M20 21a8 8 0 0 0-16 0" }))),
    UserPlus: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "7", r: "4" }), /* @__PURE__ */ React.createElement("path", { d: "M19 8v6" }), /* @__PURE__ */ React.createElement("path", { d: "M22 11h-6" }))),
    LogIn: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }), /* @__PURE__ */ React.createElement("path", { d: "m10 17 5-5-5-5" }), /* @__PURE__ */ React.createElement("path", { d: "M15 12H3" }))),
    Compass: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "m16.24 7.76-1.8 5.4a2 2 0 0 1-1.27 1.27l-5.41 1.8 1.8-5.4a2 2 0 0 1 1.27-1.27z" }))),
    ChevronDown: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "m6 9 6 6 6-6" }), { defaultSize: 14 }),
    External: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M15 3h6v6" }), /* @__PURE__ */ React.createElement("path", { d: "M10 14 21 3" }), /* @__PURE__ */ React.createElement("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })), { defaultSize: 14 }),
    ChevronRight: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "m9 18 6-6-6-6" }), { defaultSize: 14 }),
    ChevronUp: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "m18 15-6-6-6 6" }), { defaultSize: 14 }),
    ChevronLeft: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "m15 18-6-6 6-6" }), { defaultSize: 14 }),
    Minus: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M5 12h14" })),
    Crown: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 7l4.5 5L12 4l5.5 8L22 7l-2 12H4L2 7Z" }))),
    Shield: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" })),
    Radio: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M16.24 7.76a6 6 0 0 1 0 8.49" }), /* @__PURE__ */ React.createElement("path", { d: "M7.76 16.24a6 6 0 0 1 0-8.49" }), /* @__PURE__ */ React.createElement("path", { d: "M19.07 4.93a10 10 0 0 1 0 14.14" }), /* @__PURE__ */ React.createElement("path", { d: "M4.93 19.07a10 10 0 0 1 0-14.14" }))),
    CreditCard: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M2 10h20" }))),
    Infinity: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" })),
    PanelLeft: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M9 3v18" }))),
    More: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1" }), /* @__PURE__ */ React.createElement("circle", { cx: "19", cy: "12", r: "1" }), /* @__PURE__ */ React.createElement("circle", { cx: "5", cy: "12", r: "1" }))),
    Grid: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }))),
    Keyboard: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M10 8h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M12 12h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M14 8h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M16 12h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M18 8h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M6 8h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M7 16h10" }), /* @__PURE__ */ React.createElement("path", { d: "M8 12h.01" }), /* @__PURE__ */ React.createElement("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }))),
    FileText: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }), /* @__PURE__ */ React.createElement("path", { d: "M10 9H8" }), /* @__PURE__ */ React.createElement("path", { d: "M16 13H8" }), /* @__PURE__ */ React.createElement("path", { d: "M16 17H8" }))),
    Activity: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" })),
    Disc: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }))),
    MessageSquare: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }), { defaultSize: 14 }),
    Plus: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M5 12h14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 5v14" }))),
    Refresh: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), /* @__PURE__ */ React.createElement("path", { d: "M21 3v5h-5" }), /* @__PURE__ */ React.createElement("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), /* @__PURE__ */ React.createElement("path", { d: "M8 16H3v5" }))),
    Trash: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M3 6h18" }), /* @__PURE__ */ React.createElement("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }), /* @__PURE__ */ React.createElement("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M10 11v6" }), /* @__PURE__ */ React.createElement("path", { d: "M14 11v6" }))),
    Save: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" }), /* @__PURE__ */ React.createElement("path", { d: "M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" }), /* @__PURE__ */ React.createElement("path", { d: "M7 3v4a1 1 0 0 0 1 1h7" }))),
    Upload: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), /* @__PURE__ */ React.createElement("path", { d: "m17 8-5-5-5 5" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3v12" }))),
    Filter: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" })),
    ArrowUpDown: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m21 16-4 4-4-4" }), /* @__PURE__ */ React.createElement("path", { d: "M17 20V4" }), /* @__PURE__ */ React.createElement("path", { d: "m3 8 4-4 4 4" }), /* @__PURE__ */ React.createElement("path", { d: "M7 4v16" }))),
    Layers: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" }), /* @__PURE__ */ React.createElement("path", { d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" }), /* @__PURE__ */ React.createElement("path", { d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" }))),
    Sparkles: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M9.94 14.06 8 20l-1.94-5.94L0 12l6.06-1.94L8 4l1.94 6.06L16 12z", transform: "translate(3 -1) scale(.85)" }), /* @__PURE__ */ React.createElement("path", { d: "M20 3v4" }), /* @__PURE__ */ React.createElement("path", { d: "M22 5h-4" }))),
    Zap: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" })),
    Gem: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M6 3h12l4 6-10 13L2 9Z" }), /* @__PURE__ */ React.createElement("path", { d: "M11 3 8 9l4 13 4-13-3-6" }), /* @__PURE__ */ React.createElement("path", { d: "M2 9h20" }))),
    Alert: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 16h.01" }), /* @__PURE__ */ React.createElement("path", { d: "M12 8v4" }), /* @__PURE__ */ React.createElement("path", { d: "M15.31 2a2 2 0 0 1 1.42.59l4.68 4.68A2 2 0 0 1 22 8.69v6.62a2 2 0 0 1-.59 1.42l-4.68 4.68a2 2 0 0 1-1.42.59H8.69a2 2 0 0 1-1.42-.59l-4.68-4.68A2 2 0 0 1 2 15.31V8.69a2 2 0 0 1 .59-1.42l4.68-4.68A2 2 0 0 1 8.69 2z" }))),
    Scale: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" }), /* @__PURE__ */ React.createElement("path", { d: "m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" }), /* @__PURE__ */ React.createElement("path", { d: "M7 21h10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3v18" }), /* @__PURE__ */ React.createElement("path", { d: "M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" }))),
    Image: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "9", r: "2" }), /* @__PURE__ */ React.createElement("path", { d: "m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" }))),
    Tag: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z" }), /* @__PURE__ */ React.createElement("circle", { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor" }))),
    Music: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M9 18V5l12-2v13" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "18", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "18", cy: "16", r: "3" }))),
    Headphones: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" })),
    Eye: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "3" }))),
    Pencil: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" }), /* @__PURE__ */ React.createElement("path", { d: "m15 5 4 4" }))),
    Star: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M11.52 2.3a.53.53 0 0 1 .96 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.79a.53.53 0 0 1 .3-.9l5.16-.76a2.12 2.12 0 0 0 1.6-1.16z" })),
    Heart: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" })),
    Target: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "6" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "2" }))),
    Copy: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }))),
    Link: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ React.createElement("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }))),
    Lock: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }))),
    Clock: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6v6l4 2" }))),
    Info: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M12 16v-4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 8h.01" }))),
    Flame: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" })),
    Brain: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 5v13" }))),
    Package: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 22V12" }), /* @__PURE__ */ React.createElement("path", { d: "m3.3 7 8.7 5 8.7-5" }))),
    Pin: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "10", r: "3" }))),
    Wand: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" }), /* @__PURE__ */ React.createElement("path", { d: "m14 7 3 3" }), /* @__PURE__ */ React.createElement("path", { d: "M5 6v4" }), /* @__PURE__ */ React.createElement("path", { d: "M19 14v4" }), /* @__PURE__ */ React.createElement("path", { d: "M10 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 8H3" }), /* @__PURE__ */ React.createElement("path", { d: "M21 16h-4" }), /* @__PURE__ */ React.createElement("path", { d: "M11 3H9" }))),
    Volume: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" }), /* @__PURE__ */ React.createElement("path", { d: "M16 9a5 5 0 0 1 0 6" }), /* @__PURE__ */ React.createElement("path", { d: "M19.36 18.36a9 9 0 0 0 0-12.73" }))),
    Shuffle: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "m18 14 4 4-4 4" }), /* @__PURE__ */ React.createElement("path", { d: "m18 2 4 4-4 4" }), /* @__PURE__ */ React.createElement("path", { d: "M2 18h1.97a4 4 0 0 0 3.3-1.7l5.46-8.6a4 4 0 0 1 3.3-1.7H22" }), /* @__PURE__ */ React.createElement("path", { d: "M2 6h1.97a4 4 0 0 1 3.3 1.7l.53.83" }), /* @__PURE__ */ React.createElement("path", { d: "M22 18h-6.04a4 4 0 0 1-3.3-1.8l-.36-.45" }))),
    Calendar: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }), /* @__PURE__ */ React.createElement("path", { d: "M16 2v4" }), /* @__PURE__ */ React.createElement("path", { d: "M8 2v4" }), /* @__PURE__ */ React.createElement("path", { d: "M3 10h18" }))),
    Bulb: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" }), /* @__PURE__ */ React.createElement("path", { d: "M9 18h6" }), /* @__PURE__ */ React.createElement("path", { d: "M10 22h4" }))),
    Rocket: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" }), /* @__PURE__ */ React.createElement("path", { d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" }), /* @__PURE__ */ React.createElement("path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" }), /* @__PURE__ */ React.createElement("path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" }))),
    Wave: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M2 10v3" }), /* @__PURE__ */ React.createElement("path", { d: "M6 6v11" }), /* @__PURE__ */ React.createElement("path", { d: "M10 3v18" }), /* @__PURE__ */ React.createElement("path", { d: "M14 8v7" }), /* @__PURE__ */ React.createElement("path", { d: "M18 5v13" }), /* @__PURE__ */ React.createElement("path", { d: "M22 10v3" }))),
    Crosshair: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("path", { d: "M22 12h-4" }), /* @__PURE__ */ React.createElement("path", { d: "M6 12H2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 6V2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 22v-4" }))),
    Cloud: makeIcon(/* @__PURE__ */ React.createElement("path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" })),
    Bell: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M10.27 21a2 2 0 0 0 3.46 0" }), /* @__PURE__ */ React.createElement("path", { d: "M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33" }))),
    Passport: makeIcon(/* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("rect", { x: "4", y: "2", width: "16", height: "20", rx: "2" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "10", r: "3" }), /* @__PURE__ */ React.createElement("path", { d: "M8 17h8" }))),
    Stop: makeIcon(/* @__PURE__ */ React.createElement("rect", { x: "5", y: "5", width: "14", height: "14", rx: "2" }), { filled: true })
  };
  var Icons = {
    ...ShellIcons,
    Edit: ShellIcons.Pencil
  };
  var PlatformSeratoLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 40 40", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: `shrink-0 ${className}` }, /* @__PURE__ */ React.createElement("path", { d: "M7 29L14.5 11H19.5L12 29H7Z", fill: "#00d1e8" }), /* @__PURE__ */ React.createElement("path", { d: "M16 31L23.5 13H28.5L21 31H16Z", fill: "#00e5ff" }), /* @__PURE__ */ React.createElement("path", { d: "M25 29L29.5 18H34L29.5 29H25Z", fill: "#38bdf8" }), /* @__PURE__ */ React.createElement("circle", { cx: "32", cy: "31", r: "2.2", fill: "#00e5ff" }));
  var PlatformRekordboxLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 40 40", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: `shrink-0 ${className}` }, /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "18", stroke: "#38bdf8", strokeWidth: "2", strokeDasharray: "6 3", strokeLinecap: "round", opacity: "0.85" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "13", stroke: "#00e5ff", strokeWidth: "2", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "7.5", stroke: "#38bdf8", strokeWidth: "1.8", strokeDasharray: "3 2" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "3.5", fill: "#00e5ff" }), /* @__PURE__ */ React.createElement("path", { d: "M20 2V7M20 33V38M2 20H7M33 20H38", stroke: "#38bdf8", strokeWidth: "2.2", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("path", { d: "M7.27 7.27L10.8 10.8M29.2 29.2L32.73 32.73M7.27 32.73L10.8 29.2M29.2 10.8L32.73 7.27", stroke: "#00e5ff", strokeWidth: "1.5", strokeLinecap: "round", opacity: "0.75" }));
  var PlatformVirtualDjLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 40 40", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: `shrink-0 ${className}` }, /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "18", stroke: "#f97316", strokeWidth: "2.2", strokeLinecap: "round" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "14.5", stroke: "#fb923c", strokeWidth: "1", strokeDasharray: "2 1.5", opacity: "0.75" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "11.5", stroke: "#ea580c", strokeWidth: "1.2" }), /* @__PURE__ */ React.createElement("path", { d: "M12 12.5L20 28.5L28 12.5H23.5L20 20.5L16.5 12.5H12Z", fill: "#ffedd5" }), /* @__PURE__ */ React.createElement("path", { d: "M14.5 12.5L20 24L25.5 12.5H23.5L20 19.5L16.5 12.5H14.5Z", fill: "#f97316" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "2.2", fill: "#ffffff" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "1", fill: "#ea580c" }));
  var PlatformTraktorLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 40 40", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: `shrink-0 ${className}` }, /* @__PURE__ */ React.createElement("rect", { x: "5", y: "8", width: "30", height: "6.5", rx: "2", fill: "#facc15" }), /* @__PURE__ */ React.createElement("path", { d: "M16 14.5H24V29.5C24 30.88 22.88 32 21.5 32H18.5C17.12 32 16 30.88 16 29.5V14.5Z", fill: "#facc15" }), /* @__PURE__ */ React.createElement("path", { d: "M10 18L13 22H11L14 27", stroke: "#eab308", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", opacity: "0.9" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "22", r: "2.5", fill: "#facc15" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "28", r: "1.8", fill: "#eab308" }));
  var PlatformAutoLogo = ({ size = 20, className = "" }) => /* @__PURE__ */ React.createElement("svg", { width: size, height: size, viewBox: "0 0 32 32", fill: "none", xmlns: "http://www.w3.org/2000/svg", className }, /* @__PURE__ */ React.createElement("rect", { width: "32", height: "32", rx: "7", fill: "#1e0c2e" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "9", stroke: "#a855f7", strokeWidth: "1.5", strokeDasharray: "3 2" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "5", stroke: "#c084fc", strokeWidth: "1.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "16", cy: "16", r: "2", fill: "#e9d5ff" }), /* @__PURE__ */ React.createElement("path", { d: "M16 6L18.5 10.5L16 9.2L13.5 10.5L16 6Z", fill: "#a855f7" }), /* @__PURE__ */ React.createElement("path", { d: "M16 26L13.5 21.5L16 22.8L18.5 21.5L16 26Z", fill: "#a855f7" }));
  var PlatformLogos = {
    auto: PlatformAutoLogo,
    serato: PlatformSeratoLogo,
    rekordbox: PlatformRekordboxLogo,
    virtualdj: PlatformVirtualDjLogo,
    traktor: PlatformTraktorLogo
  };
  var renderPlatformLogo = (id, size = 20, className = "") => {
    const key = (id || "auto").toLowerCase();
    const Comp = PlatformLogos[key] || PlatformLogos.auto;
    return /* @__PURE__ */ React.createElement(Comp, { size, className });
  };

  // web/js/waveforms/waveformUtils.js
  var parseDurationMs = (dur) => {
    if (!dur || typeof dur !== "string") return 3e5;
    const parts = dur.split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseFloat(parts[1]) || 0;
      return Math.max(1e3, (m * 60 + s) * 1e3);
    }
    return 3e5;
  };
  function getTrackHash(track) {
    if (!track) return 1337;
    const str = `${track.id || ""}|${track.title || track.t || ""}|${track.artist || track.a || ""}|${track.bpm || track.b || ""}|${track.key || track.k || ""}|${track.f || track.path || ""}`;
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0) || 1;
  }
  function computeTrackStructuralBands(xNorm, seed, track = null) {
    const trackSeed = track ? getTrackHash(track) : seed || 1;
    const archetype = trackSeed % 5;
    const s1 = (trackSeed % 23 - 11) * 7e-3;
    const s2 = ((trackSeed >> 3) % 19 - 9) * 6e-3;
    let b1Start, b1End, drop1End, b2Start, b2End, drop2End;
    if (archetype === 0) {
      b1Start = Math.max(0.18, 0.25 + s1);
      b1End = b1Start + 0.12 + Math.abs(s2);
      drop1End = Math.min(0.68, b1End + 0.22);
      b2Start = drop1End + 0.04;
      b2End = Math.min(0.84, b2Start + 0.1);
      drop2End = 0.9;
    } else if (archetype === 1) {
      b1Start = Math.max(0.08, 0.14 + s1);
      b1End = b1Start + 0.08;
      drop1End = Math.min(0.5, b1End + 0.2);
      b2Start = drop1End + 0.05;
      b2End = Math.min(0.72, b2Start + 0.12);
      drop2End = 0.86;
    } else if (archetype === 2) {
      b1Start = Math.max(0.14, 0.18 + s1);
      b1End = b1Start + 0.1;
      drop1End = Math.min(0.58, b1End + 0.26);
      b2Start = drop1End + 0.03;
      b2End = Math.min(0.76, b2Start + 0.08);
      drop2End = 0.92;
    } else if (archetype === 3) {
      b1Start = Math.max(0.22, 0.3 + s1);
      b1End = b1Start + 0.16 + Math.abs(s2);
      drop1End = Math.min(0.78, b1End + 0.24);
      b2Start = 0.99;
      b2End = 0.99;
      drop2End = 0.99;
    } else {
      b1Start = Math.max(0.12, 0.16 + s1);
      b1End = b1Start + 0.07;
      drop1End = Math.min(0.48, b1End + 0.18);
      b2Start = drop1End + 0.08;
      b2End = Math.min(0.78, b2Start + 0.09);
      drop2End = 0.88;
    }
    const durMs = track ? parseDurationMs(track.duration || "05:00") : 3e5;
    const curMs = xNorm * durMs;
    const trimMs = track && track.trim_start_ms ? parseFloat(track.trim_start_ms) : 0;
    const downbeatMs = track && track.first_downbeat_ms ? parseFloat(track.first_downbeat_ms) : 0;
    if (trimMs > 0 && curMs < trimMs) {
      return { bass: 5e-3, drums: 5e-3, vocals: 5e-3, treble: 5e-3, isBreak: false, isSilence: true };
    }
    const bpm = track ? parseFloat(track.bpm || track.b) || 124 : 124;
    const beatMs = 6e4 / Math.max(30, bpm);
    const beatPhase = (curMs - downbeatMs) / beatMs;
    const rawEnergy = track ? track.energy !== void 0 ? parseFloat(track.energy) : track.e !== void 0 ? parseFloat(track.e) : 0.65 : 0.65;
    const energy = Math.max(0.35, Math.min(1, rawEnergy <= 1 ? rawEnergy : rawEnergy / 10));
    const role = String((track == null ? void 0 : track.acoustic_role) || (track == null ? void 0 : track.role) || (track == null ? void 0 : track.genre) || "").toLowerCase();
    const isBassDriver = role.includes("bass") || role.includes("sub") || role.includes("techno") || role.includes("tech");
    const isVocalLead = role.includes("vocal") || role.includes("lead") || role.includes("melodic") || role.includes("anthem");
    const isPercussive = role.includes("drum") || role.includes("perc") || role.includes("tool") || role.includes("groove");
    const f1 = 18 + trackSeed % 29;
    const f2 = 37 + (trackSeed >> 3) % 41;
    const f3 = 73 + (trackSeed >> 6) % 53;
    const microRipple = 0.85 + 0.15 * Math.sin(xNorm * f1) * Math.cos(xNorm * f2);
    const transientSpike = Math.pow(Math.abs(Math.sin(xNorm * f3)), 12);
    const beatGridKick = Math.pow(Math.abs(Math.cos(Math.PI * beatPhase)), 10);
    const snareHit = Math.pow(Math.abs(Math.cos(Math.PI * (beatPhase - 1) * 0.5)), 8);
    const hatPattern = 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(Math.PI * beatPhase)), 4);
    let bass = 0.15, drums = 0.15, vocals = 0.15, treble = 0.15;
    let isBreak = false;
    if (xNorm < b1Start) {
      const p = xNorm / b1Start;
      bass = (0.55 + 0.35 * beatGridKick) * (isBassDriver ? 1.3 : 1);
      drums = (0.45 + 0.4 * snareHit) * Math.min(1, p * 1.6);
      vocals = (0.15 + 0.25 * p) * (isVocalLead ? 1.4 : 0.8);
      treble = (0.3 + 0.5 * p) * hatPattern;
    } else if (xNorm >= b1Start && xNorm < b1End) {
      isBreak = true;
      const p = (xNorm - b1Start) / (b1End - b1Start);
      bass = 0.03 + 0.03 * Math.sin(xNorm * 15);
      drums = 0.08 + 0.45 * Math.pow(p, 2.2) * snareHit;
      vocals = (0.8 + 0.2 * Math.sin(p * Math.PI)) * (isVocalLead ? 1.3 : 1);
      treble = 0.35 + 0.6 * Math.pow(p, 1.6);
    } else if (xNorm >= b1End && xNorm < drop1End) {
      bass = (0.88 + 0.12 * beatGridKick) * (isBassDriver ? 1.15 : 1) * energy;
      drums = (0.84 + 0.16 * snareHit) * (isPercussive ? 1.2 : 1) * energy;
      vocals = (0.6 + 0.3 * Math.sin(xNorm * 35)) * (isVocalLead ? 1.1 : 0.8);
      treble = (0.75 + 0.25 * hatPattern) * energy;
    } else if (xNorm >= b2Start && xNorm < b2End) {
      isBreak = true;
      const p = (xNorm - b2Start) / (b2End - b2Start);
      bass = 0.02 + 0.03 * Math.cos(xNorm * 10);
      drums = 0.06 + 0.5 * Math.pow(p, 2.5) * snareHit;
      vocals = (0.92 + 0.08 * Math.sin(p * Math.PI)) * (isVocalLead ? 1.25 : 1);
      treble = 0.4 + 0.55 * p;
    } else if (xNorm >= b2End && xNorm < drop2End) {
      bass = (0.95 + 0.05 * beatGridKick) * (isBassDriver ? 1.2 : 1) * energy;
      drums = (0.9 + 0.1 * snareHit) * (isPercussive ? 1.2 : 1) * energy;
      vocals = (0.65 + 0.25 * Math.sin(xNorm * 45)) * (isVocalLead ? 1.1 : 0.8);
      treble = (0.85 + 0.15 * hatPattern) * energy;
    } else {
      const p = (xNorm - drop2End) / Math.max(0.01, 1 - drop2End);
      bass = Math.max(0.06, (0.7 - 0.55 * p) * (0.75 + 0.25 * beatGridKick));
      drums = Math.max(0.06, 0.5 - 0.42 * p);
      vocals = Math.max(0.04, 0.3 - 0.26 * p);
      treble = Math.max(0.04, 0.4 - 0.35 * p);
    }
    bass = Math.min(1, bass * microRipple);
    drums = Math.min(1, drums * (0.9 + 0.2 * transientSpike));
    treble = Math.min(1, treble * (0.85 + 0.15 * microRipple));
    return { bass, drums, vocals, treble, isBreak, energy, archetype };
  }

  // web/js/waveforms/TableHarmonicWaveform.jsx
  var { useRef, useEffect } = React;
  var TableHarmonicWaveform = React.memo(
    ({ track, duration = "05:00", onPlayTrack, isCurrentPlaying, onTogglePlay, playProgress = 0 }) => {
      const canvasRef = useRef(null);
      const bgBitmapRef = useRef(null);
      const rafRef = useRef(null);
      const progressRef = useRef(playProgress);
      const WIDTH = 112, HEIGHT = 28;
      const seed = getTrackHash(track);
      const handleClickScrub = (e) => {
        e.stopPropagation();
        if (isCurrentPlaying && onTogglePlay) {
          onTogglePlay();
          return;
        }
        if (!canvasRef.current || !onPlayTrack) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        onPlayTrack(track, pct, true);
      };
      useEffect(() => {
        let offscreen;
        try {
          offscreen = new OffscreenCanvas(WIDTH, HEIGHT);
        } catch (_) {
          offscreen = document.createElement("canvas");
          offscreen.width = WIDTH;
          offscreen.height = HEIGHT;
        }
        const ctx = offscreen.getContext("2d");
        const centerY = HEIGHT / 2;
        ctx.fillStyle = "#07080b";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        const amp = HEIGHT * 0.47;
        for (let x = 0; x < WIDTH; x += 2) {
          const { bass, drums, vocals, treble, isBreak } = computeTrackStructuralBands(x / WIDTH, seed, track);
          const dim = isBreak ? 0.55 : 1;
          const hl = Math.max(1, amp * Math.min(1, bass * 0.75 + drums * 0.35) * dim);
          const hm = Math.max(0.5, amp * Math.min(1, vocals * 0.6 + drums * 0.3) * 0.78 * dim);
          const hh = Math.max(0.5, amp * Math.min(1, treble * 0.9 + drums * 0.15) * 0.48 * dim);
          ctx.fillStyle = "rgba(37, 99, 235, 0.95)";
          ctx.fillRect(x, centerY - hl, 1.4, hl * 2);
          ctx.fillStyle = "rgba(34, 211, 238, 0.95)";
          ctx.fillRect(x, centerY - hm, 1.4, hm * 2);
          ctx.fillStyle = "rgba(240, 253, 255, 0.92)";
          ctx.fillRect(x, centerY - hh, 1.4, hh * 2);
        }
        ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(WIDTH, centerY);
        ctx.stroke();
        if (typeof offscreen.transferToImageBitmap === "function") {
          bgBitmapRef.current = offscreen.transferToImageBitmap();
        } else {
          bgBitmapRef.current = offscreen;
        }
      }, [seed, track]);
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = WIDTH * dpr;
        canvas.height = HEIGHT * dpr;
        const ctx = canvas.getContext("2d");
        ctx.scale(dpr, dpr);
      }, []);
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const draw = () => {
          if (!bgBitmapRef.current) return;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(bgBitmapRef.current, 0, 0, WIDTH, HEIGHT);
          if (isCurrentPlaying) {
            const px = WIDTH * Math.min(1, Math.max(0, progressRef.current));
            ctx.fillStyle = "rgba(7, 8, 11, 0.55)";
            ctx.fillRect(0, 0, px, HEIGHT);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(Math.round(px) - 0.5, 0, 1, HEIGHT);
          }
        };
        if (isCurrentPlaying) {
          const loop = () => {
            draw();
            rafRef.current = requestAnimationFrame(loop);
          };
          rafRef.current = requestAnimationFrame(loop);
        } else {
          draw();
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        }
        return () => {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        };
      }, [isCurrentPlaying, seed]);
      useEffect(() => {
        progressRef.current = playProgress;
      }, [playProgress]);
      return /* @__PURE__ */ React.createElement("div", { onClick: handleClickScrub, className: "ws-wave w-28 h-7 relative overflow-hidden group cursor-pointer flex items-center justify-center" }, /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { width: "112px", height: "28px", display: "block" } }), /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-0.5 right-1 text-[9px] font-mono tabular-nums text-[var(--bw-text-2)] opacity-70 group-hover:opacity-100" }, duration), isCurrentPlaying && /* @__PURE__ */ React.createElement("span", { className: "absolute top-1 left-1 ws-dot ws-dot-live", "aria-hidden": "true" }));
    },
    // ── Función de comparación (areEqual): evita re-renders innecesarios ────────
    (prev, next) => {
      if ((prev.track && prev.track.id) !== (next.track && next.track.id)) return false;
      if (prev.isCurrentPlaying !== next.isCurrentPlaying) return false;
      if (prev.isCurrentPlaying && Math.abs(prev.playProgress - next.playProgress) > 0.02) return false;
      if (prev.onPlayTrack !== next.onPlayTrack) return false;
      if (prev.onTogglePlay !== next.onTogglePlay) return false;
      if (prev.duration !== next.duration) return false;
      return true;
    }
  );

  // web/js/data/constants.js
  var DEFAULT_VINYL_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="12" fill="#0d0d14"/><circle cx="80" cy="80" r="58" fill="#14141f" stroke="#27273a" stroke-width="2"/><circle cx="80" cy="80" r="44" fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/><circle cx="80" cy="80" r="30" fill="none" stroke="#22d3ee" stroke-width="1.5" opacity="0.5"/><circle cx="80" cy="80" r="14" fill="#06b6d4"/><circle cx="80" cy="80" r="5" fill="#09090b"/></svg>');
  function getValidCover(c) {
    if (!c || typeof c !== "string") return DEFAULT_VINYL_SVG;
    if (c.startsWith("data:") || c.startsWith("http://") || c.startsWith("https://") || c.startsWith("/")) return c;
    return "https://i.scdn.co/image/" + c;
  }

  // web/js/waveforms/RekordboxWaveform.jsx
  var { useState, useEffect: useEffect2, useRef: useRef2, useCallback } = React;

  // web/js/waveforms/ZoomableRekordboxWaveform.jsx
  var { useState: useState2, useEffect: useEffect3, useRef: useRef3, useCallback: useCallback2, useMemo } = React;

  // web/js/waveforms/FooterMasterWaveform.jsx
  var { useEffect: useEffect4, useRef: useRef4, useCallback: useCallback3 } = React;

  // web/js/waveforms/CopilotSeratoWaveform.jsx
  var { useState: useState3, useEffect: useEffect5, useRef: useRef5, useMemo: useMemo2 } = React;
  var RB3BAND_HD_CACHE = /* @__PURE__ */ new Map();
  function decodeBase64ToU8(b64) {
    if (!b64 || typeof b64 !== "string") return null;
    try {
      const bin = atob(b64);
      const len = bin.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8[i] = bin.charCodeAt(i);
      }
      return u8;
    } catch (_) {
      return null;
    }
  }
  function sample3BandHD(bands, totalCols, fStart, fEnd) {
    if (fEnd < 0 || fStart >= totalCols) return [0, 0, 0];
    const s0 = Math.max(0, Math.min(totalCols - 1, fStart));
    const s1 = Math.max(s0, Math.min(totalCols - 1, fEnd));
    const span = s1 - s0;
    if (span <= 1) {
      const i0 = Math.floor(s0);
      const i1 = Math.min(totalCols - 1, i0 + 1);
      const frac = s0 - i0;
      const o0 = i0 * 3;
      const o1 = i1 * 3;
      return [
        (bands[o0] + (bands[o1] - bands[o0]) * frac) / 255,
        (bands[o0 + 1] + (bands[o1 + 1] - bands[o0 + 1]) * frac) / 255,
        (bands[o0 + 2] + (bands[o1 + 2] - bands[o0 + 2]) * frac) / 255
      ];
    }
    const iStart = Math.floor(s0);
    const iEnd = Math.min(totalCols - 1, Math.ceil(s1));
    const step = Math.max(1, Math.floor((iEnd - iStart) / 16));
    let maxL = 0;
    let maxM = 0;
    let maxH = 0;
    for (let idx = iStart; idx <= iEnd; idx += step) {
      const off = idx * 3;
      if (bands[off] > maxL) maxL = bands[off];
      if (bands[off + 1] > maxM) maxM = bands[off + 1];
      if (bands[off + 2] > maxH) maxH = bands[off + 2];
    }
    return [maxL / 255, maxM / 255, maxH / 255];
  }
  var CopilotSeratoWaveform = ({
    deck,
    side = "1",
    antiMuddy = null,
    partnerDeck = null,
    isCompact = false
  }) => {
    const canvasRef = useRef5(null);
    const minimapRef = useRef5(null);
    const minimapCacheRef = useRef5(null);
    const [zoom, setZoom] = useState3(4);
    const [showTacticalAids, setShowTacticalAids] = useState3(true);
    const [hoveredMilestone, setHoveredMilestone] = useState3(null);
    const [hdWave, setHdWave] = useState3(null);
    const initialProgress = typeof deck.play_progress === "number" && !isNaN(deck.play_progress) ? deck.play_progress : 0;
    const [progress, setProgress] = useState3(initialProgress);
    const progressRef = useRef5(initialProgress);
    const isPlayingRef = useRef5(Boolean(deck.is_playing));
    const bpmRef = useRef5(deck.bpm || 130);
    const durationSecRef = useRef5(deck.duration_sec || 390);
    const deckNum = side === "2" || side === 2 || (deck == null ? void 0 : deck.deck_num) === 2 ? 2 : 1;
    const trackFilePath = (deck == null ? void 0 : deck.filepath) || (deck == null ? void 0 : deck.file_path) || "";
    const isEmptyDeck = !deck || !deck.title || !deck.bpm || Number(deck.bpm) <= 0 || deck.status === "STANDBY (VAC\xCDO)";
    useEffect5(() => {
      if (deck.play_progress !== void 0 && deck.play_progress !== null) {
        const diff = Math.abs(progressRef.current - deck.play_progress);
        if (diff > 2e-3 || !deck.is_playing || deck.play_progress === 0) {
          progressRef.current = deck.play_progress;
          setProgress(deck.play_progress);
        }
      }
      isPlayingRef.current = Boolean(deck.is_playing);
      bpmRef.current = parseFloat(deck.bpm) || 130;
      durationSecRef.current = parseFloat(deck.duration_sec) || 390;
    }, [deck.play_progress, deck.is_playing, deck.bpm, deck.duration_sec]);
    const hdTrackKey = isEmptyDeck ? "" : `${deckNum}|${trackFilePath || deck.title}|${deck.artist || ""}|${deck.duration_sec || 0}`;
    useEffect5(() => {
      if (!hdTrackKey) {
        setHdWave(null);
        return;
      }
      if (RB3BAND_HD_CACHE.has(hdTrackKey)) {
        setHdWave(RB3BAND_HD_CACHE.get(hdTrackKey));
        return;
      }
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (!isLocalHost) {
        setHdWave(null);
        return;
      }
      let cancelled = false;
      setHdWave(null);
      const fetchHD = async (attempt = 0) => {
        try {
          const res = await fetch(`/api/copilot/waveform/${deckNum}?k=${encodeURIComponent(hdTrackKey)}`);
          if (!res.ok) return;
          const payload = await res.json();
          if (cancelled) return;
          if (payload && payload.ready && payload.bands_b64) {
            const bands = decodeBase64ToU8(payload.bands_b64);
            const overview = decodeBase64ToU8(payload.overview_b64);
            if (bands && bands.length >= 3) {
              const parsed = {
                cacheKey: payload.cache_key || hdTrackKey,
                version: payload.version || "rb3b",
                columns: payload.columns || Math.floor(bands.length / 3),
                overviewColumns: payload.overview_columns || (overview ? Math.floor(overview.length / 3) : 0),
                durationSec: payload.duration_sec || deck.duration_sec || 240,
                bands,
                overview,
                realFft: Boolean(payload.real_fft)
              };
              RB3BAND_HD_CACHE.set(hdTrackKey, parsed);
              if (RB3BAND_HD_CACHE.size > 16) {
                const oldest = RB3BAND_HD_CACHE.keys().next().value;
                RB3BAND_HD_CACHE.delete(oldest);
              }
              setHdWave(parsed);
              return;
            }
          }
          if (payload && payload.pending && attempt < 24 && !cancelled) {
            setTimeout(() => fetchHD(attempt + 1), 320);
          }
        } catch (_) {
        }
      };
      fetchHD(0);
      return () => {
        cancelled = true;
      };
    }, [deckNum, hdTrackKey]);
    useEffect5(() => {
      let animId;
      let lastTime = performance.now();
      let lastUiUpdate = 0;
      const tick = (now) => {
        const dt = (now - lastTime) / 1e3;
        lastTime = now;
        if (isPlayingRef.current && durationSecRef.current > 0) {
          const advance = dt / durationSecRef.current;
          const next = (progressRef.current + advance) % 1;
          progressRef.current = next;
          if (now - lastUiUpdate >= 16) {
            lastUiUpdate = now;
            setProgress(next);
          }
        }
        if (isPlayingRef.current) {
          animId = requestAnimationFrame(tick);
        }
      };
      if (isPlayingRef.current) {
        animId = requestAnimationFrame(tick);
      }
      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    }, [deck.is_playing]);
    const rawId = trackFilePath || deck.title || "1";
    const seed = rawId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const durSec = deck.duration_sec || (hdWave == null ? void 0 : hdWave.durationSec) || 390;
    const elapsedSec = progress * durSec;
    const remainSec = Math.max(0, durSec - elapsedSec);
    const overviewBytes = useMemo2(() => {
      if (!deck.serato_overview) return null;
      return decodeBase64ToU8(deck.serato_overview);
    }, [deck.serato_overview]);
    const formatSec = (s) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };
    const cues = deck.cues || [
      { id: 1, name: "Downbeat 1.0.0", color: "#ef4444", pct: 0.04, time: "00:00.25", directive: "Punto de anclaje inicial. Arranca beatmatching aqu\xED." },
      { id: 2, name: "Intro Perc", color: "#f97316", pct: 0.16, time: "01:04.00", directive: "Entrada de caja y charles. Inicia subida gradual del fader." },
      { id: 3, name: "Bassline In", color: "#eab308", pct: 0.32, time: "02:08.00", directive: "Aparecen graves dominantes. Revisa EQ Low del otro deck." },
      { id: 4, name: "MAIN DROP", color: "#10b981", pct: 0.48, time: "03:12.00", directive: "Cl\xEDmax 100% de potencia. Corta totalmente los graves del deck saliente." },
      { id: 5, name: "Breakdown", color: "#06b6d4", pct: 0.62, time: "04:16.00", directive: "Par\xF3n mel\xF3dico sin bombo. Ventana id\xF3nea para transiciones vocales." },
      { id: 6, name: "Climax 2", color: "#22d3ee", pct: 0.74, time: "05:04.00", directive: "Segundo impacto de sala. Mant\xE9n energ\xEDa alta." },
      { id: 7, name: "Outro 32b", color: "#8b5cf6", pct: 0.86, time: "06:08.00", directive: "Se retiran capas r\xEDtmicas. Zona recomendada para mezclar track entrante." },
      { id: 8, name: "Cut / Fade", color: "#ec4899", pct: 0.96, time: "07:15.00", directive: "Final de pista. Fade-out o corte antes del silencio." }
    ];
    const phases = deck.structural_phases || [
      { id: "intro", name: "Intro", start_pct: 0, end_pct: 0.16, type: "intro", label: "Intro 32b \u2022 Mezcla In", color: "#06b6d4", directive: "32 compases de entrada. Sincroniza beatgrid." },
      { id: "build", name: "Bassline In", start_pct: 0.16, end_pct: 0.35, type: "build", label: "Bassline Activa", color: "#eab308", directive: "Filtra frecuencias sub con filtro High-Pass." },
      { id: "break", name: "Breakdown", start_pct: 0.35, end_pct: 0.48, type: "break", label: "Breakdown (Sin Graves)", color: "#38bdf8", directive: "Sin bombo. Oportunidad para cruce de leads o acapellas." },
      { id: "drop", name: "MAIN DROP", start_pct: 0.48, end_pct: 0.74, type: "drop", label: "\u26A1 DROP PRINCIPAL (Cl\xEDmax)", color: "#ef4444", directive: "Energ\xEDa m\xE1xima en pista. Kill switch en graves opuestos." },
      { id: "break2", name: "Segundo Par\xF3n", start_pct: 0.74, end_pct: 0.82, type: "break", label: "Puente Mel\xF3dico", color: "#a855f7", directive: "Transici\xF3n mel\xF3dica antes del outro." },
      { id: "outro", name: "Outro", start_pct: 0.82, end_pct: 1, type: "outro", label: "\u{1F7E2} MEZCLA SEGURA (Outro)", color: "#10b981", directive: "Zona segura de mezcla. Abre canal entrante." }
    ];
    const nextCue = cues.find((c) => (c.pct || 0) > progress);
    const beatsToNextCue = nextCue && deck.bpm ? Math.round((nextCue.pct - progress) * durSec / (60 / deck.bpm)) : null;
    const barsToNextCue = beatsToNextCue ? Math.max(1, Math.ceil(beatsToNextCue / 4)) : null;
    const timeToNextCue = nextCue ? Math.max(0, (nextCue.pct - progress) * durSec) : 0;
    const bothPlaying = Boolean(deck.is_playing && partnerDeck && partnerDeck.is_playing);
    const isBassClashDanger = bothPlaying && antiMuddy && antiMuddy.status === "danger" && (deck.low_ratio || 0) >= 44;
    useEffect5(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.parentElement.clientWidth || 550;
      const h = 88;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx.resetTransform) ctx.resetTransform();
      else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#050507";
      ctx.fillRect(0, 0, w, h);
      const midY = h / 2;
      const playheadX = w / 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();
      if (isEmptyDeck) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("ARRASTRAR CANCI\xD3N AQU\xCD (STANDBY)", w / 2, midY + 4);
        const miniCanvas2 = minimapRef.current;
        if (miniCanvas2) {
          const mRect2 = miniCanvas2.getBoundingClientRect();
          const mw2 = mRect2.width || miniCanvas2.parentElement.clientWidth || 550;
          const mh2 = 22;
          miniCanvas2.width = Math.round(mw2 * dpr);
          miniCanvas2.height = Math.round(mh2 * dpr);
          const mCtx2 = miniCanvas2.getContext("2d");
          if (mCtx2.resetTransform) mCtx2.resetTransform();
          else mCtx2.setTransform(1, 0, 0, 1, 0, 0);
          mCtx2.scale(dpr, dpr);
          mCtx2.fillStyle = "#050507";
          mCtx2.fillRect(0, 0, mw2, mh2);
          mCtx2.strokeStyle = "rgba(255, 255, 255, 0.08)";
          mCtx2.lineWidth = 1;
          mCtx2.beginPath();
          mCtx2.moveTo(0, mh2 / 2);
          mCtx2.lineTo(mw2, mh2 / 2);
          mCtx2.stroke();
        }
        return;
      }
      const windowSec = 64 / zoom;
      const halfWindowSec = windowSec / 2;
      const currentSec = progress * durSec;
      const startSec = currentSec - halfWindowSec;
      const endSec = currentSec + halfWindowSec;
      if (showTacticalAids) {
        phases.forEach((ph) => {
          const phStartSec = ph.start_pct * durSec;
          const phEndSec = ph.end_pct * durSec;
          if (phEndSec >= startSec && phStartSec <= endSec) {
            const x1 = Math.max(0, playheadX + (phStartSec - currentSec) / windowSec * w);
            const x2 = Math.min(w, playheadX + (phEndSec - currentSec) / windowSec * w);
            if (x2 > x1) {
              ctx.fillStyle = `${ph.color}12`;
              ctx.fillRect(x1, 0, x2 - x1, h);
              ctx.fillStyle = `${ph.color}99`;
              ctx.fillRect(x1, 0, x2 - x1, 2);
            }
          }
        });
        if (isBassClashDanger) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.18)";
          ctx.fillRect(playheadX - 60, 0, 120, h);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
          ctx.lineWidth = 1;
          ctx.strokeRect(playheadX - 60, 0, 120, h);
        }
      }
      const maxAmp = h / 2 - 5;
      const physCols = Math.max(1, Math.round(w * dpr));
      const colW = w / physCols;
      const hasRealHD = Boolean(hdWave && hdWave.bands && hdWave.columns > 0);
      const waveDur = hasRealHD ? Math.max(1, hdWave.durationSec || durSec) : durSec;
      const colsPerSec = hasRealHD ? hdWave.columns / waveDur : 0;
      for (let i = 0; i < physCols; i++) {
        const x = i * colW;
        const t0 = startSec + i / physCols * windowSec;
        const t1 = startSec + (i + 1) / physCols * windowSec;
        const sliceNorm = t0 / durSec;
        if (t1 < 0 || t0 > waveDur) continue;
        let low = 0;
        let mid = 0;
        let high = 0;
        if (hasRealHD) {
          const [l, m, hi] = sample3BandHD(hdWave.bands, hdWave.columns, t0 * colsPerSec, t1 * colsPerSec);
          low = l;
          mid = m;
          high = hi;
        } else if (overviewBytes && overviewBytes.length >= 3840 && sliceNorm >= 0 && sliceNorm <= 1) {
          const colIdx = Math.min(1279, Math.max(0, Math.floor(sliceNorm * 1280)));
          const byteOffset = colIdx * 3;
          low = Math.min(1, (overviewBytes[byteOffset] || 0) / 220);
          mid = Math.min(1, (overviewBytes[byteOffset + 1] || 0) / 140);
          high = Math.min(1, (overviewBytes[byteOffset + 2] || 0) / 140);
        } else if (sliceNorm >= 0 && sliceNorm <= 1) {
          const bands = computeTrackStructuralBands(sliceNorm, seed, deck);
          low = bands.bass;
          mid = Math.max(bands.drums, bands.vocals);
          high = bands.treble;
        }
        const isPlayed = x < playheadX;
        const lowAmp = low * maxAmp * 0.96;
        const midAmp = Math.pow(mid, 1.15) * maxAmp * 0.72;
        const highAmp = Math.pow(high, 1.45) * maxAmp * 0.42;
        if (lowAmp >= 0.5) {
          ctx.fillStyle = isPlayed ? "rgba(29, 78, 216, 0.78)" : "#2563eb";
          ctx.fillRect(x, midY - lowAmp, colW + 0.15, lowAmp * 2);
        }
        if (midAmp >= 0.5) {
          ctx.fillStyle = isPlayed ? "rgba(245, 158, 11, 0.80)" : "#f59e0b";
          ctx.fillRect(x, midY - midAmp, colW + 0.15, midAmp * 2);
        }
        if (highAmp >= 0.5) {
          ctx.fillStyle = isPlayed ? "rgba(248, 250, 252, 0.85)" : "#ffffff";
          ctx.fillRect(x, midY - highAmp, colW + 0.15, highAmp * 2);
        }
      }
      const bpm = deck.bpm || 130;
      const beatSec = 60 / bpm;
      const downbeatSec = deck && deck.first_downbeat_ms ? parseFloat(deck.first_downbeat_ms) / 1e3 : Array.isArray(deck.cues) && deck.cues.length > 0 && typeof deck.cues[0].pos_sec === "number" ? deck.cues[0].pos_sec : 0;
      if (beatSec > 0) {
        const firstBeatIdx = Math.floor((startSec - downbeatSec) / beatSec);
        const lastBeatIdx = Math.ceil((endSec - downbeatSec) / beatSec);
        for (let b = firstBeatIdx; b <= lastBeatIdx; b++) {
          const bSec = downbeatSec + b * beatSec;
          if (bSec < 0 || bSec > durSec) continue;
          const bx = playheadX + (bSec - currentSec) / windowSec * w;
          if (bx >= 0 && bx <= w) {
            const isDownbeat = (b % 4 + 4) % 4 === 0;
            if (isDownbeat) {
              const barNum = Math.floor(b / 4) + 1;
              ctx.strokeStyle = "rgba(239, 68, 68, 0.82)";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(bx, 0);
              ctx.lineTo(bx, h);
              ctx.stroke();
              ctx.fillStyle = "#ef4444";
              ctx.fillRect(bx - 1.5, 0, 3, 5);
              if (barNum > 0 && bx > 14 && bx < w - 24) {
                ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
                ctx.font = "bold 8.5px ui-monospace, SFMono-Regular, Menlo, monospace";
                ctx.textAlign = "left";
                ctx.fillText(`${barNum}.1`, bx + 3, 11);
              }
            } else {
              ctx.strokeStyle = "rgba(255, 255, 255, 0.20)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(bx, 6);
              ctx.lineTo(bx, h - 4);
              ctx.stroke();
              ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
              ctx.fillRect(bx - 0.5, 0, 1, 3.5);
            }
          }
        }
      }
      if (showTacticalAids) {
        cues.forEach((cue) => {
          const cueSec = typeof cue.pos_sec === "number" ? cue.pos_sec : (cue.pct !== void 0 ? cue.pct : 0) * durSec;
          if (cueSec >= startSec && cueSec <= endSec) {
            const cx = playheadX + (cueSec - currentSec) / windowSec * w;
            if (cx >= 0 && cx <= w) {
              const color = cue.color || "#22d3ee";
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.moveTo(cx, 0);
              ctx.lineTo(cx, h);
              ctx.stroke();
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.moveTo(cx, 0);
              ctx.lineTo(cx + 15, 0);
              ctx.lineTo(cx + 15, 11);
              ctx.lineTo(cx + 4, 11);
              ctx.lineTo(cx, 15);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = "#050507";
              ctx.font = "bold 8px ui-monospace, SFMono-Regular, Menlo, monospace";
              ctx.textAlign = "left";
              ctx.fillText(`C${cue.id || ""}`, cx + 2, 8.5);
            }
          }
        });
      }
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(playheadX - 0.85, 0, 1.7, h);
      ctx.beginPath();
      ctx.moveTo(playheadX - 5.5, 0);
      ctx.lineTo(playheadX + 5.5, 0);
      ctx.lineTo(playheadX, 7);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(playheadX - 5.5, h);
      ctx.lineTo(playheadX + 5.5, h);
      ctx.lineTo(playheadX, h - 7);
      ctx.closePath();
      ctx.fill();
      const miniCanvas = minimapRef.current;
      if (!miniCanvas) return;
      const mRect = miniCanvas.getBoundingClientRect();
      const mw = mRect.width || miniCanvas.parentElement.clientWidth || 550;
      const mh = 22;
      miniCanvas.width = Math.round(mw * dpr);
      miniCanvas.height = Math.round(mh * dpr);
      const mCtx = miniCanvas.getContext("2d");
      if (mCtx.resetTransform) mCtx.resetTransform();
      else mCtx.setTransform(1, 0, 0, 1, 0, 0);
      mCtx.scale(dpr, dpr);
      const dataTag = (hdWave == null ? void 0 : hdWave.cacheKey) ? `hd_${hdWave.cacheKey}` : overviewBytes ? "serato" : "synth";
      const cacheKey = `${rawId}_${Math.round(mw)}_${showTacticalAids}_${dataTag}`;
      if (!minimapCacheRef.current || minimapCacheRef.current.key !== cacheKey) {
        const off = document.createElement("canvas");
        off.width = Math.round(mw * dpr);
        off.height = Math.round(mh * dpr);
        const oCtx = off.getContext("2d");
        if (oCtx.resetTransform) oCtx.resetTransform();
        else oCtx.setTransform(1, 0, 0, 1, 0, 0);
        oCtx.scale(dpr, dpr);
        oCtx.fillStyle = "#050507";
        oCtx.fillRect(0, 0, mw, mh);
        const mHalf = mh / 2;
        const mPhysCols = Math.max(1, Math.round(mw * dpr));
        const mColW = mw / mPhysCols;
        const hasOvHD = Boolean(hdWave && hdWave.overview && hdWave.overviewColumns > 0);
        for (let j = 0; j < mPhysCols; j++) {
          const mx = j * mColW;
          const mNorm0 = j / mPhysCols;
          const mNorm1 = (j + 1) / mPhysCols;
          let bVal = 0;
          let mVal = 0;
          let tVal = 0;
          if (hasOvHD) {
            const [l, m, hi] = sample3BandHD(
              hdWave.overview,
              hdWave.overviewColumns,
              mNorm0 * hdWave.overviewColumns,
              mNorm1 * hdWave.overviewColumns
            );
            bVal = l;
            mVal = m;
            tVal = hi;
          } else if (overviewBytes && overviewBytes.length >= 3840) {
            const colIdx = Math.min(1279, Math.max(0, Math.floor(mNorm0 * 1280)));
            const byteOffset = colIdx * 3;
            bVal = Math.min(1, (overviewBytes[byteOffset] || 0) / 220);
            mVal = Math.min(1, (overviewBytes[byteOffset + 1] || 0) / 140);
            tVal = Math.min(1, (overviewBytes[byteOffset + 2] || 0) / 140);
          } else {
            const bands = computeTrackStructuralBands(mNorm0, seed, deck);
            bVal = bands.bass;
            mVal = Math.max(bands.drums, bands.vocals);
            tVal = bands.treble;
          }
          const bAmp = bVal * (mHalf - 1.5);
          const mAmp = Math.pow(mVal, 1.2) * (mHalf - 3);
          const tAmp = Math.pow(tVal, 1.65) * (mHalf - 5);
          if (bAmp >= 0.4) {
            oCtx.fillStyle = "#2563eb";
            oCtx.fillRect(mx, mHalf - bAmp, mColW + 0.15, bAmp * 2);
          }
          if (mAmp >= 0.4) {
            oCtx.fillStyle = "#f59e0b";
            oCtx.fillRect(mx, mHalf - mAmp, mColW + 0.15, mAmp * 2);
          }
          if (tAmp >= 0.4) {
            oCtx.fillStyle = "#ffffff";
            oCtx.fillRect(mx, mHalf - tAmp, mColW + 0.15, tAmp * 2);
          }
        }
        if (showTacticalAids) {
          phases.forEach((ph) => {
            const px1 = ph.start_pct * mw;
            const px2 = ph.end_pct * mw;
            oCtx.fillStyle = `${ph.color}20`;
            oCtx.fillRect(px1, 0, px2 - px1, mh);
            oCtx.fillStyle = ph.color;
            oCtx.fillRect(px1, 0, px2 - px1, 1.5);
          });
          cues.forEach((cue) => {
            const cx = (cue.pct || 0) * mw;
            oCtx.fillStyle = cue.color || "#22d3ee";
            oCtx.fillRect(cx - 0.5, 0, 1.2, mh);
          });
        }
        minimapCacheRef.current = { key: cacheKey, canvas: off };
      }
      mCtx.drawImage(minimapCacheRef.current.canvas, 0, 0, mw, mh);
      const mPlayheadX = progress * mw;
      if (mPlayheadX > 0) {
        mCtx.fillStyle = "rgba(5, 5, 8, 0.46)";
        mCtx.fillRect(0, 0, mPlayheadX, mh);
      }
      const vStart = Math.max(0, startSec / durSec * mw);
      const vEnd = Math.min(mw, endSec / durSec * mw);
      mCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
      mCtx.fillRect(vStart, 0, Math.max(4, vEnd - vStart), mh);
      mCtx.strokeStyle = "rgba(255, 255, 255, 0.72)";
      mCtx.lineWidth = 1;
      mCtx.strokeRect(vStart, 0.5, Math.max(4, vEnd - vStart), mh - 1);
      mCtx.fillStyle = "#ef4444";
      mCtx.fillRect(mPlayheadX - 0.85, 0, 1.7, mh);
    }, [zoom, showTacticalAids, progress, deck, antiMuddy, isBassClashDanger, hdWave, overviewBytes]);
    const handleMinimapClick = (e) => {
      const miniCanvas = minimapRef.current;
      if (!miniCanvas) return;
      const rect = miniCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newPct = Math.max(0, Math.min(1, clickX / rect.width));
      progressRef.current = newPct;
      setProgress(newPct);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 p-2 sm:p-2.5 rounded-2xl bg-[#030308] border border-zinc-800/90 shadow-inner" }, !isCompact && showTacticalAids && /* @__PURE__ */ React.createElement("div", { className: "relative p-2 rounded-xl bg-zinc-950/90 border border-zinc-800/80 shadow-md" }, isEmptyDeck ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-400 font-mono text-[11px] font-medium" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u23F9\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "DECK VAC\xCDO \u2794 Arrastrar canci\xF3n aqu\xED para activar an\xE1lisis")), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono text-zinc-600" }, "STANDBY")) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, !deck.is_playing ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-500/70 text-indigo-200 font-mono text-[11px] font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u{1F3A7}"), /* @__PURE__ */ React.createElement("span", null, "EN CUE (PREPARADO) \u2794 Listo para soltar en primer bombo (Bar 1)")) : isBassClashDanger ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500 text-red-200 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse ring-1 ring-red-400" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("span", null, "EN ", barsToNextCue || 8, " COMPASES (", formatSec(timeToNextCue || 16), ") \u2794 BASS CLASH: Cortar Low EQ")) : nextCue ? timeToNextCue <= 5 && timeToNextCue > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white font-mono text-[11px] font-black shadow-[0_0_25px_rgba(239,68,68,1)] ring-2 ring-red-400 border border-white animate-pulse scale-105" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm animate-bounce" }, "\u{1F6A8}"), /* @__PURE__ */ React.createElement("span", null, "\xA1ATENCI\xD3N! EN ", /* @__PURE__ */ React.createElement("strong", { className: "text-yellow-300 font-orbitron" }, formatSec(timeToNextCue)), " \u2794 ", /* @__PURE__ */ React.createElement("span", { className: "uppercase tracking-wider" }, nextCue.name))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-djcyan-950/60 border border-djcyan-500/60 text-djcyan-300 font-mono text-[11px] font-bold" }, /* @__PURE__ */ React.createElement("span", null, "\u23F3"), /* @__PURE__ */ React.createElement("span", null, "EN ", /* @__PURE__ */ React.createElement("strong", { className: "text-white font-orbitron" }, barsToNextCue), " BARS (", formatSec(timeToNextCue), ") \u2794 ", /* @__PURE__ */ React.createElement("span", { className: "text-white uppercase" }, nextCue.name))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold" }, /* @__PURE__ */ React.createElement("span", null, "\u{1F7E2}"), /* @__PURE__ */ React.createElement("span", null, "EN ZONA SEGURA DE MEZCLA (OUTRO)"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono uppercase text-amber-400 font-bold mr-1 hidden md:inline" }, "\u{1F3AF} Hitos:"), phases.map((ph) => {
      const phStart = ph.start_pct || 0;
      const isPassed = phStart <= progress;
      const isCurrent = progress >= ph.start_pct && progress < ph.end_pct;
      const iconsMap = { intro: "\u{1F680}", build: "\u{1F6D1}", break: "\u{1F30A}", break2: "\u{1F30A}", drop: "\u{1F3AF}", outro: "\u{1F3C1}" };
      const icon = iconsMap[ph.type] || "\u26A1";
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: ph.id,
          onMouseEnter: () => setHoveredMilestone({
            name: ph.name || ph.label,
            time: formatSec(ph.start_pct * durSec),
            pct: ph.start_pct,
            color: ph.color,
            directive: ph.directive || ph.label
          }),
          onMouseLeave: () => setHoveredMilestone(null),
          className: `relative px-1.5 py-0.5 rounded cursor-pointer transition-all text-[9px] font-mono font-bold flex items-center gap-1 border ${isCurrent ? "bg-amber-400 text-black border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-105 ring-1 ring-white" : isPassed ? "bg-zinc-900/80 text-zinc-400 border-zinc-800" : "bg-zinc-950 text-zinc-300 border-zinc-700/60 hover:border-amber-400"}`
        },
        /* @__PURE__ */ React.createElement("span", null, icon),
        /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-[70px]" }, ph.name.toUpperCase())
      );
    }))), hoveredMilestone && /* @__PURE__ */ React.createElement("div", { className: "absolute left-2 right-2 top-full mt-1.5 z-30 p-2.5 rounded-xl bg-black/95 border border-djcyan-500/60 shadow-2xl backdrop-blur-md text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-zinc-800 pb-1 mb-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-white flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: hoveredMilestone.color } }), hoveredMilestone.name, " (", hoveredMilestone.time, ")"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-djcyan-400 font-mono" }, "Comp\xE1s ", Math.round(hoveredMilestone.pct * durSec / (60 / (deck.bpm || 130)) / 4))), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-zinc-300 leading-relaxed" }, /* @__PURE__ */ React.createElement("strong", { className: "text-emerald-400" }, "Acci\xF3n DJ:"), " ", hoveredMilestone.directive || "Ajuste de ganancia y sincron\xEDa arm\xF3nica antes del drop."))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap text-xs font-mono" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, !isCompact && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowTacticalAids(!showTacticalAids),
        className: `flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-bold uppercase transition-all cursor-pointer border text-[10px] sm:text-[11px] ${showTacticalAids ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"}`,
        title: "Habilitar/Deshabilitar ayudas visuales (Drops, Cues, Zonas Seguras y Anti-Muddy) en el waveform"
      },
      /* @__PURE__ */ React.createElement("span", null, showTacticalAids ? "\u{1F3AF}" : "\u26AA"),
      /* @__PURE__ */ React.createElement("span", null, showTacticalAids ? "Ayudas DJ" : "Puro Wave")
    ), /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-2 shrink-0" }, (hdWave == null ? void 0 : hdWave.realFft) && /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "flex items-center gap-1.5 font-mono font-black px-2 py-0.5 rounded-md shrink-0",
        style: {
          fontSize: "9px",
          backgroundColor: "rgba(34, 211, 238, 0.12)",
          border: "1px solid rgba(34, 211, 238, 0.45)",
          color: "#22d3ee"
        }
      },
      /* @__PURE__ */ React.createElement("span", { style: { width: 5, height: 5, borderRadius: "9999px", backgroundColor: "#22d3ee", display: "inline-block" } }),
      "3BAND HD"
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 px-2.5 py-0.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[9.5px] font-mono text-zinc-400 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "9999px", backgroundColor: "#2563eb", display: "inline-block" } }), "Graves"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "9999px", backgroundColor: "#f59e0b", display: "inline-block" } }), "Medios"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { style: { width: 6, height: 6, borderRadius: "9999px", backgroundColor: "#ffffff", display: "inline-block" } }), "Agudos")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 order-first shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px]" }, [2, 4, 8, 16].map((z) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: z,
        type: "button",
        onClick: () => setZoom(z),
        className: `px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${zoom === z ? "bg-djcyan-500 text-black shadow" : "text-zinc-400 hover:text-white"}`
      },
      z,
      "x"
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[10px] sm:text-[11px]" }, /* @__PURE__ */ React.createElement("span", { className: isEmptyDeck ? "text-zinc-500 font-bold" : "text-white font-bold" }, isEmptyDeck ? "00:00" : formatSec(elapsedSec)), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-600" }, "/"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-500" }, "-", isEmptyDeck ? "00:00" : formatSec(remainSec))))), /* @__PURE__ */ React.createElement("div", { className: "relative w-full rounded-xl overflow-hidden border border-zinc-800/80 bg-[#050507]" }, /* @__PURE__ */ React.createElement(
      "canvas",
      {
        ref: canvasRef,
        style: { width: "100%", height: "88px", display: "block" }
      }
    )), /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: handleMinimapClick,
        className: "relative w-full rounded-lg overflow-hidden border border-zinc-800/60 bg-[#050507] cursor-pointer hover:border-zinc-700 transition-colors",
        title: "Haz clic en cualquier punto para saltar en la pista"
      },
      /* @__PURE__ */ React.createElement(
        "canvas",
        {
          ref: minimapRef,
          style: { width: "100%", height: "22px", display: "block" }
        }
      )
    ));
  };

  // web/js/workspaces/CopilotMixerMirror.jsx
  var { memo } = React;
  var KnobSVG = memo(({
    label,
    value = 0.5,
    bipolar = true,
    alertTarget = false,
    resolved = false,
    touched = false
  }) => {
    const v = Math.max(0, Math.min(1, Number(value) || 0));
    const startDeg = -135;
    const sweepDeg = 270;
    const angleDeg = startDeg + v * sweepDeg;
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const cx = 18;
    const cy = 18;
    const r = 13;
    const px = cx + Math.cos(rad) * (r - 2);
    const py = cy + Math.sin(rad) * (r - 2);
    const polarToXY = (deg) => {
      const a = (deg - 90) * (Math.PI / 180);
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    const describeArc = (a0, a1) => {
      const [x0, y0] = polarToXY(a0);
      const [x1, y1] = polarToXY(a1);
      const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
      const sweep = a1 >= a0 ? 1 : 0;
      return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    };
    const activeArc = bipolar ? Math.abs(v - 0.5) > 0.015 ? describeArc(0, angleDeg) : "" : v > 0.015 ? describeArc(startDeg, angleDeg) : "";
    const strokeColor = resolved ? "#10b981" : alertTarget ? "#ef4444" : touched ? "#ffffff" : "#22d3ee";
    const pctLabel = bipolar ? `${v >= 0.5 ? "+" : ""}${Math.round((v - 0.5) * 200)}%` : `${Math.round(v * 100)}%`;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex flex-col items-center select-none",
        style: { width: 42 },
        title: `${label}: ${pctLabel}`
      },
      /* @__PURE__ */ React.createElement("svg", { width: "36", height: "36", viewBox: "0 0 36 36", style: { overflow: "visible" } }, /* @__PURE__ */ React.createElement(
        "path",
        {
          d: describeArc(startDeg, startDeg + sweepDeg),
          fill: "none",
          stroke: "#27272a",
          strokeWidth: "3",
          strokeLinecap: "round"
        }
      ), alertTarget && !resolved && /* @__PURE__ */ React.createElement(
        "path",
        {
          d: describeArc(startDeg, startDeg + 0.3 * sweepDeg),
          fill: "none",
          stroke: "#f59e0b",
          strokeWidth: "4",
          strokeLinecap: "round",
          opacity: "0.85"
        }
      ), activeArc && /* @__PURE__ */ React.createElement(
        "path",
        {
          d: activeArc,
          fill: "none",
          stroke: strokeColor,
          strokeWidth: "3",
          strokeLinecap: "round"
        }
      ), /* @__PURE__ */ React.createElement(
        "circle",
        {
          cx,
          cy,
          r: "8.5",
          fill: "#111116",
          stroke: alertTarget ? "#ef4444" : touched ? "#22d3ee" : "#3f3f46",
          strokeWidth: "1.2"
        }
      ), /* @__PURE__ */ React.createElement(
        "line",
        {
          x1: cx,
          y1: cy,
          x2: px,
          y2: py,
          stroke: strokeColor,
          strokeWidth: "2",
          strokeLinecap: "round"
        }
      )),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "font-mono font-bold tracking-wider",
          style: {
            fontSize: 8.5,
            marginTop: -2,
            color: resolved ? "#6ee7b7" : alertTarget ? "#fca5a5" : "#a1a1aa"
          }
        },
        label,
        alertTarget && !resolved ? " \u2199" : resolved ? " \u2713" : ""
      )
    );
  });
  var ChannelStrip = memo(({ deckNum, ch, touched = {}, directive = null }) => {
    var _a, _b, _c, _d, _e, _f;
    const isTargetLow = Boolean(
      directive && directive.deck === deckNum && directive.control === "low" && directive.status !== "RESOLVED"
    );
    const isResolvedLow = Boolean(
      directive && directive.deck === deckNum && directive.control === "low" && directive.status === "RESOLVED"
    );
    const volPct = Math.round(Math.max(0, Math.min(1, Number((_a = ch == null ? void 0 : ch.volume) != null ? _a : 1))) * 100);
    const pfx = `deck_${deckNum}`;
    return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "font-mono font-bold px-1.5 py-0.5 rounded",
        style: {
          fontSize: 9,
          backgroundColor: "rgba(34,211,238,0.10)",
          border: "1px solid rgba(34,211,238,0.32)",
          color: "#22d3ee"
        }
      },
      "D",
      deckNum
    ), /* @__PURE__ */ React.createElement(KnobSVG, { label: "GAIN", value: (_b = ch == null ? void 0 : ch.gain) != null ? _b : 0.5, bipolar: true }), /* @__PURE__ */ React.createElement(KnobSVG, { label: "HIGH", value: (_c = ch == null ? void 0 : ch.high) != null ? _c : 0.5, bipolar: true, touched: Boolean(touched[`${pfx}.high`]) }), /* @__PURE__ */ React.createElement(KnobSVG, { label: "MID", value: (_d = ch == null ? void 0 : ch.mid) != null ? _d : 0.5, bipolar: true, touched: Boolean(touched[`${pfx}.mid`]) }), /* @__PURE__ */ React.createElement(
      KnobSVG,
      {
        label: "LOW",
        value: (_e = ch == null ? void 0 : ch.low) != null ? _e : 0.5,
        bipolar: true,
        alertTarget: isTargetLow,
        resolved: isResolvedLow
      }
    ), /* @__PURE__ */ React.createElement(KnobSVG, { label: "FLTR", value: (_f = ch == null ? void 0 : ch.filter) != null ? _f : 0.5, bipolar: true, touched: Boolean(touched[`${pfx}.filter`]) }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center ml-1", style: { width: 26 }, title: `Volumen D${deckNum}: ${volPct}%` }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          width: 8,
          height: 30,
          borderRadius: 4,
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          position: "relative",
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${volPct}%`,
            backgroundColor: volPct > 12 ? "#22d3ee" : "#52525b",
            transition: "height 40ms linear"
          }
        }
      )
    ), /* @__PURE__ */ React.createElement("span", { className: "font-mono font-bold text-zinc-400", style: { fontSize: 8, marginTop: 2 } }, "VOL")));
  });
  var CopilotMixerMirror = memo(({ mixer = null, audit = null }) => {
    var _a, _b, _c, _d;
    const d1 = (mixer == null ? void 0 : mixer.deck_1) || { gain: 0.5, high: 0.5, mid: 0.5, low: 0.5, filter: 0.5, volume: 1 };
    const d2 = (mixer == null ? void 0 : mixer.deck_2) || { gain: 0.5, high: 0.5, mid: 0.5, low: 0.5, filter: 0.5, volume: 1 };
    const touched = (mixer == null ? void 0 : mixer.touched) || {};
    const xf = Math.max(0, Math.min(1, Number((_a = mixer == null ? void 0 : mixer.crossfader) != null ? _a : 0.5)));
    const directive = (audit == null ? void 0 : audit.active_directive) || null;
    const scorePct = (_b = audit == null ? void 0 : audit.score_pct) != null ? _b : 100;
    const resolved = (_c = audit == null ? void 0 : audit.resolved) != null ? _c : 0;
    const total = (_d = audit == null ? void 0 : audit.total) != null ? _d : 0;
    return /* @__PURE__ */ React.createElement(
      "section",
      {
        className: "w-full rounded-2xl border border-zinc-800/90 px-3 py-2 mb-3.5 flex items-center justify-between gap-3 flex-wrap",
        style: { backgroundColor: "#07070c" }
      },
      /* @__PURE__ */ React.createElement(ChannelStrip, { deckNum: 1, ch: d1, touched, directive }),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-1.5 min-w-[175px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-mono", style: { fontSize: 9.5 } }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "px-1.5 py-0.5 rounded font-bold",
          style: {
            backgroundColor: (mixer == null ? void 0 : mixer.active) ? "rgba(16,185,129,0.14)" : "#18181b",
            border: (mixer == null ? void 0 : mixer.active) ? "1px solid rgba(16,185,129,0.4)" : "1px solid #3f3f46",
            color: (mixer == null ? void 0 : mixer.active) ? "#6ee7b7" : "#a1a1aa"
          }
        },
        (mixer == null ? void 0 : mixer.active) ? "MIXER 14-BIT LIVE" : "MIXER STANDBY"
      ), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-300 font-bold" }, "AUDIT: ", /* @__PURE__ */ React.createElement("span", { style: { color: scorePct >= 80 ? "#22d3ee" : "#f59e0b" } }, scorePct, "%"), total > 0 ? ` (${resolved}/${total})` : "")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 w-full max-w-[160px]" }, /* @__PURE__ */ React.createElement("span", { className: "font-mono text-zinc-500", style: { fontSize: 8.5 } }, "A"), /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            position: "relative",
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#18181b",
            border: "1px solid #27272a"
          }
        },
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: -3,
              left: `calc(${(xf * 100).toFixed(1)}% - 5px)`,
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: "#ffffff",
              border: "1px solid #22d3ee"
            }
          }
        )
      ), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-zinc-500", style: { fontSize: 8.5 } }, "B")), directive && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "font-mono font-bold px-2 py-0.5 rounded text-center",
          style: {
            fontSize: 9,
            backgroundColor: directive.status === "RESOLVED" ? "rgba(16,185,129,0.16)" : "rgba(239,68,68,0.16)",
            border: directive.status === "RESOLVED" ? "1px solid rgba(16,185,129,0.45)" : "1px solid rgba(239,68,68,0.45)",
            color: directive.status === "RESOLVED" ? "#6ee7b7" : "#fca5a5"
          }
        },
        directive.status === "RESOLVED" ? `\u2713 EJECUTADO EN ${directive.reaction_ms}ms` : directive.label
      )),
      /* @__PURE__ */ React.createElement(ChannelStrip, { deckNum: 2, ch: d2, touched, directive })
    );
  });

  // web/js/workspaces/CopilotCleanMixBanner.jsx
  var { memo: memo2 } = React;
  var CopilotCleanMixBanner = memo2(({
    antiMuddy = null,
    harmonic = null,
    controllerState = null,
    lufsDelta = null,
    lowEqApplied = false,
    onApplyCorrection = null,
    isAppOpen = true,
    latency = 2
  }) => {
    const isDanger = isAppOpen && antiMuddy && antiMuddy.status === "danger";
    const isWarning = isAppOpen && antiMuddy && antiMuddy.status === "warning";
    const controllerName = ((controllerState == null ? void 0 : controllerState.name) || "NUMARK NV II").replace(/\s*\(USB\)\s*/i, "").trim();
    const camelotLabel = (harmonic == null ? void 0 : harmonic.badge) || ((harmonic == null ? void 0 : harmonic.type) === "HARMONIC_CLASH" || (harmonic == null ? void 0 : harmonic.is_clash) ? "CHOQUE" : (harmonic == null ? void 0 : harmonic.type) === "STANDBY" ? "STANDBY" : (harmonic == null ? void 0 : harmonic.type) === "PERFECT_MATCH" ? "MATCH" : (harmonic == null ? void 0 : harmonic.score) != null ? `${harmonic.score}% OK` : "OK");
    const actionText = lowEqApplied ? "\u2713 EQ RESTABLECIDO" : ((antiMuddy == null ? void 0 : antiMuddy.action) || (isDanger ? "CORTAR LOW CH2 (-12 dB)" : "Frec. equilibradas")).replace(/Frecuencias equilibradas/i, "Frec. equilibradas");
    return /* @__PURE__ */ React.createElement(
      "section",
      {
        className: `bw-msg-banner !flex !flex-col !items-stretch !gap-1.5 !py-2 !px-3 ${isDanger ? "is-danger" : ""} ${!isAppOpen ? "opacity-50" : ""}`,
        "aria-live": "polite"
      },
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "bw-msg-visual !py-0.5 !px-2 !gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "bw-phase-bars" }, /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" }), /* @__PURE__ */ React.createElement("span", { className: "bw-p-bar" })), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-[10px] leading-none flex items-center gap-1.5 select-none" }, /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400 font-bold" }, "SUB-BASS"), /* @__PURE__ */ React.createElement("span", { className: `font-black ${isDanger ? "text-[#ff6b88]" : "text-emerald-400"}` }, !isAppOpen ? "STANDBY" : isDanger ? "COLISI\xD3N 142\xB0" : "FASE 0\xB0 OK"))), /* @__PURE__ */ React.createElement("span", { className: "font-syne font-black text-[13px] tracking-wider text-white leading-none" }, !isAppOpen ? "CABINA EN STANDBY" : isDanger ? (antiMuddy == null ? void 0 : antiMuddy.title) || "ALERTA DE GRAVES" : isWarning ? (antiMuddy == null ? void 0 : antiMuddy.title) || "AVISO DE FRECUENCIAS" : "MEZCLA LIMPIA"), /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-mono font-black px-2 py-0.5 rounded-full tracking-wider leading-none ${!isAppOpen ? "bg-zinc-800 text-zinc-400" : isDanger ? "bg-[#FF2A54] text-white shadow-[0_0_10px_rgba(255,42,84,0.72)]" : isWarning ? "bg-amber-400 text-black" : "bg-emerald-500 text-[#03140E]"}` }, !isAppOpen ? "SIN CONEXI\xD3N" : isDanger ? (antiMuddy == null ? void 0 : antiMuddy.tag) || "BASS CLASH \xB7 -0.2 dB CLIP" : (antiMuddy == null ? void 0 : antiMuddy.tag) || "CLEAR MIX \xB7 HEADROOM +2.4 dB")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap justify-end shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/50 font-mono text-[10px] text-cyan-300" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold tracking-tight" }, "\u26A1 ", /* @__PURE__ */ React.createElement("strong", { className: "text-white font-extrabold" }, latency, "ms"), " \u2022 SYNC")), (controllerState == null ? void 0 : controllerState.detected) && /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A] border border-cyan-500/40 text-cyan-300" }, isDanger ? `${controllerName} \xB7 LOW CH2 ACTIVO` : controllerName), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F172A] border border-[#26354F] text-zinc-300" }, "CAMELOT: ", /* @__PURE__ */ React.createElement("strong", { style: { color: (harmonic == null ? void 0 : harmonic.color) || "#38bdf8" } }, camelotLabel), " \xB7 ", lufsDelta != null ? `${lufsDelta > 0 ? "+" : ""}${lufsDelta} dB` : "-8.4 LUFS"))),
      /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3 pt-1 border-t border-white/5 flex-wrap sm:flex-nowrap" }, /* @__PURE__ */ React.createElement("div", { className: `text-[11px] font-syne whitespace-normal leading-snug min-w-0 flex-1 ${isDanger ? "text-[#ffe4e6] font-semibold" : "text-zinc-300 font-medium"}` }, !isAppOpen ? "Supervisi\xF3n inactiva hasta conectar software y hardware DJ." : (antiMuddy == null ? void 0 : antiMuddy.message) || (isDanger ? "Choque de sub-graves detectado entre DK1 y DK2. Riesgo de saturaci\xF3n en PA." : "Espectro de graves despejado (30\u2013120 Hz). Sin riesgo de cancelaci\xF3n ac\xFAstica.")), onApplyCorrection && isAppOpen ? /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onApplyCorrection,
          className: `font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 ${lowEqApplied ? "bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300" : isDanger ? "bg-[#FF2A54] hover:bg-red-500 border-red-200 text-white font-black shadow-[0_0_12px_rgba(255,42,84,0.5)] animate-pulse" : "bg-[#0F172A] hover:bg-zinc-800 border-emerald-500/60 text-emerald-300"}`,
          title: "Aplicar ajuste correctivo anti-muddy"
        },
        actionText
      ) : /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 shrink-0" }, "EQ STANDBY"))
    );
  });

  // web/js/workspaces/CopilotCenterMixer.jsx
  var { useState: useState4, useEffect: useEffect6, useRef: useRef6, useMemo: useMemo3, memo: memo3 } = React;
  var HardwareKnob = memo3(({
    value = 0.5,
    color = "#00F0FF",
    label = "",
    isFilter = false,
    onChange = null
  }) => {
    const v = Math.max(0, Math.min(1, Number(value) || 0.5));
    const angle = Math.round((v - 0.5) * 270);
    return /* @__PURE__ */ React.createElement(
      "svg",
      {
        className: "dj-knob-svg bw-dj-knob-svg select-none",
        viewBox: "0 0 40 40",
        title: `${label}: ${v >= 0.5 ? "+" : ""}${Math.round((v - 0.5) * 200)}%`
      },
      /* @__PURE__ */ React.createElement(
        "circle",
        {
          cx: "20",
          cy: "20",
          r: "14",
          fill: "none",
          stroke: "#162033",
          strokeWidth: "2.2",
          strokeDasharray: "66 24",
          transform: "rotate(135 20 20)"
        }
      ),
      /* @__PURE__ */ React.createElement(
        "circle",
        {
          cx: "20",
          cy: "20",
          r: "14",
          fill: "none",
          stroke: color,
          strokeWidth: "2.2",
          strokeDasharray: "38 56",
          transform: "rotate(135 20 20)",
          opacity: "0.88"
        }
      ),
      /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "10.5", fill: "#0A101C", stroke: "#334155", strokeWidth: "1.3" }),
      /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "20", r: "8.2", fill: "#151F32" }),
      /* @__PURE__ */ React.createElement("g", { transform: `rotate(${angle} 20 20)` }, /* @__PURE__ */ React.createElement("line", { x1: "20", y1: "20", x2: "20", y2: "10", stroke: color, strokeWidth: "2.2", strokeLinecap: "round" }))
    );
  });
  var HitoIcons = {
    intro: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ React.createElement("polygon", { points: "10 8 16 12 10 16 10 8" })),
    bassline: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("polyline", { points: "2 12 6 12 9 4 13 20 16 9 18 12 22 12" })),
    buildup: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("polyline", { points: "17 11 12 6 7 11" }), /* @__PURE__ */ React.createElement("polyline", { points: "17 18 12 13 7 18" })),
    drop: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "8" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "2", x2: "12", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "22" }), /* @__PURE__ */ React.createElement("line", { x1: "2", y1: "12", x2: "6", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "18", y1: "12", x2: "22", y2: "12" }), /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "1.5" })),
    breakdown: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M2 9c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0 4-2.5 4-2.5" }), /* @__PURE__ */ React.createElement("path", { d: "M2 15c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0 4-2.5 4-2.5" })),
    break2: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "3" }), /* @__PURE__ */ React.createElement("line", { x1: "10", y1: "8", x2: "10", y2: "16" }), /* @__PURE__ */ React.createElement("line", { x1: "14", y1: "8", x2: "14", y2: "16" })),
    drop2: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("polygon", { points: "13 2 4 14 12 14 11 22 20 10 12 10 13 2" })),
    outro: () => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M5 21V4" }), /* @__PURE__ */ React.createElement("path", { d: "M5 4h12l-2.5 4L17 12H5" }))
  };
  var DEFAULT_HITOS_D1 = [
    { id: 1, key: "intro", label: "INTRO", time: "00:00", pos_sec: 0 },
    { id: 2, key: "bassline", label: "BASSLINE IN", time: "00:32", pos_sec: 32 },
    { id: 3, key: "buildup", label: "BUILD UP", time: "01:04", pos_sec: 64 },
    { id: 4, key: "drop", label: "MAIN DROP", time: "01:36", pos_sec: 96 },
    { id: 5, key: "breakdown", label: "BREAKDOWN", time: "02:15", pos_sec: 135 },
    { id: 6, key: "break2", label: "2ND BREAK", time: "02:58", pos_sec: 178 },
    { id: 7, key: "drop2", label: "DROP 2", time: "03:30", pos_sec: 210 },
    { id: 8, key: "outro", label: "OUTRO", time: "04:12", pos_sec: 252 }
  ];
  var DEFAULT_HITOS_D2 = [
    { id: 1, key: "intro", label: "INTRO", time: "00:00", pos_sec: 0 },
    { id: 2, key: "bassline", label: "BASSLINE IN", time: "00:16", pos_sec: 16 },
    { id: 3, key: "buildup", label: "BUILD UP", time: "00:48", pos_sec: 48 },
    { id: 4, key: "drop", label: "MAIN DROP", time: "01:04", pos_sec: 64 },
    { id: 5, key: "breakdown", label: "BREAKDOWN", time: "01:48", pos_sec: 108 },
    { id: 6, key: "break2", label: "2ND BREAK", time: "02:30", pos_sec: 150 },
    { id: 7, key: "drop2", label: "DROP 2", time: "03:02", pos_sec: 182 },
    { id: 8, key: "outro", label: "OUTRO", time: "03:45", pos_sec: 225 }
  ];
  var CopilotCenterMixer = memo3(({
    deck1 = null,
    deck2 = null,
    mixer = null,
    audit = null,
    isAppOpen = true,
    showInlineHud = true
    // HUD integrado en la mesa central slim
  }) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
    const [d1ActiveHito, setD1ActiveHito] = useState4(0);
    const [d2ActiveHito, setD2ActiveHito] = useState4(2);
    const [pflState, setPflState] = useState4({ ch1: false, ch2: true });
    const [currentBeat, setCurrentBeat] = useState4(1);
    useEffect6(() => {
      const bpm = Number((deck1 == null ? void 0 : deck1.bpm) || (deck2 == null ? void 0 : deck2.bpm) || 136);
      const beatMs = Math.round(60 / bpm * 1e3);
      const interval = setInterval(() => {
        setCurrentBeat((b) => b % 4 + 1);
      }, beatMs);
      return () => clearInterval(interval);
    }, [deck1 == null ? void 0 : deck1.bpm, deck2 == null ? void 0 : deck2.bpm]);
    const hitosD1 = useMemo3(() => {
      if ((deck1 == null ? void 0 : deck1.cues) && deck1.cues.length >= 4) {
        return deck1.cues.map((c, i) => {
          var _a2, _b2, _c2, _d2;
          return {
            id: c.id || i + 1,
            key: ((_a2 = DEFAULT_HITOS_D1[i]) == null ? void 0 : _a2.key) || "intro",
            label: ((_b2 = DEFAULT_HITOS_D1[i]) == null ? void 0 : _b2.label) || c.name || `CUE ${i + 1}`,
            time: c.time || ((_c2 = DEFAULT_HITOS_D1[i]) == null ? void 0 : _c2.time) || "00:00",
            pos_sec: c.pos_sec !== void 0 ? c.pos_sec : ((_d2 = DEFAULT_HITOS_D1[i]) == null ? void 0 : _d2.pos_sec) || 0
          };
        });
      }
      return DEFAULT_HITOS_D1;
    }, [deck1 == null ? void 0 : deck1.cues]);
    const hitosD2 = useMemo3(() => {
      if ((deck2 == null ? void 0 : deck2.cues) && deck2.cues.length >= 4) {
        return deck2.cues.map((c, i) => {
          var _a2, _b2, _c2, _d2;
          return {
            id: c.id || i + 1,
            key: ((_a2 = DEFAULT_HITOS_D2[i]) == null ? void 0 : _a2.key) || "intro",
            label: ((_b2 = DEFAULT_HITOS_D2[i]) == null ? void 0 : _b2.label) || c.name || `CUE ${i + 1}`,
            time: c.time || ((_c2 = DEFAULT_HITOS_D2[i]) == null ? void 0 : _c2.time) || "00:00",
            pos_sec: c.pos_sec !== void 0 ? c.pos_sec : ((_d2 = DEFAULT_HITOS_D2[i]) == null ? void 0 : _d2.pos_sec) || 0
          };
        });
      }
      return DEFAULT_HITOS_D2;
    }, [deck2 == null ? void 0 : deck2.cues]);
    const formatSec = (sec) => {
      const s = Math.max(0, Math.round(sec));
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };
    const d1Duration = Number(deck1 == null ? void 0 : deck1.duration_sec) || 240;
    const d2Duration = Number(deck2 == null ? void 0 : deck2.duration_sec) || 240;
    const [d1PlayPos, setD1PlayPos] = useState4(() => (typeof (deck1 == null ? void 0 : deck1.play_progress) === "number" ? deck1.play_progress : 0.15) * d1Duration);
    const [d2PlayPos, setD2PlayPos] = useState4(() => (typeof (deck2 == null ? void 0 : deck2.play_progress) === "number" ? deck2.play_progress : 0) * d2Duration);
    useEffect6(() => {
      if (typeof (deck1 == null ? void 0 : deck1.play_progress) === "number") {
        setD1PlayPos(deck1.play_progress * d1Duration);
      }
    }, [deck1 == null ? void 0 : deck1.play_progress, d1Duration]);
    useEffect6(() => {
      if (typeof (deck2 == null ? void 0 : deck2.play_progress) === "number") {
        setD2PlayPos(deck2.play_progress * d2Duration);
      }
    }, [deck2 == null ? void 0 : deck2.play_progress, d2Duration]);
    useEffect6(() => {
      if (!isAppOpen) return;
      const interval = setInterval(() => {
        if (deck1 == null ? void 0 : deck1.is_playing) {
          setD1PlayPos((p) => p + 1 > d1Duration ? 0 : p + 1);
        }
        if (deck2 == null ? void 0 : deck2.is_playing) {
          setD2PlayPos((p) => p + 1 > d2Duration ? 0 : p + 1);
        }
      }, 1e3);
      return () => clearInterval(interval);
    }, [isAppOpen, deck1 == null ? void 0 : deck1.is_playing, deck2 == null ? void 0 : deck2.is_playing, d1Duration, d2Duration]);
    const d1Bpm = Number(deck1 == null ? void 0 : deck1.bpm) || 136;
    const d2Bpm = Number(deck2 == null ? void 0 : deck2.bpm) || 136;
    const d1BarSec = 60 / d1Bpm * 4;
    const d2BarSec = 60 / d2Bpm * 4;
    const d1NextHito = useMemo3(() => {
      const upcoming = hitosD1.find((h) => h.pos_sec > d1PlayPos + 0.5);
      return upcoming || hitosD1[d1ActiveHito] || hitosD1[0];
    }, [hitosD1, d1PlayPos, d1ActiveHito]);
    const d1RemainingSec = Math.max(0, Math.round(((d1NextHito == null ? void 0 : d1NextHito.pos_sec) || 32) - d1PlayPos));
    const d1RemainingBars = Math.max(1, Math.ceil(d1RemainingSec / d1BarSec));
    const d1IsPlaying = Boolean(deck1 == null ? void 0 : deck1.is_playing);
    const d1IsAlert = d1IsPlaying && d1RemainingSec <= 5 && d1RemainingSec > 0;
    const d1ProgressPct = Math.min(100, Math.max(0, Math.round((d1NextHito.pos_sec - d1RemainingSec) / (d1NextHito.pos_sec || 1) * 100)));
    const d2NextHito = useMemo3(() => {
      const upcoming = hitosD2.find((h) => h.pos_sec > d2PlayPos + 0.5);
      return upcoming || hitosD2[d2ActiveHito] || hitosD2[2] || hitosD2[0];
    }, [hitosD2, d2PlayPos, d2ActiveHito]);
    const d2IsPlaying = Boolean(deck2 == null ? void 0 : deck2.is_playing);
    const d2RemainingSec = d2IsPlaying ? Math.max(0, Math.round(((d2NextHito == null ? void 0 : d2NextHito.pos_sec) || 48) - d2PlayPos)) : d1IsPlaying ? d1RemainingSec : 14;
    const d2RemainingBars = Math.max(1, Math.ceil(d2RemainingSec / d2BarSec));
    const d2IsAlert = (d2IsPlaying || d1IsPlaying && !d2IsPlaying) && d2RemainingSec <= 5 && d2RemainingSec > 0;
    const d2ProgressPct = Math.min(100, Math.max(0, Math.round((d2NextHito.pos_sec - d2RemainingSec) / (d2NextHito.pos_sec || 1) * 100)));
    const isCriticalAlert = d1IsAlert || d2IsAlert;
    const ch1Mix = (mixer == null ? void 0 : mixer.deck_1) || (mixer == null ? void 0 : mixer.ch1) || {};
    const ch2Mix = (mixer == null ? void 0 : mixer.deck_2) || (mixer == null ? void 0 : mixer.ch2) || {};
    const ch1Gain = (_a = ch1Mix.gain) != null ? _a : 0.5;
    const ch2Gain = (_b = ch2Mix.gain) != null ? _b : 0.5;
    const ch1Hi = (_d = (_c = ch1Mix.high) != null ? _c : ch1Mix.eq_high) != null ? _d : 0.5;
    const ch2Hi = (_f = (_e = ch2Mix.high) != null ? _e : ch2Mix.eq_high) != null ? _f : 0.5;
    const ch1Mid = (_h = (_g = ch1Mix.mid) != null ? _g : ch1Mix.eq_mid) != null ? _h : 0.5;
    const ch2Mid = (_j = (_i = ch2Mix.mid) != null ? _i : ch2Mix.eq_mid) != null ? _j : 0.5;
    const ch1Low = (_l = (_k = ch1Mix.low) != null ? _k : ch1Mix.eq_low) != null ? _l : 0.5;
    const ch2Low = (_n = (_m = ch2Mix.low) != null ? _m : ch2Mix.eq_low) != null ? _n : 0.5;
    const ch1Fltr = (_o = ch1Mix.filter) != null ? _o : 0.5;
    const ch2Fltr = (_p = ch2Mix.filter) != null ? _p : 0.5;
    const ch1Fader = (_r = (_q = ch1Mix.volume) != null ? _q : ch1Mix.fader) != null ? _r : 1;
    const ch2Fader = (_t = (_s = ch2Mix.volume) != null ? _s : ch2Mix.fader) != null ? _t : 1;
    const crossfader = (_u = mixer == null ? void 0 : mixer.crossfader) != null ? _u : 0.5;
    const ch1VuLeds = Math.round(Math.min(1, Math.max(0, ch1Gain * (0.65 + 0.35 * ch1Fader))) * 10);
    const ch2VuLeds = Math.round(Math.min(1, Math.max(0, ch2Gain * (0.65 + 0.35 * ch2Fader))) * 10);
    const auditScore = (audit == null ? void 0 : audit.score_pct) !== void 0 ? audit.score_pct : 100;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `bw-center-mixer center-mixer ${isCriticalAlert ? "is-alert-5s" : ""}`,
        id: "mixer-main",
        role: "region",
        "aria-label": "Mesa de Mezclas Central T\xE1ctica"
      },
      /* @__PURE__ */ React.createElement("div", { className: "mx-topbar bw-mx-topbar select-none" }, /* @__PURE__ */ React.createElement("div", { className: "mx-sync bw-mx-sync" }, /* @__PURE__ */ React.createElement("span", { className: "sync-dot bw-sync-dot" }), /* @__PURE__ */ React.createElement("span", null, "SYNC \xB7 ", Math.round((deck1 == null ? void 0 : deck1.bpm) || (deck2 == null ? void 0 : deck2.bpm) || 136), " BPM")), /* @__PURE__ */ React.createElement("div", { className: "mx-beat-strip bw-mx-beat-strip" }, [1, 2, 3, 4].map((b) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: b,
          className: `b-box bw-b-box ${currentBeat === b ? b === 4 ? "pulse" : "on" : ""}`
        },
        b
      ))), /* @__PURE__ */ React.createElement("div", { className: "mx-alert-badge bw-mx-alert-badge" }, isCriticalAlert ? "\u26A0 <5S ALERTA" : "\u26A0 <5S")),
      showInlineHud && /* @__PURE__ */ React.createElement("div", { className: "bw-dual-huds" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `cue-hud bw-cue-hud d1-hud select-none ${d1IsAlert ? "is-impact" : ""}`,
          role: "status",
          "aria-live": "assertive"
        },
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-ico bw-cue-hud-ico" }, d1IsAlert ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M7 18v-6a5 5 0 1 1 10 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M5 21h14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M4.93 4.93l1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M19.07 4.93l-1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12h2" }), /* @__PURE__ */ React.createElement("path", { d: "M20 12h2" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" }), /* @__PURE__ */ React.createElement("path", { d: "M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" }))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-body bw-cue-hud-body" }, /* @__PURE__ */ React.createElement("div", { className: "cue-hud-kicker bw-cue-hud-kicker" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-dot bw-cue-hud-dot", style: { backgroundColor: "#00F0FF", boxShadow: "0 0 7px #00F0FF" } }), /* @__PURE__ */ React.createElement("span", { className: "text-[#00F0FF] font-black mr-1" }, "DK 1"), /* @__PURE__ */ React.createElement("span", null, d1IsAlert ? d1RemainingSec === 0 ? "\xA1IMPACTO AHORA! SOLTAR PISTA" : "\xA1ATENCI\xD3N! QUEDAN < 5 SEGUNDOS" : d1IsPlaying ? `EN PLAY \xB7 PROXIMO: ${(d1NextHito == null ? void 0 : d1NextHito.label) || "HITO"}` : "EN CUE (PREPARADO)")), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-text bw-cue-hud-text truncate" }, d1IsAlert ? `PRIMER GOLPE (${(d1NextHito == null ? void 0 : d1NextHito.label) || "INTRO"})` : d1IsPlaying ? `Transici\xF3n a ${(d1NextHito == null ? void 0 : d1NextHito.label) || "Hito"} en ${d1RemainingBars} compases` : "Listo para soltar en primer bombo"), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-progress bw-cue-hud-progress" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "cue-hud-progress-fill bw-cue-hud-progress-fill",
            style: { width: `${d1ProgressPct}%` }
          }
        ))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-right bw-cue-hud-right" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-timer bw-cue-hud-timer" }, formatSec(d1RemainingSec)), /* @__PURE__ */ React.createElement("span", { className: "cue-hud-bar-pill bw-cue-hud-bar-pill" }, "BAR ", d1RemainingBars))
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: `cue-hud bw-cue-hud d2-hud select-none ${d2IsAlert ? "is-impact" : ""}`,
          role: "status",
          "aria-live": "assertive"
        },
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-ico bw-cue-hud-ico" }, d2IsAlert ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M7 18v-6a5 5 0 1 1 10 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M5 21h14" }), /* @__PURE__ */ React.createElement("path", { d: "M12 2v2" }), /* @__PURE__ */ React.createElement("path", { d: "M4.93 4.93l1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M19.07 4.93l-1.41 1.41" }), /* @__PURE__ */ React.createElement("path", { d: "M2 12h2" }), /* @__PURE__ */ React.createElement("path", { d: "M20 12h2" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24" }, /* @__PURE__ */ React.createElement("path", { d: "M3 18v-6a9 9 0 0 1 18 0v6" }), /* @__PURE__ */ React.createElement("path", { d: "M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" }), /* @__PURE__ */ React.createElement("path", { d: "M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" }))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-body bw-cue-hud-body" }, /* @__PURE__ */ React.createElement("div", { className: "cue-hud-kicker bw-cue-hud-kicker" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-dot bw-cue-hud-dot", style: { backgroundColor: "#818CF8", boxShadow: "0 0 7px #818CF8" } }), /* @__PURE__ */ React.createElement("span", { className: "text-[#38BDF8] font-black mr-1" }, "DK 2"), /* @__PURE__ */ React.createElement("span", null, d2IsAlert ? d2RemainingSec === 0 ? "\xA1IMPACTO AHORA! SOLTAR PISTA" : "\xA1ATENCI\xD3N! QUEDAN < 5 SEGUNDOS" : d2IsPlaying ? `EN PLAY \xB7 PROXIMO: ${(d2NextHito == null ? void 0 : d2NextHito.label) || "HITO"}` : "EN CUE (PREPARADO)")), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-text bw-cue-hud-text truncate" }, d2IsAlert ? `PRIMER GOLPE (${(d2NextHito == null ? void 0 : d2NextHito.label) || "INTRO"})` : d2IsPlaying ? `Transici\xF3n a ${(d2NextHito == null ? void 0 : d2NextHito.label) || "Hito"} en ${d2RemainingBars} compases` : "Listo para soltar en primer bombo"), /* @__PURE__ */ React.createElement("div", { className: "cue-hud-progress bw-cue-hud-progress" }, /* @__PURE__ */ React.createElement(
          "div",
          {
            className: "cue-hud-progress-fill bw-cue-hud-progress-fill",
            style: { width: `${d2ProgressPct}%` }
          }
        ))),
        /* @__PURE__ */ React.createElement("div", { className: "cue-hud-right bw-cue-hud-right" }, /* @__PURE__ */ React.createElement("span", { className: "cue-hud-timer bw-cue-hud-timer" }, formatSec(d2RemainingSec)), /* @__PURE__ */ React.createElement("span", { className: "cue-hud-bar-pill bw-cue-hud-bar-pill" }, "BAR ", d2RemainingBars))
      )),
      /* @__PURE__ */ React.createElement("div", { className: "mx-body bw-mx-body select-none" }, /* @__PURE__ */ React.createElement("div", { className: "deck-pane d1-pane bw-deck-pane bw-d1-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dp-head bw-dp-head" }, /* @__PURE__ */ React.createElement("span", { className: "dp-title bw-dp-title" }, "DK 1"), /* @__PURE__ */ React.createElement("span", { className: "dp-rem bw-dp-rem" }, (deck1 == null ? void 0 : deck1.duration) || "-03:14")), /* @__PURE__ */ React.createElement("div", { className: "hito-banner bw-hito-banner" }, /* @__PURE__ */ React.createElement("div", { className: "hb-bars bw-hb-bars" }, d1RemainingBars, " BARS \xB7 ", formatSec(d1RemainingSec)), /* @__PURE__ */ React.createElement("div", { className: "hb-name bw-hb-name" }, "NEXT: ", (d1NextHito == null ? void 0 : d1NextHito.label) || "BASSLINE IN"), /* @__PURE__ */ React.createElement("div", { className: "hb-bar bw-hb-bar" }, /* @__PURE__ */ React.createElement("div", { className: "hb-fill bw-hb-fill", style: { width: `${d1ProgressPct}%` } }))), /* @__PURE__ */ React.createElement("div", { className: "cue-list bw-cue-list", id: "main-d1-list" }, hitosD1.map((h, idx) => {
        const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
        const isActive = d1ActiveHito === idx;
        const isNext = !isActive && idx === 1;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: h.id || idx,
            type: "button",
            onClick: () => setD1ActiveHito(idx),
            className: `cue-btn bw-cue-btn ${isActive ? "is-active" : isNext ? "is-next" : ""}`,
            title: `Hito DK1: ${h.label} (${h.time})`
          },
          /* @__PURE__ */ React.createElement("span", { className: "c-ico bw-c-ico" }, /* @__PURE__ */ React.createElement(IconComponent, null)),
          /* @__PURE__ */ React.createElement("span", { className: "c-lbl bw-c-lbl" }, h.label),
          /* @__PURE__ */ React.createElement("span", { className: "c-time bw-c-time" }, h.time),
          /* @__PURE__ */ React.createElement("span", { className: "c-led bw-c-led" })
        );
      }))), /* @__PURE__ */ React.createElement("div", { className: "hardware-mixer bw-hardware-mixer" }, /* @__PURE__ */ React.createElement("div", { className: "hm-col-headers bw-hm-col-headers" }, /* @__PURE__ */ React.createElement("span", { className: "ch-tag ch1 bw-ch-tag ch1" }, "CH1"), /* @__PURE__ */ React.createElement("span", { className: "ch-mid bw-ch-mid" }, "EQ"), /* @__PURE__ */ React.createElement("span", { className: "ch-tag ch2 bw-ch-tag ch2" }, "CH2")), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Gain, color: "#00F0FF", label: "CH1 Gain" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "GAIN"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Gain, color: "#38BDF8", label: "CH2 Gain" }))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Hi, color: "#00F0FF", label: "CH1 High" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "TREBLE"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Hi, color: "#38BDF8", label: "CH2 High" }))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Mid, color: "#00F0FF", label: "CH1 Mid" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "MID"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Mid, color: "#38BDF8", label: "CH2 Mid" }))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Low, color: "#00F0FF", label: "CH1 Low" })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl bw-knob-lbl" }, "BASS"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(
        HardwareKnob,
        {
          value: ch2Low,
          color: isCriticalAlert ? "#FF2A54" : "#38BDF8",
          label: "CH2 Low"
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "knob-row bw-knob-row" }, /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch1Fltr, color: "#38BDF8", label: "CH1 Filter", isFilter: true })), /* @__PURE__ */ React.createElement("div", { className: "knob-lbl fltr bw-knob-lbl fltr" }, "FILTER"), /* @__PURE__ */ React.createElement("div", { className: "knob-cell bw-knob-cell" }, /* @__PURE__ */ React.createElement(HardwareKnob, { value: ch2Fltr, color: "#38BDF8", label: "CH2 Filter", isFilter: true }))), /* @__PURE__ */ React.createElement("div", { className: "pfl-row bw-pfl-row" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: `pfl-btn bw-pfl-btn ${pflState.ch1 ? "is-on" : ""}`,
          onClick: () => setPflState((p) => ({ ...p, ch1: !p.ch1 }))
        },
        "CUE 1"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: `pfl-btn bw-pfl-btn ${pflState.ch2 ? "is-on" : ""}`,
          onClick: () => setPflState((p) => ({ ...p, ch2: !p.ch2 }))
        },
        "CUE 2"
      )), /* @__PURE__ */ React.createElement("div", { className: "faders-deck bw-faders-deck" }, /* @__PURE__ */ React.createElement("div", { className: "fader-unit bw-fader-unit" }, /* @__PURE__ */ React.createElement("div", { className: "fader-slot bw-fader-slot" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "fader-cap bw-fader-cap",
          style: { top: `${Math.round((1 - ch1Fader) * 80)}%` }
        },
        /* @__PURE__ */ React.createElement("span", { className: "cap-line bw-cap-line" })
      ))), /* @__PURE__ */ React.createElement("div", { className: "vu-bridge bw-vu-bridge" }, /* @__PURE__ */ React.createElement("div", { className: "vu-col bw-vu-col" }, Array.from({ length: 10 }, (_, i) => {
        const levelFromBottom = 10 - i;
        const isLit = levelFromBottom <= ch1VuLeds;
        const colorCls = !isLit ? "" : i < 3 ? "on-amber bw-vu-led on-amber" : "on-cyan bw-vu-led on-cyan";
        return /* @__PURE__ */ React.createElement("span", { key: i, className: `vu-led bw-vu-led ${colorCls}` });
      })), /* @__PURE__ */ React.createElement("div", { className: "vu-col bw-vu-col" }, Array.from({ length: 10 }, (_, i) => {
        const levelFromBottom = 10 - i;
        const isLit = levelFromBottom <= ch2VuLeds;
        const colorCls = !isLit ? "" : i < 3 ? "on-amber bw-vu-led on-amber" : "on-cyan bw-vu-led on-cyan";
        return /* @__PURE__ */ React.createElement("span", { key: i, className: `vu-led bw-vu-led ${colorCls}` });
      }))), /* @__PURE__ */ React.createElement("div", { className: "fader-unit bw-fader-unit" }, /* @__PURE__ */ React.createElement("div", { className: "fader-slot bw-fader-slot" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "fader-cap ch2-cap bw-fader-cap bw-ch2-cap",
          style: { top: `${Math.round((1 - ch2Fader) * 80)}%` }
        },
        /* @__PURE__ */ React.createElement("span", { className: "cap-line bw-cap-line" })
      )))), /* @__PURE__ */ React.createElement("div", { className: "xfader-box bw-xfader-box" }, /* @__PURE__ */ React.createElement("div", { className: "xf-slot bw-xf-slot" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "xf-thumb bw-xf-thumb",
          style: { left: `calc(${Math.round(crossfader * 100)}% - 5px)` }
        }
      )))), /* @__PURE__ */ React.createElement("div", { className: "deck-pane d2-pane bw-deck-pane bw-d2-pane" }, /* @__PURE__ */ React.createElement("div", { className: "dp-head bw-dp-head" }, /* @__PURE__ */ React.createElement("span", { className: "dp-title bw-dp-title" }, "DK 2"), /* @__PURE__ */ React.createElement("span", { className: "dp-rem bw-dp-rem" }, (deck2 == null ? void 0 : deck2.duration) || "-02:41")), /* @__PURE__ */ React.createElement("div", { className: `hito-banner bw-hito-banner ${d2IsAlert ? "alert-mode" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "hb-bars bw-hb-bars" }, d2IsAlert ? `2 BARS \xB7 ${formatSec(d2RemainingSec)}` : `${d2RemainingBars} BARS \xB7 ${formatSec(d2RemainingSec)}`), /* @__PURE__ */ React.createElement("div", { className: "hb-name bw-hb-name" }, d2IsAlert ? `INMINENTE: ${(d2NextHito == null ? void 0 : d2NextHito.label) || "MAIN DROP"}` : `NEXT: ${(d2NextHito == null ? void 0 : d2NextHito.label) || "MAIN DROP"}`), /* @__PURE__ */ React.createElement("div", { className: "hb-bar bw-hb-bar" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "hb-fill bw-hb-fill",
          style: { width: `${d2ProgressPct}%` }
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "cue-list bw-cue-list", id: "main-d2-list" }, hitosD2.map((h, idx) => {
        const IconComponent = HitoIcons[h.key] || HitoIcons.intro;
        const isActive = d2ActiveHito === idx;
        const isAlert = isCriticalAlert && idx === 3;
        const isNext = !isActive && !isAlert && idx === 3;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: h.id || idx,
            type: "button",
            onClick: () => setD2ActiveHito(idx),
            className: `cue-btn bw-cue-btn ${isAlert ? "is-alert" : isActive ? "is-active" : isNext ? "is-next" : ""}`,
            title: `Hito DK2: ${h.label} (${h.time})`
          },
          /* @__PURE__ */ React.createElement("span", { className: "c-ico bw-c-ico" }, /* @__PURE__ */ React.createElement(IconComponent, null)),
          /* @__PURE__ */ React.createElement("span", { className: "c-lbl bw-c-lbl" }, h.label),
          /* @__PURE__ */ React.createElement("span", { className: "c-time bw-c-time" }, h.time),
          /* @__PURE__ */ React.createElement("span", { className: "c-led bw-c-led" })
        );
      }))))
    );
  });

  // web/js/shell/workspace-ui.jsx
  var { useState: useState5, useEffect: useEffect7, useRef: useRef7 } = React;

  // web/js/workspaces/CopilotWorkspace.jsx
  var { useState: useState6, useEffect: useEffect8, useRef: useRef8, useMemo: useMemo4, useCallback: useCallback4 } = React;
  var MASTER_TRACKS_POOL = [
    {
      id: "rec_1",
      title: "Higher (Original Mix)",
      artist: "Amelie Lens",
      bpm: 138,
      camelot: "10A",
      raw_key: "Bm",
      role: "Percussive Tool",
      lufs: -6.5,
      low_ratio: 36,
      genre: "Acid / Peak Techno",
      subgenre: "Lenske Peak",
      energy: 94,
      danceability: 89,
      arousal: 92,
      mood: "Acid Drive",
      format: "FLAC 24-bit",
      duration: "06:12",
      year: "2023",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
      strategy: "Mezcla Arm\xF3nica Segura",
      reason: "Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.",
      camelot_color: "#f472b6"
    },
    {
      id: "rec_2",
      title: "Your Mind (Extended Club)",
      artist: "Adam Beyer & Bart Skils",
      bpm: 138.5,
      camelot: "11A",
      raw_key: "F#m",
      role: "Peak Time Driver",
      lufs: -5.9,
      low_ratio: 49,
      genre: "Drumcode Techno",
      subgenre: "Drumcode Peak",
      energy: 96,
      danceability: 92,
      arousal: 95,
      mood: "Peak Time Climax",
      format: "FLAC Hi-Res",
      duration: "07:22",
      year: "2022",
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
      strategy: "Subid\xF3n de Energ\xEDa (+1)",
      reason: "Aumento arm\xF3nico a 11A con +1.0 BPM. Eleva la intensidad del club para el cl\xEDmax.",
      camelot_color: "#fb7185"
    },
    {
      id: "rec_3",
      title: "Old School",
      artist: "Hertz",
      bpm: 138,
      camelot: "10A",
      raw_key: "Bm",
      role: "Industrial Driver",
      lufs: -6.2,
      low_ratio: 38,
      genre: "Hard Techno Industrial",
      subgenre: "Sway Records",
      energy: 93,
      danceability: 91,
      arousal: 90,
      mood: "Raw Industrial",
      format: "FLAC 24-bit",
      duration: "05:12",
      year: "2024",
      cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
      strategy: "Groove Industrial Limpio",
      reason: "Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transici\xF3n directa perfecta.",
      camelot_color: "#f472b6"
    },
    {
      id: "rec_4",
      title: "Booster (Gary Beck Remix)",
      artist: "Planetary Assault Systems",
      bpm: 137.5,
      camelot: "10A",
      raw_key: "Bm",
      role: "Percussive Descongestor",
      lufs: -7.1,
      low_ratio: 32,
      genre: "Hypnotic / Raw",
      subgenre: "Mote-Evolver",
      energy: 88,
      danceability: 86,
      arousal: 85,
      mood: "Hypnotic Groove",
      format: "WAV 24-bit",
      duration: "05:48",
      year: "2021",
      cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
      strategy: "Descongesti\xF3n de Sala",
      reason: "Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.",
      camelot_color: "#f472b6"
    },
    {
      id: "rec_5",
      title: "Subversion",
      artist: "Enrico Sangiuliano",
      bpm: 138,
      camelot: "11A",
      raw_key: "F#m",
      role: "Cosmic Climax",
      lufs: -6,
      low_ratio: 44,
      genre: "Peak Time Techno",
      subgenre: "NINETOZERO",
      energy: 95,
      danceability: 90,
      arousal: 94,
      mood: "Cosmic Meltdown",
      format: "FLAC Hi-Res",
      duration: "06:48",
      year: "2023",
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
      strategy: "Ascensi\xF3n Hipn\xF3tica",
      reason: "Sintetizadores espaciales que abren el panorama est\xE9reo antes de cortar los bajos.",
      camelot_color: "#fb7185"
    },
    {
      id: "rec_6",
      title: "Rave Generation",
      artist: "Reinier Zonneveld",
      bpm: 139,
      camelot: "11A",
      raw_key: "F#m",
      role: "Acid Meltdown",
      lufs: -5.5,
      low_ratio: 46,
      genre: "Acid Techno",
      subgenre: "Filth on Acid",
      energy: 98,
      danceability: 94,
      arousal: 98,
      mood: "High Energy Climax",
      format: "WAV 24-bit",
      duration: "06:15",
      year: "2024",
      cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
      strategy: "Explosi\xF3n Peak Time",
      reason: "Energ\xEDa m\xE1xima para cerrar el set. Requiere swap r\xE1pido de EQ Low en drop.",
      camelot_color: "#fb7185"
    },
    {
      id: "rec_7",
      title: "Age of Love (Charlotte de Witte Remix)",
      artist: "Age of Love",
      bpm: 138,
      camelot: "9A",
      raw_key: "Em",
      role: "Peak Acid Driver",
      lufs: -5.8,
      low_ratio: 41,
      genre: "Peak Techno",
      subgenre: "Diki Records",
      energy: 96,
      danceability: 92,
      arousal: 95,
      mood: "Euphoric Peak",
      format: "FLAC 24-bit",
      duration: "07:30",
      year: "2021",
      cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop",
      strategy: "Descenso Arm\xF3nico Suave (-1)",
      reason: "Transici\xF3n diagonal suave a 9A, manteniendo la tensi\xF3n alta en el p\xFAblico.",
      camelot_color: "#818cf8"
    },
    {
      id: "rec_8",
      title: "Consciousness",
      artist: "Anyma & Chris Avantgarde",
      bpm: 130,
      camelot: "8A",
      raw_key: "Am",
      role: "Melodic Journey",
      lufs: -6.4,
      low_ratio: 35,
      genre: "Melodic Techno",
      subgenre: "Afterlife",
      energy: 90,
      danceability: 88,
      arousal: 89,
      mood: "Atmospheric Meltdown",
      format: "FLAC Hi-Res",
      duration: "05:48",
      year: "2022",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
      strategy: "Cruce Mel\xF3dico Espacioso",
      reason: "Ideal para bajar de BPM o abrir el viaje mel\xF3dico con graves limpios.",
      camelot_color: "#c084fc"
    }
  ];
  var DEFAULT_COPILOT_STATE = {
    "connected": true,
    "source": "SERATO_LIVE",
    "platform": "serato",
    "platform_mode": "serato",
    "platform_name": "Serato DJ Pro",
    "platform_icon": "\u26A1",
    "platform_color": "#00d1e8",
    "platform_status": "LIVE",
    "detected_platforms": {
      "serato": true,
      "rekordbox": true,
      "virtualdj": true,
      "traktor": false
    },
    "deck_1": {
      "deck_num": "1",
      "status": "STANDBY (VAC\xCDO)",
      "is_master": false,
      "is_playing": false,
      "artist": "Deck Vac\xEDo",
      "title": "",
      "bpm": 0,
      "camelot": "--",
      "camelot_color": "#27272a",
      "raw_key": "",
      "file_path": "",
      "genre": "",
      "subgenre": "",
      "energy": 0,
      "danceability": 0,
      "valence": 0,
      "arousal": 0,
      "format": "",
      "duration": "--:--",
      "duration_sec": 0,
      "elapsed_sec": 0,
      "play_progress": 0,
      "phase": "Standby",
      "year": "",
      "cover": "",
      "cues": [],
      "structural_phases": [],
      "lufs": -99,
      "low_ratio": 0,
      "mid_ratio": 0,
      "high_ratio": 0,
      "acoustic_role": "Standby",
      "is_audited": false,
      "comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "tactical_comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "mood": "Standby"
    },
    "deck_2": {
      "deck_num": "2",
      "status": "STANDBY (VAC\xCDO)",
      "is_master": false,
      "is_playing": false,
      "artist": "Deck Vac\xEDo",
      "title": "",
      "bpm": 0,
      "camelot": "--",
      "camelot_color": "#27272a",
      "raw_key": "",
      "file_path": "",
      "genre": "",
      "subgenre": "",
      "energy": 0,
      "danceability": 0,
      "valence": 0,
      "arousal": 0,
      "format": "",
      "duration": "",
      "duration_sec": 0,
      "elapsed_sec": 0,
      "play_progress": 0,
      "phase": "Standby",
      "year": "",
      "cover": "",
      "cues": [],
      "structural_phases": [],
      "lufs": -99,
      "low_ratio": 0,
      "mid_ratio": 0,
      "high_ratio": 0,
      "acoustic_role": "",
      "is_audited": false,
      "comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "tactical_comment": "Deck vac\xEDo \u2022 Sin pista cargada en Serato ni en la mesa",
      "mood": "Standby"
    },
    "anti_muddy": {
      "status": "safe",
      "tag": "CLEAN MIX",
      "title": "MEZCLA LIMPIA",
      "message": "Deck 2 sin pista cargada. Cero riesgo de cancelaci\xF3n ac\xFAstica. Carga la siguiente pista en Serato o la mesa.",
      "action": "Frecuencias equilibradas",
      "controller_knobs": {
        "filter_knob": "Centrado (12h)",
        "eq_low": "0 dB"
      }
    },
    "harmonic": {
      "score": 100,
      "type": "STANDBY",
      "label": "Deck 2 en Espera",
      "badge": "STANDBY",
      "color": "#10b981",
      "is_clash": false,
      "advice": "Deck 2 preparado. Carga una pista arm\xF3nicamente compatible en Serato o la mesa."
    },
    "lufs_delta": -0.8,
    "bpm_delta": -0.37,
    "bpm_pct": -0.28,
    "recommendations": [
      {
        "id": "rec_1",
        "title": "Higher (Original Mix)",
        "artist": "Amelie Lens",
        "bpm": 130,
        "camelot": "10A",
        "role": "Percussive Tool",
        "lufs": -6.5,
        "low_ratio": 36,
        "genre": "Acid / Peak Techno",
        "subgenre": "Lenske Peak",
        "energy": 94,
        "danceability": 89,
        "mood": "Acid Drive",
        "format": "FLAC 24-bit",
        "duration": "06:12",
        "year": "2023",
        "cover": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
        "strategy": "Mezcla Arm\xF3nica Segura",
        "reason": "Mismo tono (10A) y espectro percusivo limpio. Cero riesgo de embarre en graves.",
        "camelot_color": "#f472b6"
      },
      {
        "id": "rec_2",
        "title": "Your Mind (Extended Club)",
        "artist": "Adam Beyer & Bart Skils",
        "bpm": 131,
        "camelot": "11A",
        "role": "Peak Time Driver",
        "lufs": -5.9,
        "low_ratio": 49,
        "genre": "Drumcode Techno",
        "subgenre": "Drumcode Peak",
        "energy": 96,
        "danceability": 92,
        "mood": "Peak Time Climax",
        "format": "FLAC Hi-Res",
        "duration": "07:22",
        "year": "2022",
        "cover": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop",
        "strategy": "Subid\xF3n de Energ\xEDa (+1)",
        "reason": "Aumento arm\xF3nico a 11A con +1.0 BPM. Eleva la intensidad del club para el cl\xEDmax.",
        "camelot_color": "#fb7185"
      },
      {
        "id": "rec_3",
        "title": "Old School",
        "artist": "Hertz",
        "bpm": 130,
        "camelot": "10A",
        "role": "Industrial Driver",
        "lufs": -6.2,
        "low_ratio": 38,
        "genre": "Hard Techno Industrial",
        "subgenre": "Sway Records",
        "energy": 93,
        "danceability": 91,
        "mood": "Raw Industrial",
        "format": "FLAC 24-bit",
        "duration": "05:12",
        "year": "2024",
        "cover": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop",
        "strategy": "Groove Industrial Limpio",
        "reason": "Mismo Camelot (10A), pegada seca sin saturar sub-graves. Transici\xF3n directa perfecta.",
        "camelot_color": "#f472b6"
      },
      {
        "id": "rec_4",
        "title": "Booster (Gary Beck Remix)",
        "artist": "Planetary Assault Systems",
        "bpm": 129.5,
        "camelot": "10A",
        "role": "Percussive Descongestor",
        "lufs": -7.1,
        "low_ratio": 32,
        "genre": "Hypnotic / Raw",
        "subgenre": "Mote-Evolver",
        "energy": 88,
        "danceability": 86,
        "mood": "Hypnotic Groove",
        "format": "WAV 24-bit",
        "duration": "05:48",
        "year": "2021",
        "cover": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop",
        "strategy": "Descongesti\xF3n de Sala",
        "reason": "Textura enfocada en medios y agudos. Ideal para limpiar la sala tras un drop saturado.",
        "camelot_color": "#f472b6"
      },
      {
        "id": "rec_5",
        "title": "Subversion",
        "artist": "Enrico Sangiuliano",
        "bpm": 130.5,
        "camelot": "11A",
        "role": "Cosmic Climax",
        "lufs": -6,
        "low_ratio": 44,
        "genre": "Peak Time Techno",
        "subgenre": "NINETOZERO",
        "energy": 95,
        "danceability": 90,
        "mood": "Cosmic Meltdown",
        "format": "FLAC Hi-Res",
        "duration": "06:48",
        "year": "2023",
        "cover": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
        "strategy": "Ascensi\xF3n Hipn\xF3tica",
        "reason": "Sintetizadores espaciales que abren el panorama est\xE9reo antes de cortar los bajos.",
        "camelot_color": "#fb7185"
      },
      {
        "id": "rec_6",
        "title": "Rave Generation",
        "artist": "Reinier Zonneveld",
        "bpm": 132,
        "camelot": "11A",
        "role": "Acid Meltdown",
        "lufs": -5.5,
        "low_ratio": 46,
        "genre": "Acid Techno",
        "subgenre": "Filth on Acid",
        "energy": 98,
        "danceability": 94,
        "mood": "High Energy Climax",
        "format": "WAV 24-bit",
        "duration": "06:15",
        "year": "2024",
        "cover": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop",
        "strategy": "Explosi\xF3n Peak Time",
        "reason": "Energ\xEDa m\xE1xima para cerrar el set. Requiere swap r\xE1pido de EQ Low en drop.",
        "camelot_color": "#fb7185"
      }
    ],
    "local_ip": "192.168.1.151",
    "timestamp": 1794309847254317e-6,
    "last_updated": "12:24:07",
    "is_simulating": true
  };
  var DEFAULT_CABINA_HOT_CUES = [
    { id: 1, time: "00:00.01", color: "#EF4444" },
    { id: 2, time: "00:28.25", color: "#F97316" },
    { id: 3, time: "00:56.48", color: "#FBBF24" },
    { id: 4, time: "01:24.72", color: "#10B981" },
    { id: 5, time: "01:52.95", color: "#00F0FF" },
    { id: 6, time: "02:21.19", color: "#A855F7" },
    { id: 7, time: "02:49.42", color: "#EC4899" },
    { id: 8, time: "03:17.65", color: "#3B82F6" }
  ];
  var CopilotDeckCard = ({ deck, side, isMaster, antiMuddy = null, partnerDeck = null, onSetMaster = null, onTogglePlay = null, isAppOpen = true, isCompact = false }) => {
    if (!deck) return null;
    const cabinaHotCues = useMemo4(() => {
      if ((deck == null ? void 0 : deck.cues) && deck.cues.length > 0) {
        return deck.cues.slice(0, 8).map((c, i) => {
          var _a, _b;
          return {
            id: c.id || i + 1,
            time: c.time || ((_a = DEFAULT_CABINA_HOT_CUES[i]) == null ? void 0 : _a.time) || "00:00.00",
            color: c.color || ((_b = DEFAULT_CABINA_HOT_CUES[i]) == null ? void 0 : _b.color) || "#00F0FF"
          };
        });
      }
      return DEFAULT_CABINA_HOT_CUES;
    }, [deck == null ? void 0 : deck.cues]);
    if (!isAppOpen) {
      return /* @__PURE__ */ React.createElement("div", { className: `rounded-3xl border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse relative overflow-hidden flex flex-col justify-between bg-[#06060c] transition-all ${isCompact ? "p-2.5 sm:p-3" : "p-3.5 sm:p-4"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-sm sm:text-base text-zinc-500" }, "DECK ", side), /* @__PURE__ */ React.createElement("span", { className: "px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider bg-red-950/60 border border-red-500/40 text-red-300" }, "STANDBY \u2022 SIN CONEXI\xD3N")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-mono text-[11px] text-zinc-600 uppercase" }, /* @__PURE__ */ React.createElement("span", null, "STANDBY SKIN"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mb-2.5 p-2.5 rounded-2xl bg-black/40 border border-zinc-800/60 items-stretch opacity-60" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-stretch gap-3 min-w-0" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "relative rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950 flex items-center justify-center",
          style: { width: "68px", height: "68px", minWidth: "68px", minHeight: "68px", aspectRatio: "1 / 1" }
        },
        /* @__PURE__ */ React.createElement("img", { src: DEFAULT_VINYL_SVG, alt: "Sin pista", className: "w-10 h-10 opacity-30" }),
        /* @__PURE__ */ React.createElement("span", { className: "absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-[8px] font-mono text-zinc-500" }, "--:--")
      ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1 flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-bold text-xs sm:text-sm text-zinc-400 tracking-tight leading-tight truncate" }, "-- Esperando Pista --"), /* @__PURE__ */ React.createElement("p", { className: "font-syne font-medium text-xs text-zinc-600 mt-0.5 truncate" }, "Conecta Serato, Rekordbox, Traktor o VirtualDJ"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-600" }, "-- G\xC9NERO --")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t md:border-t-0 md:border-l border-zinc-800/60 pt-2 md:pt-0 md:pl-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1 p-1 rounded-xl bg-zinc-950/90 border border-zinc-800 shrink-0 min-w-[100px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/60 text-zinc-600" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-4 rounded text-[9px] font-orbitron font-black bg-zinc-800 text-zinc-500 flex items-center justify-center" }, "--"), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono uppercase font-bold" }, "TONO"), /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-[10px]" }, "--")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg bg-zinc-900/60 text-zinc-600" }, /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono uppercase font-bold" }, "TEMPO"), /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-[10px]" }, "--.--"), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono" }, "BPM")), /* @__PURE__ */ React.createElement("div", { className: "px-1.5 py-0.5 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-[8px] font-mono text-zinc-600 text-center" }, "STANDBY")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-[130px] flex flex-col justify-center gap-1 opacity-40" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[8px] font-mono mb-0.5 text-zinc-500" }, /* @__PURE__ */ React.createElement("span", null, "ENERG\xCDA"), /* @__PURE__ */ React.createElement("span", null, "0%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[8px] font-mono mb-0.5 text-zinc-500" }, /* @__PURE__ */ React.createElement("span", null, "INTENSIDAD"), /* @__PURE__ */ React.createElement("span", null, "0%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[8px] font-mono mb-0.5 text-zinc-500" }, /* @__PURE__ */ React.createElement("span", null, "DANZABILIDAD"), /* @__PURE__ */ React.createElement("span", null, "0%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[8px] font-mono mb-0.5 text-zinc-500" }, /* @__PURE__ */ React.createElement("span", null, "POSITIVIDAD"), /* @__PURE__ */ React.createElement("span", null, "0%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1" }))))), /* @__PURE__ */ React.createElement("div", { className: "mb-2.5 p-2 rounded-2xl bg-black/60 border border-zinc-800/60 opacity-50" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-mono uppercase text-zinc-500 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-zinc-600" }), " 8 HOT CUES DE CABINA"), /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-mono text-zinc-600" }, "En espera de enlace")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-4 sm:grid-cols-8 gap-1" }, [1, 2, 3, 4, 5, 6, 7, 8].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "p-1 rounded-xl border border-zinc-800/60 bg-zinc-950/60 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-mono text-zinc-500 bg-zinc-900" }, i), /* @__PURE__ */ React.createElement("span", { className: "text-[7px] font-mono text-zinc-600" }, "--:--")), /* @__PURE__ */ React.createElement("div", { className: "text-[7px] font-syne text-zinc-600 truncate mt-0.5" }, "Cue ", i))))), /* @__PURE__ */ React.createElement("div", { className: "mb-2 h-16 rounded-2xl bg-black/70 border border-dashed border-red-500/40 flex flex-col items-center justify-center gap-1 p-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-[10px] text-red-400/90 uppercase tracking-wider flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" }), "STANDBY \u2022 ESPERANDO SE\xD1AL DE AUDIO DE CABINA"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[9px] text-zinc-600" }, "Puntos de cuantizaci\xF3n y forma de onda en espera")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1 pt-1.5 border-t border-zinc-800/60 font-mono text-[11px] text-zinc-600" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", null, "Densidad Sub-Graves (Sub-Bass)"), /* @__PURE__ */ React.createElement("span", null, "0%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1.5" })), /* @__PURE__ */ React.createElement("div", { className: "mt-2 p-2 rounded-xl bg-black/40 border border-zinc-800/60 flex items-start gap-2" }, /* @__PURE__ */ React.createElement(Icons.MessageSquare, { size: 13, className: "inline-block text-zinc-600 shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("div", { className: "text-zinc-600 font-mono text-[11px] truncate" }, "Esperando enlace de software DJ y controladora para telemetr\xEDa en tiempo real.")));
    }
    const isEmptyDeck = !deck.title || !deck.bpm || Number(deck.bpm) <= 0 || deck.status === "STANDBY (VAC\xCDO)";
    return /* @__PURE__ */ React.createElement("div", { className: `rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${isCompact ? "p-2.5 sm:p-3" : "p-3.5 sm:p-4"} ${isMaster ? "bg-gradient-to-b from-[#0c0d1c] to-[#06060c] border-djcyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.2)]" : "bg-[#07070f] border-zinc-800 hover:border-zinc-700"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-zinc-800/70 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-700/80 bg-zinc-950 flex items-center justify-center shadow-md" }, deck.cover && !isEmptyDeck ? /* @__PURE__ */ React.createElement(
      "img",
      {
        src: getValidCover(deck.cover),
        alt: "Cover",
        className: "w-full h-full object-cover",
        onError: (e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_VINYL_SVG;
        }
      }
    ) : /* @__PURE__ */ React.createElement("img", { src: DEFAULT_VINYL_SVG, alt: "Sin pista", className: "w-7 h-7 opacity-40" })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1 flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-sm text-white leading-tight truncate", title: deck.title || "Track" }, deck.title || (isEmptyDeck ? "-- Esperando Pista --" : "Whip")), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[11px] text-zinc-400 leading-tight truncate mt-0.5", title: deck.artist || "Artista" }, deck.artist || (isEmptyDeck ? "Conecta Serato o mesa" : "Mark Broom")), !isEmptyDeck && deck.genre && /* @__PURE__ */ React.createElement("div", { className: "mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "inline-block px-1.5 py-0.2 rounded bg-zinc-900/90 border border-zinc-800 text-[9px] font-mono text-zinc-400 truncate max-w-[140px]" }, deck.genre)))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-end justify-between gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-base text-white tracking-tight" }, deck.bpm ? Number(deck.bpm).toFixed(2) : isEmptyDeck ? "--.--" : "136.00"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-[9px] text-zinc-500 uppercase" }, "BPM")), /* @__PURE__ */ React.createElement("span", { className: "px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 font-mono text-[9px] font-bold text-zinc-300 uppercase" }, deck.format || "FLAC"), /* @__PURE__ */ React.createElement("span", { className: "font-orbitron font-black text-sm text-white tracking-wider" }, "DECK ", side), isEmptyDeck && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full font-mono text-[8px] font-bold uppercase bg-zinc-900 border border-zinc-800 text-zinc-500" }, "STANDBY")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 font-mono text-[10px] font-bold" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-0.5 text-amber-400", title: "Energ\xEDa" }, /* @__PURE__ */ React.createElement(Icons.Zap, { size: 10 }), " ", isEmptyDeck ? 0 : deck.energy || 90, "%"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-0.5 text-emerald-400", title: "Groove / Intensidad" }, /* @__PURE__ */ React.createElement(Icons.Activity, { size: 10 }), " ", isEmptyDeck ? 0 : deck.groove || 86, "%"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-0.5 text-purple-400", title: "Danzabilidad" }, /* @__PURE__ */ React.createElement(Icons.Sliders, { size: 10 }), " ", isEmptyDeck ? 0 : deck.danceability || 85, "%"), /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-0.5 text-cyan-400", title: "Positividad / Brillo" }, /* @__PURE__ */ React.createElement(Icons.Sparkles, { size: 10 }), " ", isEmptyDeck ? 0 : deck.valence != null ? deck.valence : side === "1" || side === "A" ? 55 : 62, "%")), /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "px-2 py-0.5 rounded-md font-orbitron font-black text-[11px] text-black shadow-sm",
        style: { backgroundColor: deck.camelot_color || "#10b981" }
      },
      deck.camelot || deck.raw_key || (side === "1" || side === "A" ? "6A" : "8A")
    )))), /* @__PURE__ */ React.createElement("div", { className: "dk-hotcues-box select-none !flex !flex-wrap !items-center !gap-1.5 !py-1.5 !px-2" }, /* @__PURE__ */ React.createElement("div", { className: "dk-hc-lbl !mb-0 !mr-1 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "dk-hc-dot" }), /* @__PURE__ */ React.createElement("span", null, "8 HOT CUES DE CABINA")), cabinaHotCues.map((cue, idx) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: cue.id || idx,
        className: "hc-chip shrink-0",
        style: { borderColor: cue.color || "#00F0FF" }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: "hc-badge",
          style: { backgroundColor: cue.color || "#00F0FF" }
        },
        cue.id || idx + 1
      ),
      /* @__PURE__ */ React.createElement("span", null, cue.time)
    ))), /* @__PURE__ */ React.createElement("div", { className: "mb-2" }, /* @__PURE__ */ React.createElement(
      CopilotSeratoWaveform,
      {
        deck,
        side,
        antiMuddy,
        partnerDeck,
        isCompact
      }
    )), (() => {
      const rawLow = deck.low_ratio != null ? Number(deck.low_ratio) : deck.low_energy_level != null ? Number(deck.low_energy_level) * 100 : 0;
      const lowPct = isEmptyDeck ? 0 : Math.round(Math.max(0, Math.min(100, rawLow)));
      const rawMid = deck.mid_ratio != null ? Number(deck.mid_ratio) : (100 - lowPct) * 0.62;
      const midPct = isEmptyDeck ? 0 : Math.round(Math.max(0, Math.min(100 - lowPct, rawMid)));
      const rawHigh = deck.high_ratio != null ? Number(deck.high_ratio) : Math.max(0, 100 - lowPct - midPct);
      const highPct = isEmptyDeck ? 0 : Math.round(Math.max(0, rawHigh));
      const total = Math.max(1, lowPct + midPct + highPct);
      const lufsRaw = deck.lufs != null ? deck.lufs : deck.lufs_short_term;
      const lufsTxt = !isEmptyDeck && lufsRaw != null && Number(lufsRaw) > -90 ? `${Number(lufsRaw).toFixed(1)} dB` : "-- dB";
      return /* @__PURE__ */ React.createElement("div", { className: "space-y-1 pt-1.5 border-t border-zinc-800/60 font-mono text-[11px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-zinc-400" }, /* @__PURE__ */ React.createElement("span", null, "Densidad Sub-Graves (Sub-Bass)"), /* @__PURE__ */ React.createElement("span", { className: "font-bold", style: { color: lowPct >= 44 ? "#22d3ee" : "#e4e4e7" } }, lowPct, "%")), /* @__PURE__ */ React.createElement("div", { className: "w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden flex" }, !isEmptyDeck && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full transition-all duration-300",
          style: { width: `${lowPct / total * 100}%`, backgroundColor: "#2563eb" },
          title: `Graves: ${lowPct}%`
        }
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full transition-all duration-300",
          style: { width: `${midPct / total * 100}%`, backgroundColor: "#f59e0b" },
          title: `Medios: ${midPct}%`
        }
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "h-full transition-all duration-300",
          style: { width: `${highPct / total * 100}%`, backgroundColor: "#f8fafc" },
          title: `Agudos: ${highPct}%`
        }
      ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] text-zinc-500 pt-0.5" }, /* @__PURE__ */ React.createElement("span", null, "Medios: ", /* @__PURE__ */ React.createElement("strong", { style: { color: "#f59e0b" } }, midPct, "%")), /* @__PURE__ */ React.createElement("span", null, "Agudos: ", /* @__PURE__ */ React.createElement("strong", { style: { color: "#f8fafc" } }, highPct, "%")), /* @__PURE__ */ React.createElement("span", null, "LUFS: ", /* @__PURE__ */ React.createElement("strong", { className: "text-zinc-300" }, lufsTxt))));
    })(), /* @__PURE__ */ React.createElement("div", { className: "mt-2 p-2 rounded-xl bg-black/50 border border-zinc-800/80 flex items-start gap-2" }, /* @__PURE__ */ React.createElement(Icons.MessageSquare, { size: 13, className: "inline-block text-emerald-400 shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[8px] font-mono uppercase text-zinc-500 tracking-wider" }, "Comentario T\xE1ctico DJ (Tag ID3)"), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-[11px] text-zinc-200 whitespace-normal break-words leading-snug", title: deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : "--"} BPM | ${deck.camelot}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b` }, deck.comment || deck.tactical_comment || `[${deck.bpm ? Number(deck.bpm).toFixed(1) : "--"} BPM | ${deck.camelot}] Intro 32b \u2022 Drop contundente \u2022 Outro 64b`))));
  };
  var CopilotWorkspace = ({ onOpenPopOut, onOpenQr }) => {
    const [state, setState] = useState6(DEFAULT_COPILOT_STATE);
    const [clock, setClock] = useState6("");
    const [latency, setLatency] = useState6(2);
    const [visibleCount, setVisibleCount] = useState6(4);
    const [tracksList, setTracksList] = useState6(DEFAULT_COPILOT_STATE.recommendations);
    const [draggedIdx, setDraggedIdx] = useState6(null);
    const [transitionAnalysis, setTransitionAnalysis] = useState6(null);
    const [lowEqApplied, setLowEqApplied] = useState6(false);
    const [manualPickerOpen, setManualPickerOpen] = useState6(false);
    const [manualSearchQuery, setManualSearchQuery] = useState6("");
    const wsRef = useRef8(null);
    const handleApplyCorrection = () => {
      setLowEqApplied((prev) => {
        const next = !prev;
        setState((curr) => {
          if (!curr) return curr;
          return {
            ...curr,
            deck_2: {
              ...curr.deck_2,
              low_ratio: next ? 24 : 51,
              lufs: next ? -7.8 : -6.3
            },
            anti_muddy: {
              ...curr.anti_muddy,
              status: next ? "safe" : "danger",
              tag: next ? "EQ LOW -10dB APLICADO" : "BASS CLASH",
              color: next ? "#10b981" : "#ef4444",
              message: next ? "Low EQ cortado en Deck 2 (-10dB). Espectro de sub-graves despejado y sin distorsi\xF3n en sala." : "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\xE1 empaste y distorsi\xF3n en el sistema de sala.",
              action: next ? "Restablecer EQ (Deshacer)" : "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB)"
            }
          };
        });
        return next;
      });
    };
    const handleRandomLoad = () => {
      const poolCopy = [...MASTER_TRACKS_POOL];
      for (let i = poolCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
      }
      setTracksList(poolCopy.slice(0, 8));
      setVisibleCount(8);
    };
    const handleAddManualTrack = (track) => {
      setTracksList((prev) => {
        if (prev.some((t) => t.id === track.id)) return prev;
        if (prev.length >= 8) {
          return [...prev.slice(0, 7), track];
        }
        return [...prev, track];
      });
      setVisibleCount((v) => Math.max(v, Math.min(8, tracksList.length + 1)));
      setManualPickerOpen(false);
    };
    const [controllerState, setControllerState] = useState6({
      detected: false,
      name: "",
      status: "SIN CONEXI\xD3N"
    });
    const [testDisconnectSkin, setTestDisconnectSkin] = useState6(false);
    const [forceLiveStage, setForceLiveStage] = useState6(false);
    useEffect8(() => {
      if (typeof navigator !== "undefined" && navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: false }).then((access) => {
          const checkDevices = () => {
            const inputs = Array.from(access.inputs.values());
            const connectedInputs = inputs.filter((d) => !d.state || d.state === "connected");
            const djDev = connectedInputs.find((d) => /nv|numark|mkii|ddj|flx|pioneer|traktor|kontrol|denon|hercules|reloop|dj/i.test(d.name || ""));
            if (djDev) {
              let cleanName = djDev.name.toUpperCase().replace(/\s*\(USB\)\s*/i, "").trim();
              if (/nv|mkii/i.test(cleanName)) {
                cleanName = "NUMARK NV II";
              }
              setControllerState({
                detected: true,
                name: cleanName,
                status: "CONECTADA"
              });
            } else if (connectedInputs.length > 0) {
              setControllerState({
                detected: true,
                name: connectedInputs[0].name.toUpperCase().replace(/\s*\(USB\)\s*/i, "").trim(),
                status: "MIDI ACTIVO"
              });
            } else {
              setControllerState({
                detected: false,
                name: "",
                status: "SIN CONEXI\xD3N"
              });
            }
          };
          checkDevices();
          access.onstatechange = checkDevices;
        }).catch(() => {
        });
      }
    }, []);
    useEffect8(() => {
      const timer = setInterval(() => {
        const now = /* @__PURE__ */ new Date();
        setClock(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }, 1e3);
      return () => clearInterval(timer);
    }, []);
    useEffect8(() => {
      let isMounted = true;
      let ws = null;
      let fallbackInterval = null;
      let isFetching = false;
      const startPollingFallback = () => {
        if (fallbackInterval) return;
        const fetchStatus = async () => {
          if (isFetching || document.hidden) return;
          isFetching = true;
          const t0 = performance.now();
          try {
            const res = await fetch("/api/copilot/status");
            if (res.ok) {
              const data = await res.json();
              const dt = Math.round(performance.now() - t0);
              if (isMounted) {
                setState(data);
                if (data.controller && data.controller.name) {
                  setControllerState(data.controller);
                }
                const measured = data.capture_latency_ms ? Math.round(data.capture_latency_ms + dt * 0.15) : dt;
                setLatency(Math.max(1, measured));
                if (data.recommendations && data.recommendations.length > 0) {
                  setTracksList((prev) => prev.length === 0 ? data.recommendations : prev);
                }
              }
            }
          } catch (e) {
            if (isMounted) {
              setState((prev) => prev || DEFAULT_COPILOT_STATE);
              setLatency(1);
              setTracksList((prev) => prev.length === 0 ? DEFAULT_COPILOT_STATE.recommendations : prev);
            }
          } finally {
            isFetching = false;
          }
        };
        fetchStatus();
        fallbackInterval = setInterval(fetchStatus, 150);
      };
      const connectWebSocket = () => {
        try {
          const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host || "127.0.0.1:8000";
          ws = new WebSocket(`${proto}//${host}/ws/copilot`);
          wsRef.current = ws;
          let lastPingTime = performance.now();
          const pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              lastPingTime = performance.now();
              ws.send(JSON.stringify({ action: "ping", client_ts: lastPingTime }));
            }
          }, 2e3);
          ws.onmessage = (event) => {
            if (!isMounted) return;
            try {
              const data = JSON.parse(event.data);
              if (data.type === "pong") {
                const rtt = Math.round(performance.now() - (data.client_ts || lastPingTime));
                setLatency(Math.max(1, Math.min(25, rtt)));
                return;
              }
              setState(data);
              if (data.controller && data.controller.name) {
                setControllerState(data.controller);
              }
              const cap = data.capture_latency_ms || 0.4;
              const netDt = data.server_ts ? Math.max(1, Math.round((Date.now() / 1e3 - data.server_ts) * 1e3)) : 1;
              const totalLat = Math.min(25, Math.max(1, Math.round(cap + netDt)));
              setLatency(totalLat);
              if (data.recommendations && data.recommendations.length > 0) {
                setTracksList((prev) => prev.length === 0 ? data.recommendations : prev);
              }
            } catch (_) {
            }
          };
          ws.onerror = () => {
            if (ws) ws.close();
          };
          ws.onclose = () => {
            clearInterval(pingInterval);
            if (isMounted) {
              startPollingFallback();
            }
          };
        } catch (_) {
          startPollingFallback();
        }
      };
      connectWebSocket();
      return () => {
        isMounted = false;
        if (ws) ws.close();
        if (fallbackInterval) clearInterval(fallbackInterval);
      };
    }, []);
    const setMasterDeck = async (deckTarget) => {
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) {
        try {
          const res = await fetch("/api/copilot/set_master", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ master: deckTarget })
          });
          if (res.ok) {
            const data = await res.json();
            setState(data);
            return;
          }
        } catch (_) {
        }
      }
      setState((prev) => {
        var _a;
        if (!prev) return prev;
        const cur1Master = (_a = prev.deck_1) == null ? void 0 : _a.is_master;
        const new1Master = deckTarget === "1" ? true : deckTarget === "2" ? false : !cur1Master;
        return {
          ...prev,
          deck_1: {
            ...prev.deck_1,
            is_master: new1Master,
            status: new1Master ? "ON AIR (MASTER)" : "CUE / PREPARADO",
            is_playing: new1Master,
            elapsed_sec: prev.deck_1.elapsed_sec
          },
          deck_2: {
            ...prev.deck_2,
            is_master: !new1Master,
            status: !new1Master ? "ON AIR (MASTER)" : "CUE / PREPARADO",
            is_playing: !new1Master,
            elapsed_sec: prev.deck_2.elapsed_sec
          }
        };
      });
    };
    const toggleDeckPlay = useCallback4(async (deckTarget) => {
      const deckNum = deckTarget === "2" || deckTarget === 2 ? 2 : 1;
      const dKey = deckNum === 1 ? "deck_1" : "deck_2";
      setState((prev) => {
        if (!prev || !prev.decks) return prev;
        const cur = prev.decks[dKey];
        if (!cur || !cur.title) return prev;
        const nextPlaying = !cur.is_playing;
        return {
          ...prev,
          decks: {
            ...prev.decks,
            [dKey]: {
              ...cur,
              is_playing: nextPlaying,
              status: nextPlaying ? cur.is_master ? "ON AIR (MASTER)" : "REPRODUCIENDO" : "PAUSA"
            }
          }
        };
      });
      try {
        const res = await fetch(`/api/copilot/deck/${deckNum}/toggle_play`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (_) {
      }
    }, []);
    const cueDeck = useCallback4(async (deckTarget) => {
      const deckNum = deckTarget === "2" || deckTarget === 2 ? 2 : 1;
      const dKey = deckNum === 1 ? "deck_1" : "deck_2";
      setState((prev) => {
        if (!prev || !prev.decks) return prev;
        const cur = prev.decks[dKey];
        if (!cur || !cur.title) return prev;
        const cueSec = cur.cues && cur.cues.length > 0 && cur.cues[0].pos_sec !== void 0 ? cur.cues[0].pos_sec : 0;
        const dur = cur.duration_sec || 240;
        const prog = dur > 0 ? Math.min(1, cueSec / dur) : 0;
        return {
          ...prev,
          decks: {
            ...prev.decks,
            [dKey]: {
              ...cur,
              is_playing: false,
              elapsed_sec: cueSec,
              play_progress: prog,
              status: "CUE (PREPARADO)"
            }
          }
        };
      });
      try {
        const res = await fetch(`/api/copilot/deck/${deckNum}/cue`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (_) {
      }
    }, []);
    useEffect8(() => {
      const handleKeyDown = (e) => {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
        if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          setMasterDeck("toggle");
        } else if (e.key === "1") {
          e.preventDefault();
          toggleDeckPlay(1);
        } else if (e.key === "2") {
          e.preventDefault();
          toggleDeckPlay(2);
        } else if (e.key === " " || e.code === "Space") {
          e.preventDefault();
          toggleDeckPlay(state && state.master_deck ? state.master_deck : 1);
        } else if (e.key === "q" || e.key === "Q") {
          e.preventDefault();
          cueDeck(1);
        } else if (e.key === "w" || e.key === "W") {
          e.preventDefault();
          cueDeck(2);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setMasterDeck, toggleDeckPlay, cueDeck, state]);
    useEffect8(() => {
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) return;
      if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) return;
      let midiAccess = null;
      const lastMidiTrigger = {};
      const onMidiMessage = (e) => {
        if (!e.data || e.data.length < 2) return;
        const [status, note, velocity = 0] = e.data;
        const cmd = status & 240;
        const ch = status & 15;
        if (cmd !== 144 || velocity <= 0) return;
        const targetDeck = ch === 1 ? 1 : ch === 2 ? 2 : 0;
        if (!targetDeck) return;
        const now = Date.now();
        const key = `${targetDeck}_${note}`;
        if (now - (lastMidiTrigger[key] || 0) < 60) return;
        lastMidiTrigger[key] = now;
        if (note === 33) {
          toggleDeckPlay(targetDeck);
        } else if (note === 32) {
          cueDeck(targetDeck);
        }
      };
      navigator.requestMIDIAccess().then((access) => {
        midiAccess = access;
        for (const input of midiAccess.inputs.values()) {
          input.onmidimessage = onMidiMessage;
        }
        midiAccess.onstatechange = (ev) => {
          if (ev.port && ev.port.type === "input" && ev.port.state === "connected") {
            ev.port.onmidimessage = onMidiMessage;
          }
        };
      }).catch(() => {
      });
      return () => {
        if (midiAccess) {
          for (const input of midiAccess.inputs.values()) {
            input.onmidimessage = null;
          }
        }
      };
    }, [toggleDeckPlay, cueDeck]);
    const toggleSimulation = async () => {
      const isLocalHost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocalHost) {
        try {
          const res = await fetch("/api/copilot/toggle_simulation", { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            setState(data);
            if (data.recommendations) setTracksList(data.recommendations);
            return;
          }
        } catch (e) {
        }
      }
      setState((prev) => {
        const current = prev || DEFAULT_COPILOT_STATE;
        const newSim = !current.is_simulating;
        return {
          ...current,
          is_simulating: newSim,
          source: newSim ? "SIMULATION_MODE" : "SERATO_LIVE",
          deck_1: {
            ...current.deck_1,
            title: newSim ? "Komodo (Megavoices Claxixx)" : "Deep Blue",
            artist: newSim ? "Mauro Picotto" : "The Midnight",
            bpm: newSim ? 137.68 : 130,
            camelot: newSim ? "10A" : "10A",
            mood: newSim ? "Peak Time Climax" : "Melodic Club"
          },
          deck_2: {
            ...current.deck_2,
            title: newSim ? "Smooth Mind" : "Turn on your Brain Baby",
            artist: newSim ? "Marco Bailey / Sigvard" : "Snog",
            bpm: newSim ? 140 : 129.63,
            camelot: newSim ? "6A" : "8A",
            mood: newSim ? "Hypnotic Groove" : "Drumcode Core"
          },
          anti_muddy: {
            clash_detected: newSim,
            severity: newSim ? "CRITICAL" : "SAFE",
            color: newSim ? "#ef4444" : "#10b981",
            badge: newSim ? "BASS CLASH" : "SAFE MIX",
            message: newSim ? "Ambos tracks tienen sub-graves dominantes (>44%). El solape directo crear\xE1 empaste y distorsi\xF3n en el sistema de sala." : "Equilibrio de frecuencias \xF3ptimo entre Decks. Transici\xF3n limpia sin solape.",
            tactical_advice: newSim ? "Corta la EQ de graves (Low) en el canal entrante (-6dB a -12dB) antes de abrir el fader, o usa filtro paso-alto." : "Curva de mezcla perfecta en comp\xE1s 32."
          }
        };
      });
    };
    const setPlatform = async (plat) => {
      try {
        const res = await fetch("/api/copilot/set_platform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: plat })
        });
        if (res.ok) {
          const data = await res.json();
          setState(data);
          return;
        }
      } catch (e) {
      }
      setState((prev) => {
        const current = prev || DEFAULT_COPILOT_STATE;
        return {
          ...current,
          platform: plat,
          platform_mode: plat,
          platform_name: plat === "serato" ? "Serato DJ Pro" : plat === "rekordbox" ? "Rekordbox" : plat === "virtualdj" ? "VirtualDJ Pro" : plat === "traktor" ? "Traktor Pro" : "Auto-Detect"
        };
      });
    };
    const handleDragStart = (e, index) => {
      setDraggedIdx(index);
      e.dataTransfer.effectAllowed = "move";
    };
    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    const handleDrop = (e, targetIdx) => {
      e.preventDefault();
      if (draggedIdx === null || draggedIdx === targetIdx) return;
      const updated = [...tracksList];
      const [movedItem] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, movedItem);
      setTracksList(updated);
      setDraggedIdx(null);
      const masterTrack = (state == null ? void 0 : state.deck_1) || {};
      const incomingTrack = updated[0];
      const mCamelot = masterTrack.camelot || "10A";
      const inCamelot = incomingTrack.camelot || "10A";
      const mBpm = parseFloat(masterTrack.bpm) || 138;
      const inBpm = parseFloat(incomingTrack.bpm) || 138;
      const bpmDelta = (inBpm - mBpm).toFixed(1);
      const mNum = parseInt(mCamelot);
      const inNum = parseInt(inCamelot);
      const isExactMatch = mCamelot === inCamelot;
      const isEnergyBoost = inNum === mNum % 12 + 1;
      const isHarmonic = isExactMatch || isEnergyBoost || mNum === inNum % 12 + 1;
      setTransitionAnalysis({
        trackTitle: incomingTrack.title,
        isHarmonic,
        matchType: isExactMatch ? "MATCH PERFECTO (Mismo Tono)" : isEnergyBoost ? "SUBID\xD3N DE ENERG\xCDA (+1 Camelot)" : isHarmonic ? "COMPATIBLE" : "CHOQUE ARM\xD3NICO (Cuidado)",
        bpmDelta: bpmDelta >= 0 ? `+${bpmDelta}` : bpmDelta,
        lowRatio: incomingTrack.low_ratio,
        safeBass: incomingTrack.low_ratio < 44,
        advice: isExactMatch ? "Excelente acople t\xEDmbrico. Realiza el cruce en el comp\xE1s 32 con EQ Low compensado." : isEnergyBoost ? "Sube la intensidad de la pista. Filtra graves con HPF antes del drop para impacto limpio." : "Diferencia arm\xF3nica. Usa un par\xF3n (breakdown) o reverb out para no desafinar."
      });
    };
    const activeState = state || DEFAULT_COPILOT_STATE;
    const { deck_1, deck_2, anti_muddy, harmonic } = activeState;
    const isLive = state.source && state.source.endsWith("_LIVE");
    const isStandby = state.source && state.source.endsWith("_STANDBY");
    const displayRecommendations = tracksList.length > 0 ? tracksList : state.recommendations || [];
    const isAnyDeckPlaying = Boolean((deck_1 == null ? void 0 : deck_1.is_playing) || (deck_2 == null ? void 0 : deck_2.is_playing));
    const [liveStageSticky, setLiveStageSticky] = useState6(false);
    useEffect8(() => {
      if (isAnyDeckPlaying) {
        setLiveStageSticky(true);
        return;
      }
      const closeTimer = setTimeout(() => {
        setLiveStageSticky(false);
      }, 3500);
      return () => clearTimeout(closeTimer);
    }, [isAnyDeckPlaying]);
    const isLiveStage = forceLiveStage || isAnyDeckPlaying || liveStageSticky;
    const isAppRunning = state.is_app_open !== void 0 ? state.is_app_open : state.dj_app ? state.dj_app.is_open : false;
    const isAppOpen = !testDisconnectSkin && isAppRunning;
    const platformsList = [
      { id: "auto", label: "Auto", color: "#a855f7" },
      { id: "serato", label: "Serato", color: "#00d1e8" },
      { id: "rekordbox", label: "Rekordbox", color: "#38bdf8" },
      { id: "virtualdj", label: "VirtualDJ", color: "#f97316" },
      { id: "traktor", label: "Traktor", color: "#facc15" }
    ];
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col w-full h-full p-3 sm:p-5 pb-32 md:pb-6 overflow-y-auto select-none bg-[#040407] text-gray-200" }, /* @__PURE__ */ React.createElement("div", { className: "relative flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3 px-1 select-none" }, /* @__PURE__ */ React.createElement("div", { className: "relative z-10 flex items-center justify-between gap-3 w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-lg bg-djcyan-500/10 border border-djcyan-500/30 flex items-center justify-center text-djcyan-400 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]" }, /* @__PURE__ */ React.createElement(Icons.Turntable, { size: 17 })), /* @__PURE__ */ React.createElement("h2", { className: "font-syne font-black text-sm sm:text-base leading-none text-white tracking-wide uppercase whitespace-nowrap flex items-center gap-1.5" }, "Copilot ", /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400" }, "Cabina DJ"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/60 font-mono text-[10px]" }, renderPlatformLogo(state.platform || "serato", 13), /* @__PURE__ */ React.createElement("strong", { style: { color: state.platform_color || "#00d1e8" } }, state.platform_name || "Serato DJ Pro"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-600" }, "|"), /* @__PURE__ */ React.createElement("span", { className: isLive ? "text-red-400 font-bold" : "text-cyan-400 font-bold" }, state.platform_status || (isLive ? "LIVE" : "STANDBY"))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap justify-end shrink-0" }, controllerState.detected ? /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center gap-2 select-none cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors",
        onClick: () => setControllerState({
          detected: false,
          name: "",
          status: "SIN CONEXI\xD3N"
        }),
        title: "Haz clic para alternar prueba de desconexi\xF3n"
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse shrink-0" }),
      /* @__PURE__ */ React.createElement(
        "h3",
        {
          className: "font-syne font-black text-sm sm:text-base tracking-wider uppercase leading-none whitespace-nowrap",
          style: {
            textShadow: "0 0 14px rgba(6, 182, 212, 0.85), 0 0 28px rgba(6, 182, 212, 0.5), 0 0 50px rgba(6, 182, 212, 0.25)"
          }
        },
        (() => {
          const rawName = (controllerState.name || "NUMARK NV II").replace(/\s*\(USB\)\s*/i, "").trim();
          const parts = rawName.split(/\s+/);
          const firstWord = parts[0] || "NUMARK";
          const restWords = parts.slice(1).join(" ") || "";
          return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" }, firstWord), restWords && /* @__PURE__ */ React.createElement(React.Fragment, null, " ", /* @__PURE__ */ React.createElement("span", { className: "text-[#00d1e8] text-djcyan-400 drop-shadow-[0_0_14px_rgba(6,182,212,0.9)]" }, restWords)));
        })()
      )
    ) : /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "flex items-center gap-2 py-1.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 font-syne font-semibold text-xs tracking-wider uppercase select-none cursor-pointer hover:text-zinc-300 hover:border-zinc-700 transition-colors",
        onClick: () => setControllerState({
          detected: true,
          name: "NUMARK NV II",
          status: "CONECTADA"
        }),
        title: "Haz clic para conectar controladora (Numark NV II)"
      },
      /* @__PURE__ */ React.createElement("span", { className: "w-2 h-2 rounded-full bg-zinc-600 shrink-0" }),
      /* @__PURE__ */ React.createElement("span", null, "SIN CONEXI\xD3N")
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center p-0.5 bg-zinc-950/90 rounded-xl border border-zinc-800 shadow-inner" }, platformsList.map((p) => {
      const isSelected = state.platform_mode === p.id || state.platform_mode === "auto" && p.id === "auto";
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: p.id,
          type: "button",
          onClick: () => setPlatform(p.id),
          className: `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${isSelected ? "bg-zinc-800 text-white shadow-md border border-zinc-600" : "text-zinc-400 hover:text-zinc-200"}`,
          style: isSelected ? { color: p.color, borderColor: `${p.color}66` } : {},
          title: `Conectar con ${p.label}`
        },
        renderPlatformLogo(p.id, 13),
        /* @__PURE__ */ React.createElement("span", { className: "hidden sm:inline text-[10px]" }, p.label)
      );
    })), /* @__PURE__ */ React.createElement("div", { className: "font-mono text-xs font-bold text-white bg-zinc-900 px-2 py-1 rounded-xl border border-zinc-800 shadow-inner" }, clock || state.last_updated), onOpenPopOut && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onOpenPopOut,
        className: "flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase transition-all shadow-[0_0_12px_rgba(239,68,68,0.4)] cursor-pointer",
        title: "Abrir en ventana flotante independiente"
      },
      "Pop-Out \u2197"
    )))), testDisconnectSkin && /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-3 sm:p-3.5 rounded-2xl bg-red-950/80 border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-between gap-3 animate-pulse" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl shrink-0" }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-syne font-bold text-xs sm:text-sm text-red-100 uppercase tracking-wide" }, "Es necesario conectar la aplicaci\xF3n y la controladora"), /* @__PURE__ */ React.createElement("p", { className: "font-syne text-[11px] text-red-200/90 mt-0.5" }, "Conecta la aplicaci\xF3n de m\xFAsica (Serato, Rekordbox, Traktor o VirtualDJ) y la controladora DJ para activar el an\xE1lisis en vivo."))), /* @__PURE__ */ React.createElement("div", { className: "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/60 border border-red-500/50 font-mono text-[9px] text-red-300 uppercase shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" }), /* @__PURE__ */ React.createElement("span", null, "SKIN STANDBY"))), /* @__PURE__ */ React.createElement(
      CopilotCleanMixBanner,
      {
        antiMuddy: anti_muddy,
        harmonic,
        controllerState,
        lufsDelta: state == null ? void 0 : state.lufs_delta,
        lowEqApplied,
        onApplyCorrection: handleApplyCorrection,
        isAppOpen,
        latency
      }
    ), /* @__PURE__ */ React.createElement("div", { className: `bw-copilot-stage ${isLiveStage ? "is-live" : ""} mb-4` }, /* @__PURE__ */ React.createElement(
      CopilotDeckCard,
      {
        deck: deck_1,
        side: "1",
        isMaster: deck_1.is_master,
        antiMuddy: anti_muddy,
        partnerDeck: deck_2,
        onSetMaster: setMasterDeck,
        onTogglePlay: toggleDeckPlay,
        isAppOpen,
        isCompact: isLiveStage
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "bw-center-slot" }, /* @__PURE__ */ React.createElement(
      CopilotCenterMixer,
      {
        deck1: deck_1,
        deck2: deck_2,
        mixer: state == null ? void 0 : state.mixer,
        audit: state == null ? void 0 : state.audit,
        isAppOpen,
        showInlineHud: true
      }
    )), /* @__PURE__ */ React.createElement(
      CopilotDeckCard,
      {
        deck: deck_2,
        side: "2",
        isMaster: deck_2.is_master,
        antiMuddy: anti_muddy,
        partnerDeck: deck_1,
        onSetMaster: setMasterDeck,
        onTogglePlay: toggleDeckPlay,
        isAppOpen,
        isCompact: isLiveStage
      }
    )), /* @__PURE__ */ React.createElement("section", { className: `mt-auto transition-all ${!isAppOpen ? "p-3 rounded-2xl bg-[#06060c] border border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2.5 flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("h4", { className: "font-syne font-bold text-xs sm:text-sm text-zinc-300 uppercase tracking-wider flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(Icons.Bulb, { size: 14, className: "text-amber-400 inline-block" }), /* @__PURE__ */ React.createElement("span", null, "PR\xD3XIMAS PISTAS SUGERIDAS (", isAppOpen ? displayRecommendations.length : 0, ")")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-mono text-zinc-500 hidden sm:inline" }, isAppOpen ? "\u2022 Arrastra para reordenar la secuencia" : "\u2022 Modo Standby Skin")), isAppOpen && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setVisibleCount((v) => v === 4 ? Math.min(8, displayRecommendations.length) : 4),
        className: "px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-mono font-bold text-djcyan-400 transition-colors cursor-pointer",
        title: "Alternar entre 4 y 8 pistas visibles"
      },
      visibleCount === 4 ? "Cargar m\xE1s (+4)" : "Mostrar 4 (-4)"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleRandomLoad,
        className: "px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/60 text-xs font-mono font-bold text-purple-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm",
        title: "Cargar selecci\xF3n aleatoria de candidatos de la biblioteca"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u{1F3B2}"),
      /* @__PURE__ */ React.createElement("span", null, "Carga Aleatoria")
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setManualPickerOpen(true),
        className: "px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 text-xs font-mono font-bold text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm",
        title: "Buscar y a\xF1adir manualmente una pista a la cola"
      },
      /* @__PURE__ */ React.createElement("span", null, "\u2795"),
      /* @__PURE__ */ React.createElement("span", null, "Carga Manual")
    ))), !isAppOpen ? (
      /* MODO SKIN VACÍO CON BORDES EN STANDBY */
      /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" }, [1, 2, 3, 4].map((slot) => /* @__PURE__ */ React.createElement("div", { key: slot, className: "p-3 rounded-2xl bg-[#080811] border border-zinc-800/80 flex flex-col justify-between opacity-50" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2.5 mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-black flex items-center justify-center" }, /* @__PURE__ */ React.createElement("img", { src: DEFAULT_VINYL_SVG, alt: "Standby", className: "w-6 h-6 opacity-25" }), /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-600 flex items-center justify-center" }, "#", slot)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-xs text-zinc-500 truncate block" }, "-- Esperando Pista --"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-zinc-600 truncate font-mono block" }, "Standby"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-zinc-600" }, /* @__PURE__ */ React.createElement("span", null, "-- BPM"), /* @__PURE__ */ React.createElement("span", null, "\u2022 -- Camelot")))), /* @__PURE__ */ React.createElement("div", { className: "text-[9.5px] font-mono text-zinc-600 pt-1.5 border-t border-zinc-800/60" }, "Conecta software DJ y controladora"))))
    ) : /* @__PURE__ */ React.createElement(React.Fragment, null, transitionAnalysis && /* @__PURE__ */ React.createElement("div", { className: "mb-3 p-2.5 rounded-xl bg-zinc-950 border border-djcyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-wrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-base" }, "\u26A1"), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-300" }, "Transici\xF3n con ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, transitionAnalysis.trackTitle), ":"), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded font-bold text-[10px] ${transitionAnalysis.isHarmonic ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40"}` }, transitionAnalysis.matchType), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "\u0394 BPM: ", /* @__PURE__ */ React.createElement("strong", { className: "text-white" }, transitionAnalysis.bpmDelta)), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-400" }, "Sub-Graves: ", /* @__PURE__ */ React.createElement("strong", { className: transitionAnalysis.safeBass ? "text-emerald-400" : "text-amber-400" }, transitionAnalysis.lowRatio, "%"))), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-zinc-300 truncate" }, /* @__PURE__ */ React.createElement("strong", { className: "text-djcyan-400" }, "Acci\xF3n:"), " ", transitionAnalysis.advice)), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" }, displayRecommendations.slice(0, visibleCount).map((rec, idx) => {
      const isDragging = draggedIdx === idx;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: rec.id || idx,
          draggable: true,
          onDragStart: (e) => handleDragStart(e, idx),
          onDragOver: handleDragOver,
          onDrop: (e) => handleDrop(e, idx),
          className: `p-2.5 rounded-2xl bg-[#090912] border transition-all shadow-md group flex flex-col justify-between cursor-grab active:cursor-grabbing ${isDragging ? "opacity-40 border-djcyan-400 scale-95" : "border-zinc-800 hover:border-djcyan-500/50 hover:bg-[#0c0c17]"}`,
          title: "Arrastra para cambiar el orden de mezcla"
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-2.5 mb-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-zinc-700/60 bg-black" }, /* @__PURE__ */ React.createElement(
          "img",
          {
            src: getValidCover(rec.cover),
            alt: "Cover",
            onError: (e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_VINYL_SVG;
            },
            className: "w-full h-full object-cover"
          }
        ), /* @__PURE__ */ React.createElement("span", { className: "absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/80 text-[8px] font-mono font-bold text-zinc-300 flex items-center justify-center" }, "#", idx + 1)), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-syne font-bold text-xs text-white group-hover:text-djcyan-300 transition-colors truncate" }, rec.title), /* @__PURE__ */ React.createElement("span", { className: "w-6 h-6 rounded flex items-center justify-center font-orbitron font-black text-[10px] text-black shadow shrink-0", style: { backgroundColor: rec.camelot_color } }, rec.camelot)), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-zinc-400 truncate font-mono" }, rec.artist), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-0.5 text-[9px] font-mono" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-bold" }, rec.bpm, " BPM"), rec.mood && /* @__PURE__ */ React.createElement("span", { className: "text-purple-400 truncate" }, "\u2022 ", rec.mood), rec.energy && /* @__PURE__ */ React.createElement("span", { className: "text-amber-400 font-bold shrink-0" }, "\u2022 ", rec.energy, "%")))),
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-800/60" }, /* @__PURE__ */ React.createElement("span", { className: "text-djcyan-400 font-semibold truncate max-w-[130px]" }, rec.strategy), /* @__PURE__ */ React.createElement("span", { className: "text-zinc-500 shrink-0" }, "Sub: ", rec.low_ratio, "%")),
        /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed" }, rec.reason)
      );
    })))), manualPickerOpen && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn", onClick: () => setManualPickerOpen(false) }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0b0b12] border border-zinc-700 rounded-2xl w-full max-w-xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between border-b border-zinc-800 pb-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl" }, "\u2795"), /* @__PURE__ */ React.createElement("h3", { className: "font-syne font-bold text-base text-white" }, "Carga Manual de Pistas a la Cola")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setManualPickerOpen(false),
        className: "w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-mono cursor-pointer"
      },
      "\u2715"
    )), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: manualSearchQuery,
        onChange: (e) => setManualSearchQuery(e.target.value),
        placeholder: "Buscar por t\xEDtulo, artista, tono Camelot o g\xE9nero...",
        className: "w-full h-10 px-3 pl-9 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-djcyan-400 font-mono",
        autoFocus: true
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "absolute left-3 top-2.5 text-zinc-500 text-xs" }, "\u{1F50D}")), /* @__PURE__ */ React.createElement("div", { className: "overflow-y-auto flex-1 flex flex-col gap-2 pr-1 max-h-[45vh]" }, MASTER_TRACKS_POOL.filter((t) => {
      if (!manualSearchQuery) return true;
      const q = manualSearchQuery.toLowerCase();
      return (t.title || "").toLowerCase().includes(q) || (t.artist || "").toLowerCase().includes(q) || (t.camelot || "").toLowerCase().includes(q) || (t.genre || "").toLowerCase().includes(q);
    }).map((t) => {
      const isAlreadyAdded = tracksList.some((item) => item.id === t.id);
      return /* @__PURE__ */ React.createElement("div", { key: t.id, className: "flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-all gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "w-7 h-7 rounded text-[10px] font-orbitron font-black text-black flex items-center justify-center shrink-0",
          style: { backgroundColor: t.camelot_color || "#f472b6" }
        },
        t.camelot
      ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-syne font-bold text-xs text-white truncate" }, t.title), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-mono text-zinc-400" }, t.artist, " \u2022 ", t.bpm, " BPM \u2022 ", t.genre))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          disabled: isAlreadyAdded || tracksList.length >= 8,
          onClick: () => handleAddManualTrack(t),
          className: `px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${isAlreadyAdded ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : tracksList.length >= 8 ? "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow"}`
        },
        isAlreadyAdded ? "En cola \u2713" : tracksList.length >= 8 ? "Cola llena (8 m\xE1x)" : "+ A\xF1adir"
      ));
    })))));
  };

  // web/js/copilot.jsx
  function LiveCopilotApp() {
    return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen w-full bg-[#05070e] text-white p-3 sm:p-4 overflow-x-hidden" }, /* @__PURE__ */ React.createElement(CopilotWorkspace, { onOpenPopOut: null, onOpenQr: null }));
  }
  var rootEl = document.getElementById("copilot-root");
  if (rootEl) {
    ReactDOM.render(/* @__PURE__ */ React.createElement(LiveCopilotApp, null), rootEl);
  }
  window.LiveCopilotApp = LiveCopilotApp;
})();
