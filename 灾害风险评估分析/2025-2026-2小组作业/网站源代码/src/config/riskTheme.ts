export interface RiskLegendItem {
  level: number;
  label: string;
  color: string;
  stroke: string;
}

export const riskLegend: RiskLegendItem[] = [
  {
    level: 4,
    label: '高风险',
    color: '#d14f46',
    stroke: '#f0a29c',
  },
  {
    level: 3,
    label: '中高风险',
    color: '#d98a3d',
    stroke: '#f6cb96',
  },
  {
    level: 2,
    label: '中低风险',
    color: '#d8c85c',
    stroke: '#f2e79b',
  },
  {
    level: 1,
    label: '低风险',
    color: '#4e9f6d',
    stroke: '#b4e2c3',
  },
];

const fallbackLegendItem = {
  color: '#5d7387',
  stroke: '#a8bac9',
};

export function getRiskTheme(level: number) {
  return riskLegend.find((item) => item.level === level) ?? fallbackLegendItem;
}
