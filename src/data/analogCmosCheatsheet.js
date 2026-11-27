export const ANALOG_CMOS_CHEATSHEET = {
  title: '《模拟 CMOS》考前 A4 积木速查表',
  subtitle: '拉扎维第 2 版 · 考前 10 分钟速览与 A4 打印版',
  tableTitle: '5 大基本模块积木速查表',
  headers: [
    '基本电路积木',
    '输入 / 输出',
    '电压增益 Av（忽略体效应）',
    '输入阻抗 Rin',
    '输出阻抗 Rout',
    '一句话物理角色',
  ],
  rows: [
    [
      '共源级 (CS)',
      'G 进 / D 出',
      '-gm · (RD // rO)',
      '∞',
      'RD // rO',
      '主力电压反相放大器',
    ],
    [
      '退化共源级 (CS+RS)',
      'G 进 / D 出',
      '≈ -RD / (1/gm + RS)',
      '∞',
      'RD // [rO(1+gm·RS)]',
      '牺牲增益换线性度与高阻',
    ],
    [
      '共栅级 (CG)',
      'S 进 / D 出',
      '+gm · (RD // rO)',
      '≈ 1/gm',
      'RD // rO',
      '电流缓冲器 / 屏蔽密勒效应',
    ],
    [
      '源跟随器 (CD)',
      'G 进 / S 出',
      'gm·RS / (1+gm·RS) < 1',
      '∞',
      'RS // (1/gm)',
      '电压缓冲器 / 驱动重负载',
    ],
    [
      'Cascode (叠罗汉)',
      '下管 G / 上管 D',
      '-gm1 · [(gm2·rO2·rO1)//Rload]',
      '∞',
      '≈ gm·rO² // Rload',
      '阻抗暴涨神器，增益 (gm·rO)²',
    ],
    [
      '对称差动对 (Diff)',
      '双 G / 双 D',
      'Adm = -gm·(RD // rO)',
      '∞',
      '2(RD // rO) 双端',
      '半边电路劈开算，抗共模干扰',
    ],
    [
      '五管运放 (电流镜负载)',
      '双 G / 单 D',
      '+gmN · (rON // rOP)',
      '∞',
      'rON // rOP',
      '双端转单端且增益不打折',
    ],
  ],
  rulesTitle: '📌 期末考前 3 分钟必背三大铁律',
  ironRules: [
    {
      index: 1,
      title: '观察法秒杀铁律',
      content:
        'Av = -Gm · Rout。见栅漏短接管（二极管接法）直接替换成电阻 1/gm；见对称差动对直接从中间劈开当共源级算。',
    },
    {
      index: 2,
      title: '频率响应与稳定性铁律',
      content:
        '单节点极点 ωp = 1/(R_node · C_node)；密勒电容输入放大 (1+|Av|) 倍；两级运放密勒补偿牢记四件套：GBW = gm1/CC、ωp2 = gm2/CL、RHP 零点 = +gm2/CC、调零电阻 RZ = 1/gm2。',
    },
    {
      index: 3,
      title: '负反馈阻抗口诀',
      content:
        '输入端「串联变大、并联变小」；输出端「电压变小、电流变大」（系数统一为 1 + Aβ）。',
    },
  ],
};

/**
 * Generates clean Markdown / plain text for one-click clipboard copy.
 */
export function buildCheatsheetCopyText() {
  const { title, tableTitle, headers, rows, rulesTitle, ironRules } = ANALOG_CMOS_CHEATSHEET;
  const headerLine = `| ${headers.join(' | ')} |`;
  const sepLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = rows.map((r) => `| ${r.join(' | ')} |`);
  const ruleLines = ironRules.map(
    (rule) => `${rule.index}. ${rule.title}：${rule.content}`
  );

  return [
    `# ${title}`,
    '',
    `## ${tableTitle}`,
    headerLine,
    sepLine,
    ...rowLines,
    '',
    `## ${rulesTitle}`,
    ...ruleLines,
  ].join('\n');
}
