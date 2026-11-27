import React from 'react';
import {
  COLORS,
  Nmos,
  Pmos,
  Resistor,
  Capacitor,
  Ground,
  VddRail,
  PortDot,
  FormulaBox,
  NodeHotspot,
  Bjt,
} from './cmosPrimitives.jsx';

/**
 * 3.1: Miller Effect Equivalent Decomposition
 */
export function Schematic31({ variant = '40', activeHint, onHint }) {
  const gain = Number(variant) || 40;
  const cfVal = 10; // fF example
  const cinVal = cfVal * (1 + gain);
  const coutVal = (cfVal * (1 + 1 / gain)).toFixed(2);

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left: Original Bridging Capacitor */}
      <text
        x="160"
        y="26"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        原始跨接寄生电容 (CGD / CF)
      </text>

      {/* Input & Output Wires */}
      <line x1="60" y1="176" x2="115" y2="176" stroke="currentColor" strokeWidth="2" />
      <PortDot x={58} y={176} label="Vin" labelPos="left" filled />

      <line x1="205" y1="176" x2="262" y2="176" stroke="currentColor" strokeWidth="2" />
      <PortDot
        x={264}
        y={176}
        label="Vout"
        subLabel={`=-${gain}·Vin`}
        labelPos="right"
        filled
      />

      {/* Inverting Amplifier Triangle */}
      <polygon
        points="115,138 115,214 205,176"
        fill="rgba(56, 189, 248, 0.08)"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <text
        x="148"
        y="181"
        fill={COLORS.violet}
        fontSize="15"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        -{gain}
      </text>

      {/* Bridging Capacitor CF */}
      <circle cx="84" cy="176" r="4" fill={COLORS.violet} />
      <circle cx="234" cy="176" r="4" fill={COLORS.violet} />
      <polyline
        points="84,176 84,88 144,88"
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="2.4"
      />
      <Capacitor
        x={160}
        y={88}
        label={`CF = ${cfVal} fF`}
        accentColor={COLORS.violet}
      />
      <polyline
        points="176,88 234,88 234,176"
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="2.4"
      />

      {/* Bidirectional Equivalence Arrow */}
      <path
        d="M 318 176 L 358 176"
        stroke={COLORS.port}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polygon points="366,176 355,170 355,182" fill={COLORS.port} />
      <polygon points="310,176 321,170 321,182" fill={COLORS.port} />
      <text
        x="338"
        y="160"
        fill={COLORS.port}
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        Miller 拆解
      </text>

      {/* Right: Equivalent Grounded Capacitors */}
      <text
        x="518"
        y="26"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        等效对地电容（跨接支路断开）
      </text>

      <line x1="398" y1="176" x2="465" y2="176" stroke="currentColor" strokeWidth="2" />
      <PortDot x={396} y={176} label="Vin" labelPos="top" filled />

      <polygon
        points="465,138 465,214 555,176"
        fill="rgba(56, 189, 248, 0.08)"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <text
        x="498"
        y="181"
        fill={COLORS.violet}
        fontSize="15"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        -{gain}
      </text>

      <line x1="555" y1="176" x2="622" y2="176" stroke="currentColor" strokeWidth="2" />
      <PortDot x={624} y={176} label="Vout" labelPos="top" filled />

      {/* Amplified Input Cap Cin_Miller */}
      <circle cx="426" cy="176" r="4.2" fill={COLORS.danger} />
      <line x1="426" y1="176" x2="426" y2="202" stroke={COLORS.danger} strokeWidth="2.4" />
      <Capacitor
        x={426}
        y={218}
        orientation="vertical"
        accentColor={COLORS.danger}
      />
      <line x1="426" y1="234" x2="426" y2="256" stroke={COLORS.danger} strokeWidth="2.4" />
      <Ground x={426} y={256} label="" />
      <text
        x="404"
        y="214"
        fill={COLORS.danger}
        fontSize="12.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="end"
      >
        Cin = {cinVal} fF
      </text>
      <text
        x="404"
        y="230"
        fill={COLORS.danger}
        fontSize="11.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="end"
      >
        = CF·(1+{gain})
      </text>
      <NodeHotspot
        cx={426}
        cy={218}
        r={20}
        color={COLORS.danger}
        active={activeHint === 'miller_cin'}
        onActivate={() =>
          onHint(
            'miller_cin',
            '门往前推 1cm，对面大力士往后拉 100cm，输入端必须多灌 101 倍电荷！这就是输入带宽暴跌的元凶。'
          )
        }
      />

      {/* Output Cap Cout_Miller */}
      <circle cx="590" cy="176" r="3.8" fill="currentColor" />
      <line x1="590" y1="176" x2="590" y2="202" stroke="currentColor" strokeWidth="2" />
      <Capacitor x={590} y={218} orientation="vertical" />
      <line x1="590" y1="234" x2="590" y2="256" stroke="currentColor" strokeWidth="2" />
      <Ground x={590} y={256} label="" />
      <text
        x="608"
        y="215"
        fill="currentColor"
        fontSize="12"
        fontWeight="600"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        Cout ≈ {coutVal} fF
      </text>
      <text
        x="608"
        y="231"
        fill="currentColor"
        opacity="0.7"
        fontSize="11"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        ≈ CF (几乎不变)
      </text>

      {/* Formula + RHP Zero Pitfall */}
      <FormulaBox
        x={28}
        y={266}
        w={334}
        h={62}
        accent={COLORS.danger}
        lines={[
          `Cin_Miller = CF · (1 + |Av|) = ${cinVal} fF`,
          '⚠️ 避坑：密勒近似会漏掉 RHP 零点 ωz = +gm/CGD',
        ]}
      />
    </svg>
  );
}

/**
 * 3.2: Node RC Pole Counting (Cascode 3-Node Interactive Locator)
 */
