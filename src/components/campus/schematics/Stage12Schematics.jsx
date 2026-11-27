import React from 'react';
import {
  COLORS,
  Nmos,
  Pmos,
  Resistor,
  CurrentSource,
  ControlledCurrentSource,
  Ground,
  VddRail,
  PortDot,
  FormulaBox,
  NodeHotspot,
} from './cmosPrimitives.jsx';

/**
 * 1.1: NMOS Large-Signal Symbol & Small-Signal Saturation Model
 */
export function Schematic11({ variant = 'dual', activeHint, onHint }) {
  const showLeft = variant === 'dual' || variant === 'dc';
  const showRight = variant === 'dual' || variant === 'ac';

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left Half: NMOS Large Signal Symbol */}
      {showLeft && (
        <g transform={variant === 'dc' ? 'translate(160, 0) scale(1.05)' : undefined}>
          <text
            x="160"
            y="28"
            fill="currentColor"
            fontSize="13.5"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            直流大信号符号 (NMOS)
          </text>

          {/* Drain wire + ID arrow */}
          <line x1="158" y1="68" x2="158" y2="124" stroke="currentColor" strokeWidth="2" />
          <line x1="175" y1="74" x2="175" y2="106" stroke={COLORS.violet} strokeWidth="2" />
          <polygon points="175,112 171,103 179,103" fill={COLORS.violet} />
          <text
            x="184"
            y="95"
            fill={COLORS.violet}
            fontSize="13"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            ID
          </text>
          <PortDot x={158} y={66} label="D" labelPos="top" />

          {/* Gate wire */}
          <line x1="88" y1="150" x2="126" y2="150" stroke="currentColor" strokeWidth="2" />
          <PortDot x={86} y={150} label="Vin / G" labelPos="left" />

          {/* NMOS */}
          <Nmos x={150} y={150} label="M1" />

          {/* Source wire + GND */}
          <line x1="158" y1="176" x2="158" y2="215" stroke="currentColor" strokeWidth="2" />
          <circle cx="158" cy="192" r="3" fill="currentColor" />
          <text
            x="170"
            y="196"
            fill={COLORS.port}
            fontSize="13"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            S
          </text>
          <Ground x={158} y={215} />

          {/* VGS bracket label */}
          <path
            d="M 86 164 L 86 200 L 142 200"
            fill="none"
            stroke={COLORS.port}
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
          <text
            x="92"
            y="192"
            fill={COLORS.port}
            fontSize="12.5"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            + VGS -
          </text>

          {/* Saturation condition dashed box */}
          <rect
            x="24"
            y="262"
            width="274"
            height="58"
            rx="8"
            fill="rgba(16, 185, 129, 0.07)"
            stroke={COLORS.safe}
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />
          <text
            x="161"
            y="285"
            fill={COLORS.safe}
            fontSize="12.5"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            饱和区导通条件（必须同时满足）
          </text>
          <text
            x="161"
            y="306"
            fill="currentColor"
            fontSize="13"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            VGS &gt; VTH  且  VDS ≥ VOV
          </text>
        </g>
      )}

      {/* Center divider in dual mode */}
      {variant === 'dual' && (
        <line
          x1="322"
          y1="28"
          x2="322"
          y2="316"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="5 5"
        />
      )}

      {/* Right Half: Small-signal saturation model */}
      {showRight && (
        <g transform={variant === 'ac' ? 'translate(-180, 0) scale(1.04)' : undefined}>
          <text
            x="505"
            y="28"
            fill="currentColor"
            fontSize="13.5"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            饱和区交流小信号模型
          </text>

          {/* Gate Open Circuit */}
          <line x1="364" y1="104" x2="412" y2="104" stroke="currentColor" strokeWidth="2" />
          <PortDot x={362} y={104} label="G" labelPos="left" />
          <circle cx="416" cy="104" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <text
            x="408"
            y="90"
            fill={COLORS.port}
            fontSize="11.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="middle"
          >
            (开路 Rin=∞)
          </text>

          {/* vgs label between G and S */}
          <line
            x1="416"
            y1="116"
            x2="416"
            y2="190"
            stroke={COLORS.port}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text
            x="398"
            y="158"
            fill={COLORS.port}
            fontSize="13.5"
            fontWeight="700"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            textAnchor="end"
          >
            vgs
          </text>

          {/* Bottom Source bus */}
          <line x1="364" y1="202" x2="625" y2="202" stroke="currentColor" strokeWidth="2" />
          <PortDot x={362} y={202} label="S" labelPos="left" />
          <Ground x={520} y={202} label="S (AC Ground)" />

          {/* Top Drain bus */}
          <line x1="472" y1="104" x2="625" y2="104" stroke="currentColor" strokeWidth="2" />
          <PortDot x={628} y={104} label="D" labelPos="right" />

          {/* Branch 1: Controlled current source gm*vgs */}
          <line x1="472" y1="104" x2="472" y2="128" stroke="currentColor" strokeWidth="2" />
          <ControlledCurrentSource x={472} y={152} label="gm·vgs" labelSide="left" />
          <line x1="472" y1="176" x2="472" y2="202" stroke="currentColor" strokeWidth="2" />

          {/* Branch 2: Output resistor rO */}
          <line x1="572" y1="104" x2="572" y2="130" stroke="currentColor" strokeWidth="2" />
          <Resistor x={572} y={152} label="rO" labelSide="right" />
          <line x1="572" y1="174" x2="572" y2="202" stroke="currentColor" strokeWidth="2" />
          <text
            x="592"
            y="174"
            fill={COLORS.violet}
            fontSize="11.5"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            = 1/(λID)
          </text>

          {/* Interactive Hotspot on rO */}
          <NodeHotspot
            cx={572}
            cy={152}
            r={22}
            active={activeHint === 'ro'}
            onActivate={() =>
              onHint(
                'ro',
                '输出电阻 rO 考点：忽略沟道长度调制 (λ = 0) 时，rO 视为无穷大直接开路！'
              )
            }
          />

          {/* Formula box bottom right */}
          <FormulaBox
            x={354}
            y={254}
            w={298}
            h={66}
            lines={[
              'gm = 2ID / VOV = √[2μnCox(W/L)ID]',
              'rO ≈ 1 / (λ·ID)  |  本征增益 = gm · rO',
            ]}
          />
        </g>
      )}
    </svg>
  );
}

