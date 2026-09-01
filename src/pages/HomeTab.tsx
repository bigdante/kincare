import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCw, 
  Volume2, 
  CheckCircle2, 
  Check, 
  Sparkles, 
  X, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Utensils,
  Activity,
  Pill,
  Newspaper
} from 'lucide-react';
import { useHealthStore } from '../store';
import { MemberSwitcherRail } from '../components/MemberSwitcherRail';

export const HomeTab: React.FC = () => {
  const { 
    activeProfile, 
    activeProfileId, 
    medications, 
    medicationLogs, 
    takeMedication, 
    cancelMedicationTake, 
    aiDailyCareMap, 
    refreshDailyCare, 
    speak, 
    isSpeaking, 
    elderMode,
    showConfirmModal,
    showToast
  } = useHealthStore();

  const [isRefreshingCare, setIsRefreshingCare] = useState(false);
  const [showCompletedBanner, setShowCompletedBanner] = useState(false);
  const [intervalWarningModal, setIntervalWarningModal] = useState<{
    medId: string;
    medName: string;
    doseIndex: number;
    lastTime: string;
    interval: number;
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCare = (activeProfileId && aiDailyCareMap[activeProfileId]) || {
    status: 'good' as const,
    summary: '今日各项身体体征良好，建议保持规律用药和适度运动。',
    dietAdvice: '建议低盐低脂饮食，多吃深色蔬菜水果。',
    exerciseAdvice: '建议散步30分钟，避免剧烈运动。',
    medicationAdvice: '请按时服用常规药物，饭后静坐。',
    newsChips: [{ title: '高血压秋冬防护常识', url: '#' }, { title: '老年人补钙知识', url: '#' }],
    isMock: true
  };

  // Medications for current member (or all members if 'all' is selected)
  const { profiles } = useHealthStore();
  const currentMemberMeds = medications.filter(m => 
    !m.isInCabinetOnly && (activeProfileId === 'all' ? true : m.profileId === activeProfileId)
  );

  // Check if all today's doses are taken
  const allMedsTakenToday = currentMemberMeds.length > 0 && currentMemberMeds.every(med => {
    const times = med.scheduleTimes || [med.time || '08:00'];
    return times.every((_, idx) => {
      return medicationLogs.some(l => l.medicationId === med.id && l.date === todayStr && l.doseIndex === idx && l.taken);
    });
  });

  const memberDisplayName = activeProfileId === 'all' ? '全家成员' : (activeProfile?.name || '长辈');

  useEffect(() => {
    if (allMedsTakenToday) {
      setShowCompletedBanner(true);
      const timer = setTimeout(() => {
        setShowCompletedBanner(false);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setShowCompletedBanner(false);
    }
  }, [allMedsTakenToday]);

  const handleRefreshCare = async () => {
    const targetId = activeProfileId === 'all' ? (profiles[0]?.id || '') : activeProfileId;
    if (!targetId) return;
    setIsRefreshingCare(true);
    await refreshDailyCare(targetId);
    setTimeout(() => {
      setIsRefreshingCare(false);
      showToast('已更新今日健康关怀建议');
    }, 600);
  };

  const handleSlotClick = async (med: any, doseIndex: number, isTaken: boolean) => {
    if (isTaken) {
      // PRD 5.1.7: 已打卡的时间格再次点击 -> 弹出确认弹窗取消打卡
      showConfirmModal({
        title: '确认取消本次打卡？',
        content: `取消后将把「${med.name}」第 ${doseIndex + 1} 次服药记录重置为未打卡状态。`,
        confirmText: '确认取消',
        confirmColor: 'bg-[#EF4444]',
        onConfirm: async () => {
          await cancelMedicationTake(med.id, todayStr, doseIndex);
        }
      });
    } else {
      // 正常打卡
      const res = await takeMedication(med.id, todayStr, doseIndex);
      if (res.intervalWarning) {
        setIntervalWarningModal({
          medId: med.id,
          medName: med.name,
          doseIndex,
          lastTime: res.lastTime || '未知时间',
          interval: med.interval || 4
        });
      }
    }
  };

  const handleConfirmForceTake = async () => {
    if (!intervalWarningModal) return;
    await takeMedication(intervalWarningModal.medId, todayStr, intervalWarningModal.doseIndex, true);
    setIntervalWarningModal(null);
  };

  const handlePlayVoice = (med: any) => {
    const pName = profiles.find(p => p.id === med.profileId)?.name || activeProfile?.name || '您';
    const text = med.reminderText || `该吃药啦！${pName}请服用${med.name}，每次${med.dosage}，${med.mealTimingLabel || '按医嘱要求服用'}。`;
    speak(text);
  };

  // Date formatting
  const today = new Date();
  const dateNum = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDayStr = weekDays[today.getDay()];
  const monthStr = `${today.getMonth() + 1}月${dateNum}日 ${weekDayStr}`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F9FAFB] pb-24 scrollbar-hide select-none">
      {/* 顶部自定义导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <span>健康打卡</span>
        </h1>
        <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
          {monthStr}
        </span>
      </div>

      {/* 5.0 全局成员切换轨 (每页必备) */}
      <MemberSwitcherRail />

      <div className="px-3.5 py-4 space-y-4">
        {/* 5.1.4 AI 每日关怀卡片 (解决遮挡问题，确保充裕高度与清晰布局) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 relative">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
              <h2 className="text-sm font-bold text-gray-900">今日关怀</h2>
              <span className="text-[11px] text-gray-400 font-normal">
                {monthStr}
              </span>
              {todayCare.isMock && (
                <span className="text-[10px] text-[#0D9488] bg-[#CCFBF1] px-1.5 py-0.5 rounded font-medium">
                  AI推荐
                </span>
              )}
            </div>
            <button
              onClick={handleRefreshCare}
              disabled={isRefreshingCare}
              className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-[#0D9488] hover:bg-teal-100 transition-colors shrink-0"
              title="刷新关怀"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshingCare ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 状态大字 */}
          <div className="flex items-center space-x-2 mb-2 flex-wrap">
            {todayCare.status === 'good' ? (
              <span className="text-lg font-extrabold text-[#0D9488] flex items-center space-x-1">
                <Smile className="w-5 h-5" />
                <span>状态良好</span>
              </span>
            ) : todayCare.status === 'normal' ? (
              <span className="text-lg font-extrabold text-amber-500 flex items-center space-x-1">
                <Meh className="w-5 h-5" />
                <span>状态一般</span>
              </span>
            ) : (
              <span className="text-lg font-extrabold text-red-500 flex items-center space-x-1">
                <Frown className="w-5 h-5" />
                <span>需多关注</span>
              </span>
            )}
            <span className="text-xs text-gray-500">· 守护「{memberDisplayName}」的健康</span>
          </div>

          {/* AI 摘要 */}
          <p className={`text-gray-700 leading-relaxed mb-3 ${elderMode ? 'text-base' : 'text-xs'}`}>
            {todayCare.summary}
          </p>

          {/* 建议卡片 (完整展开，不遮挡文字) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            <div className="bg-[#CCFBF1]/40 rounded-xl p-3 border border-teal-100/70">
              <div className="flex items-center space-x-1 text-[#0D9488] font-bold text-xs mb-1">
                <Utensils className="w-3.5 h-3.5 shrink-0" />
                <span>饮食建议</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {todayCare.dietAdvice}
              </p>
            </div>

            <div className="bg-[#CCFBF1]/40 rounded-xl p-3 border border-teal-100/70">
              <div className="flex items-center space-x-1 text-[#0D9488] font-bold text-xs mb-1">
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>运动建议</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {todayCare.exerciseAdvice}
              </p>
            </div>

            <div className="bg-[#CCFBF1]/40 rounded-xl p-3 border border-teal-100/70">
              <div className="flex items-center space-x-1 text-[#0D9488] font-bold text-xs mb-1">
                <Pill className="w-3.5 h-3.5 shrink-0" />
                <span>用药提醒</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {todayCare.medicationAdvice}
              </p>
            </div>
          </div>

          {/* 资讯 Chip 行 */}
          {todayCare.newsChips && todayCare.newsChips.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pt-1 pb-0.5">
              <Newspaper className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              {todayCare.newsChips.map((chip, idx) => (
                <div
                  key={idx}
                  className="bg-teal-50 border border-teal-200/60 text-[#0D9488] text-[11px] px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap font-medium"
                >
                  📰 {chip.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5.1.5 用药完毕横幅 (明确标明是谁服药完成) */}
        <AnimatePresence>
          {showCompletedBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#CCFBF1] rounded-xl p-3 flex items-center justify-between border border-teal-200 text-[#0D9488] shadow-xs"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" />
                <span className="text-sm font-bold">
                  「{memberDisplayName}」今日用药已全部完成，棒棒哒！
                </span>
              </div>
              <button
                onClick={() => setShowCompletedBanner(false)}
                className="p-1 text-teal-700 hover:text-teal-900 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5.1.6 日期头部 */}
        <div className="flex items-baseline space-x-2 pt-1 px-1">
          <span className="text-3xl font-black text-gray-900">{dateNum}</span>
          <span className="text-sm font-bold text-gray-700">{weekDayStr}</span>
          <span className="text-xs text-gray-400">· 今日用药排程清单</span>
        </div>

        {/* 5.1.7 用药打卡列表 (药卡) */}
        {currentMemberMeds.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-xs">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">今日暂无排程用药计划</p>
            <p className="text-xs text-gray-400 mt-1">
              可在「用药管理」中为「{memberDisplayName}」添加服药计划
            </p>
          </div>
        ) : (
          currentMemberMeds.map((med) => {
            const scheduleTimes = med.scheduleTimes || [med.time || '08:00'];
            const totalDoses = scheduleTimes.length;
            const takenLogs = medicationLogs.filter(
              l => l.medicationId === med.id && l.date === todayStr && l.taken
            );
            const takenCount = takenLogs.length;
            const medProfile = profiles.find(p => p.id === med.profileId);

            return (
              <div
                key={med.id}
                className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3.5"
              >
                {/* 第一行：药品信息 + 语音播报按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {med.imageUrl ? (
                        <img
                          src={med.imageUrl}
                          alt={med.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Pill className="w-6 h-6 text-[#0D9488]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <h3 className={`font-bold text-gray-900 truncate ${elderMode ? 'text-lg' : 'text-sm'}`}>
                          {med.name}
                        </h3>
                        {activeProfileId === 'all' && medProfile && (
                          <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                            {medProfile.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {med.mealTimingLabel || '饭后'}
                        </span>
                        <span className="text-[11px] bg-teal-50 text-[#0D9488] px-2 py-0.5 rounded font-medium">
                          {med.dosage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 语音播报按钮 */}
                  <button
                    onClick={() => handlePlayVoice(med)}
                    className="w-9 h-9 rounded-full bg-teal-50 text-[#0D9488] hover:bg-teal-100 flex items-center justify-center active:scale-90 transition-all flex-shrink-0 border border-teal-100 cursor-pointer"
                    title="语音提醒"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 第二行：时间轨道 slots */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {scheduleTimes.map((slotTime, idx) => {
                    const log = medicationLogs.find(
                      l => l.medicationId === med.id && l.date === todayStr && l.doseIndex === idx && l.taken
                    );
                    const isTaken = !!log;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSlotClick(med, idx, isTaken)}
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 ${
                          isTaken
                            ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                            : 'bg-gray-50/80 border-gray-200 text-gray-700 hover:border-teal-400'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isTaken ? 'text-white' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold">{slotTime}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {isTaken ? (
                            <>
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                              <span className="text-[10px] text-teal-100 font-medium">已服</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">打卡</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 第三行：进度与打卡人标识 */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
                  <span>
                    今日进度：<strong className="text-gray-800">{takenCount}/{totalDoses}</strong> 次
                  </span>

                  {takenLogs.length > 0 && (
                    <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      打卡人：{takenLogs[takenLogs.length - 1].operatorName || '本人'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 安全用药间隔警示模态框 (PRD 5.1.7) */}
      <AnimatePresence>
        {intervalWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-amber-800">安全用药提醒</h3>
                <p className="text-gray-600 text-xs mt-2 leading-relaxed">
                  距离您上次服用【{intervalWarningModal.medName}】不足 {intervalWarningModal.interval} 小时（上一次服药在 {intervalWarningModal.lastTime}），确认现在服药吗？
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIntervalWarningModal(null)}
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmForceTake}
                  className="flex-1 py-3 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white text-xs shadow-md shadow-amber-200"
                >
                  确认服用
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