export function Schematic32({ variant = '3', onVariantChange, activeHint, onHint }) {
  const activeNode = variant || '3';

  const nodeSpecs = {
    '1': {
      title: '① 输入栅极节点 (Input Gate)',
      r: 'R_node = RS',
      c: 'C_node = CGS1 + 2·CGD1',
      pole: 'ωp_in = 1 / [RS · (CGS1 + 2·CGD1)]',
      note: '因 M2 屏蔽，M1 处密勒倍数只有 2 倍！',
      color: COLORS.port,
    },
    '2': {
      title: '② 中间叠层节点 X (Internal Node X)',
      r: 'R_node ≈ 1 / gm2（极低阻！）',
      c: 'C_node = CDB1 + CSB2 + CGS2',
      pole: 'ωpX ≈ gm2 / (CDB1 + CSB2 + CGS2)',
      note: '阻抗仅几百欧，属于高频次极点（远离主极点）。',
      color: COLORS.amber,
    },
    '3': {
      title: '③ 顶部输出节点 (Output Node)',
      r: 'R_node = Rout ≈ (gm2·rO2·rO1) ∥ Rload（极高阻！）',
      c: 'C_node = CL + CDB2 + CGD2',
      pole: 'ωp1 = 1 / (Rout · Cout) ← 主极点！',
      note: '高阻输出节点通常是决定整个运放带宽的主极点 ωp1！',
      color: COLORS.violet,
    },
  };

  const handleSelectNode = (nodeId) => {
    if (onVariantChange) onVariantChange(nodeId);
    onHint(`node_${nodeId}`, nodeSpecs[nodeId].note);
  };

  const current = nodeSpecs[activeNode] || nodeSpecs['3'];

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left: Cascode with RS & CL */}
      <VddRail x={210} y={36} width={84} />
      <line x1="210" y1="36" x2="210" y2="48" stroke="currentColor" strokeWidth="2" />
      <Resistor x={210} y={70} label="Rload" />
      <line x1="210" y1="92" x2="210" y2="132" stroke="currentColor" strokeWidth="2" />

      {/* Output Node 3 */}
      <circle cx="210" cy="112" r="4.5" fill={COLORS.violet} />
      <line x1="210" y1="112" x2="310" y2="112" stroke="currentColor" strokeWidth="2" />
      <PortDot x={312} y={112} label="Vout" labelPos="right" filled />

      {/* Output Cap CL */}
      <circle cx="282" cy="112" r="3.5" fill="currentColor" />
      <line x1="282" y1="112" x2="282" y2="144" stroke="currentColor" strokeWidth="2" />
      <Capacitor x={282} y={160} orientation="vertical" label="CL" labelPos="right" />
      <line x1="282" y1="176" x2="282" y2="202" stroke="currentColor" strokeWidth="2" />
      <Ground x={282} y={202} label="" />

      {/* M2 */}
      <line x1="138" y1="158" x2="178" y2="158" stroke={COLORS.violet} strokeWidth="2" />
      <PortDot x={136} y={158} label="Vb" labelPos="left" color={COLORS.violet} />
      <Nmos x={202} y={158} label="M2" highlightGate />

      {/* Node X (Node 2) */}
      <line x1="210" y1="184" x2="210" y2="218" stroke="currentColor" strokeWidth="2" />
      <circle cx="210" cy="201" r="4.5" fill={COLORS.amber} />

      {/* M1 */}
      <Nmos x={202} y={244} label="M1" />
      <line x1="210" y1="270" x2="210" y2="286" stroke="currentColor" strokeWidth="2" />
      <Ground x={210} y={286} />

      {/* Input RS & Gate Node 1 */}
      <line x1="56" y1="244" x2="72" y2="244" stroke="currentColor" strokeWidth="2" />
      <PortDot x={54} y={244} label="Vin" labelPos="left" filled />
      <Resistor x={94} y={244} orientation="horizontal" label="RS" />
      <line x1="116" y1="244" x2="178" y2="244" stroke="currentColor" strokeWidth="2" />
      <circle cx="148" cy="244" r="4.5" fill={COLORS.port} />

      {/* 3 Clickable Glowing Node Hotspots */}
      <NodeHotspot
        cx={148}
        cy={244}
        r={14}
        badgeText="①"
        color={COLORS.port}
        active={activeNode === '1' || activeHint === 'node_1'}
        onActivate={() => handleSelectNode('1')}
      />
      <NodeHotspot
        cx={210}
        cy={201}
        r={14}
        badgeText="②"
        color={COLORS.amber}
        active={activeNode === '2' || activeHint === 'node_2'}
        onActivate={() => handleSelectNode('2')}
      />
      <NodeHotspot
        cx={248}
        cy={112}
        r={14}
        badgeText="③"
        color={COLORS.violet}
        active={activeNode === '3' || activeHint === 'node_3'}
        onActivate={() => handleSelectNode('3')}
      />

      {/* Right Panel: Interactive Node Pole Inspector */}
      <rect
        x="362"
        y="30"
        width="298"
        height="276"
        rx="12"
        fill="rgba(139, 92, 246, 0.06)"
        stroke={current.color}
        strokeWidth="1.8"
      />
      <text
        x="380"
        y="56"
        fill={current.color}
        fontSize="13.5"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {current.title}
      </text>
      <text
        x="380"
        y="80"
        fill="currentColor"
        fontSize="12"
        fontWeight="600"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {current.r}
      </text>
      <text
        x="380"
        y="102"
        fill="currentColor"
        fontSize="12"
        fontWeight="600"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {current.c}
      </text>
      <rect
        x="378"
        y="116"
        width="266"
        height="34"
        rx="8"
        fill="rgba(15, 23, 42, 0.12)"
        stroke={current.color}
        strokeWidth="1.2"
      />
      <text
        x="511"
        y="137"
        fill={current.color}
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        {current.pole}
      </text>

      {/* Summary of all 3 rules */}
      <line
        x1="378"
        y1="168"
        x2="644"
        y2="168"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <text
        x="380"
        y="190"
        fill="currentColor"
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        数节点 RC 万能定律：ωp = 1/(R_node · C_node)
      </text>
      <text
        x="380"
        y="214"
        fill={COLORS.port}
        fontSize="11.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        ① 输入节点：RS 驱动 CGS1+2CGD1
      </text>
      <text
        x="380"
        y="236"
        fill={COLORS.amber}
        fontSize="11.5"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        ② 中间 Node X：低阻 1/gm2 → 高频次极点
      </text>
      <text
        x="380"
        y="258"
        fill={COLORS.violet}
        fontSize="11.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        ③ 输出节点：高阻 Rout · Cout → 主极点 ωp1
      </text>
      <text
        x="380"
        y="288"
        fill="currentColor"
        opacity="0.78"
        fontSize="11"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        💡 点击左图 ① ② ③ 气泡可切换检查对应极点
      </text>
    </svg>
  );
}

/**
 * 4.1: 4 Negative Feedback Topologies Block Diagram
 */
