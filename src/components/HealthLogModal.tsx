import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Heart, 
  Activity, 
  Droplet, 
  Scale, 
  Thermometer, 
  Check, 
  Sparkles,
  Sliders,
  Calendar,
  Clock
} from 'lucide-react';
import { useHealthStore } from '../store';

interface HealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
}

// Physical Exam Health Categories & Metric Definitions
interface MetricDef {
  key: string;
  name: string;
  unit: string;
  category: string;
  defaultVal: number;
  min: number;
  max: number;
  step: number;
  normalRange: string;
  description: string;
}

const HEALTH_CATEGORIES = [
  { key: 'circulation', name: '血压与心率' },
  { key: 'glucose', name: '血糖与代谢' },
  { key: 'lipids', name: '血脂四项' },
  { key: 'renal', name: '肾功与尿酸' },
  { key: 'body', name: '基础体征' }
];

const METRIC_DEFINITIONS: Record<string, MetricDef[]> = {
  circulation: [
    { key: 'bp_sys', name: '收缩压 (高压)', unit: 'mmHg', category: 'circulation', defaultVal: 120, min: 70, max: 220, step: 1, normalRange: '90–139', description: '心脏收缩时动脉血管内的压力' },
    { key: 'bp_dia', name: '舒张压 (低压)', unit: 'mmHg', category: 'circulation', defaultVal: 80, min: 40, max: 130, step: 1, normalRange: '60–89', description: '心脏舒张时动脉血管内的压力' },
    { key: 'heartRate', name: '心率 / 脉搏', unit: 'bpm', category: 'circulation', defaultVal: 72, min: 40, max: 160, step: 1, normalRange: '60–100', description: '静息状态下每分钟心跳次数' }
  ],
  glucose: [
    { key: 'glucose_fasting', name: '空腹血糖', unit: 'mmol/L', category: 'glucose', defaultVal: 5.6, min: 2.0, max: 20.0, step: 0.1, normalRange: '3.9–6.1', description: '隔夜禁食 8-10 小时后的清晨血糖' },
    { key: 'glucose_postprandial', name: '餐后2小时血糖', unit: 'mmol/L', category: 'glucose', defaultVal: 7.2, min: 3.0, max: 25.0, step: 0.1, normalRange: '4.4–7.8', description: '从吃第一口饭算起满 2 小时测得' },
    { key: 'hba1c', name: '糖化血红蛋白', unit: '%', category: 'glucose', defaultVal: 5.8, min: 4.0, max: 15.0, step: 0.1, normalRange: '4.0–6.0', description: '反映过去 2-3 个月的平均血糖水平' }
  ],
  lipids: [
    { key: 'cholesterol_total', name: '总胆固醇 (TC)', unit: 'mmol/L', category: 'lipids', defaultVal: 4.5, min: 2.0, max: 12.0, step: 0.1, normalRange: '2.8–5.2', description: '血液中各脂蛋白所含胆固醇总和' },
    { key: 'triglycerides', name: '甘油三酯 (TG)', unit: 'mmol/L', category: 'lipids', defaultVal: 1.5, min: 0.3, max: 8.0, step: 0.05, normalRange: '0.56–1.70', description: '血脂主要成分，与高脂饮食密切相关' },
    { key: 'ldl', name: '低密度脂蛋白 (LDL-C)', unit: 'mmol/L', category: 'lipids', defaultVal: 2.6, min: 1.0, max: 7.0, step: 0.1, normalRange: '< 3.4', description: '坏胆固醇，心脑血管硬化关键指标' },
    { key: 'hdl', name: '高密度脂蛋白 (HDL-C)', unit: 'mmol/L', category: 'lipids', defaultVal: 1.3, min: 0.5, max: 3.0, step: 0.05, normalRange: '> 1.0', description: '好胆固醇，抗动脉硬化保护因子' }
  ],
  renal: [
    { key: 'uric_acid', name: '血尿酸 (UA)', unit: 'μmol/L', category: 'renal', defaultVal: 340, min: 100, max: 800, step: 5, normalRange: '208–428', description: '嘌呤代谢终产物，过高易诱发痛风' },
    { key: 'creatinine', name: '血肌酐 (Cr)', unit: 'μmol/L', category: 'renal', defaultVal: 75, min: 30, max: 300, step: 1, normalRange: '44–106', description: '反映肾小球滤过功能的直接指标' }
  ],
  body: [
    { key: 'weight', name: '体重', unit: 'kg', category: 'body', defaultVal: 65.0, min: 30.0, max: 150.0, step: 0.5, normalRange: 'BMI 18.5–24', description: '清晨排便后空腹轻装测量' },
    { key: 'oxygen', name: '血氧饱和度 (SpO2)', unit: '%', category: 'body', defaultVal: 98, min: 80, max: 100, step: 1, normalRange: '95–100', description: '血液中氧合血红蛋白容量占全部容量的百分比' },
    { key: 'temperature', name: '体温', unit: '℃', category: 'body', defaultVal: 36.6, min: 35.0, max: 42.0, step: 0.1, normalRange: '36.0–37.2', description: '腋温/耳温正常生理范围' }
  ]
};