/**
 * 1.2: CS Prototype, 3 High-Frequency Variants & CG/CD Side-by-Side
 */
export function Schematic12({ variant = 'basic', activeHint, onHint }) {
  if (variant === 'basic') {
    return (
      <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
        <VddRail x={300} y={50} />
        <line x1="300" y1="50" x2="300" y2="76" stroke="currentColor" strokeWidth="2" />
        <Resistor x={300} y={98} label="RD" />
        <line x1="300" y1="120" x2="300" y2="178" stroke="currentColor" strokeWidth="2" />

        {/* Vout branch */}
        <circle cx="300" cy="148" r="4" fill="currentColor" />
        <line x1="300" y1="148" x2="390" y2="148" stroke="currentColor" strokeWidth="2" />
        <PortDot x={392} y={148} label="Vout" labelPos="right" filled />

        {/* M1 */}
        <line x1="186" y1="204" x2="268" y2="204" stroke="currentColor" strokeWidth="2" />
        <PortDot x={184} y={204} label="Vin" labelPos="left" filled />
        <Nmos x={292} y={204} label="M1" />
        <line x1="300" y1="230" x2="300" y2="266" stroke="currentColor" strokeWidth="2" />
        <Ground x={300} y={266} />

        {/* Formula box */}
        <FormulaBox
          x={418}
          y={224}
          w={230}
          h={68}
          lines={['Av = -gm · (RD ∥ rO)', 'Rin = ∞  |  Rout = RD ∥ rO']}
        />
        <NodeHotspot
          cx={300}
          cy={148}
          r={15}
          active={activeHint === 'cs_out'}
          onActivate={() =>
            onHint(
              'cs_out',
              '基本 CS 观察法：短路输出电流 Gm = gm1，输入接地看总输出电阻 Rout = RD ∥ rO，一乘加负号即得 Av！'
            )
          }
        />
      </svg>
    );
  }

  if (variant === 'diode') {
    return (
      <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
        <VddRail x={290} y={44} />
        <line x1="290" y1="44" x2="290" y2="80" stroke="currentColor" strokeWidth="2" />

        {/* M2 Diode-connected NMOS */}
        <Nmos x={282} y={106} label="M2" subLabel="≈ 1/gm2" highlightGate />

        {/* Highlighted purple G-D shorting wire */}
        <circle cx="290" cy="64" r="4" fill={COLORS.violet} />
        <polyline
          points="258,106 232,106 232,64 290,64"
          fill="none"
          stroke={COLORS.violet}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="222"
          y="88"
          fill={COLORS.violet}
          fontSize="12"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="end"
        >
          G-D 短接
        </text>
        <NodeHotspot
          cx={232}
          cy={85}
          r={18}
          active={activeHint === 'gd_short'}
          onActivate={() =>
            onHint(
              'gd_short',
              '期末考试见栅漏短接管，直接脑内替换成电阻 1/gm！增益 Av = -gm1 / gm2 = -√[(W/L)1 / (W/L)2]。'
            )
          }
        />

        {/* Interstage & Vout */}
        <line x1="290" y1="132" x2="290" y2="188" stroke="currentColor" strokeWidth="2" />
        <circle cx="290" cy="160" r="4" fill="currentColor" />
        <line x1="290" y1="160" x2="380" y2="160" stroke="currentColor" strokeWidth="2" />
        <PortDot x={382} y={160} label="Vout" labelPos="right" filled />

        {/* M1 */}
        <line x1="172" y1="214" x2="258" y2="214" stroke="currentColor" strokeWidth="2" />
        <PortDot x={170} y={214} label="Vin" labelPos="left" filled />
        <Nmos x={282} y={214} label="M1" />
        <line x1="290" y1="240" x2="290" y2="272" stroke="currentColor" strokeWidth="2" />
        <Ground x={290} y={272} />

        <FormulaBox
          x={404}
          y={204}
          w={248}
          h={72}
          lines={[
            'Av = -gm1 / gm2',
            '= -√[(W/L)1 / (W/L)2]（与 PVT 无关）',
          ]}
        />
      </svg>
    );
  }

  if (variant === 'isource') {
    return (
      <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
        <VddRail x={290} y={44} />
        <line x1="290" y1="44" x2="290" y2="76" stroke="currentColor" strokeWidth="2" />

        {/* PMOS M2 Current Source Load */}
        <line x1="184" y1="102" x2="258" y2="102" stroke={COLORS.violet} strokeWidth="2" />
        <PortDot x={182} y={102} label="Vb" labelPos="left" color={COLORS.violet} />
        <Pmos x={282} y={102} label="M2 (PMOS)" highlightGate />

        {/* Vout */}
        <line x1="290" y1="128" x2="290" y2="188" stroke="currentColor" strokeWidth="2" />
        <circle cx="290" cy="158" r="4" fill="currentColor" />
        <line x1="290" y1="158" x2="380" y2="158" stroke="currentColor" strokeWidth="2" />
        <PortDot x={382} y={158} label="Vout" labelPos="right" filled />

        {/* NMOS M1 */}
        <line x1="184" y1="214" x2="258" y2="214" stroke="currentColor" strokeWidth="2" />
        <PortDot x={182} y={214} label="Vin" labelPos="left" filled />
        <Nmos x={282} y={214} label="M1 (NMOS)" />
        <line x1="290" y1="240" x2="290" y2="272" stroke="currentColor" strokeWidth="2" />
        <Ground x={290} y={272} />

        <FormulaBox
          x={404}
          y={204}
          w={248}
          h={72}
          lines={[
            'Av = -gm1 · (rO1 ∥ rO2)',
            'Rout = rO1 ∥ rO2（摆脱大电阻面积）',
          ]}
        />
        <NodeHotspot
          cx={290}
          cy={102}
          r={16}
          active={activeHint === 'pmos_load'}
          onActivate={() =>
            onHint(
              'pmos_load',
              'PMOS 栅极接固定直流偏置 Vb，交流小信号下栅极接地，故 M2 等效为一个纯粹电阻 rO2！'
            )
          }
        />
      </svg>
    );
  }

  if (variant === 'degen') {
    return (
      <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
        <VddRail x={285} y={40} />
        <line x1="285" y1="40" x2="285" y2="56" stroke="currentColor" strokeWidth="2" />
        <Resistor x={285} y={78} label="RD" />
        <line x1="285" y1="100" x2="285" y2="146" stroke="currentColor" strokeWidth="2" />

        {/* Vout */}
        <circle cx="285" cy="122" r="4" fill="currentColor" />
        <line x1="285" y1="122" x2="376" y2="122" stroke="currentColor" strokeWidth="2" />
        <PortDot x={378} y={122} label="Vout" labelPos="right" filled />

        {/* M1 */}
        <line x1="175" y1="172" x2="253" y2="172" stroke="currentColor" strokeWidth="2" />
        <PortDot x={173} y={172} label="Vin" labelPos="left" filled />
        <Nmos x={277} y={172} label="M1" />

        {/* Source degeneration RS */}
        <line x1="285" y1="198" x2="285" y2="216" stroke="currentColor" strokeWidth="2" />
        <Resistor x={285} y={238} label="RS" />
        <line x1="285" y1="260" x2="285" y2="282" stroke="currentColor" strokeWidth="2" />
        <Ground x={285} y={282} />

        <FormulaBox
          x={404}
          y={184}
          w={252}
          h={88}
          lines={[
            'Av ≈ -RD / (1/gm + RS)',
            'Rout ≈ RD ∥ [rO(1 + gm·RS)]',
            '口诀：-(漏极电阻)/(1/gm + 源极电阻)',
          ]}
        />
        <NodeHotspot
          cx={285}
          cy={238}
          r={18}
          active={activeHint === 'rs_degen'}
          onActivate={() =>
            onHint(
              'rs_degen',
              '源极退化电阻 RS 把部分输入信号负反馈吃掉，牺牲增益换取极佳线性度，并让向下看输出阻抗暴涨 (1 + gm·RS) 倍！'
            )
          }
        />
      </svg>
    );
  }

  // Variant 5: CG & CD side-by-side
  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left: Common Gate (CG) */}
      <text
        x="168"
        y="24"
        fill="currentColor"
        fontSize="13.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        共栅级 (CG)：S 进 / D 出
      </text>
      <VddRail x={176} y={56} width={64} />
      <line x1="176" y1="56" x2="176" y2="70" stroke="currentColor" strokeWidth="2" />
      <Resistor x={176} y={92} label="RD" />
      <line x1="176" y1="114" x2="176" y2="156" stroke="currentColor" strokeWidth="2" />
      <circle cx="176" cy="134" r="4" fill="currentColor" />
      <line x1="176" y1="134" x2="240" y2="134" stroke="currentColor" strokeWidth="2" />
      <PortDot x={242} y={134} label="Vout" labelPos="right" filled />

      <line x1="88" y1="182" x2="144" y2="182" stroke={COLORS.violet} strokeWidth="2" />
      <PortDot x={86} y={182} label="Vb" labelPos="left" color={COLORS.violet} />
      <Nmos x={168} y={182} label="M1" highlightGate />

      <line x1="176" y1="208" x2="176" y2="232" stroke="currentColor" strokeWidth="2" />
      <circle cx="176" cy="222" r="4" fill={COLORS.port} />
      <line x1="100" y1="222" x2="176" y2="222" stroke={COLORS.port} strokeWidth="2" />
      <PortDot x={98} y={222} label="Vin" labelPos="left" filled />
      <CurrentSource x={176} y={252} label="Ibias" />
      <Ground x={176} y={274} />

      <FormulaBox
        x={38}
        y={292}
        w={268}
        h={44}
        lines={['Av = +gm(RD∥rO)  |  Rin ≈ 1/gm']}
      />

      {/* Divider */}
      <line
        x1="340"
        y1="26"
        x2="340"
        y2="324"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />

      {/* Right: Common Drain / Source Follower (CD) */}
      <text
        x="512"
        y="24"
        fill="currentColor"
        fontSize="13.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        源跟随器 (CD)：G 进 / S 出
      </text>
      <VddRail x={516} y={56} width={64} />
      <line x1="516" y1="56" x2="516" y2="112" stroke="currentColor" strokeWidth="2" />

      <line x1="422" y1="138" x2="484" y2="138" stroke="currentColor" strokeWidth="2" />
      <PortDot x={420} y={138} label="Vin" labelPos="left" filled />
      <Nmos x={508} y={138} label="M1" />

      <line x1="516" y1="164" x2="516" y2="206" stroke="currentColor" strokeWidth="2" />
      <circle cx="516" cy="184" r="4" fill="currentColor" />
      <line x1="516" y1="184" x2="584" y2="184" stroke="currentColor" strokeWidth="2" />
      <PortDot x={586} y={184} label="Vout" labelPos="right" filled />

      <Resistor x={516} y={228} label="RS" />
      <line x1="516" y1="250" x2="516" y2="274" stroke="currentColor" strokeWidth="2" />
      <Ground x={516} y={274} />

      <FormulaBox
        x={376}
        y={292}
        w={274}
        h={44}
        lines={['Av = gmRS/(1+gmRS)<1 | Rout ≈ 1/gm']}
      />
      <NodeHotspot
        cx={176}
        cy={222}
        r={14}
        active={activeHint === 'cg_rin'}
        onActivate={() =>
          onHint(
            'cg_rin',
            '黄金阻抗口诀：从源极 (S) 往里看阻抗 = 1/gm（极低）；所以 CG 输入阻抗低，CD 输出阻抗低！'
          )
        }
      />
    </svg>
  );
}