export function Schematic41({ variant = 'vv', activeHint, onHint }) {
  const configs = {
    vv: {
      title: '电压-串联反馈 (Voltage-Voltage)',
      inMode: 'series',
      outMode: 'voltage',
      inLabel: 'Vin',
      outLabel: 'Vout',
      ampType: '理想电压放大器 (Vout / Vin)',
      rinText: 'Rin_closed = Rin · (1 + Aβ)  ↑ 变大',
      routText: 'Rout_closed = Rout / (1 + Aβ) ↓ 变小',
      rinUp: true,
      routUp: false,
    },
    iv: {
      title: '电流-串联反馈 (Current-Voltage)',
      inMode: 'series',
      outMode: 'current',
      inLabel: 'Vin',
      outLabel: 'Iout',
      ampType: '理想跨导放大器 (Iout / Vin)',
      rinText: 'Rin_closed = Rin · (1 + Aβ)  ↑ 变大',
      routText: 'Rout_closed = Rout · (1 + Aβ) ↑ 变大',
      rinUp: true,
      routUp: true,
    },
    vi: {
      title: '电压-并联反馈 (Voltage-Current)',
      inMode: 'shunt',
      outMode: 'voltage',
      inLabel: 'Iin',
      outLabel: 'Vout',
      ampType: '理想跨阻放大器 (Vout / Iin)',
      rinText: 'Rin_closed = Rin / (1 + Aβ)  ↓ 变小',
      routText: 'Rout_closed = Rout / (1 + Aβ) ↓ 变小',
      rinUp: false,
      routUp: false,
    },
    ii: {
      title: '电流-并联反馈 (Current-Current)',
      inMode: 'shunt',
      outMode: 'current',
      inLabel: 'Iin',
      outLabel: 'Iout',
      ampType: '理想电流放大器 (Iout / Iin)',
      rinText: 'Rin_closed = Rin / (1 + Aβ)  ↓ 变小',
      routText: 'Rout_closed = Rout · (1 + Aβ) ↑ 变大',
      rinUp: false,
      routUp: true,
    },
  };

  const cfg = configs[variant] || configs.vv;
  const isSeriesIn = cfg.inMode === 'series';
  const isVoltOut = cfg.outMode === 'voltage';

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      <text
        x="340"
        y="24"
        fill="currentColor"
        fontSize="14"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        {cfg.title} · {cfg.ampType}
      </text>

      {/* Main Forward Amplifier Block A */}
      <rect
        x="245"
        y="56"
        width="190"
        height="64"
        rx="10"
        fill="rgba(56, 189, 248, 0.10)"
        stroke={COLORS.port}
        strokeWidth="2.2"
      />
      <text
        x="340"
        y="94"
        fill="currentColor"
        fontSize="16"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        开环放大器 A
      </text>

      {/* Feedback Network Block Beta */}
      <rect
        x="245"
        y="174"
        width="190"
        height="56"
        rx="10"
        fill="rgba(139, 92, 246, 0.10)"
        stroke={COLORS.violet}
        strokeWidth="2.2"
      />
      <text
        x="340"
        y="207"
        fill={COLORS.violet}
        fontSize="15.5"
        fontWeight="800"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        反馈网络 β
      </text>

      {/* Input Mixing Wiring */}
      {isSeriesIn ? (
        <>
          {/* Series voltage summing */}
          <line x1="78" y1="74" x2="150" y2="74" stroke="currentColor" strokeWidth="2" />
          <PortDot x={76} y={74} label={cfg.inLabel} labelPos="left" filled />
          <circle
            cx="166"
            cy="88"
            r="16"
            fill="rgba(139, 92, 246, 0.08)"
            stroke={COLORS.violet}
            strokeWidth="2"
          />
          <text x="155" y="81" fill={COLORS.safe} fontSize="13" fontWeight="800">+</text>
          <text x="157" y="102" fill={COLORS.danger} fontSize="14" fontWeight="800">−</text>
          <line x1="182" y1="88" x2="245" y2="88" stroke="currentColor" strokeWidth="2" />
          <polyline
            points="245,202 166,202 166,104"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.2"
          />
          <polygon points="166,106 162,115 170,115" fill={COLORS.violet} />
          <text
            x="116"
            y="148"
            fill={COLORS.safe}
            fontSize="12"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            串联混合 (电压减)
          </text>
        </>
      ) : (
        <>
          {/* Parallel current node mixing */}
          <line x1="78" y1="88" x2="245" y2="88" stroke="currentColor" strokeWidth="2" />
          <PortDot x={76} y={88} label={cfg.inLabel} labelPos="left" filled />
          <circle cx="166" cy="88" r="5.5" fill={COLORS.violet} />
          <polyline
            points="245,202 166,202 166,94"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.2"
          />
          <polygon points="166,198 162,188 170,188" fill={COLORS.violet} transform="rotate(180 166 193)" />
          <text
            x="114"
            y="148"
            fill={COLORS.amber}
            fontSize="12"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            并联混合 (同一节点)
          </text>
        </>
      )}

      {/* Output Sampling Wiring */}
      {isVoltOut ? (
        <>
          {/* Parallel voltage sampling */}
          <line x1="435" y1="88" x2="594" y2="88" stroke="currentColor" strokeWidth="2" />
          <PortDot x={596} y={88} label={cfg.outLabel} labelPos="right" filled />
          <circle cx="515" cy="88" r="5" fill={COLORS.violet} />
          <polyline
            points="515,88 515,202 442,202"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.2"
          />
          <polygon points="437,202 446,198 446,206" fill={COLORS.violet} />
          <text
            x="576"
            y="148"
            fill={COLORS.port}
            fontSize="12"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            电压采样 (并联)
          </text>
        </>
      ) : (
        <>
          {/* Series current sampling */}
          <line x1="435" y1="88" x2="594" y2="88" stroke="currentColor" strokeWidth="2" />
          <PortDot x={596} y={88} label={cfg.outLabel} labelPos="right" filled />
          {/* Series current pickup loop */}
          <rect
            x="498"
            y="78"
            width="34"
            height="20"
            rx="5"
            fill="rgba(139, 92, 246, 0.16)"
            stroke={COLORS.violet}
            strokeWidth="2"
          />
          <text
            x="515"
            y="92"
            fill={COLORS.violet}
            fontSize="11"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            I串
          </text>
          <polyline
            points="515,98 515,202 442,202"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.2"
          />
          <polygon points="437,202 446,198 446,206" fill={COLORS.violet} />
          <text
            x="576"
            y="148"
            fill={COLORS.safe}
            fontSize="12"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            电流采样 (串联)
          </text>
        </>
      )}

      {/* Hotspot on output sampling point */}
      <NodeHotspot
        cx={515}
        cy={88}
        r={18}
        active={activeHint === 'sample_out'}
        onActivate={() =>
          onHint(
            'sample_out',
            '把 Vout 交流接地，反馈消失就是电压采样，否则是电流采样！（如源极退化电阻 RS 采样的是电流）'
          )
        }
      />

      {/* Impedance Impact Badges */}
      <FormulaBox
        x={48}
        y={252}
        w={286}
        h={72}
        accent={cfg.rinUp ? COLORS.safe : COLORS.amber}
        lines={[
          '输入端：串联变大 / 并联变小',
          cfg.rinText,
          'A_closed = A/(1 + Aβ) ≈ 1/β',
        ]}
      />
      <FormulaBox
        x={348}
        y={252}
        w={286}
        h={72}
        accent={cfg.routUp ? COLORS.safe : COLORS.amber}
        lines={[
          '输出端：电压变小 / 电流变大',
          cfg.routText,
          '闭环带宽拓展 (1 + Aβ) 倍',
        ]}
      />
    </svg>
  );
}

/**
 * 4.2: Classic Op-Amp Topologies (Telescopic / Folded / Two-Stage)
 */
