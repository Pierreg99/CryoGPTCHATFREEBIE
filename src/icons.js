// Local SVG icons keep labels independent of platform emoji fonts.
const paths = {
  plus: "M12 5v14M5 12h14",
  arrow: "M6 18 18 6M6 6h12v12",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  chat: "M4 4h16v12H9l-5 4V4Z",
  knowledge: "M5 3h11l3 3v15H5V3Zm3 6h8M8 13h8M8 17h5",
  focus: "m13 2-8 12h7l-1 8 8-12h-7l1-8Z",
  agents: "M8 5h8v4H8V5ZM6 15h4v4H6v-4Zm8 0h4v4h-4v-4ZM12 9v3M8 15v-3h8v3",
  skills: "m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18",
  godot: "m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10",
  roadmap: "M4 4h16v16H4V4ZM8 8h3M8 12h8M8 16h5",
  menu: "M4 6h16M4 12h16M4 18h16",
  refresh:
    "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1",
  rename: "m15 4 5 5M4 20l4-1L20 7l-4-4L4 15v5Z",
  stop: "M6 6h12v12H6V6Z",
  send: "m3 3 18 9-18 9 4-9-4-9Zm4 9h14",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  download: "M12 3v13m-5-5 5 5 5-5M4 15v6h16v-6",
  models: "M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5",
};
export function icon(key) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("ui-icon");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[key] || paths.chat);
  svg.append(path);
  return svg;
}