/**
 * 1.3: Cascode Stacked Amplifier (RD vs Full Cascode PMOS Load)
 */
export function Schematic13({ variant = 'cascode', activeHint, onHint }) {
  const isFullCascode = variant === 'cascode';

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      <VddRail x={260} y={36} width={100} />

      {isFullCascode ? (
        <>
          <line x1="260" y1="36" x2="260" y2="44" stroke="currentColor" strokeWidth="2" />
          <line x1="176" y1="68" x2="228" y2="68" stroke={COLORS.violet} strokeWidth="2" />
          <PortDot x={174} y={68} label="Vb4" labelPos="left" color={COLORS.violet} />
          <Pmos x={252} y={68} label="M4" highlightGate />

          <line x1="176" y1="118" x2="228" y2="118" stroke={COLORS.violet} strokeWidth="2" />
          <PortDot x={174} y={118} label="Vb3" labelPos="left" color={COLORS.violet} />
          <Pmos x={252} y={118} label="M3" highlightGate />
          <line x1="260" y1="144" x2="260" y2="162" stroke="currentColor" strokeWidth="2" />
        </>
      ) : (
        <>
          <line x1="260" y1="36" x2="260" y2="64" stroke="currentColor" strokeWidth="2" />
          <Resistor x={260} y={88} label="RD" />
          <line x1="260" y1="110" x2="260" y2="162" stroke="currentColor" strokeWidth="2" />
        </>
      )}

      {/* Vout tap */}
      <circle cx="260" cy="152" r="4" fill="currentColor" />
      <line x1="260" y1="152" x2="380" y2="152" stroke="currentColor" strokeWidth="2" />
      <PortDot x={382} y={152} label="Vout" labelPos="right" filled />

      {/* M2 (Cascode Shield) */}
      <line x1="176" y1="188" x2="228" y2="188" stroke={COLORS.violet} strokeWidth="2" />
      <PortDot x={174} y={188} label="Vb2" labelPos="left" color={COLORS.violet} />
      <Nmos x={252} y={188} label="M2" highlightGate />

      {/* Node X */}
      <line x1="260" y1="214" x2="260" y2="236" stroke="currentColor" strokeWidth="2" />
      <circle cx="260" cy="225" r="4.5" fill={COLORS.violet} />
      <text
        x="276"
        y="229"
        fill={COLORS.violet}
        fontSize="12.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        Node X
      </text>
      <NodeHotspot
        cx={260}
        cy={225}
        r={16}
        active={activeHint === 'nodex'}
        onActivate={() =>
          onHint(
            'nodex',
            'M2 像防弹盾牌锁死了 Node X 电位，同时把输入管 CGD1 的密勒倍数压到仅 2 倍！'
          )
        }
      />

      {/* M1 (Input) */}
      <line x1="176" y1="262" x2="228" y2="262" stroke="currentColor" strokeWidth="2" />
      <PortDot x={174} y={262} label="Vin" labelPos="left" filled />
      <Nmos x={252} y={262} label="M1" />
      <line x1="260" y1="288" x2="260" y2="302" stroke="currentColor" strokeWidth="2" />
      <Ground x={260} y={302} />

      {/* Curved violet arrow pointing to Rout_down */}
      <path
        d="M 335 190 Q 305 162 272 162"
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <polygon points="268,162 276,158 276,166" fill={COLORS.violet} />
      <text
        x="342"
        y="196"
        fill={COLORS.violet}
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        Rout_down ≈ gm2·rO2·rO1
      </text>

      {/* Gain comparison box */}
      <FormulaBox
        x={386}
        y={220}
        w={274}
        h={98}
        accent={isFullCascode ? COLORS.safe : COLORS.amber}
        lines={
          isFullCascode
            ? [
                '全 Cascode 负载：Av ≈ -(gm·rO)²',
                'Gm = gm1（等效跨导不翻倍！）',
                '摆幅代价：Vout_min = VOV1 + VOV2',
                '总输出摆幅缩水至 VDD - 4VOV',
              ]
            : [
                '普通电阻负载：Av ≈ -gm1 · RD',
                '⚠️ (gm·rO²) ∥ RD ≈ RD！',
                '顶部不用 Cascode 负载就白叠了！',
                'Gm = gm1 | Vout_min = VOV1+VOV2',
              ]
        }
      />
    </svg>
  );
}