export const HealthLogModal: React.FC<HealthLogModalProps> = ({
  isOpen,
  onClose,
  initialType
}) => {
  const { activeProfileId, addHealthRecord, showToast } = useHealthStore();

  const [activeCategory, setActiveCategory] = useState<string>('circulation');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('bp_sys');
  const [currentValue, setCurrentValue] = useState<number>(120);

  // Component-based datetime picker
  const nowStr = new Date().toISOString().slice(0, 16);
  const [recordDateTime, setRecordDateTime] = useState<string>(nowStr);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  // Flatten all metric definitions for quick lookup and selection
  const allMetricsList = Object.values(METRIC_DEFINITIONS).flat();
  const currentMetric = allMetricsList.find(m => m.key === selectedMetricKey) || allMetricsList[0];

  const handleSelectMetric = (m: MetricDef) => {
    setActiveCategory(m.category);
    setSelectedMetricKey(m.key);
    setCurrentValue(m.defaultVal);
  };

  const handleDropdownChange = (metricKey: string) => {
    const found = allMetricsList.find(m => m.key === metricKey);
    if (found) {
      handleSelectMetric(found);
    }
  };

  const handleSave = async () => {
    if (!activeProfileId) {
      showToast('请先选择家庭成员');
      return;
    }

    // Parse date and time from component picker
    const [dStr, tStr] = recordDateTime.split('T');
    const displayTime = tStr ? tStr.slice(0, 5) : '08:00';
    const displayDate = dStr || new Date().toISOString().split('T')[0];

    // Determine status badge
    let status: 'normal' | 'high' | 'low' = 'normal';
    if (currentMetric.key === 'bp_sys') {
      status = currentValue >= 140 ? 'high' : currentValue < 90 ? 'low' : 'normal';
    } else if (currentMetric.key === 'bp_dia') {
      status = currentValue >= 90 ? 'high' : currentValue < 60 ? 'low' : 'normal';
    } else if (currentMetric.key === 'glucose_fasting') {
      status = currentValue >= 6.1 ? 'high' : currentValue < 3.9 ? 'low' : 'normal';
    } else if (currentMetric.key === 'oxygen') {
      status = currentValue < 95 ? 'low' : 'normal';
    }

    await addHealthRecord({
      profileId: activeProfileId,
      type: currentMetric.key as any,
      metricName: currentMetric.name,
      value: currentValue,
      unit: currentMetric.unit,
      date: displayDate,
      time: displayTime,
      timestamp: `${displayDate} ${displayTime}:00`,
      status,
      note: note.trim() || undefined
    });

    showToast(`已成功录入「${currentMetric.name} ${currentValue} ${currentMetric.unit}」`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto scrollbar-hide text-xs"
      >
        {/* 顶部标题 */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-black text-gray-900 text-base">记一笔体征数据</h3>
            <p className="text-[10px] text-gray-400">按照体检分类选择指标，支持滑块触控调节与时间构件选择</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 常见指标小标签（支持左右滑动切换） */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
            <span>常见指标标签 (左右滑动轻点即选)</span>
            <span className="text-[10px] text-gray-400">滑动查看更多</span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide py-0.5">
            {allMetricsList.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => handleSelectMetric(m)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap text-xs border transition-all cursor-pointer flex items-center space-x-1 ${
                  selectedMetricKey === m.key
                    ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs scale-102'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{m.name}</span>
                {selectedMetricKey === m.key && (
                  <Check className="w-3 h-3 stroke-[3]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 详细下拉选择框 */}
        <div className="space-y-1 bg-teal-50/40 p-2.5 rounded-2xl border border-teal-100">
          <label className="text-[11px] font-bold text-gray-800 block">详细指标选择 (按体检大类精确定位)</label>
          <select
            value={selectedMetricKey}
            onChange={(e) => handleDropdownChange(e.target.value)}
            className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs font-black text-gray-900 shadow-xs focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
          >
            {HEALTH_CATEGORIES.map(cat => (
              <optgroup key={cat.key} label={`【${cat.name}】`}>
                {(METRIC_DEFINITIONS[cat.key] || []).map(m => (
                  <option key={m.key} value={m.key}>
                    {m.name} ({m.unit}) — 正常参考：{m.normalRange}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* 3. 体检大类与同类指标标签 */}
        <div className="space-y-1.5">
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {HEALTH_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key);
                  const first = METRIC_DEFINITIONS[cat.key][0];
                  setSelectedMetricKey(first.key);
                  setCurrentValue(first.defaultVal);
                }}
                className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap text-[11px] border transition-all cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-teal-700 border-teal-700 text-white shadow-xs'
                    : 'bg-gray-100/80 border-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {(METRIC_DEFINITIONS[activeCategory] || METRIC_DEFINITIONS.circulation).map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => handleSelectMetric(m)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMetricKey === m.key
                    ? 'bg-teal-50 border-[#0D9488] shadow-xs'
                    : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-xs ${selectedMetricKey === m.key ? 'text-[#0D9488]' : 'text-gray-800'}`}>
                    {m.name}
                  </span>
                  {selectedMetricKey === m.key && (
                    <Check className="w-3.5 h-3.5 text-[#0D9488] stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  参考: {m.normalRange} {m.unit}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. 【核心要求：滑块触控调节 + 数值输入】 */}
        <div className="bg-teal-50/60 p-4 rounded-3xl border border-teal-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-extrabold text-gray-900 text-sm">{currentMetric.name}</span>
              <p className="text-[10px] text-teal-800">{currentMetric.description}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-baseline space-x-1 bg-white px-3 py-1.5 rounded-2xl border border-teal-200 shadow-xs">
                <input
                  type="number"
                  step={currentMetric.step}
                  min={currentMetric.min}
                  max={currentMetric.max}
                  value={currentValue}
                  onChange={(e) => setCurrentValue(Number(e.target.value))}
                  className="w-16 font-mono font-black text-xl text-[#0D9488] text-right focus:outline-hidden"
                />
                <span className="text-xs font-bold text-gray-500">{currentMetric.unit}</span>
              </div>
            </div>
          </div>

          {/* 交互滑块 Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
              <span>{currentMetric.min} {currentMetric.unit}</span>
              <span className="font-bold text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-100">
                标准范围: {currentMetric.normalRange}
              </span>
              <span>{currentMetric.max} {currentMetric.unit}</span>
            </div>
            <input
              type="range"
              min={currentMetric.min}
              max={currentMetric.max}
              step={currentMetric.step}
              value={currentValue}
              onChange={(e) => setCurrentValue(Number(e.target.value))}
              className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0D9488]"
            />
          </div>

          {/* 快捷微调按钮 */}
          <div className="flex items-center justify-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentValue(Math.max(currentMetric.min, Number((currentValue - currentMetric.step * 5).toFixed(2))))}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              - {currentMetric.step * 5}
            </button>
            <button
              type="button"
              onClick={() => setCurrentValue(Math.max(currentMetric.min, Number((currentValue - currentMetric.step).toFixed(2))))}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              - {currentMetric.step}
            </button>
            <button
              type="button"
              onClick={() => setCurrentValue(Math.min(currentMetric.max, Number((currentValue + currentMetric.step).toFixed(2))))}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              + {currentMetric.step}
            </button>
            <button
              type="button"
              onClick={() => setCurrentValue(Math.min(currentMetric.max, Number((currentValue + currentMetric.step * 5).toFixed(2))))}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              + {currentMetric.step * 5}
            </button>
          </div>
        </div>

        {/* 4. 【核心要求：测量记录历史时间使用构件编辑】 */}
        <div className="space-y-1.5 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
          <label className="font-bold text-gray-800 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#0D9488]" />
            <span>测量时间（组件选择）</span>
          </label>
          <input
            type="datetime-local"
            value={recordDateTime}
            onChange={(e) => setRecordDateTime(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-mono font-bold"
          />
        </div>

        {/* 5. 测量状态备注 */}
        <div>
          <label className="font-bold text-gray-700 block mb-1">测量状态与体征备注 (选填)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="如：晨起静息状态下测量，无头晕"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
          />
        </div>

        {/* 底部保存按钮 */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 flex items-center justify-center space-x-1 cursor-pointer active:scale-98 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>保存体征记录</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