export function Schematic42({ variant = 'all', activeHint, onHint }) {
  const showTele = variant === 'all' || variant === 'telescopic';
  const showFold = variant === 'all' || variant === 'folded';
  const showTwo = variant === 'all' || variant === 'twostage';

  const getTransform = (pos) => {
    if (variant === 'all') {
      if (pos === 'tele') return 'translate(0, 0)';
      if (pos === 'fold') return 'translate(226, 0)';
      return 'translate(452, 0)';
    }
    return 'translate(215, 0) scale(1.06)';
  };

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* 1. Telescopic */}
      {showTele && (
        <g transform={getTransform('tele')}>
          <rect
            x="14"
            y="14"
            width="202"
            height="312"
            rx="12"
            fill="rgba(56, 189, 248, 0.04)"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="1.4"
          />
          <text
            x="115"
            y="36"
            fill="currentColor"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            套筒式 (Telescopic)
          </text>
          <text
            x="115"
            y="53"
            fill={COLORS.port}
            fontSize="11"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            单支路叠 5 层 · 最快省电
          </text>

          {/* 5 Stacked Blocks representing M_tail, M1, M2, M3, M4 */}
          <line x1="88" y1="68" x2="88" y2="274" stroke="currentColor" strokeWidth="2" />
          {[
            { y: 80, name: 'PMOS Cascode 2', c: COLORS.violet },
            { y: 118, name: 'PMOS Cascode 1', c: COLORS.violet },
            { y: 162, name: 'NMOS Cascode', c: COLORS.port },
            { y: 200, name: 'NMOS 输入管', c: COLORS.port },
            { y: 238, name: '尾电流源 M5', c: 'currentColor' },
          ].map((blk, i) => (
            <g key={i}>
              <rect
                x="44"
                y={blk.y}
                width="88"
                height="26"
                rx="6"
                fill="rgba(15,23,42,0.08)"
                stroke={blk.c}
                strokeWidth="1.6"
              />
              <text
                x="88"
                y={blk.y + 17}
                fill="currentColor"
                fontSize="10.5"
                fontWeight="600"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                textAnchor="middle"
              >
                {blk.name}
              </text>
            </g>
          ))}
          <circle cx="88" cy="153" r="4" fill={COLORS.port} />
          <line x1="88" y1="153" x2="128" y2="153" stroke={COLORS.port} strokeWidth="2" />
          <text x="132" y="157" fill={COLORS.port} fontSize="11" fontWeight="700">Vout</text>

          {/* Swing Ruler */}
          <line x1="168" y1="120" x2="168" y2="196" stroke={COLORS.danger} strokeWidth="2.5" />
          <text
            x="174"
            y="162"
            fill={COLORS.danger}
            fontSize="11"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            窄摆幅
          </text>
          <text
            x="115"
            y="302"
            fill={COLORS.danger}
            fontSize="12"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            摆幅: VDD - 5VOV
          </text>
          <text
            x="115"
            y="318"
            fill="currentColor"
            opacity="0.75"
            fontSize="10.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            输入输出不可直接短接
          </text>
        </g>
      )}

      {/* 2. Folded Cascode */}
      {showFold && (
        <g transform={getTransform('fold')}>
          <rect
            x="14"
            y="14"
            width="202"
            height="312"
            rx="12"
            fill="rgba(139, 92, 246, 0.05)"
            stroke={COLORS.violet}
            strokeOpacity="0.35"
            strokeWidth="1.4"
          />
          <text
            x="115"
            y="36"
            fill="currentColor"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            折叠式 (Folded)
          </text>
          <text
            x="115"
            y="53"
            fill={COLORS.violet}
            fontSize="11"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            两条并行支路 · 功耗翻倍
          </text>

          {/* Left Input Branch */}
          <rect x="28" y="132" width="60" height="44" rx="7" fill="rgba(56,189,248,0.1)" stroke={COLORS.port} strokeWidth="1.6" />
          <text x="58" y="158" fill="currentColor" fontSize="11" fontWeight="700" textAnchor="middle">输入差动</text>
          <rect x="28" y="194" width="60" height="34" rx="7" fill="rgba(15,23,42,0.08)" stroke="currentColor" strokeWidth="1.6" />
          <text x="58" y="215" fill="currentColor" fontSize="10.5" textAnchor="middle">尾电流源</text>
          <line x1="58" y1="176" x2="58" y2="194" stroke="currentColor" strokeWidth="2" />

          {/* Folding Bridge */}
          <polyline points="58,132 58,92 132,92" fill="none" stroke={COLORS.violet} strokeWidth="2.2" strokeDasharray="4 3" />
          <polygon points="136,92 128,88 128,96" fill={COLORS.violet} />
          <text x="95" y="84" fill={COLORS.violet} fontSize="10.5" fontWeight="700" textAnchor="middle">折叠电流</text>

          {/* Right Output Stack (4 layers) */}
          {[
            { y: 74, name: '上负载', c: 'currentColor' },
            { y: 112, name: 'Cascode', c: COLORS.violet },
            { y: 162, name: 'Cascode', c: COLORS.violet },
            { y: 200, name: '电流源', c: 'currentColor' },
          ].map((blk, i) => (
            <g key={i}>
              <rect x="116" y={blk.y} width="66" height="28" rx="6" fill="rgba(15,23,42,0.08)" stroke={blk.c} strokeWidth="1.6" />
              <text x="149" y={blk.y + 18} fill="currentColor" fontSize="10.5" fontWeight="600" textAnchor="middle">{blk.name}</text>
            </g>
          ))}
          <line x1="149" y1="140" x2="149" y2="162" stroke="currentColor" strokeWidth="2" />
          <circle cx="149" cy="151" r="4" fill={COLORS.port} />
          <line x1="149" y1="151" x2="188" y2="151" stroke={COLORS.port} strokeWidth="2" />
          <text x="190" y="155" fill={COLORS.port} fontSize="11" fontWeight="700">Vout</text>

          <text
            x="115"
            y="302"
            fill={COLORS.amber}
            fontSize="12"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            摆幅: VDD - 4VOV
          </text>
          <text
            x="115"
            y="318"
            fill="currentColor"
            opacity="0.75"
            fontSize="10.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            输入输出可短接 · 单级高增益
          </text>
        </g>
      )}

      {/* 3. Two-Stage Miller Op-Amp */}
      {showTwo && (
        <g transform={getTransform('two')}>
          <rect
            x="14"
            y="14"
            width="202"
            height="312"
            rx="12"
            fill="rgba(16, 185, 129, 0.05)"
            stroke={COLORS.safe}
            strokeOpacity="0.45"
            strokeWidth="1.6"
          />
          <text
            x="115"
            y="36"
            fill="currentColor"
            fontSize="12.5"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            两级运放 (Two-Stage)
          </text>
          <text
            x="115"
            y="53"
            fill={COLORS.safe}
            fontSize="11"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            输出仅 2 层 · 摆幅最大
          </text>

          {/* Stage 1 OTA */}
          <rect x="26" y="114" width="66" height="82" rx="8" fill="rgba(56,189,248,0.1)" stroke={COLORS.port} strokeWidth="1.8" />
          <text x="59" y="146" fill="currentColor" fontSize="11" fontWeight="700" textAnchor="middle">第 1 级</text>
          <text x="59" y="164" fill={COLORS.port} fontSize="10.5" fontWeight="600" textAnchor="middle">五管差动</text>
          <text x="59" y="180" fill="currentColor" fontSize="10" textAnchor="middle">gm1·Rout1</text>

          <line x1="92" y1="155" x2="122" y2="155" stroke="currentColor" strokeWidth="2" />
          <circle cx="107" cy="155" r="3.5" fill={COLORS.violet} />

          {/* Stage 2 CS (2 layers only) */}
          <rect x="122" y="102" width="58" height="36" rx="6" fill="rgba(15,23,42,0.08)" stroke="currentColor" strokeWidth="1.6" />
          <text x="151" y="124" fill="currentColor" fontSize="10.5" fontWeight="600" textAnchor="middle">电流源 M7</text>

          <rect x="122" y="170" width="58" height="36" rx="6" fill="rgba(16,185,129,0.12)" stroke={COLORS.safe} strokeWidth="1.8" />
          <text x="151" y="192" fill="currentColor" fontSize="10.5" fontWeight="700" textAnchor="middle">共源 M6</text>

          <line x1="151" y1="138" x2="151" y2="170" stroke="currentColor" strokeWidth="2" />
          <circle cx="151" cy="154" r="4" fill={COLORS.safe} />
          <line x1="151" y1="154" x2="188" y2="154" stroke={COLORS.safe} strokeWidth="2" />
          <text x="190" y="158" fill={COLORS.safe} fontSize="11" fontWeight="700">Vout</text>

          {/* Dashed Miller Cap CC */}
          <polyline
            points="107,155 107,78 164,78 164,154"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <text x="135" y="72" fill={COLORS.violet} fontSize="11" fontWeight="700" textAnchor="middle">CC 补偿</text>

          <NodeHotspot
            cx={151}
            cy={186}
            r={18}
            color={COLORS.safe}
            active={activeHint === 'twostage_out'}
            onActivate={() =>
              onHint(
                'twostage_out',
                '输出级只有 2 个管子（M6 与 M7），所以输出摆幅能轻松做到 VDD - 2VOV！但双高阻节点必须加 CC 补偿。'
              )
            }
          />

          <text
            x="115"
            y="302"
            fill={COLORS.safe}
            fontSize="12"
            fontWeight="800"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            摆幅最宽: VDD - 2VOV
          </text>
          <text
            x="115"
            y="318"
            fill="currentColor"
            opacity="0.75"
            fontSize="10.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            必须加 CC 密勒补偿防自激
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * 5.1: Bode Plot & Phase Margin Geometric Visualizer
 */
export function Schematic51({ variant = 'pm60', activeHint, onHint }) {
  // Coordinates for Bode Magnitude (top: y 30..150) & Phase (bottom: y 182..312)
  // X-axis log frequency: wp1 at x=170, w_GX at x=390
  // Varying wp2 position:
  // pm60: wp2 = 465 (2.2 * w_GX) -> PM ≈ 65°
  // pm45: wp2 = 390 (= w_GX) -> PM = 45°
  // osc:  wp2 = 315 (< w_GX) -> PM ≈ 18° (danger!)
  const cfgMap = {
    pm60: {
      wp2X: 465,
      wp2Label: 'ωp2 = 2.2·ω_GX',
      pmText: 'PM ≈ 65° ≥ 60° (黄金稳态!)',
      pmDegY: 262, // phase at w_GX (~ -115 deg, well above -180 at y=296)
      color: COLORS.safe,
      phasePath: 'M 90 198 C 145 200, 175 245, 240 249 L 365 251 C 425 253, 465 276, 520 293 L 610 296',
    },
    pm45: {
      wp2X: 390,
      wp2Label: 'ωp2 = ω_GX',
      pmText: 'PM = 45° (临界振铃底线)',
      pmDegY: 274, // -135 deg
      color: COLORS.amber,
      phasePath: 'M 90 198 C 145 200, 175 245, 240 249 L 310 250 C 365 253, 395 274, 460 293 L 610 296',
    },
    osc: {
      wp2X: 315,
      wp2Label: 'ωp2 < ω_GX',
      pmText: 'PM ≈ 18° (甚至 <0° 振荡危险!)',
      pmDegY: 282, // very close to -180!
      color: COLORS.danger,
      phasePath: 'M 90 198 C 145 200, 175 245, 235 249 C 285 252, 320 275, 390 289 L 610 297',
    },
  };

  const cfg = cfgMap[variant] || cfgMap.pm60;
  // 0 dB line at y=118. A0=60dB at y=50.
  // Slope -20dB/dec: from x=170 (y=50) to x=390 (y=118) => slope = 68/220 ≈ 0.309 px/px.
  // After wp2X, slope doubles to ~0.618 px/px.
  const magAtWp2 = 50 + ((cfg.wp2X - 170) * 68) / 220;
  const endMagY = Math.min(156, magAtWp2 + (580 - cfg.wp2X) * 0.618);
  const endMagX = cfg.wp2X + (endMagY - magAtWp2) / 0.618;
  // Exact x where mag crosses 0dB (y=118)
  const gxX =
    cfg.wp2X >= 390
      ? 390
      : Math.round(cfg.wp2X + (118 - magAtWp2) / 0.618);

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Top Axis: Magnitude |βH| (dB) */}
      <line x1="82" y1="30" x2="82" y2="152" stroke="currentColor" strokeWidth="1.8" />
      <line x1="82" y1="152" x2="625" y2="152" stroke="currentColor" strokeWidth="1.5" />
      <text x="45" y="42" fill="currentColor" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
        |βH|
      </text>
      <text x="45" y="57" fill="currentColor" fontSize="11" fontFamily="ui-monospace, monospace">
        (dB)
      </text>

      {/* 0 dB reference line */}
      <line x1="82" y1="118" x2="625" y2="118" stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" strokeWidth="1.4" />
      <text x="74" y="122" fill="currentColor" fontSize="11.5" fontWeight="700" textAnchor="end" fontFamily="ui-monospace, monospace">
        0 dB
      </text>
      <text x="74" y="54" fill="currentColor" fontSize="11.5" fontWeight="700" textAnchor="end" fontFamily="ui-monospace, monospace">
        A0
      </text>

      {/* Magnitude Bode Curve */}
      <polyline
        points={`90,50 170,50 ${cfg.wp2X},${magAtWp2.toFixed(1)} ${endMagX.toFixed(1)},${endMagY.toFixed(1)}`}
        fill="none"
        stroke={COLORS.port}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="276" y="72" fill={COLORS.port} fontSize="11.5" fontWeight="700" fontFamily="ui-monospace, monospace">
        -20 dB/dec
      </text>
      <text x={cfg.wp2X + 12} y={Math.min(138, magAtWp2 + 12)} fill={COLORS.violet} fontSize="11.5" fontWeight="700" fontFamily="ui-monospace, monospace">
        -40 dB/dec
      </text>

      {/* Pole markers wp1 & wp2 */}
      <circle cx="170" cy="50" r="3.8" fill={COLORS.violet} />
      <text x="170" y="38" fill={COLORS.violet} fontSize="11.5" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace, monospace">
        ωp1
      </text>
      <circle cx={cfg.wp2X} cy={magAtWp2} r="4.2" fill={COLORS.violet} />
      <text x={cfg.wp2X} y={magAtWp2 - 11} fill={COLORS.violet} fontSize="11.5" fontWeight="700" textAnchor="middle" fontFamily="ui-monospace, monospace">
        {cfg.wp2Label}
      </text>

      {/* Vertical Drop Line at Gain Crossover w_GX */}
      <line
        x1={gxX}
        y1="118"
        x2={gxX}
        y2="314"
        stroke={COLORS.danger}
        strokeWidth="1.8"
        strokeDasharray="5 4"
      />
      <circle cx={gxX} cy="118" r="4.5" fill={COLORS.danger} />
      <text
        x={gxX}
        y="170"
        fill={COLORS.danger}
        fontSize="12"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
      >
        ω_GX (0 dB 交越)
      </text>

      {/* Bottom Axis: Phase ∠βH */}
      <line x1="82" y1="186" x2="82" y2="314" stroke="currentColor" strokeWidth="1.8" />
      <line x1="82" y1="314" x2="625" y2="314" stroke="currentColor" strokeWidth="1.5" />
      <text x="42" y="204" fill="currentColor" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
        ∠βH
      </text>
      <text x="640" y="318" fill="currentColor" fontSize="12" fontWeight="700" fontFamily="ui-monospace, monospace">
        lg ω
      </text>

      {/* Phase Labels */}
      <text x="74" y="202" fill="currentColor" fontSize="11" textAnchor="end" fontFamily="ui-monospace, monospace">0°</text>
      <text x="74" y="252" fill="currentColor" fontSize="11" textAnchor="end" fontFamily="ui-monospace, monospace">-90°</text>
      <line x1="82" y1="248" x2="625" y2="248" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />

      {/* -180 deg Red Danger Threshold */}
      <line x1="82" y1="296" x2="625" y2="296" stroke={COLORS.danger} strokeWidth="2" strokeDasharray="6 4" />
      <text x="74" y="300" fill={COLORS.danger} fontSize="11.5" fontWeight="800" textAnchor="end" fontFamily="ui-monospace, monospace">
        -180°
      </text>
      <NodeHotspot
        cx={565}
        cy={296}
        r={16}
        color={COLORS.danger}
        active={activeHint === 'neg180'}
        onActivate={() =>
          onHint(
            'neg180',
            '一旦增益还没降到 0 dB 相位就掉到 -180°，负反馈变正反馈，运放直接变成自激振荡器！'
          )
        }
      />

      {/* Phase Curve */}
      <path
        d={cfg.phasePath}
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* PM Bidirectional Margin Arrow at w_GX */}
      <line x1={gxX} y1={cfg.pmDegY} x2={gxX} y2="294" stroke={cfg.color} strokeWidth="3" />
      <polygon points={`${gxX},${cfg.pmDegY - 2} ${gxX - 4},${cfg.pmDegY + 6} ${gxX + 4},${cfg.pmDegY + 6}`} fill={cfg.color} />
      <polygon points={`${gxX},296 ${gxX - 4},288 ${gxX + 4},288`} fill={cfg.color} />

      {/* Callout Badge for PM */}
      <rect
        x="430"
        y="196"
        width="234"
        height="46"
        rx="8"
        fill="rgba(16, 185, 129, 0.08)"
        stroke={cfg.color}
        strokeWidth="1.8"
      />
      <text
        x="547"
        y="216"
        fill={cfg.color}
        fontSize="12"
        fontWeight="800"
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        {cfg.pmText}
      </text>
      <text
        x="547"
        y="234"
        fill="currentColor"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        PM = 180° + ∠βH(ω_GX)
      </text>
    </svg>
  );
}