/**
 * 2.1: Symmetric Differential Pair & Half-Circuit Method
 */
export function Schematic21({ variant = 'diff', activeHint, onHint }) {
  const isDiff = variant === 'diff';

  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      {/* Left Half: Complete Differential Pair */}
      <text
        x="170"
        y="24"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        完整对称差动对 (Differential Pair)
      </text>

      {/* Top VDD Rail */}
      <VddRail x={170} y={54} width={160} />
      <line x1="108" y1="54" x2="108" y2="70" stroke="currentColor" strokeWidth="2" />
      <line x1="232" y1="54" x2="232" y2="70" stroke="currentColor" strokeWidth="2" />

      {/* RD resistors */}
      <Resistor x={108} y={92} label="RD" labelSide="left" />
      <Resistor x={232} y={92} label="RD" labelSide="right" />

      {/* Vout1 / Vout2 */}
      <line x1="108" y1="114" x2="108" y2="158" stroke="currentColor" strokeWidth="2" />
      <circle cx="108" cy="134" r="3.8" fill="currentColor" />
      <line x1="74" y1="134" x2="108" y2="134" stroke="currentColor" strokeWidth="2" />
      <PortDot x={72} y={134} label="Vout1" labelPos="left" filled />

      <line x1="232" y1="114" x2="232" y2="158" stroke="currentColor" strokeWidth="2" />
      <circle cx="232" cy="134" r="3.8" fill="currentColor" />
      <line x1="232" y1="134" x2="266" y2="134" stroke="currentColor" strokeWidth="2" />
      <PortDot x={268} y={134} label="Vout2" labelPos="right" filled />

      {/* M1 (Left) & M2 (Right mirrored) */}
      <line x1="56" y1="184" x2="76" y2="184" stroke="currentColor" strokeWidth="2" />
      <PortDot
        x={54}
        y={184}
        label="Vin1"
        subLabel={isDiff ? '+vin/2' : 'v_cm'}
        labelPos="left"
        filled
      />
      <Nmos x={100} y={184} label="M1" />

      <line x1="264" y1="184" x2="284" y2="184" stroke="currentColor" strokeWidth="2" />
      <PortDot
        x={286}
        y={184}
        label="Vin2"
        subLabel={isDiff ? '-vin/2' : 'v_cm'}
        labelPos="right"
        filled
      />
      <Nmos x={240} y={184} label="M2" labelSide="left" mirror />

      {/* Tail Node P */}
      <polyline
        points="108,210 108,230 232,230 232,210"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="170" cy="230" r="4.5" fill={COLORS.danger} />
      <text
        x="156"
        y="247"
        fill={COLORS.danger}
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="end"
      >
        Node P
      </text>

      {/* Tail ISS & RSS */}
      <line x1="170" y1="230" x2="170" y2="244" stroke="currentColor" strokeWidth="2" />
      {isDiff ? (
        <>
          <CurrentSource x={170} y={266} label="ISS" />
          <line x1="170" y1="288" x2="170" y2="298" stroke="currentColor" strokeWidth="2" />
          <Ground x={170} y={298} />
        </>
      ) : (
        <>
          <Resistor x={170} y={266} label="RSS" labelSide="left" />
          <line x1="170" y1="288" x2="170" y2="298" stroke="currentColor" strokeWidth="2" />
          <Ground x={170} y={298} />
        </>
      )}

      {/* Red Dashed Symmetry Line */}
      <line
        x1="170"
        y1="38"
        x2="170"
        y2="230"
        stroke={COLORS.danger}
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <text
        x="170"
        y="120"
        fill={COLORS.danger}
        fontSize="11.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
        transform="rotate(-90 170 120)"
      >
        Symmetry Line
      </text>
      <NodeHotspot
        cx={170}
        cy={230}
        r={16}
        color={COLORS.danger}
        active={activeHint === 'nodep'}
        onActivate={() =>
          onHint(
            'nodep',
            '差模输入一升一降，节点 P 纹丝不动相当于交流地；共模同升同降，则需把 RSS 拆成两个 2RSS！'
          )
        }
      />

      {/* Arrow to Half-Circuit */}
      <path
        d="M 352 165 L 408 165"
        stroke={COLORS.port}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <polygon points="418,165 406,158 406,172" fill={COLORS.port} />
      <text
        x="383"
        y="150"
        fill={COLORS.port}
        fontSize="12"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        半边电路法
      </text>

      {/* Right Half: Equivalent Half-Circuit */}
      <text
        x="546"
        y="24"
        fill="currentColor"
        fontSize="13"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle"
      >
        {isDiff ? '差模半边电路 (Diff Mode)' : '共模半边电路 (Common Mode)'}
      </text>

      <VddRail x={546} y={54} width={74} />
      <line x1="546" y1="54" x2="546" y2="70" stroke="currentColor" strokeWidth="2" />
      <Resistor x={546} y={92} label="RD" />
      <line x1="546" y1="114" x2="546" y2="156" stroke="currentColor" strokeWidth="2" />

      <circle cx="546" cy="134" r="3.8" fill="currentColor" />
      <line x1="546" y1="134" x2="594" y2="134" stroke="currentColor" strokeWidth="2" />
      <PortDot x={596} y={134} label="Vout1" labelPos="right" filled />

      <line x1="484" y1="182" x2="514" y2="182" stroke="currentColor" strokeWidth="2" />
      <PortDot
        x={482}
        y={182}
        label={isDiff ? 'vin/2' : 'v_cm'}
        labelPos="left"
        filled
      />
      <Nmos x={538} y={182} label="M1" />

      {isDiff ? (
        <>
          <line x1="546" y1="208" x2="546" y2="246" stroke={COLORS.danger} strokeWidth="2" />
          <Ground x={546} y={246} label="Virtual AC Ground" accentColor={COLORS.danger} />
        </>
      ) : (
        <>
          <line x1="546" y1="208" x2="546" y2="220" stroke="currentColor" strokeWidth="2" />
          <Resistor x={546} y={242} label="2·RSS" color={COLORS.danger} />
          <line x1="546" y1="264" x2="546" y2="274" stroke="currentColor" strokeWidth="2" />
          <Ground x={546} y={274} label="GND" />
        </>
      )}

      <FormulaBox
        x={418}
        y={288}
        w={248}
        h={44}
        lines={
          isDiff
            ? ['Adm = -gm·(RD ∥ rO)  |  CMRR ≈ gm·RSS']
            : ['Acm ≈ -RD / (1/gm + 2RSS) ≈ -RD/(2RSS)']
        }
      />
    </svg>
  );
}

