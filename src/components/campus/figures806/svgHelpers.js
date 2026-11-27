/**
 * Shared SVG math sampling utilities for 806 Semiconductor Physics figures.
 * Ensures smooth, analytically accurate curves without duplicate sampling logic.
 */

export function sampleCurve(fn, xMin, xMax, steps, mapX, mapY) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = fn(x);
    const sx = mapX(x).toFixed(2);
    const sy = mapY(y).toFixed(2);
    pts.push(`${i === 0 ? 'M' : 'L'}${sx},${sy}`);
  }
  return pts.join(' ');
}

export function createMapper(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1;
  const outSpan = rangeMax - rangeMin;
  return (val) => rangeMin + ((val - domainMin) / span) * outSpan;
}