/**
 * 5.2: Two-Stage Op-Amp Miller Compensation, Zeroing Resistor RZ & Pole Splitting
 */
export function Schematic52({ variant = 'rz_cancel', activeHint, onHint }) {
  const hasRz = variant === 'rz_cancel' || variant === 'rz_lhp';
  const isLhp = variant === 'rz_lhp';

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left Half: 2-Stage Op-Amp + CC + RZ */}
      <text
        x="164"
        y="24"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        两级运放密勒补偿电路
      </text>

      {/* Stage 1 OTA */}
      <polygon
        points="42,150 42,226 112,188"
        fill="rgba(56, 189, 248, 0.1)"
        stroke={COLORS.port}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <text x="68" y="192" fill="currentColor" fontSize="12.5" fontWeight="800" textAnchor="middle">
        gm1
      </text>
      <line x1="22" y1="170" x2="42" y2="170" stroke="currentColor" strokeWidth="2" />
      <line x1="22" y1="206" x2="42" y2="206" stroke="currentColor" strokeWidth="2" />
      <text x="18" y="174" fill={COLORS.port} fontSize="12" fontWeight="700" textAnchor="end">+</text>
      <text x="18" y="210" fill={COLORS.port} fontSize="12" fontWeight="700" textAnchor="end">−</text>

      {/* Node A */}
      <line x1="112" y1="188" x2="176" y2="188" stroke="currentColor" strokeWidth="2" />
      <circle cx="144" cy="188" r="4.5" fill={COLORS.violet} />
      <text
        x="144"
        y="210"
        fill={COLORS.violet}
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        Node A
      </text>

      {/* Stage 2 CS M6 */}
      <VddRail x={208} y={120} width={56} />
      <line x1="208" y1="120" x2="208" y2="162" stroke="currentColor" strokeWidth="2" />
      <Nmos x={200} y={188} label="M6" subLabel="gm2" labelSide="left" />
      <line x1="208" y1="214" x2="208" y2="246" stroke="currentColor" strokeWidth="2" />
      <Ground x={208} y={246} />

      {/* Node B / Vout + CL */}
      <circle cx="208" cy="148" r="4.5" fill={COLORS.violet} />
      <line x1="208" y1="148" x2="306" y2="148" stroke="currentColor" strokeWidth="2" />
      <PortDot x={308} y={148} label="Vout(B)" labelPos="top" filled />

      <circle cx="276" cy="148" r="3.5" fill="currentColor" />
      <line x1="276" y1="148" x2="276" y2="174" stroke="currentColor" strokeWidth="2" />
      <Capacitor x={276} y={190} orientation="vertical" label="CL" labelPos="right" />
      <line x1="276" y1="206" x2="276" y2="246" stroke="currentColor" strokeWidth="2" />
      <Ground x={276} y={246} label="" />

      {/* Miller Compensation Bridge CC + optional RZ */}
      <polyline
        points="144,188 144,72 168,72"
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="2.4"
      />
      {hasRz ? (
        <>
          <Capacitor x={184} y={72} label="CC" accentColor={COLORS.violet} />
          <line x1="200" y1="72" x2="220" y2="72" stroke={COLORS.violet} strokeWidth="2.4" />
          <Resistor
            x={242}
            y={72}
            orientation="horizontal"
            label="RZ"
            color={COLORS.safe}
          />
          <polyline
            points="264,72 288,72 288,148"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.4"
          />
          <NodeHotspot
            cx={242}
            cy={72}
            r={18}
            color={COLORS.safe}
            active={activeHint === 'rz'}
            onActivate={() =>
              onHint(
                'rz',
                '期末压轴大题必考公式：ωz = 1 / [CC·(1/gm2 - RZ)]，取 RZ = 1/gm2 彻底消灭右半平面零点！'
              )
            }
          />
        </>
      ) : (
        <>
          <Capacitor x={216} y={72} label="CC (未加 RZ)" accentColor={COLORS.violet} />
          <polyline
            points="168,72 200,72"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.4"
          />
          <polyline
            points="232,72 288,72 288,148"
            fill="none"
            stroke={COLORS.violet}
            strokeWidth="2.4"
          />
          <NodeHotspot
            cx={216}
            cy={72}
            r={18}
            color={COLORS.danger}
            active={activeHint === 'rz'}
            onActivate={() =>
              onHint(
                'rz',
                '未串调零电阻 RZ 时，CC 前馈通路会引入恶毒的右半平面零点 ωz = +gm2/CC！点击上方切换加入 RZ。'
              )
            }
          />
        </>
      )}

      {/* Divider */}
      <line
        x1="340"
        y1="26"
        x2="340"
        y2="296"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />

      {/* Right Half: s-plane Pole Splitting & Zero Trajectory */}
      <text
        x="510"
        y="24"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        s 平面：极点分裂 (Pole Splitting) &amp; 零点移动
      </text>

      {/* s-plane axes */}
      <line x1="358" y1="156" x2="656" y2="156" stroke="currentColor" strokeWidth="1.8" />
      <line x1="538" y1="54" x2="538" y2="256" stroke="currentColor" strokeWidth="1.8" />
      <text x="658" y="160" fill="currentColor" fontSize="11.5" fontWeight="700">Re(s)</text>
      <text x="538" y="48" fill="currentColor" fontSize="11.5" fontWeight="700" textAnchor="middle">Im(s)</text>

      {/* LHP vs RHP shading */}
      <rect x="539" y="56" width="114" height="198" fill="rgba(239, 68, 68, 0.06)" />
      <text x="596" y="74" fill={COLORS.danger} fontSize="11" fontWeight="700" textAnchor="middle">RHP (危险区)</text>
      <text x="446" y="74" fill={COLORS.safe} fontSize="11" fontWeight="700" textAnchor="middle">LHP (稳定区)</text>

      {/* Original close poles (gray dashed) */}
      <text x="498" y="161" fill="currentColor" opacity="0.45" fontSize="15" fontWeight="800" textAnchor="middle">×</text>
      <text x="478" y="161" fill="currentColor" opacity="0.45" fontSize="15" fontWeight="800" textAnchor="middle">×</text>

      {/* Split arrows */}
      <path d="M 505 142 Q 520 120 532 140" fill="none" stroke={COLORS.violet} strokeWidth="2" />
      <polygon points="534,144 526,139 533,134" fill={COLORS.violet} />
      <text x="526" y="122" fill={COLORS.violet} fontSize="11" fontWeight="700" textAnchor="middle">ωp1 左移</text>
      <text x="530" y="161" fill={COLORS.violet} fontSize="16" fontWeight="900" textAnchor="middle">×</text>

      <path d="M 472 142 Q 430 116 388 140" fill="none" stroke={COLORS.violet} strokeWidth="2.2" />
      <polygon points="384,144 393,142 388,134" fill={COLORS.violet} />
      <text x="424" y="120" fill={COLORS.violet} fontSize="11" fontWeight="700" textAnchor="middle">ωp2 = gm2/CL 右推</text>
      <text x="382" y="161" fill={COLORS.violet} fontSize="16" fontWeight="900" textAnchor="middle">×</text>

      {/* Zero Behavior */}
      {!hasRz && (
        <>
          <circle cx="592" cy="156" r="6" fill="none" stroke={COLORS.danger} strokeWidth="2.6" />
          <text x="592" y="182" fill={COLORS.danger} fontSize="11.5" fontWeight="800" textAnchor="middle">
            RHP 零点
          </text>
          <text x="592" y="198" fill={COLORS.danger} fontSize="11" fontWeight="700" textAnchor="middle">
            +gm2/CC
          </text>
        </>
      )}
      {variant === 'rz_cancel' && (
        <>
          <circle cx="576" cy="156" r="5" fill="none" stroke={COLORS.danger} strokeOpacity="0.4" strokeWidth="2" strokeDasharray="2 2" />
          <line x1="584" y1="156" x2="646" y2="156" stroke={COLORS.safe} strokeWidth="2.6" strokeDasharray="4 3" />
          <polygon points="652,156 642,151 642,161" fill={COLORS.safe} />
          <text x="604" y="184" fill={COLORS.safe} fontSize="11.5" fontWeight="800" textAnchor="middle">
            飞向 +∞ 消灭!
          </text>
          <text x="604" y="200" fill={COLORS.safe} fontSize="11" fontWeight="700" textAnchor="middle">
            RZ = 1/gm2
          </text>
        </>
      )}
      {isLhp && (
        <>
          <circle cx="586" cy="156" r="5" fill="none" stroke={COLORS.danger} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M 586 168 Q 486 218 390 168" fill="none" stroke={COLORS.safe} strokeWidth="2.4" strokeDasharray="4 3" />
          <polygon points="386,164 396,165 391,173" fill={COLORS.safe} />
          <circle cx="382" cy="156" r="6.5" fill="none" stroke={COLORS.safe} strokeWidth="2.6" />
          <text x="486" y="218" fill={COLORS.safe} fontSize="11.5" fontWeight="800" textAnchor="middle">
            零点翻转至 LHP 抵消 ωp2!
          </text>
        </>
      )}

      {/* Bottom Formula Banner */}
      <FormulaBox
        x={24}
        y={274}
        w={632}
        h={56}
        accent={hasRz ? COLORS.safe : COLORS.violet}
        lines={[
          'GBW = gm1 / CC  |  ωp2 = gm2 / CL  |  ωz = 1 / [CC · (1/gm2 - RZ)]',
          '调零模板：① 定 CC = gm1/GBW  ② 验 gm2/CL ≥ 2.2·GBW  ③ 取 RZ = 1/gm2 消零点',
        ]}
      />
    </svg>
  );
}

