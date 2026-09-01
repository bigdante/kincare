import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Droplet, 
  Thermometer, 
  Scale, 
  Wind, 
  Info,
  Calendar,
  Clock,
  Sparkles,
  ChevronDown,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { HealthRecord } from '../types';

export type MetricType = 'blood_pressure' | 'blood_sugar' | 'heartRate' | 'temperature' | 'spo2' | 'weight' | 'uric_acid';

export interface HealthTrendChartProps {
  records: HealthRecord[];
  activeMetric?: MetricType;
  onSelectMetric?: (metric: MetricType) => void;
  onAddRecord?: (metric: MetricType) => void;
  onOpenFilter?: () => void;
}

export interface MetricConfig {
  id: MetricType;
  name: string;
  shortName: string;
  unit: string;
  icon: any;
  color: string;
  secondaryColor?: string;
  normalRange: [number, number]; // [min, max]
  normalLabel: string;
  step: number;
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  blood_pressure: {
    id: 'blood_pressure',
    name: '血压 (收缩压/舒张压)',
    shortName: '血压',
    unit: 'mmHg',
    icon: Activity,
    color: '#0D9488', // Teal for SBP
    secondaryColor: '#3B82F6', // Blue for DBP
    normalRange: [90, 140], // SBP range
    normalLabel: '收缩压 90~140 / 舒张压 60~90 mmHg',
    step: 1
  },
  blood_sugar: {
    id: 'blood_sugar',
    name: '血糖 (空腹/餐后)',
    shortName: '血糖',
    unit: 'mmol/L',
    icon: Droplet,
    color: '#F59E0B',
    normalRange: [3.9, 6.1],
    normalLabel: '空腹 3.9~6.1 / 餐后 <7.8 mmol/L',
    step: 0.1
  },
  heartRate: {
    id: 'heartRate',
    name: '静息心率',
    shortName: '心率',
    unit: 'bpm',
    icon: Heart,
    color: '#EF4444',
    normalRange: [60, 100],
    normalLabel: '正常静息 60~100 bpm',
    step: 1
  },
  temperature: {
    id: 'temperature',
    name: '体温',
    shortName: '体温',
    unit: '℃',
    icon: Thermometer,
    color: '#8B5CF6',
    normalRange: [36.0, 37.2],
    normalLabel: '正常范围 36.0~37.2 ℃',
    step: 0.1
  },
  spo2: {
    id: 'spo2',
    name: '血氧饱和度',
    shortName: '血氧',
    unit: '%',
    icon: Wind,
    color: '#06B6D4',
    normalRange: [95, 100],
    normalLabel: '正常范围 95%~100%',
    step: 1
  },
  weight: {
    id: 'weight',
    name: '体重监测',
    shortName: '体重',
    unit: 'kg',
    icon: Scale,
    color: '#10B981',
    normalRange: [50, 75],
    normalLabel: '健康参考 50~75 kg',
    step: 0.5
  },
  uric_acid: {
    id: 'uric_acid',
    name: '血尿酸',
    shortName: '尿酸',
    unit: 'μmol/L',
    icon: Droplet,
    color: '#6366F1',
    normalRange: [200, 420],
    normalLabel: '男性 <420 / 女性 <360 μmol/L',
    step: 10
  }
};

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({
  records,
  activeMetric = 'blood_pressure',
  onSelectMetric,
  onAddRecord,
  onOpenFilter
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(activeMetric);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'all'>('7');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const currentMetric = selectedMetric;
  const config = METRIC_CONFIGS[currentMetric];

  const handleMetricChange = (m: MetricType) => {
    setSelectedMetric(m);
    if (onSelectMetric) onSelectMetric(m);
  };

  // Filter and sort records for this metric
  const chartData = useMemo(() => {
    // Filter records by type
    let filtered = records.filter(r => r.type === currentMetric);

    // If empty, generate realistic demo points for preview
    if (filtered.length === 0) {
      if (currentMetric === 'blood_pressure') {
        filtered = [
          { id: 'd1', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 135, dia: 84, value: 135, unit: 'mmHg', status: 'normal', measuredAt: '2026-08-25 07:45:10', scene: '晨起静息' },
          { id: 'd2', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 138, dia: 86, value: 138, unit: 'mmHg', status: 'normal', measuredAt: '2026-08-26 08:00:22', scene: '晨起静息' },
          { id: 'd3', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 130, dia: 80, value: 130, unit: 'mmHg', status: 'normal', measuredAt: '2026-08-27 07:30:05', scene: '晨起静息' },
          { id: 'd4', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 142, dia: 90, value: 142, unit: 'mmHg', status: 'warning', measuredAt: '2026-08-28 19:20:40', scene: '晚餐后稍感疲劳' },
          { id: 'd5', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 134, dia: 82, value: 134, unit: 'mmHg', status: 'normal', measuredAt: '2026-08-29 08:15:30', scene: '晨起静息' },
          { id: 'd6', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 138, dia: 86, value: 138, unit: 'mmHg', status: 'normal', measuredAt: '2026-08-30 08:00:15', scene: '晨起静息' },
          { id: 'd7', memberId: '', type: 'blood_pressure', typeName: '血压', sys: 132, dia: 82, value: 132, unit: 'mmHg', status: 'normal', measuredAt: '2026-08-31 07:30:00', scene: '晨起服药前' },
        ];
      } else if (currentMetric === 'blood_sugar') {
        filtered = [
          { id: 's1', memberId: '', type: 'blood_sugar', typeName: '血糖', value: 5.8, unit: 'mmol/L', status: 'normal', measuredAt: '2026-08-25 07:10:00', scene: '空腹' },
          { id: 's2', memberId: '', type: 'blood_sugar', typeName: '血糖', value: 6.4, unit: 'mmol/L', status: 'normal', measuredAt: '2026-08-26 07:15:20', scene: '空腹' },
          { id: 's3', memberId: '', type: 'blood_sugar', typeName: '血糖', value: 7.9, unit: 'mmol/L', status: 'warning', measuredAt: '2026-08-27 13:30:10', scene: '午餐后2小时' },
          { id: 's4', memberId: '', type: 'blood_sugar', typeName: '血糖', value: 6.0, unit: 'mmol/L', status: 'normal', measuredAt: '2026-08-28 07:20:00', scene: '空腹' },
          { id: 's5', memberId: '', type: 'blood_sugar', typeName: '血糖', value: 8.2, unit: 'mmol/L', status: 'warning', measuredAt: '2026-08-29 20:00:00', scene: '晚餐后2小时' },
          { id: 's6', memberId: '', type: 'blood_sugar', typeName: '血糖', value: 6.2, unit: 'mmol/L', status: 'normal', measuredAt: '2026-08-31 07:15:30', scene: '空腹' }
        ];
      } else if (currentMetric === 'heartRate') {
        filtered = [
          { id: 'h1', memberId: '', type: 'heartRate', typeName: '心率', value: 74, unit: 'bpm', status: 'normal', measuredAt: '2026-08-25 07:45:00', scene: '晨起静息' },
          { id: 'h2', memberId: '', type: 'heartRate', typeName: '心率', value: 76, unit: 'bpm', status: 'normal', measuredAt: '2026-08-27 07:30:00', scene: '晨起静息' },
          { id: 'h3', memberId: '', type: 'heartRate', typeName: '心率', value: 70, unit: 'bpm', status: 'normal', measuredAt: '2026-08-29 08:15:00', scene: '晨起静息' },
          { id: 'h4', memberId: '', type: 'heartRate', typeName: '心率', value: 72, unit: 'bpm', status: 'normal', measuredAt: '2026-08-31 07:30:00', scene: '晨起静息' }
        ];
      } else {
        filtered = [
          { id: 'o1', memberId: '', type: currentMetric, typeName: config.name, value: (config.normalRange[0] + config.normalRange[1]) / 2, unit: config.unit, status: 'normal', measuredAt: '2026-08-29 09:00:00', scene: '常规测量' },
          { id: 'o2', memberId: '', type: currentMetric, typeName: config.name, value: (config.normalRange[0] + config.normalRange[1]) / 2 + 1, unit: config.unit, status: 'normal', measuredAt: '2026-08-31 09:00:00', scene: '常规测量' }
        ];
      }
    }

    // Sort chronologically (oldest to newest for the chart)
    return [...filtered].sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  }, [records, currentMetric]);

  // Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0, count: 0, normalRate: '100%' };

    if (currentMetric === 'blood_pressure') {
      const sysValues = chartData.map(d => d.sys || d.value);
      const diaValues = chartData.map(d => d.dia || 80);
      const minSys = Math.min(...sysValues);
      const maxSys = Math.max(...sysValues);
      const avgSys = Math.round(sysValues.reduce((a, b) => a + b, 0) / sysValues.length);
      const avgDia = Math.round(diaValues.reduce((a, b) => a + b, 0) / diaValues.length);
      const normalCount = chartData.filter(d => (d.sys || d.value) <= 140 && (d.dia || 80) <= 90).length;
      const normalRate = Math.round((normalCount / chartData.length) * 100) + '%';
      return { min: minSys, max: maxSys, avg: `${avgSys}/${avgDia}`, count: chartData.length, normalRate };
    } else {
      const values = chartData.map(d => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
      const normalCount = chartData.filter(d => d.value >= config.normalRange[0] && d.value <= config.normalRange[1]).length;
      const normalRate = Math.round((normalCount / chartData.length) * 100) + '%';
      return { min, max, avg, count: chartData.length, normalRate };
    }
  }, [chartData, currentMetric, config]);

  // SVG Chart Geometry Calculations
  const chartHeight = 160;
  const chartWidth = 320;
  const padding = { top: 25, bottom: 30, left: 35, right: 20 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Determine Y-axis Min & Max
  const { yMin, yMax } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    chartData.forEach(d => {
      if (currentMetric === 'blood_pressure') {
        const s = d.sys || d.value;
        const dia = d.dia || 80;
        min = Math.min(min, dia, s);
        max = Math.max(max, s, dia);
      } else {
        min = Math.min(min, d.value);
        max = Math.max(max, d.value);
      }
    });

    // Expand margin
    const rangeMargin = (max - min) * 0.25 || 10;
    const finalMin = Math.floor(Math.max(0, min - rangeMargin));
    const finalMax = Math.ceil(max + rangeMargin);
    return { yMin: finalMin, yMax: finalMax };
  }, [chartData, currentMetric]);

  // Compute Coordinates for Points
  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    const count = chartData.length;

    return chartData.map((d, i) => {
      const x = count === 1 ? padding.left + plotWidth / 2 : padding.left + (i / (count - 1)) * plotWidth;
      const yVal1 = currentMetric === 'blood_pressure' ? (d.sys || d.value) : d.value;
      const y1 = padding.top + plotHeight - ((yVal1 - yMin) / (yMax - yMin || 1)) * plotHeight;

      let y2: number | undefined;
      if (currentMetric === 'blood_pressure') {
        const yVal2 = d.dia || 80;
        y2 = padding.top + plotHeight - ((yVal2 - yMin) / (yMax - yMin || 1)) * plotHeight;
      }

      return {
        x,
        y1,
        y2,
        data: d,
        val1: yVal1,
        val2: currentMetric === 'blood_pressure' ? (d.dia || 80) : undefined
      };
    });
  }, [chartData, yMin, yMax, plotWidth, plotHeight, currentMetric]);

  // Build SVG Path strings
  const linePath1 = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y1}` : `${acc} L ${curr.x} ${curr.y1}`;
    }, '');
  }, [points]);

  const linePath2 = useMemo(() => {
    if (currentMetric !== 'blood_pressure' || points.length === 0) return '';
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y2}` : `${acc} L ${curr.x} ${curr.y2}`;
    }, '');
  }, [points, currentMetric]);

  const areaPath1 = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + plotHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath1} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath1, points, plotHeight]);

  const activePoint = hoveredPointIndex !== null ? points[hoveredPointIndex] : points[points.length - 1];

  return (
    <div className="bg-white rounded-3xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3.5">
      {/* 顶部标题、下拉菜单与筛选入口 (通过下拉菜单精确选择指标) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
        {/* 左侧：下拉菜单选择指标 */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          
          <div className="relative">
            <label className="text-[10px] text-gray-400 font-bold block mb-0.5">选择监测指标趋势</label>
            <div className="relative flex items-center">
              <select
                value={selectedMetric}
                onChange={(e) => handleMetricChange(e.target.value as MetricType)}
                className="appearance-none bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl pl-3 pr-8 py-1.5 font-black text-gray-900 text-xs cursor-pointer transition-all shadow-xs focus:ring-2 focus:ring-teal-500/20"
              >
                {(Object.keys(METRIC_CONFIGS) as MetricType[]).map(key => {
                  const cfg = METRIC_CONFIGS[key];
                  return (
                    <option key={key} value={key}>
                      {cfg.name} ({cfg.unit})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 右侧：时间范围切换 */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {/* 时间范围 7/30/90/全部 */}
          <div className="flex items-center space-x-1 bg-gray-100/80 p-0.5 rounded-xl text-xs">
            {(['7', '30', '90', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-[#0D9488] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {range === 'all' ? '全部' : `${range}天`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 正常参考范围提示 */}
      <div className="text-[11px] text-gray-500 bg-teal-50/50 px-3 py-1.5 rounded-xl border border-teal-100/60 flex items-center justify-between">
        <span className="font-medium">标准范围参考：{config.normalLabel}</span>
        <span className="text-teal-700 font-bold">已测 {chartData.length} 次</span>
      </div>

      {/* 折线图绘制核心区 (SVG 渲染) */}
      <div className="relative bg-gradient-to-b from-gray-50/60 to-white rounded-2xl p-2 border border-gray-100/80 overflow-hidden">
        {/* 图例 */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 text-[11px] font-medium text-gray-500">
          <div className="flex items-center space-x-3">
            {currentMetric === 'blood_pressure' ? (
              <>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                  <span className="font-bold text-gray-700">收缩压 (高压)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  <span className="font-bold text-gray-700">舒张压 (低压)</span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                <span className="font-bold text-gray-700">{config.shortName} ({config.unit})</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-400">
            共 {chartData.length} 次记录
          </div>
        </div>

        {/* SVG 折线画布 */}
        <div className="w-full overflow-x-auto scrollbar-hide">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 overflow-visible touch-pan-x"
          >
            <defs>
              {/* 面积渐变 */}
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={config.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Y 轴水平网格线与刻度值 */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + plotHeight * ratio;
              const val = yMax - (yMax - yMin) * ratio;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-gray-400 font-mono font-medium"
                  >
                    {Math.round(val)}
                  </text>
                </g>
              );
            })}

            {/* 面积背景 */}
            {currentMetric !== 'blood_pressure' && (
              <path d={areaPath1} fill="url(#metricGradient)" />
            )}

            {/* 折线 1 (主要指标或收缩压) */}
            <path
              d={linePath1}
              fill="none"
              stroke={config.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 折线 2 (舒张压) */}
            {currentMetric === 'blood_pressure' && (
              <path
                d={linePath2}
                fill="none"
                stroke={config.secondaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 数据圆点 */}
            {points.map((pt, idx) => {
              const isHovered = hoveredPointIndex === idx;
              return (
                <g key={idx} className="cursor-pointer">
                  {/* 折线1圆点 */}
                  <circle
                    cx={pt.x}
                    cy={pt.y1}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#FFFFFF"
                    stroke={config.color}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all"
                  />
                  {/* 折线2圆点 (舒张压) */}
                  {pt.y2 !== undefined && (
                    <circle
                      cx={pt.x}
                      cy={pt.y2}
                      r={isHovered ? 5.5 : 3.5}
                      fill="#FFFFFF"
                      stroke={config.secondaryColor}
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all"
                    />
                  )}

                  {/* 隐形高触控触发区 */}
                  <rect
                    x={pt.x - 14}
                    y={padding.top}
                    width={28}
                    height={plotHeight}
                    fill="transparent"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onClick={() => setHoveredPointIndex(idx)}
                  />
                </g>
              );
            })}

            {/* X 轴日期刻度 */}
            {points.map((pt, idx) => {
              const showDate = points.length <= 7 || idx === 0 || idx === points.length - 1 || idx % Math.ceil(points.length / 5) === 0;
              if (!showDate) return null;
              
              const dateStr = pt.data.measuredAt ? pt.data.measuredAt.split(' ')[0].slice(5) : '';
              return (
                <text
                  key={idx}
                  x={pt.x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400 font-medium"
                >
                  {dateStr}
                </text>
              );
            })}
          </svg>
        </div>

        {/* 选中的具体测量数据详细卡片 (精确到秒与场景) */}
        {activePoint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-xs flex items-center justify-between text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-gray-500 font-medium text-[11px]">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-mono font-bold text-gray-700">
                  {activePoint.data.measuredAt || '2026-08-31 08:30:15'}
                </span>
                {activePoint.data.scene && (
                  <span className="bg-teal-50 text-[#0D9488] px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {activePoint.data.scene}
                  </span>
                )}
              </div>
              {activePoint.data.note && (
                <p className="text-[11px] text-gray-500 line-clamp-1">
                  备注：{activePoint.data.note}
                </p>
              )}
            </div>

            <div className="text-right pl-3 border-l border-gray-100">
              <div className="text-base font-black text-gray-900 leading-none">
                {currentMetric === 'blood_pressure' 
                  ? `${activePoint.val1}/${activePoint.val2}` 
                  : activePoint.val1}
                <span className="text-[10px] font-normal text-gray-400 ml-1">{config.unit}</span>
              </div>
              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activePoint.data.status === 'danger' ? 'bg-red-50 text-red-600' :
                activePoint.data.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {activePoint.data.status === 'danger' ? '偏高警惕' :
                 activePoint.data.status === 'warning' ? '稍偏高' : '达标正常'}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* 底部体征统计 4 宫格 */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        <div className="bg-gray-50 rounded-xl p-2 border border-gray-100/60">
          <span className="text-[10px] text-gray-400 block font-medium">最新数值</span>
          <span className="text-xs font-black text-gray-900 block mt-0.5">
            {points.length > 0 ? (currentMetric === 'blood_pressure' ? `${points[points.length-1].val1}/${points[points.length-1].val2}` : points[points.length-1].val1) : '--'}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-2 border border-gray-100/60">
          <span className="text-[10px] text-gray-400 block font-medium">区间均值</span>
          <span className="text-xs font-black text-gray-900 block mt-0.5">
            {stats.avg}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-2 border border-gray-100/60">
          <span className="text-[10px] text-gray-400 block font-medium">极值范围</span>
          <span className="text-xs font-black text-gray-900 block mt-0.5 font-mono">
            {stats.min}~{stats.max}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-2 border border-gray-100/60">
          <span className="text-[10px] text-gray-400 block font-medium">达标率</span>
          <span className="text-xs font-black text-emerald-600 block mt-0.5">
            {stats.normalRate}
          </span>
        </div>
      </div>
    </div>
  );
};
