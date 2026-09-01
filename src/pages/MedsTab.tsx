import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pill, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Volume2, 
  Check, 
  Trash2, 
  Edit3, 
  Info,
  Archive, 
  Search, 
  Sparkles, 
  X, 
  ScanBarcode, 
  Building2, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  History, 
  CheckSquare, 
  Package, 
  ListFilter,
  Sliders,
  Play
} from 'lucide-react';
import { useHealthStore } from '../store';
import { MemberSwitcherRail } from '../components/MemberSwitcherRail';
import { MedicineCabinetItem, Medication, MedicationLog } from '../types';
import { MedicationPlanModal } from '../components/MedicationPlanModal';
import { MedicineCabinetModal } from '../components/MedicineCabinetModal';
import { TestAlarmModal } from '../components/TestAlarmModal';
import { MedicationLogEditModal } from '../components/MedicationLogEditModal';

export const MedsTab: React.FC<{ onTriggerTestAlarm?: () => void }> = ({ onTriggerTestAlarm }) => {
  const { 
    profiles,
    activeProfile, 
    activeProfileId, 
    medications, 
    medicineCabinet, 
    medicationLogs, 
    deleteMedication, 
    deleteCabinetItem, 
    takeMedication, 
    cancelMedicationTake, 
    speak, 
    elderMode,
    showConfirmModal,
    showToast 
  } = useHealthStore();

  const [activeSegment, setActiveSegment] = useState<'calendar' | 'cabinet' | 'history'>('calendar');

  // Logs sub-tab: 'plans' (创建过的用药计划) vs 'records' (具体每次打卡流水)
  const [historySubTab, setHistorySubTab] = useState<'plans' | 'records'>('records');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'taken' | 'missed'>('all');

  // Show all toggle for cabinet & history
  const [showAllCabinet, setShowAllCabinet] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Calendar State
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  // Date String for selected day: YYYY-MM-DD
  const selectedDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Modals & Active Edit Entities
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Medication | null>(null);

  const [showCabinetModal, setShowCabinetModal] = useState(false);
  const [cabinetItemToEdit, setCabinetItemToEdit] = useState<MedicineCabinetItem | null>(null);

  const [showTestAlarmModal, setShowTestAlarmModal] = useState(false);

  const [showLogEditModal, setShowLogEditModal] = useState(false);
  const [logToEdit, setLogToEdit] = useState<any | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = useState<MedicationLog | null>(null);

  const [selectedCabinetDetail, setSelectedCabinetDetail] = useState<MedicineCabinetItem | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<Medication | null>(null);

  // Quick picker drawers
  const [showCabinetPicker, setShowCabinetPicker] = useState(false);
  const [showHistoryPlanPicker, setShowHistoryPlanPicker] = useState(false);

  // Search & Filters in Cabinet
  const [cabSearchQuery, setCabSearchQuery] = useState('');

  const memberMeds = medications.filter(m => 
    !m.isInCabinetOnly && (activeProfileId === 'all' ? true : m.profileId === activeProfileId)
  );

  // Cabinet items list (filtered or all)
  const displayCabinetItems = useMemo(() => {
    let items = medicineCabinet;
    if (!showAllCabinet && activeProfileId !== 'all') {
      items = items.filter(c => !c.memberId || c.memberId === activeProfileId);
    }
    if (cabSearchQuery.trim()) {
      const q = cabSearchQuery.toLowerCase();
      items = items.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.genericName && c.genericName.toLowerCase().includes(q)) ||
        (c.commonName && c.commonName.toLowerCase().includes(q)) ||
        (c.manufacturer && c.manufacturer.toLowerCase().includes(q)) ||
        (c.batchNumber && c.batchNumber.toLowerCase().includes(q))
      );
    }
    return items;
  }, [medicineCabinet, showAllCabinet, activeProfileId, cabSearchQuery]);

  // Plans list in history
  const displayPlans = useMemo(() => {
    if (showAllHistory || activeProfileId === 'all') {
      return medications;
    }
    return medications.filter(m => m.profileId === activeProfileId);
  }, [medications, showAllHistory, activeProfileId]);

  // Filtered Logs in history
  const filteredLogs = useMemo(() => {
    return medicationLogs
      .filter(l => (showAllHistory || activeProfileId === 'all') ? true : (!l.memberId || l.memberId === activeProfileId))
      .filter(l => {
        if (logStatusFilter === 'taken') return l.taken;
        if (logStatusFilter === 'missed') return !l.taken;
        return true;
      })
      .sort((a, b) => {
        const timeA = a.timestamp || `${a.date} ${a.scheduledTime || '00:00'}`;
        const timeB = b.timestamp || `${b.date} ${b.scheduledTime || '00:00'}`;
        return timeB.localeCompare(timeA);
      });
  }, [medicationLogs, showAllHistory, activeProfileId, logStatusFilter]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekIndex = new Date(currentYear, currentMonth - 1, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Open Plan Modal in Add or Edit Mode
  const handleOpenAddPlan = () => {
    setPlanToEdit(null);
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan: Medication) => {
    setPlanToEdit(plan);
    setShowPlanModal(true);
  };

  // Open Cabinet Modal in Add or Edit Mode
  const handleOpenAddCabinet = () => {
    setCabinetItemToEdit(null);
    setShowCabinetModal(true);
  };

  const handleOpenEditCabinet = (item: MedicineCabinetItem) => {
    setCabinetItemToEdit(item);
    setShowCabinetModal(true);
  };

  // Trigger test alarm from TestAlarmModal
  const handleTriggerFullScreenAlarm = (med: Medication, slotTime: string, doseIndex: number) => {
    if (onTriggerTestAlarm) {
      onTriggerTestAlarm();
    } else {
      showToast(`⏰ 触发到点闹钟：${med.name} (${slotTime})`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* 顶部统一标题栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-gray-900">健康用药</h1>
          <p className="text-xs text-gray-500 font-medium">
            {activeProfileId === 'all' ? '全家智能用药排程与家庭药箱' : `${activeProfile?.name || '家庭成员'} · 智能用药排程与健康守护`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* 测试到点闹钟快捷入口 */}
          <button
            onClick={() => setShowTestAlarmModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center space-x-1 cursor-pointer active:scale-95 transition-all shadow-xs"
            title="测试到点闹钟与语音提示语"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span>测试闹钟</span>
          </button>
        </div>
      </div>

      {/* 顶部横向家庭成员快速切换轨与 3 大核心分段切换 */}
      <div className="bg-white border-b border-gray-100 px-4 pt-1 pb-2.5 space-y-2 shadow-xs z-10">
        <MemberSwitcherRail />

        {/* 3 大核心分段切换：用药日历 | 药品药箱 | 服药日志 */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveSegment('calendar')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              activeSegment === 'calendar'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>用药日历</span>
          </button>

          <button
            onClick={() => setActiveSegment('cabinet')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              activeSegment === 'cabinet'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>家庭药箱 ({displayCabinetItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSegment('history')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
              activeSegment === 'history'
                ? 'bg-white text-[#0D9488] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>服药日志</span>
          </button>
        </div>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 scrollbar-hide">
        {/* =========================================================================
            Segment 1: 用药日历 (Calendar)
        ========================================================================== */}
        {activeSegment === 'calendar' && (
          <div className="space-y-4">
            {/* 月份切换与日历格 */}
            <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-black text-gray-900 font-mono">
                    {currentYear}年{currentMonth}月
                  </span>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                    今日 {now.getMonth() + 1}月{now.getDate()}日
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentYear(now.getFullYear());
                      setCurrentMonth(now.getMonth() + 1);
                      setSelectedDay(now.getDate());
                    }}
                    className="text-[11px] text-[#0D9488] font-bold px-2 py-1 hover:bg-teal-50 rounded-md"
                  >
                    回到今天
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 星期标头 */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400">
                <span>日</span>
                <span>一</span>
                <span>二</span>
                <span>三</span>
                <span>四</span>
                <span>五</span>
                <span>六</span>
              </div>

              {/* 日历格子 */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayWeekIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDay === day;
                  const isToday = dateStr === todayDateStr;

                  // Find logs on that day (supports all members when activeProfileId === 'all')
                  const dayLogs = medicationLogs.filter(l => l.date === dateStr && (activeProfileId === 'all' ? true : (!l.memberId || l.memberId === activeProfileId)));
                  const takenLogs = dayLogs.filter(l => l.taken);
                  const hasPlan = memberMeds.length > 0;
                  const allDone = hasPlan && takenLogs.length >= memberMeds.length;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0D9488] text-white font-black shadow-md shadow-teal-500/20 scale-105 z-10'
                          : isToday
                          ? 'bg-teal-50 text-[#0D9488] font-bold border border-teal-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-xs font-mono">{day}</span>
                      {hasPlan && (
                        <div className="flex items-center space-x-0.5 mt-0.5">
                          {allDone ? (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-200' : 'bg-emerald-500'}`} />
                          ) : takenLogs.length > 0 ? (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-amber-500'}`} />
                          ) : (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-200' : 'bg-gray-300'}`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 选中当天的用药计划列表 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-extrabold text-gray-900 text-sm flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#0D9488]" />
                  <span>
                    {currentMonth}月{selectedDay}日 服药计划 ({memberMeds.length}种)
                    {activeProfileId === 'all' && <span className="text-xs text-[#0D9488] ml-1 font-bold">【全家】</span>}
                  </span>
                </h4>
                <button
                  onClick={handleOpenAddPlan}
                  className="text-xs text-[#0D9488] font-bold hover:underline cursor-pointer flex items-center space-x-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增服药计划</span>
                </button>
              </div>

              {memberMeds.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2 shadow-xs">
                  <Pill className="w-10 h-10 text-teal-600/30 mx-auto" />
                  <p className="text-xs text-gray-400 font-medium">当前长辈暂无服药排程，点击右上角添加</p>
                </div>
              ) : (
                memberMeds.map((med) => {
                  const medProfile = profiles.find(p => p.id === med.profileId);
                  const scheduleTimes = med.scheduleTimes || [med.time || '08:00'];
                  const totalDoses = scheduleTimes.length;
                  const takenLogs = medicationLogs.filter(
                    l => l.medicationId === med.id && l.date === selectedDateStr && l.taken
                  );
                  const takenCount = takenLogs.length;

                  return (
                    <div
                      key={med.id}
                      className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3"
                    >
                      {/* 第一行：药品图片 + 药品名称 + 剂量 + 语音 + 编辑 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {med.imageUrl || med.image ? (
                              <img
                                src={med.imageUrl || med.image}
                                alt={med.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Pill className="w-6 h-6 text-[#0D9488]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h3 className={`font-black text-gray-900 truncate ${elderMode ? 'text-lg' : 'text-sm'}`}>
                                {med.name}
                              </h3>
                              {/* 明确标注所属家庭成员 */}
                              {medProfile && (
                                <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0 border border-teal-200">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: medProfile.avatarColor || '#0D9488' }} />
                                  <span>{medProfile.name}</span>
                                </span>
                              )}
                              {med.alarmEnabled !== false && (
                                <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" title="已开启到点闹钟" />
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-1">
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                                {med.mealTimingLabel || '饭后服'}
                              </span>
                              <span className="text-[11px] bg-teal-50 text-[#0D9488] px-2 py-0.5 rounded font-medium">
                                {med.dosage}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                每日{totalDoses}次
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 右侧：语音提醒 + 编辑计划 + 详情 */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              const text = `该吃药啦！${medProfile?.name || activeProfile?.name || '您'}请按时服用${med.name}，每次${med.dosage}，${med.mealTimingLabel || '按医嘱服用'}。`;
                              speak(text);
                            }}
                            className="w-8 h-8 rounded-full bg-teal-50 text-[#0D9488] hover:bg-teal-100 flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-teal-100"
                            title="语音播报提醒"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 【核心要求：点击编辑的地方，只能是编辑，修改了立刻更新】 */}
                          <button
                            onClick={() => handleOpenEditPlan(med)}
                            className="p-1.5 text-gray-400 hover:text-[#0D9488] rounded-lg transition-colors cursor-pointer"
                            title="编辑用药计划"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedPlanDetail(med)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                            title="查看计划详情"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 第二行：时间槽打卡 Slots */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                        {scheduleTimes.map((slotTime, idx) => {
                          const log = medicationLogs.find(
                            l => l.medicationId === med.id && l.date === selectedDateStr && l.doseIndex === idx && l.taken
                          );
                          const isTaken = !!log;

                          return (
                            <button
                              key={idx}
                              onClick={async () => {
                                if (isTaken) {
                                  showConfirmModal({
                                    title: '确认取消本次服药打卡？',
                                    content: `取消后将把「${med.name}」在 ${selectedDateStr} 第 ${idx + 1} 次（${slotTime}）的服药状态重置为未打卡。`,
                                    confirmText: '确认取消',
                                    confirmColor: 'bg-[#EF4444]',
                                    onConfirm: async () => {
                                      await cancelMedicationTake(med.id, selectedDateStr, idx);
                                    }
                                  });
                                } else {
                                  await takeMedication(med.id, selectedDateStr, idx);
                                }
                              }}
                              className={`py-2.5 px-3 rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 ${
                                isTaken
                                  ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                                  : 'bg-gray-50/80 border-gray-200 text-gray-700 hover:border-teal-400'
                              }`}
                            >
                              <div className="flex items-center space-x-1.5">
                                <Clock className={`w-3.5 h-3.5 ${isTaken ? 'text-white' : 'text-gray-400'}`} />
                                <span className="text-xs font-bold font-mono">{slotTime}</span>
                              </div>

                              <div className="flex items-center space-x-1">
                                {isTaken ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                    <span className="text-[10px] text-teal-100 font-medium">已服</span>
                                    {medProfile && activeProfileId === 'all' && (
                                      <span className="text-[9px] text-teal-200">({medProfile.name})</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[11px] text-gray-400 font-medium">打卡</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* 第三行：【核心要求：注意事项显示完全，不截断】 */}
                      {med.precautions && med.precautions.length > 0 && (
                        <div className="pt-2 border-t border-gray-50 space-y-1">
                          <span className="text-[10px] font-bold text-amber-800 flex items-center space-x-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>注意事项与用药禁忌：</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {med.precautions.map(p => (
                              <span
                                key={p}
                                className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            Segment 2: 智能药箱 (Cabinet)
        ========================================================================== */}
        {activeSegment === 'cabinet' && (
          <div className="space-y-4">
            {/* 顶部搜索、查看全部筛选与录入药品 */}
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cabSearchQuery}
                  onChange={(e) => setCabSearchQuery(e.target.value)}
                  placeholder="搜索药箱中的药品名称、厂家或批号…"
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-gray-900 shadow-xs focus:border-[#0D9488]"
                />
              </div>
              <button
                onClick={() => setShowAllCabinet(!showAllCabinet)}
                className={`px-2.5 py-2 rounded-2xl font-bold text-xs flex items-center space-x-1 border transition-all cursor-pointer shrink-0 ${
                  showAllCabinet || activeProfileId === 'all'
                    ? 'bg-teal-50 border-teal-200 text-[#0D9488]'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                title="切换展示全家所有药品的库存"
              >
                <span>{showAllCabinet || activeProfileId === 'all' ? '已展示全家' : '查看全部'}</span>
              </button>
              <button
                onClick={handleOpenAddCabinet}
                className="px-3 py-2 bg-[#0D9488] text-white rounded-2xl font-bold text-xs flex items-center space-x-1 shadow-md shadow-teal-500/20 hover:bg-teal-700 cursor-pointer shrink-0 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>录入药品</span>
              </button>
            </div>

            {/* 药箱列表 */}
            <div className="space-y-3">
              {displayCabinetItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
                  <Package className="w-10 h-10 text-teal-600/30 mx-auto" />
                  <p className="text-xs text-gray-400 font-medium">家庭药箱中暂无符合条件的药品</p>
                  <button
                    onClick={handleOpenAddCabinet}
                    className="px-4 py-1.5 bg-teal-50 text-[#0D9488] rounded-xl font-bold text-xs hover:bg-teal-100 inline-block cursor-pointer mt-1"
                  >
                    立即录入药品
                  </button>
                </div>
              ) : (
                displayCabinetItems.map(item => {
                  const itemProfile = profiles.find(p => p.id === item.memberId);
                  const defaultImg = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80';

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* 药品左侧照片展示 */}
                          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            <img
                              src={item.imageUrl || defaultImg}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h4 className="font-black text-gray-900 text-sm truncate">{item.name}</h4>
                              <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded shrink-0">
                                {item.dosageForm || item.form || '常规剂型'}
                              </span>
                              {itemProfile ? (
                                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                                  {itemProfile.name}
                                </span>
                              ) : (
                                <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-1.5 py-0.5 rounded shrink-0">
                                  全家共用
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                              {item.genericName || item.commonName || '通用名未标明'} · {item.specifications || item.specification || '标准规格'}
                            </p>
                            {item.manufacturer && (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                                厂家：{item.manufacturer}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 药箱中的药品支持编辑与删除 */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditCabinet(item)}
                            className="p-1.5 text-gray-400 hover:text-[#0D9488] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="编辑药品信息"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              showConfirmModal({
                                title: '确认从药箱移除药品？',
                                content: `确认彻底移除「${item.name}」？此操作不可恢复。`,
                                confirmColor: 'bg-red-500',
                                onConfirm: async () => {
                                  await deleteCabinetItem(item.id);
                                }
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="删除药品"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                        <div>
                          <span className="text-gray-400">库存存量：</span>
                          <strong className="text-gray-800">{item.stock} {item.unit || item.stockUnit || '盒'}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400">效期截止：</span>
                          <strong className="text-gray-800">{item.expiryDate || item.expireDate || '未录入'}</strong>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-gray-400">存放位置：</span>
                          <span className="text-gray-700">{item.storageLocation || item.location || '家庭药箱'}</span>
                        </div>
                      </div>

                      {/* 注意事项完整展示 */}
                      {item.precautions && item.precautions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.precautions.map(p => (
                            <span key={p} className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            Segment 3: 服药日志 (History)
        ========================================================================== */}
        {activeSegment === 'history' && (
          <div className="space-y-4">
            {/* 二级分类：创建过的用药计划 vs 具体打卡流水 */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() => setHistorySubTab('records')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historySubTab === 'records'
                    ? 'bg-white text-[#0D9488] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                服药打卡流水 ({filteredLogs.length})
              </button>
              <button
                onClick={() => setHistorySubTab('plans')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historySubTab === 'plans'
                    ? 'bg-white text-[#0D9488] shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                创建过的用药计划 ({displayPlans.length})
              </button>
            </div>

            {/* 1. 服药打卡流水 */}
            {historySubTab === 'records' && (
              <div className="space-y-3">
                {/* 状态筛选与全员筛选 */}
                <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setShowAllHistory(!showAllHistory)}
                      className={`text-[11px] px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                        showAllHistory || activeProfileId === 'all'
                          ? 'bg-teal-50 border-teal-300 text-[#0D9488]'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {showAllHistory || activeProfileId === 'all' ? '展示全员' : '仅当前长辈'}
                    </button>
                  </div>

                  <div className="flex space-x-1">
                    {(['all', 'taken', 'missed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setLogStatusFilter(st)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                          logStatusFilter === st
                            ? 'bg-[#0D9488] border-[#0D9488] text-white'
                            : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {st === 'all' ? '全部记录' : st === 'taken' ? '已打卡' : '逾期未服'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 space-y-2">
                    <History className="w-10 h-10 text-teal-600/30 mx-auto" />
                    <p className="text-xs text-gray-400 font-medium">暂无符合条件的打卡流水</p>
                  </div>
                ) : (
                  filteredLogs.map(log => {
                    const logProfile = profiles.find(p => p.id === log.memberId || p.id === log.profileId);
                    return (
                      <div
                        key={log.id}
                        className="bg-white rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between hover:border-teal-200 transition-all"
                      >
                        <div 
                          className="space-y-1 flex-1 cursor-pointer pr-2"
                          onClick={() => setSelectedLogDetail(log)}
                        >
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-black text-gray-900 text-xs">{log.medicationName || '用药计划'}</span>
                            {logProfile && (
                              <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                                {logProfile.name}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.taken ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {log.taken ? '✓ 已打卡' : '⏰ 逾期未服'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-mono">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{log.date} {log.scheduledTime || log.timestamp?.slice(11, 16)}</span>
                            <span>· 剂量: {log.dosage || '1次'}</span>
                          </div>
                          {log.note && (
                            <p className="text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded mt-1">
                              备注: {log.note}
                            </p>
                          )}
                        </div>

                        {/* 操作：查看详情与编辑 */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => setSelectedLogDetail(log)}
                            className="px-2 py-1.5 bg-gray-50 hover:bg-teal-50 hover:text-[#0D9488] border border-gray-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
                          >
                            详情
                          </button>
                          <button
                            onClick={() => {
                              setLogToEdit(log);
                              setShowLogEditModal(true);
                            }}
                            className="px-2.5 py-1.5 bg-teal-50 text-[#0D9488] hover:bg-teal-100 border border-teal-200 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>编辑</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 2. 创建过的计划：添加进行中/已结束标签，已结束点击编辑显示重新启动计划 */}
            {historySubTab === 'plans' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                      showAllHistory || activeProfileId === 'all'
                        ? 'bg-teal-50 border-teal-300 text-[#0D9488]'
                        : 'bg-white border-gray-200 text-gray-600'
                    }`}
                  >
                    {showAllHistory || activeProfileId === 'all' ? '展示全员计划' : '仅当前长辈'}
                  </button>
                  <span className="text-[11px] text-gray-400">共 {displayPlans.length} 个用药方案</span>
                </div>

                {displayPlans.map(plan => {
                  const planProfile = profiles.find(p => p.id === plan.profileId);
                  const isEnded = plan.status === 'completed' || (
                    !!plan.endDate && !plan.isLongTerm && new Date(plan.endDate).getTime() < new Date().setHours(0,0,0,0)
                  );

                  return (
                    <div
                      key={plan.id}
                      className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            isEnded ? 'bg-gray-100 text-gray-400' : 'bg-teal-50 text-[#0D9488]'
                          }`}>
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h4 className="font-black text-gray-900 text-sm">{plan.name}</h4>
                              {planProfile && (
                                <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-1.5 py-0.5 rounded">
                                  {planProfile.name}
                                </span>
                              )}
                              {/* 明确展示计划当前状态标签：进行中 / 已结束 */}
                              {isEnded ? (
                                <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                                  已结束
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                                  进行中
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {plan.dosage} · 每日{plan.scheduleTimes?.length || 1}次 · {plan.mealTimingLabel || '饭后'}
                              {plan.endDate && !plan.isLongTerm ? ` (截止: ${plan.endDate})` : ' (长期服用)'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditPlan(plan)}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition-all ${
                              isEnded 
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200' 
                                : 'bg-teal-50 text-[#0D9488] hover:bg-teal-100'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEnded ? '重新启动计划' : '编辑计划'}</span>
                          </button>
                          <button
                            onClick={() => {
                              showConfirmModal({
                                title: '确认删除该用药计划？',
                                content: `确认彻底删除「${plan.name}」用药计划？`,
                                confirmColor: 'bg-red-500',
                                onConfirm: async () => {
                                  await deleteMedication(plan.id);
                                }
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="删除计划"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 注意事项完整呈现 */}
                      {plan.precautions && plan.precautions.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-gray-50">
                          {plan.precautions.map(p => (
                            <span key={p} className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          全局各功能弹窗与抽屉
      ========================================================================== */}
      {/* 1. 用药计划添加/编辑弹窗 */}
      <MedicationPlanModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setPlanToEdit(null);
        }}
        planToEdit={planToEdit}
      />

      {/* 2. 药箱药品添加/编辑弹窗 */}
      <MedicineCabinetModal
        isOpen={showCabinetModal}
        onClose={() => {
          setShowCabinetModal(false);
          setCabinetItemToEdit(null);
        }}
        itemToEdit={cabinetItemToEdit}
      />

      {/* 3. 测试闹钟弹窗 */}
      <TestAlarmModal
        isOpen={showTestAlarmModal}
        onClose={() => setShowTestAlarmModal(false)}
        medications={memberMeds}
        activeProfile={activeProfile || null}
        onTriggerFullScreenAlarm={handleTriggerFullScreenAlarm}
      />

      {/* 4. 服药流水编辑弹窗 */}
      <MedicationLogEditModal
        isOpen={showLogEditModal}
        onClose={() => {
          setShowLogEditModal(false);
          setLogToEdit(null);
        }}
        log={logToEdit}
      />

      {/* 5. 服药流水详情弹窗 */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#0D9488]" />
                <h3 className="font-black text-gray-900 text-sm">服药记录详情</h3>
              </div>
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">药品名称</span>
                <strong className="text-gray-900 font-bold">{selectedLogDetail.medicationName || '用药计划'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">所属成员</span>
                <strong className="text-teal-700 font-bold">
                  {profiles.find(p => p.id === selectedLogDetail.memberId || p.id === selectedLogDetail.profileId)?.name || '未指定'}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">排程时间</span>
                <span className="text-gray-800 font-mono">{selectedLogDetail.date} {selectedLogDetail.scheduledTime || '08:00'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">服药剂量</span>
                <span className="text-gray-800 font-bold">{selectedLogDetail.dosage || '1次'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">打卡状态</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  selectedLogDetail.taken ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {selectedLogDetail.taken ? '✓ 已打卡服药' : '⏰ 逾期未服'}
                </span>
              </div>
              {selectedLogDetail.timestamp && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">记录时间</span>
                  <span className="text-gray-600 font-mono">{selectedLogDetail.timestamp}</span>
                </div>
              )}
              {selectedLogDetail.note && (
                <div className="pt-1 border-t border-gray-200/50">
                  <span className="text-gray-400 block mb-0.5">服药备注</span>
                  <p className="text-gray-700 bg-white p-2 rounded-xl border border-gray-200/70">{selectedLogDetail.note}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 cursor-pointer"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setLogToEdit(selectedLogDetail);
                  setSelectedLogDetail(null);
                  setShowLogEditModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0D9488] text-white font-bold hover:bg-teal-700 flex items-center justify-center space-x-1 cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>编辑此记录</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