/**
 * 5.3: Bandgap Temperature Compensation Curves & Core Architecture
 */
export function Schematic53({ variant = 'dual', activeHint, onHint }) {
  const showCurve = variant === 'dual' || variant === 'curve';
  const showCircuit = variant === 'dual' || variant === 'circuit';

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left Half: CTAT + PTAT = 1.2V Temperature Curve */}
      {showCurve && (
        <g transform={variant === 'curve' ? 'translate(160, 0) scale(1.06)' : undefined}>
          <text
            x="156"
            y="24"
            fill="currentColor"
            fontSize="13"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            CTAT + PTAT = 1.2V 温度曲线叠加
          </text>

          {/* Axes */}
          <line x1="46" y1="48" x2="46" y2="256" stroke="currentColor" strokeWidth="2" />
          <line x1="46" y1="256" x2="288" y2="256" stroke="currentColor" strokeWidth="2" />
          <text x="34" y="54" fill="currentColor" fontSize="12" fontWeight="700" textAnchor="end">V</text>
          <text x="292" y="260" fill="currentColor" fontSize="12" fontWeight="700">T</text>
          <text x="58" y="274" fill="currentColor" opacity="0.7" fontSize="10.5">-40°C</text>
          <text x="166" y="274" fill="currentColor" opacity="0.7" fontSize="10.5" textAnchor="middle">27°C</text>
          <text x="270" y="274" fill="currentColor" opacity="0.7" fontSize="10.5" textAnchor="end">125°C</text>

          {/* VREF ≈ 1.2V Zero-TC Arch (Emerald) */}
          <path
            d="M 56 84 Q 166 72 276 86"
            fill="none"
            stroke={COLORS.safe}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <text
            x="166"
            y="66"
            fill={COLORS.safe}
            fontSize="12.5"
            fontWeight="800"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            合成基准 VREF ≈ 1.2V (零温漂)
          </text>

          {/* CTAT downward line (Cyber Blue) */}
          <line
            x1="58"
            y1="126"
            x2="274"
            y2="196"
            stroke={COLORS.port}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <text
            x="164"
            y="144"
            fill={COLORS.port}
            fontSize="11.5"
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            CTAT: VBE (-1.5 mV/K)
          </text>

          {/* PTAT upward line (Amber) */}
          <line
            x1="58"
            y1="234"
            x2="274"
            y2="164"
            stroke={COLORS.amber}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <text
            x="164"
            y="222"
            fill={COLORS.amber}
            fontSize="11.5"
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            PTAT: K·VT·ln(n) (+1.5 mV/K)
          </text>
        </g>
      )}

      {variant === 'dual' && (
        <line
          x1="318"
          y1="28"
          x2="318"
          y2="290"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />
      )}

      {/* Right Half: Classic Bandgap Core Circuit */}
      {showCircuit && (
        <g transform={variant === 'circuit' ? 'translate(-180, 0) scale(1.05)' : undefined}>
          <text
            x="498"
            y="24"
            fill="currentColor"
            fontSize="13"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            带隙基准核 (Op-Amp 钳位 + 1:n BJT)
          </text>

          <VddRail x={476} y={54} width={220} />

          {/* 3 PMOS Current Mirror Branches */}
          <line x1="392" y1="54" x2="392" y2="62" stroke="currentColor" strokeWidth="2" />
          <line x1="484" y1="54" x2="484" y2="62" stroke="currentColor" strokeWidth="2" />
          <line x1="592" y1="54" x2="592" y2="62" stroke="currentColor" strokeWidth="2" />

          <Pmos x={384} y={88} label="M1" labelSide="left" highlightGate />
          <Pmos x={476} y={88} label="M2" labelSide="right" highlightGate />
          <Pmos x={584} y={88} label="M3" labelSide="right" highlightGate />
          <line x1="360" y1="88" x2="560" y2="88" stroke={COLORS.violet} strokeWidth="2" />

          {/* Op-Amp clamping VX = VY */}
          <polygon
            points="418,128 456,144 418,160"
            fill="rgba(56, 189, 248, 0.1)"
            stroke={COLORS.port}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text x="431" y="148" fill={COLORS.port} fontSize="10" fontWeight="800" textAnchor="middle">Op</text>
          <polyline points="436,136 436,88" fill="none" stroke={COLORS.violet} strokeWidth="1.8" />
          <circle cx="392" cy="136" r="3.5" fill={COLORS.port} />
          <circle cx="484" cy="136" r="3.5" fill={COLORS.port} />
          <line x1="392" y1="136" x2="418" y2="136" stroke="currentColor" strokeWidth="1.8" />
          <polyline points="484,136 468,136 468,152 418,152" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <text x="382" y="139" fill={COLORS.port} fontSize="11.5" fontWeight="700" textAnchor="end">X</text>
          <text x="496" y="139" fill={COLORS.port} fontSize="11.5" fontWeight="700">Y</text>

          {/* Left Branch: Q1 (1x) */}
          <line x1="392" y1="114" x2="392" y2="210" stroke="currentColor" strokeWidth="2" />
          <Bjt x={384} y={236} label="Q1" scaleText="面积 1×" />
          <line x1="366" y1="236" x2="352" y2="236" stroke="currentColor" strokeWidth="1.8" />
          <line x1="352" y1="236" x2="352" y2="274" stroke="currentColor" strokeWidth="1.8" />
          <line x1="392" y1="262" x2="392" y2="274" stroke="currentColor" strokeWidth="2" />
          <Ground x={392} y={274} label="" />

          {/* Middle Branch: R1 + Q2 (nx) */}
          <line x1="484" y1="114" x2="484" y2="148" stroke="currentColor" strokeWidth="2" />
          <Resistor x={484} y={170} label="R1" />
          <line x1="484" y1="192" x2="484" y2="210" stroke="currentColor" strokeWidth="2" />
          <Bjt x={476} y={236} label="Q2" scaleText="面积 n×" />
          <line x1="484" y1="262" x2="484" y2="274" stroke="currentColor" strokeWidth="2" />
          <Ground x={484} y={274} label="" />

          {/* Output Branch: R2 + Q3 -> VREF */}
          <line x1="592" y1="114" x2="592" y2="148" stroke="currentColor" strokeWidth="2" />
          <circle cx="592" cy="134" r="4" fill={COLORS.safe} />
          <line x1="592" y1="134" x2="634" y2="134" stroke={COLORS.safe} strokeWidth="2" />
          <PortDot x={636} y={134} label="VREF" subLabel="≈1.2V" labelPos="top" color={COLORS.safe} filled />
          <Resistor x={592} y={170} label="R2" />
          <line x1="592" y1="192" x2="592" y2="210" stroke="currentColor" strokeWidth="2" />
          <Bjt x={584} y={236} label="Q3" />
          <line x1="592" y1="262" x2="592" y2="274" stroke="currentColor" strokeWidth="2" />
          <Ground x={592} y={274} label="" />

          {/* Startup Circuit Dashed Box */}
          <rect
            x="556"
            y="42"
            width="114"
            height="36"
            rx="7"
            fill="rgba(139, 92, 246, 0.1)"
            stroke={COLORS.violet}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          <text
            x="613"
            y="64"
            fill={COLORS.violet}
            fontSize="11.5"
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            Startup 启动电路
          </text>
          <NodeHotspot
            cx={613}
            cy={60}
            r={16}
            active={activeHint === 'startup'}
            onActivate={() =>
              onHint(
                'startup',
                '自偏置电路存在全零电流简并态（死锁平衡点），上电必须靠启动电路踹一脚唤醒！'
              )
            }
          />
        </g>
      )}

      <FormulaBox
        x={24}
        y={288}
        w={632}
        h={44}
        accent={COLORS.safe}
        lines={[
          'VREF = VBE + (R2/R1)·VT·ln(n) ≈ 1.2V  |  必加 Startup 启动电路防全零死锁',
        ]}
      />
    </svg>
  );
}
