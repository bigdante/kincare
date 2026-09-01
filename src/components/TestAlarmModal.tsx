import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Volume2, 
  Clock, 
  Pill, 
  Check, 
  X, 
  Sparkles, 
  AlertTriangle,
  Play,
  VolumeX,
  ShieldAlert
} from 'lucide-react';
import { Medication, HealthProfile } from '../types';
import { useHealthStore } from '../store';

interface TestAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  activeProfile: HealthProfile | null;
  onTriggerFullScreenAlarm: (med: Medication, slotTime: string, doseIndex: number) => void;
}

export const TestAlarmModal: React.FC<TestAlarmModalProps> = ({
  isOpen,
  onClose,
  medications,
  activeProfile,
  onTriggerFullScreenAlarm
}) => {
  const { speak, stopSpeech, isSpeaking, showToast } = useHealthStore();

  const [selectedMedId, setSelectedMedId] = useState<string>('');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [customPromptText, setCustomPromptText] = useState<string>('');

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  // Selected med
  const selectedMed = medications.find(m => m.id === selectedMedId) || medications[0] || null;

  useEffect(() => {
    if (medications.length > 0 && (!selectedMedId || !medications.some(m => m.id === selectedMedId))) {
      setSelectedMedId(medications[0].id);
      setSelectedSlotIndex(0);
    }
  }, [medications, isOpen]);

  // Generate dynamic prompt text based on selected med and slot
  useEffect(() => {
    if (selectedMed) {
      const times = selectedMed.scheduleTimes || [selectedMed.time || '08:00'];
      const slotTime = times[selectedSlotIndex] || times[0] || '08:00';
      const memberName = activeProfile?.name || '长辈';
      const dose = selectedMed.dosage || '1片';
      const delivery = selectedMed.deliveryMethod || '温水送服';
      const meal = selectedMed.mealTimingLabel || '按医嘱服用';
      const caution = selectedMed.precautions && selectedMed.precautions.length > 0 
        ? `。特别注意事项：${selectedMed.precautions.join('、')}` 
        : '';
      
      const generated = `该吃药啦！${memberName}，现在是设定服药时间 ${slotTime}。请服用【${selectedMed.name}】${dose}，${delivery}，${meal}${caution}。`;
      setCustomPromptText(generated);
    }
  }, [selectedMed, selectedSlotIndex, activeProfile]);

  if (!isOpen) return null;

  const times = selectedMed?.scheduleTimes || [selectedMed?.time || '08:00'];
  const currentSlotTime = times[selectedSlotIndex] || times[0] || '08:00';

  const handlePlayVoice = () => {
    if (customPromptText) {
      speak(customPromptText);
      showToast('🔊 正在播报服药语音提示…');
    }
  };

  const handleTriggerAlarm = () => {
    if (selectedMed) {
      onTriggerFullScreenAlarm(selectedMed, currentSlotTime, selectedSlotIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-hide text-xs"
      >
        {/* 顶部标题 */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">测试用药到点闹钟与语音提示</h3>
              <p className="text-[10px] text-gray-400">检查每个药物在各时段的响铃与提示语是否符合要求</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. 选择要测试的药品 */}
        <div className="space-y-1.5">
          <label className="font-bold text-gray-800 block">
            1. 选择测试的用药计划 ({medications.length}种在用)
          </label>
          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-2xl border border-gray-200">
            {medications.length === 0 ? (
              <p className="text-center text-gray-400 py-3">当前长辈暂无服药计划，请先创建计划</p>
            ) : (
              medications.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMedId(m.id);
                    setSelectedSlotIndex(0);
                  }}
                  className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                    selectedMedId === m.id
                      ? 'bg-teal-50 border-[#0D9488] text-[#0D9488] shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Pill className="w-4 h-4 shrink-0 text-[#0D9488]" />
                    <div>
                      <span className="font-extrabold text-xs text-gray-900 block">{m.name}</span>
                      <span className="text-[10px] text-gray-500">
                        {m.dosage} · {m.mealTimingLabel || '饭后'} · 每日{m.scheduleTimes?.length || 1}次
                      </span>
                    </div>
                  </div>
                  {selectedMedId === m.id && (
                    <Check className="w-4 h-4 text-[#0D9488] stroke-[3]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* 2. 选择具体打卡时段 / 闹钟时间点 */}
        {selectedMed && (
          <div className="space-y-1.5 bg-teal-50/50 p-3 rounded-2xl border border-teal-100">
            <label className="font-bold text-teal-950 block">
              2. 选择要检查的时段闹钟时刻
            </label>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {times.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSlotIndex(idx)}
                  className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center space-x-1.5 border transition-all cursor-pointer ${
                    selectedSlotIndex === idx
                      ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-teal-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>第 {idx + 1} 次 ({t})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. 提示语与播报文本预览/编辑 */}
        <div className="space-y-1.5 bg-amber-50/40 p-3 rounded-2xl border border-amber-200/80">
          <div className="flex items-center justify-between">
            <label className="font-bold text-amber-950 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>3. 该时段到点语音播报与屏幕提示词</span>
            </label>
            <span className="text-[10px] text-amber-700">可自定义修改预览</span>
          </div>

          <textarea
            rows={3}
            value={customPromptText}
            onChange={(e) => setCustomPromptText(e.target.value)}
            className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-gray-900 leading-relaxed font-medium focus:border-amber-400"
          />

          {/* 禁忌提要 */}
          {selectedMed?.precautions && selectedMed.precautions.length > 0 && (
            <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded-xl border border-amber-200">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>已包含禁忌提示：{selectedMed.precautions.join(' · ')}</span>
            </div>
          )}
        </div>

        {/* 4. 测试操作按钮 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handlePlayVoice}
            className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0D9488] font-bold flex items-center justify-center space-x-2 cursor-pointer active:scale-98 transition-all"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>试听该药此时段语音提示（TTS 语音朗读）</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerAlarm}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20 cursor-pointer active:scale-98 transition-all"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span>模拟触发到点全屏响铃闹钟界面</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