/**
 * 2.2: Basic Current Mirror & 5-Transistor OTA
 */
export function Schematic22({ variant = 'ota5', activeHint, onHint }) {
  if (variant === 'mirror') {
    return (
      <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
        <text
          x="340"
          y="26"
          fill="currentColor"
          fontSize="14"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          基本电流镜：IREF 变 VGS，按宽长比精确复制电流
        </text>

        <VddRail x={230} y={56} width={70} />
        <line x1="230" y1="56" x2="230" y2="76" stroke="currentColor" strokeWidth="2" />
        <CurrentSource x={230} y={98} label="IREF" />
        <line x1="230" y1="120" x2="230" y2="174" stroke="currentColor" strokeWidth="2" />

        {/* M1 diode-connected */}
        <Nmos x={222} y={200} label="M1" labelSide="left" highlightGate />
        <circle cx="230" cy="152" r="4" fill={COLORS.violet} />
        <polyline
          points="198,200 176,200 176,152 230,152"
          fill="none"
          stroke={COLORS.violet}
          strokeWidth="2.4"
        />

        {/* Shared Gate Bus */}
        <line x1="198" y1="200" x2="386" y2="200" stroke={COLORS.violet} strokeWidth="2.4" />
        <text
          x="312"
          y="190"
          fill={COLORS.violet}
          fontSize="12.5"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          共用 VGS
        </text>

        {/* M2 Output */}
        <Nmos x={410} y={200} label="M2" highlightGate />
        <line x1="418" y1="174" x2="418" y2="104" stroke="currentColor" strokeWidth="2" />
        <PortDot x={418} y={100} label="Iout" labelPos="top" filled />
        {/* Copy current arrow */}
        <line x1="436" y1="118" x2="436" y2="154" stroke={COLORS.safe} strokeWidth="2.4" />
        <polygon points="436,160 431,150 441,150" fill={COLORS.safe} />
        <text
          x="446"
          y="140"
          fill={COLORS.safe}
          fontSize="12.5"
          fontWeight="700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          Iout
        </text>

        {/* Grounds */}
        <line x1="230" y1="226" x2="230" y2="246" stroke="currentColor" strokeWidth="2" />
        <Ground x={230} y={246} />
        <line x1="418" y1="226" x2="418" y2="246" stroke="currentColor" strokeWidth="2" />
        <Ground x={418} y={246} />

        <FormulaBox
          x={476}
          y={192}
          w={188}
          h={92}
          lines={[
            'Iout / IREF =',
            '(W/L)2 / (W/L)1',
            '· (1+λVDS2)/(1+λVDS1)',
            '尽量保持 VDS2 ≈ VDS1',
          ]}
        />
      </svg>
    );
  }

  // Variant: 5-Transistor OTA with Current Push-Pull Summation Arrows
  return (
    <svg viewBox="0 0 680 340" className="w-full max-w-2xl mx-auto h-auto select-none">
      <VddRail x={250} y={38} width={190} />
      <line x1="184" y1="38" x2="184" y2="54" stroke="currentColor" strokeWidth="2" />
      <line x1="316" y1="38" x2="316" y2="54" stroke="currentColor" strokeWidth="2" />

      {/* Top PMOS Mirror M3 (left, diode-connected) & M4 (right) */}
      <Pmos x={192} y={80} label="M3" labelSide="left" mirror highlightGate />
      <Pmos x={308} y={80} label="M4" labelSide="right" highlightGate />

      {/* PMOS shared gate wire + M3 diode short */}
      <line x1="216" y1="80" x2="284" y2="80" stroke={COLORS.violet} strokeWidth="2.2" />
      <circle cx="184" cy="116" r="4" fill={COLORS.violet} />
      <polyline
        points="250,80 250,116 184,116"
        fill="none"
        stroke={COLORS.violet}
        strokeWidth="2.2"
      />
      <NodeHotspot
        cx={184}
        cy={116}
        r={16}
        active={activeHint === 'm3_node'}
        onActivate={() =>
          onHint(
            'm3_node',
            '此处是二极管接法低阻节点 (1/gm3)，所以不能用半边电路法，直接用观察法 Av = Gm·Rout 5 秒秒杀！'
          )
        }
      />

      {/* Interstage vertical lines */}
      <line x1="184" y1="106" x2="184" y2="162" stroke="currentColor" strokeWidth="2" />
      <line x1="316" y1="106" x2="316" y2="162" stroke="currentColor" strokeWidth="2" />

      {/* Vout tap on right */}
      <circle cx="316" cy="138" r="4.5" fill="currentColor" />
      <line x1="316" y1="138" x2="396" y2="138" stroke="currentColor" strokeWidth="2" />
      <PortDot x={398} y={138} label="Vout" labelPos="right" filled />

      {/* Push-Pull Signal Current Arrows */}
      <path
        d="M 164 150 L 164 114 Q 164 98 184 98"
        fill="none"
        stroke={COLORS.port}
        strokeWidth="2.2"
      />
      <polygon points="164,108 160,117 168,117" fill={COLORS.port} />
      <text
        x="154"
        y="134"
        fill={COLORS.port}
        fontSize="11.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="end"
      >
        +gm1·vin/2
      </text>

      {/* Mirrored push down from M4 into Vout */}
      <line x1="334" y1="108" x2="334" y2="130" stroke={COLORS.safe} strokeWidth="2.2" />
      <polygon points="334,134 330,126 338,126" fill={COLORS.safe} />
      <text
        x="342"
        y="120"
        fill={COLORS.safe}
        fontSize="11.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        +gm1·vin/2 (镜像推入)
      </text>

      {/* Pulled down by M2 from Vout */}
      <line x1="334" y1="146" x2="334" y2="168" stroke={COLORS.port} strokeWidth="2.2" />
      <polygon points="334,173 330,164 338,164" fill={COLORS.port} />
      <text
        x="342"
        y="164"
        fill={COLORS.port}
        fontSize="11.5"
        fontWeight="700"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        -gm1·vin/2 (M2 拉出)
      </text>

      {/* Bottom NMOS Diff Pair M1 & M2 */}
      <line x1="126" y1="188" x2="152" y2="188" stroke="currentColor" strokeWidth="2" />
      <PortDot x={124} y={188} label="Vin+" labelPos="left" filled />
      <Nmos x={176} y={188} label="M1" />

      <line x1="348" y1="188" x2="376" y2="188" stroke="currentColor" strokeWidth="2" />
      <PortDot x={378} y={188} label="Vin-" labelPos="right" filled />
      <Nmos x={324} y={188} label="M2" labelSide="left" mirror />

      {/* Tail M5 */}
      <polyline
        points="184,214 184,232 316,232 316,214"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line x1="250" y1="232" x2="250" y2="242" stroke="currentColor" strokeWidth="2" />
      <line x1="176" y1="268" x2="218" y2="268" stroke={COLORS.violet} strokeWidth="2" />
      <PortDot x={174} y={268} label="Vb" labelPos="left" color={COLORS.violet} />
      <Nmos x={242} y={268} label="M5" highlightGate />
      <line x1="250" y1="294" x2="250" y2="304" stroke="currentColor" strokeWidth="2" />
      <Ground x={250} y={304} label="" />

      {/* Formula Box */}
      <FormulaBox
        x={424}
        y={214}
        w={236}
        h={86}
        accent={COLORS.safe}
        lines={[
          '五管运放：双端转单端不打折！',
          '一推一拉合流：Gm = gm1',
          'Av = gm1 · (rO2 ∥ rO4)',
          '镜极点：ωp_mirror ≈ gm3/C_m',
        ]}
      />
    </svg>
  );
}
