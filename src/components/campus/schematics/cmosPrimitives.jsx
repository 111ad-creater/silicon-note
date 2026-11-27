import React from 'react';

export const COLORS = {
  port: '#38BDF8',
  violet: '#8B5CF6',
  danger: '#EF4444',
  safe: '#10B981',
  amber: '#F59E0B',
};

/**
 * Standard Razavi-style vertical 3-terminal NMOS symbol.
 * Anchor point (x, y) is the center of the channel:
 * - Gate tip: (x - 24, y)
 * - Drain tip: (x + 8, y - 26)
 * - Source tip: (x + 8, y + 26)
 */
export function Nmos({
  x,
  y,
  label,
  labelSide = 'right',
  mirror = false,
  color = 'currentColor',
  highlightGate = false,
  highlightChannel = false,
  subLabel,
}) {
  const dir = mirror ? -1 : 1;
  const gx = x - 24 * dir;
  const gateBarX = x - 7 * dir;
  const chX = x - 2 * dir;
  const dsX = x + 8 * dir;
  const lblX =
    labelSide === 'left' ? x - 34 : labelSide === 'right' ? x + 22 : x + 22;
  const anchor = labelSide === 'left' ? 'end' : 'start';

  return (
    <g
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Gate lead & plate */}
      <line
        x1={gx}
        y1={y}
        x2={gateBarX}
        y2={y}
        stroke={highlightGate ? COLORS.violet : color}
      />
      <line
        x1={gateBarX}
        y1={y - 14}
        x2={gateBarX}
        y2={y + 14}
        stroke={highlightGate ? COLORS.violet : COLORS.port}
        strokeWidth="2.4"
      />

      {/* Channel vertical bar */}
      <line
        x1={chX}
        y1={y - 16}
        x2={chX}
        y2={y + 16}
        stroke={highlightChannel ? COLORS.violet : color}
        strokeWidth="2.2"
      />

      {/* Drain (top) */}
      <polyline points={`${chX},${y - 12} ${dsX},${y - 12} ${dsX},${y - 26}`} />
      {/* Source (bottom) */}
      <polyline points={`${chX},${y + 12} ${dsX},${y + 12} ${dsX},${y + 26}`} />

      {/* Outward source arrow (NMOS) */}
      <polygon
        points={
          mirror
            ? `${x + 1 * dir},${y + 12} ${x + 6 * dir},${y + 8} ${x + 6 * dir},${y + 16}`
            : `${dsX - 1},${y + 12} ${dsX - 7},${y + 8.5} ${dsX - 7},${y + 15.5}`
        }
        fill={color}
        stroke="none"
      />

      {label && (
        <text
          x={lblX}
          y={y + 4}
          fill={color}
          stroke="none"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
      {subLabel && (
        <text
          x={lblX}
          y={y + 19}
          fill={COLORS.violet}
          stroke="none"
          fontSize="11.5"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {subLabel}
        </text>
      )}
    </g>
  );
}

/**
 * Standard Razavi-style vertical 3-terminal PMOS symbol (bubble at gate, source at top).
 * Anchor point (x, y) is the center of the channel:
 * - Gate tip: (x - 24, y)
 * - Source tip (top): (x + 8, y - 26)
 * - Drain tip (bottom): (x + 8, y + 26)
 */
export function Pmos({
  x,
  y,
  label,
  labelSide = 'right',
  mirror = false,
  color = 'currentColor',
  highlightGate = false,
}) {
  const dir = mirror ? -1 : 1;
  const gx = x - 24 * dir;
  const bubbleX = x - 11 * dir;
  const gateBarX = x - 7 * dir;
  const chX = x - 2 * dir;
  const dsX = x + 8 * dir;
  const lblX = labelSide === 'left' ? x - 34 : x + 22;
  const anchor = labelSide === 'left' ? 'end' : 'start';

  return (
    <g
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Gate lead & bubble */}
      <line
        x1={gx}
        y1={y}
        x2={bubbleX - 3.8 * dir}
        y2={y}
        stroke={highlightGate ? COLORS.violet : color}
      />
      <circle
        cx={bubbleX}
        cy={y}
        r="3.8"
        stroke={COLORS.violet}
        strokeWidth="2"
      />
      <line
        x1={gateBarX}
        y1={y - 14}
        x2={gateBarX}
        y2={y + 14}
        stroke={COLORS.violet}
        strokeWidth="2.4"
      />

      {/* Channel */}
      <line x1={chX} y1={y - 16} x2={chX} y2={y + 16} strokeWidth="2.2" />

      {/* Source (top) */}
      <polyline points={`${chX},${y - 12} ${dsX},${y - 12} ${dsX},${y - 26}`} />
      {/* Drain (bottom) */}
      <polyline points={`${chX},${y + 12} ${dsX},${y + 12} ${dsX},${y + 26}`} />

      {/* Inward arrow on top source terminal (PMOS) */}
      <polygon
        points={
          mirror
            ? `${chX},${y - 12} ${chX - 6 * dir},${y - 15.5} ${chX - 6 * dir},${y - 8.5}`
            : `${chX + 1},${y - 12} ${chX + 7},${y - 15.5} ${chX + 7},${y - 8.5}`
        }
        fill={color}
        stroke="none"
      />

      {label && (
        <text
          x={lblX}
          y={y + 4}
          fill={color}
          stroke="none"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Vertical or horizontal zigzag Resistor.
 * Vertical span: y - 22 to y + 22.
 * Horizontal span: x - 22 to x + 22.
 */
export function Resistor({
  x,
  y,
  orientation = 'vertical',
  label,
  labelOffset = 18,
  labelSide = 'right',
  color = 'currentColor',
}) {
  const isVert = orientation === 'vertical';
  const points = isVert
    ? `${x},${y - 22} ${x},${y - 15} ${x - 6},${y - 11} ${x + 6},${y - 5} ${x - 6},${y + 1} ${x + 6},${y + 7} ${x - 6},${y + 13} ${x},${y + 16} ${x},${y + 22}`
    : `${x - 22},${y} ${x - 15},${y} ${x - 11},${y - 6} ${x - 5},${y + 6} ${x + 1},${y - 6} ${x + 7},${y + 6} ${x + 13},${y - 6} ${x + 16},${y} ${x + 22},${y}`;

  let tx = x + labelOffset;
  let ty = y + 4;
  let anchor = 'start';
  if (isVert && labelSide === 'left') {
    tx = x - labelOffset;
    anchor = 'end';
  } else if (!isVert) {
    tx = x;
    ty = labelSide === 'bottom' ? y + 20 : y - 13;
    anchor = 'middle';
  }

  return (
    <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <polyline points={points} />
      {label && (
        <text
          x={tx}
          y={ty}
          fill={color}
          stroke="none"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Parallel-plate Capacitor.
 * Vertical span: y - 16 to y + 16.
 * Horizontal span: x - 16 to x + 16.
 */
export function Capacitor({
  x,
  y,
  orientation = 'horizontal',
  label,
  labelPos = 'top',
  color = 'currentColor',
  accentColor,
}) {
  const strokeColor = accentColor || color;
  const isHoriz = orientation === 'horizontal';

  let tx = x;
  let ty = y - 17;
  let anchor = 'middle';
  if (isHoriz && labelPos === 'bottom') {
    ty = y + 25;
  } else if (!isHoriz) {
    tx = labelPos === 'left' ? x - 18 : x + 18;
    ty = y + 4;
    anchor = labelPos === 'left' ? 'end' : 'start';
  }

  return (
    <g stroke={strokeColor} strokeWidth="2" strokeLinecap="round" fill="none">
      {isHoriz ? (
        <>
          <line x1={x - 16} y1={y} x2={x - 4} y2={y} />
          <line x1={x - 4} y1={y - 11} x2={x - 4} y2={y + 11} strokeWidth="2.4" />
          <line x1={x + 4} y1={y - 11} x2={x + 4} y2={y + 11} strokeWidth="2.4" />
          <line x1={x + 4} y1={y} x2={x + 16} y2={y} />
        </>
      ) : (
        <>
          <line x1={x} y1={y - 16} x2={x} y2={y - 4} />
          <line x1={x - 11} y1={y - 4} x2={x + 11} y2={y - 4} strokeWidth="2.4" />
          <line x1={x - 11} y1={y + 4} x2={x + 11} y2={y + 4} strokeWidth="2.4" />
          <line x1={x} y1={y + 4} x2={x} y2={y + 16} />
        </>
      )}
      {label && (
        <text
          x={tx}
          y={ty}
          fill={accentColor || color}
          stroke="none"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Independent Current Source (Circle + arrow).
 * Vertical span: y - 22 to y + 22.
 */
export function CurrentSource({
  x,
  y,
  label,
  labelSide = 'left',
  direction = 'down',
  color = 'currentColor',
}) {
  const tx = labelSide === 'right' ? x + 22 : x - 22;
  const anchor = labelSide === 'right' ? 'start' : 'end';

  return (
    <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x} y1={y - 22} x2={x} y2={y - 14} />
      <circle cx={x} cy={y} r="14" />
      <line x1={x} y1={y + 14} x2={x} y2={y + 22} />
      {direction === 'down' ? (
        <>
          <line x1={x} y1={y - 7} x2={x} y2={y + 6} />
          <polygon points={`${x},${y + 9} ${x - 3.5},${y + 3} ${x + 3.5},${y + 3}`} fill={color} stroke="none" />
        </>
      ) : (
        <>
          <line x1={x} y1={y + 7} x2={x} y2={y - 6} />
          <polygon points={`${x},${y - 9} ${x - 3.5},${y - 3} ${x + 3.5},${y - 3}`} fill={color} stroke="none" />
        </>
      )}
      {label && (
        <text
          x={tx}
          y={y + 4}
          fill={color}
          stroke="none"
          fontSize="13.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Diamond Controlled Current Source (small-signal gm·vgs).
 * Vertical span: y - 24 to y + 24.
 */
export function ControlledCurrentSource({
  x,
  y,
  label,
  labelSide = 'left',
  color = 'currentColor',
}) {
  const tx = labelSide === 'right' ? x + 24 : x - 24;
  const anchor = labelSide === 'right' ? 'start' : 'end';
  return (
    <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x} y1={y - 24} x2={x} y2={y - 16} />
      <polygon points={`${x},${y - 16} ${x + 15},${y} ${x},${y + 16} ${x - 15},${y}`} />
      <line x1={x} y1={y + 16} x2={x} y2={y + 24} />
      <line x1={x} y1={y - 8} x2={x} y2={y + 6} stroke={COLORS.violet} />
      <polygon
        points={`${x},${y + 10} ${x - 3.5},${y + 4} ${x + 3.5},${y + 4}`}
        fill={COLORS.violet}
        stroke="none"
      />
      {label && (
        <text
          x={tx}
          y={y + 4}
          fill={COLORS.violet}
          stroke="none"
          fontSize="13"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Standard 3-bar Ground symbol.
 * Top connection point at (x, y).
 */
export function Ground({ x, y, label = 'GND', color = 'currentColor', accentColor }) {
  const c = accentColor || color;
  return (
    <g stroke={c} strokeWidth="2" strokeLinecap="round" fill="none">
      <line x1={x} y1={y} x2={x} y2={y + 9} />
      <line x1={x - 13} y1={y + 9} x2={x + 13} y2={y + 9} />
      <line x1={x - 8} y1={y + 14} x2={x + 8} y2={y + 14} />
      <line x1={x - 3.5} y1={y + 19} x2={x + 3.5} y2={y + 19} />
      {label && (
        <text
          x={x}
          y={y + 34}
          fill={accentColor || color}
          stroke="none"
          fontSize="12.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/**
 * Clean VDD power rail pill/bar.
 */
export function VddRail({ x, y, width = 80, label = 'VDD', color = 'currentColor' }) {
  const half = width / 2;
  return (
    <g>
      <rect
        x={x - 24}
        y={y - 25}
        width="48"
        height="18"
        rx="9"
        fill="rgba(56, 189, 248, 0.14)"
      />
      <text
        x={x}
        y={y - 11}
        fill={color}
        fontSize="13.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        {label}
      </text>
      <line
        x1={x - half}
        y1={y}
        x2={x + half}
        y2={y}
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * Input / Output Port dot & label in Cyber Blue (#38BDF8).
 */
export function PortDot({
  x,
  y,
  label,
  subLabel,
  labelPos = 'left',
  filled = false,
  color = COLORS.port,
}) {
  let tx = x - 11;
  let ty = y + 4;
  let anchor = 'end';
  if (labelPos === 'right') {
    tx = x + 11;
    anchor = 'start';
  } else if (labelPos === 'top') {
    tx = x;
    ty = y - 11;
    anchor = 'middle';
  } else if (labelPos === 'bottom') {
    tx = x;
    ty = y + 18;
    anchor = 'middle';
  }

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="3.8"
        fill={filled ? color : 'var(--svg-node-bg, #ffffff)'}
        stroke={color}
        strokeWidth="2"
      />
      {label && (
        <text
          x={tx}
          y={ty}
          fill={color}
          fontSize="14"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
      {subLabel && (
        <text
          x={tx}
          y={ty + 15}
          fill="currentColor"
          opacity="0.8"
          fontSize="11.5"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={anchor}
        >
          {subLabel}
        </text>
      )}
    </g>
  );
}

/**
 * Formula highlight box placed cleanly in a corner.
 */
export function FormulaBox({ x, y, w, h, lines, accent = COLORS.violet }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill="rgba(139, 92, 246, 0.08)"
        stroke={accent}
        strokeWidth="1.8"
      />
      {lines.map((line, idx) => (
        <text
          key={idx}
          x={x + w / 2}
          y={y + 22 + idx * 19}
          fill={idx === 0 ? accent : 'currentColor'}
          fontSize={idx === 0 ? '13.5' : '12.5'}
          fontWeight={idx === 0 ? '700' : '600'}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/**
 * Interactive hotspot ring/dot that updates the node pitfall hint on hover or tap.
 */
export function NodeHotspot({
  cx,
  cy,
  r = 16,
  badgeText,
  active = false,
  color = COLORS.violet,
  onActivate,
}) {
  return (
    <g
      onMouseEnter={onActivate}
      onClick={(e) => {
        e.stopPropagation();
        if (onActivate) onActivate();
      }}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={active ? 'rgba(139, 92, 246, 0.22)' : 'rgba(139, 92, 246, 0.10)'}
        stroke={color}
        strokeWidth={active ? '2.2' : '1.4'}
        strokeDasharray={active ? undefined : '3 3'}
      />
      {badgeText && (
        <text
          x={cx}
          y={cy + 4}
          fill={color}
          fontSize="12"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          {badgeText}
        </text>
      )}
    </g>
  );
}

/**
 * Simple BJT symbol (NPN/PNP) for Bandgap circuit.
 */
export function Bjt({ x, y, label, scaleText, mirror = false, color = 'currentColor' }) {
  const dir = mirror ? -1 : 1;
  return (
    <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Base lead & bar */}
      <line x1={x - 18 * dir} y1={y} x2={x - 5 * dir} y2={y} />
      <line x1={x - 5 * dir} y1={y - 12} x2={x - 5 * dir} y2={y + 12} strokeWidth="2.4" />
      {/* Collector (top) & Emitter (bottom) */}
      <line x1={x - 5 * dir} y1={y - 6} x2={x + 8 * dir} y2={y - 18} />
      <line x1={x + 8 * dir} y1={y - 18} x2={x + 8 * dir} y2={y - 26} />
      <line x1={x - 5 * dir} y1={y + 6} x2={x + 8 * dir} y2={y + 18} />
      <line x1={x + 8 * dir} y1={y + 18} x2={x + 8 * dir} y2={y + 26} />
      {/* PNP emitter arrow pointing into base */}
      <polygon
        points={`${x - 4 * dir},${y - 7} ${x + 3 * dir},${y - 15} ${x - 1 * dir},${y - 17}`}
        fill={color}
        stroke="none"
      />
      {label && (
        <text
          x={mirror ? x - 24 : x + 16}
          y={y + 4}
          fill={color}
          stroke="none"
          fontSize="13"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={mirror ? 'end' : 'start'}
        >
          {label}
        </text>
      )}
      {scaleText && (
        <text
          x={mirror ? x - 24 : x + 16}
          y={y + 18}
          fill={COLORS.violet}
          stroke="none"
          fontSize="11.5"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor={mirror ? 'end' : 'start'}
        >
          {scaleText}
        </text>
      )}
    </g>
  );
}
