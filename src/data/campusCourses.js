import { ANALOG_CMOS_STAGES } from './analogCmosCurriculum.js';
import { ANALOG_CMOS_CHEATSHEET } from './analogCmosCheatsheet.js';

export const CAMPUS_COURSES = [
  {
    id: 'analog-cmos',
    title: '《模拟 CMOS 集成电路设计》',
    subtitle: '拉扎维第 2 版 · 期末高性价比通关版',
    description:
      '专为 IC/EE 本科期末冲刺打造：抛开冗长 KCL/KVL 推导，用物理直觉 + 观察法 10 秒秒杀单级/差动/Cascode/两级运放增益与频率响应。',
    status: 'available',
    badge: '已上线 · 点击进入',
    tags: ['期末保过', '观察法秒杀'],
    stageCount: ANALOG_CMOS_STAGES.length,
    lessonCount: ANALOG_CMOS_STAGES.reduce((acc, s) => acc + s.lessons.length, 0),
    quizCount: ANALOG_CMOS_STAGES.reduce(
      (acc, s) => acc + s.lessons.reduce((lAcc, l) => lAcc + (l.quizzes?.length || 0), 0),
      0
    ),
    stages: ANALOG_CMOS_STAGES,
    cheatsheet: ANALOG_CMOS_CHEATSHEET,
  },
  {
    id: 'verilog-digital',
    title: '《Verilog 数字系统设计》',
    subtitle: '待补充笔记',
    description:
      '组合/时序逻辑建模、FSM 状态机三段式、跨时钟域 CDC 同步器与综合约束期末核心讲义占位。',
    status: 'coming_soon',
    badge: '待解锁占位',
    tags: ['RTL 设计', '时序约束'],
    stageCount: 0,
    lessonCount: 0,
    quizCount: 0,
    comingSoonMessage: '《Verilog 数字系统设计》即将上线：笔记与随堂题库正在整理中，敬请期待！',
  },
  {
    id: 'semiconductor-physics-806',
    title: '《806 半导体物理》',
    subtitle: '哈工大 806 V2 全量库 · 9 组交互物理图谱 + 真题',
    description:
      '内嵌 9 组公式级精准交互 SVG 图谱（E-k/EF-T/PN结/金半/MIS C-V）、9 章抽背遮罩卡、22 道简答、4 道连续性方程范例、9 道计算真题与 2026 真题全卷。',
    status: 'available',
    accent: 'teal',
    badge: '已上线 · V2 精准图谱',
    tags: ['考研专业课', '9组精准图谱', '抽背遮罩'],
    stageCount: 9,
    lessonCount: 9,
    quizCount: 14,
    countLabel: '9 章 / 9 图 / 14 题',
    progressUnit: '章',
    ctaLabel: '进入精准图谱、背诵与真题库',
  },
];
