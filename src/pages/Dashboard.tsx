import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Clock, 
  Pill, 
  Activity, 
  User,
  HeartPulse,
  Bell
} from 'lucide-react';
import { HomeTab } from './HomeTab';
import { TimelineTab } from './TimelineTab';
import { MedsTab } from './MedsTab';
import { HealthTab } from './HealthTab';
import { MyTab } from './MyTab';
import { MemberEditModal } from '../components/MemberEditModal';
import { GlobalConfirmModal } from '../components/GlobalConfirmModal';
import { GlobalPlaceholderSheet } from '../components/GlobalPlaceholderSheet';
import { MedicationAlarmModal } from '../components/MedicationAlarmModal';
import { useHealthStore } from '../store';
import { MemberProfile, Medication } from '../types';

export const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { elderMode, activeProfile, activeProfileId, medications, takeMedication, showToast } = useHealthStore();
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'meds' | 'health' | 'my'>('home');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<MemberProfile | null>(null);

  // Global Alarm States
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmMedication, setAlarmMedication] = useState<Medication | null>(null);
  const [alarmScheduledTime, setAlarmScheduledTime] = useState('08:00');
  const [alarmDoseIndex, setAlarmDoseIndex] = useState(0);

  // Track dismissed or snoozed times to prevent repetitive triggers within the same minute
  const handledAlarmsRef = useRef<Set<string>>(new Set());

  // Alarm scheduler loop (Checks every 10s against current local time)
  useEffect(() => {
    const checkAlarmInterval = setInterval(() => {
      const now = new Date();
      const currentHH = String(now.getHours()).padStart(2, '0');
      const currentMM = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHH}:${currentMM}`;
      const todayDateStr = now.toISOString().split('T')[0];

      // Check all medications for active profile
      const targetMeds = medications.filter(m => m.profileId === activeProfileId);

      for (const med of targetMeds) {
        if (!med.scheduleTimes) continue;

        med.scheduleTimes.forEach((scheduledTime, idx) => {
          const alarmKey = `${med.id}_${todayDateStr}_${scheduledTime}`;

          if (scheduledTime === currentTimeStr && !handledAlarmsRef.current.has(alarmKey)) {
            // Check if already taken
            const isTaken = med.takenDoses?.includes(idx);
            if (!isTaken) {
              handledAlarmsRef.current.add(alarmKey);
              setAlarmMedication(med);
              setAlarmScheduledTime(scheduledTime);
              setAlarmDoseIndex(idx);
              setAlarmOpen(true);
            }
          }
        });
      }
    }, 10000); // 10 seconds

    return () => clearInterval(checkAlarmInterval);
  }, [medications, activeProfileId]);

  // Trigger simulated alarm for quick test
  const handleTriggerTestAlarm = () => {
    const memberMeds = medications.filter(m => m.profileId === activeProfileId);
    const targetMed = memberMeds[0] || {
      id: 'test_med',
      profileId: activeProfileId || 'p1',
      name: '硝苯地平控释片 (拜新同)',
      dosage: '1片 (30mg)',
      frequency: 1,
      scheduleTimes: ['08:00'],
      deliveryMethod: '温水送服',
      mealTimingLabel: '晨起饭后 15–30 分钟',
      precautions: ['整片吞服，不可嚼碎', '服药期间忌饮酒', '避免与西柚汁同服'],
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80'
    };

    const now = new Date();
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');

    setAlarmMedication(targetMed as any);
    setAlarmScheduledTime(`${currentHH}:${currentMM}`);
    setAlarmDoseIndex(0);
    setAlarmOpen(true);
    showToast('⏰ 到点用药闹钟已触发！');
  };

  const handleTakeFromAlarm = async () => {
    if (alarmMedication) {
      await takeMedication(alarmMedication.id, alarmDoseIndex);
      showToast('已完成服药打卡！');
      setAlarmOpen(false);
    }
  };

  const handleSnoozeAlarm = (minutes: number) => {
    setAlarmOpen(false);
    showToast(`闹钟已推迟 ${minutes} 分钟后再次提醒`);
    setTimeout(() => {
      setAlarmOpen(true);
    }, minutes * 60 * 1000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] relative overflow-hidden">
      {/* 5大核心页面根据 Tab 切换渲染 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'timeline' && <TimelineTab onNavigateTab={(tab) => setActiveTab(tab as any)} />}
        {activeTab === 'meds' && (
          <MedsTab onTriggerTestAlarm={handleTriggerTestAlarm} />
        )}
        {activeTab === 'health' && (
          <HealthTab
            onOpenAddMember={() => {
              setProfileToEdit(null);
              setShowMemberModal(true);
            }}
            onOpenEditMember={() => {
              setProfileToEdit(activeProfile || null);
              setShowMemberModal(true);
            }}
          />
        )}
        {activeTab === 'my' && (
          <MyTab
            onLogout={onLogout}
            onOpenAddMember={() => {
              setProfileToEdit(null);
              setShowMemberModal(true);
            }}
            onOpenEditMember={() => {
              setProfileToEdit(activeProfile || null);
              setShowMemberModal(true);
            }}
          />
        )}
      </main>

      {/* 底部 5 标签导航栏 (固定吸底) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 py-1.5 flex items-center justify-around z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {/* 首页 */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'home' ? 'text-[#0D9488] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activeTab === 'home' && (
              <div className="w-1 h-1 bg-[#0D9488] rounded-full mx-auto mt-0.5" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${elderMode ? 'text-xs' : ''}`}>首页</span>
        </button>

        {/* 状态 (时间轴) */}
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'timeline' ? 'text-[#0D9488] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <Clock className={`w-5 h-5 ${activeTab === 'timeline' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activeTab === 'timeline' && (
              <div className="w-1 h-1 bg-[#0D9488] rounded-full mx-auto mt-0.5" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${elderMode ? 'text-xs' : ''}`}>时间轴</span>
        </button>

        {/* 用药管理 */}
        <button
          onClick={() => setActiveTab('meds')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'meds' ? 'text-[#0D9488] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <Pill className={`w-5 h-5 ${activeTab === 'meds' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activeTab === 'meds' && (
              <div className="w-1 h-1 bg-[#0D9488] rounded-full mx-auto mt-0.5" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${elderMode ? 'text-xs' : ''}`}>用药</span>
        </button>

        {/* 健康数据 */}
        <button
          onClick={() => setActiveTab('health')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'health' ? 'text-[#0D9488] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <HeartPulse className={`w-5 h-5 ${activeTab === 'health' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activeTab === 'health' && (
              <div className="w-1 h-1 bg-[#0D9488] rounded-full mx-auto mt-0.5" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${elderMode ? 'text-xs' : ''}`}>健康</span>
        </button>

        {/* 我的 */}
        <button
          onClick={() => setActiveTab('my')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 ${
            activeTab === 'my' ? 'text-[#0D9488] font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 ${activeTab === 'my' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {activeTab === 'my' && (
              <div className="w-1 h-1 bg-[#0D9488] rounded-full mx-auto mt-0.5" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${elderMode ? 'text-xs' : ''}`}>我的</span>
        </button>
      </nav>

      {/* 全局到点用药闹钟弹窗 */}
      <MedicationAlarmModal
        isOpen={alarmOpen}
        medication={alarmMedication}
        doseIndex={alarmDoseIndex}
        scheduledTime={alarmScheduledTime}
        profile={activeProfile || null}
        onTake={handleTakeFromAlarm}
        onSnooze={handleSnoozeAlarm}
        onDismiss={() => setAlarmOpen(false)}
      />

      {/* 全局家庭成员添加 / 编辑弹窗 */}
      <MemberEditModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        profileToEdit={profileToEdit}
      />

      {/* 全局统一确认模态框 */}
      <GlobalConfirmModal />

      {/* 全局占位与功能说明半屏抽屉 */}
      <GlobalPlaceholderSheet />
    </div>
  );
};
