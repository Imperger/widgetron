export function toSVGCoords(e: MouseEvent, svg: SVGSVGElement) {
  const pt = new DOMPoint(e.clientX, e.clientY);
  const ctm = svg.getScreenCTM();

  if (!ctm) return null;

  const svgPoint = pt.matrixTransform(ctm.inverse());

  return { x: svgPoint.x, y: svgPoint.y };
}
