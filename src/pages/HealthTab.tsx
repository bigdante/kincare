import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Heart, 
  Plus, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  UserPlus, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Check, 
  X, 
  Calendar, 
  FileDown, 
  Thermometer, 
  Droplet, 
  Scale, 
  Clock, 
  Camera, 
  ShieldCheck, 
  Upload, 
  FileCode, 
  File, 
  Eye, 
  Smartphone, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  Filter, 
  SlidersHorizontal,
  Tag,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useHealthStore } from '../store';
import { MemberSwitcherRail } from '../components/MemberSwitcherRail';
import { HealthTrendChart, MetricType, METRIC_CONFIGS } from '../components/HealthTrendChart';
import { mockGenerator } from '../ai_service';
import { MedicalRecordTemplateType, MedicalRecordAttachment, HealthRecord, MedicalRecord } from '../types';
import { HealthLogModal } from '../components/HealthLogModal';
import { EditHealthRecordModal } from '../components/EditHealthRecordModal';
import { MedicalRecordModal } from '../components/MedicalRecordModal';
import { MedicalRecordDetailModal } from '../components/MedicalRecordDetailModal';

export const HealthTab: React.FC<{ onOpenEditMember?: () => void; onOpenAddMember?: () => void }> = ({
  onOpenEditMember,
  onOpenAddMember
}) => {
  const { 
    activeProfile, 
    activeProfileId, 
    healthRecords, 
    medicalRecords, 
    medications, 
    addHealthRecord, 
    updateHealthRecord,
    deleteHealthRecord, 
    addMedicalRecord, 
    deleteMedicalRecord, 
    updateProfile, 
    addTagToProfile, 
    removeTagFromProfile, 
    elderMode, 
    showConfirmModal, 
    showToast 
  } = useHealthStore();

  const [activeTrendMetric, setActiveTrendMetric] = useState<MetricType>('blood_pressure');

  // Filter Drawer & State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterTimeRange, setFilterTimeRange] = useState<'all' | '7' | '30' | '90'>('all');
  const [filterMetricType, setFilterMetricType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterScene, setFilterScene] = useState<string>('all');

  // List expand state (default max 5 displayed)
  const [isListExpanded, setIsListExpanded] = useState(false);

  // Edit Record Modal
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  // Modal States
  const [showBMISheet, setShowBMISheet] = useState(false);
  const [showHealthLogModal, setShowHealthLogModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagType, setNewTagType] = useState<'danger' | 'warning' | 'info' | 'normal'>('warning');

  // Medical Record Modals (Full Details, Multi-Template Switcher & Recheck Scheduling)
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [medicalRecordToEdit, setMedicalRecordToEdit] = useState<MedicalRecord | null>(null);
  const [selectedMedicalRecordDetail, setSelectedMedicalRecordDetail] = useState<MedicalRecord | null>(null);

  // BMI Quick Edit States
  const [editHeight, setEditHeight] = useState<number>(activeProfile?.height || 170);
  const [editWeight, setEditWeight] = useState<number>(activeProfile?.weight || 70);

  const memberRecords = healthRecords.filter(r => r.memberId === activeProfileId);
  const memberMedicals = medicalRecords.filter(m => m.memberId === activeProfileId);

  // Filtered health records by filter modal conditions
  const filteredRecords = useMemo(() => {
    return memberRecords.filter(r => {
      // Time filter
      if (filterTimeRange !== 'all') {
        const days = Number(filterTimeRange);
        const recordDate = new Date(r.measuredAt).getTime();
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (recordDate < cutoff) return false;
      }
      // Metric Type filter
      if (filterMetricType !== 'all' && r.type !== filterMetricType) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && r.status !== filterStatus) {
        return false;
      }
      // Scene filter
      if (filterScene !== 'all' && r.scene !== filterScene) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  }, [memberRecords, filterTimeRange, filterMetricType, filterStatus, filterScene]);

  // Display only max 5 items by default, user can scroll or expand
  const displayedRecords = isListExpanded ? filteredRecords : filteredRecords.slice(0, 5);

  // Latest metrics
  const latestBP = memberRecords.filter(r => r.type === 'blood_pressure')[0];
  const latestSugar = memberRecords.filter(r => r.type === 'blood_sugar')[0];
  const latestHR = memberRecords.filter(r => r.type === 'heartRate')[0];

  const bmiValue = activeProfile?.bmi || 22.0;
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '偏瘦', color: 'text-amber-300', bg: 'bg-amber-500' };
    if (bmi <= 24) return { label: 'BMI 正常', color: 'text-white', bg: 'bg-emerald-500' };
    if (bmi <= 28) return { label: '超重', color: 'text-amber-300', bg: 'bg-amber-500' };
    return { label: '肥胖', color: 'text-red-300', bg: 'bg-red-500' };
  };
  const bmiCategory = getBMICategory(bmiValue);
  const strokeDashoffset = Math.max(0, 314 - (Math.min(35, bmiValue) / 35) * 314);

  const handleSaveBMI = async () => {
    if (!activeProfileId) return;
    await updateProfile(activeProfileId, {
      height: editHeight,
      weight: editWeight
    });
    setShowBMISheet(false);
    showToast('身体基本指标已更新');
  };

  const handleOpenRecordSheet = (type: MetricType) => {
    setActiveTrendMetric(type);
    setShowHealthLogModal(true);
  };

  // Open Edit Record
  const handleOpenEditRecord = (r: HealthRecord) => {
    setEditingRecord(r);
  };

  // Quick Preset Tags
  const presetTags = [
    { label: '晨峰血压警惕', type: 'danger' as const },
    { label: '心律不齐防范', type: 'danger' as const },
    { label: '空腹血糖波动', type: 'warning' as const },
    { label: '痛风低嘌呤饮食', type: 'warning' as const },
    { label: '定期眼底复查', type: 'info' as const },
    { label: '防跌倒看护', type: 'info' as const },
    { label: '血压平稳受控', type: 'normal' as const }
  ];

  const handleAddCustomTag = async () => {
    if (!newTagLabel.trim() || !activeProfileId) return;
    await addTagToProfile(activeProfileId, {
      label: newTagLabel.trim(),
      type: newTagType
    });
    setNewTagLabel('');
    setShowAddTagModal(false);
    showToast('重点关注标签已添加');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F9FAFB] pb-24 scrollbar-hide select-none">
      {/* 顶部标题栏 (根据用户要求：取消掉加号) */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-900">健康数据</h1>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400 font-medium">KinCare 健康中心</span>
        </div>
      </div>

      {/* 全局成员切换轨 */}
      <MemberSwitcherRail showAddButton onAddMember={onOpenAddMember} />

      <div className="px-3.5 py-4 space-y-4">
        {/* 健康名片卡 (Health ID Card) */}
        <div
          onClick={() => onOpenEditMember && onOpenEditMember()}
          className="rounded-3xl p-5 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-white shadow-[0_8px_20px_rgba(13,148,136,0.25)] relative overflow-hidden cursor-pointer group active:scale-[0.99] transition-transform"
        >
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            {/* 左侧信息区 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-full border-2 border-white/80 overflow-hidden bg-white/20 shadow-md">
                  {activeProfile?.avatarUrl ? (
                    <img src={activeProfile.avatarUrl} alt={activeProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl">
                      {activeProfile?.name?.slice(0, 1) || '我'}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-black flex items-center space-x-1.5">
                    <span>{activeProfile?.name}</span>
                    <Edit3 className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                  </h2>
                  <p className="text-xs text-white/80 font-medium">
                    {activeProfile?.age || 68}岁 · {activeProfile?.relation === 'self' ? '本人' : activeProfile?.relation === 'father' ? '父亲' : activeProfile?.relation === 'mother' ? '母亲' : '家人'} · {activeProfile?.gender === 'male' ? '男' : '女'}
                  </p>
                </div>
              </div>

              {/* 健康状态 */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>健康档案已建档</span>
                </span>
                <span className="text-[11px] text-white/60">
                  点击名片编辑资料与头像
                </span>
              </div>
            </div>

            {/* 右侧 BMI 圆环 */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowBMISheet(true);
              }}
              className="flex flex-col items-center justify-center relative p-1 cursor-pointer hover:scale-105 transition-transform"
              title="点击调整身高体重"
            >
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" className="stroke-white/20" strokeWidth="8" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    className="stroke-white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="314"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black leading-none">{bmiValue}</span>
                  <span className="text-[9px] text-white/80 font-bold mt-0.5">{bmiCategory.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 【新增重点关注标签卡】(位于重点概览上方，不同严重程度对应不同颜色，支持自定义编辑输入与删除) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-[#0D9488]" />
              <span>长辈重点关注标签</span>
            </h3>
            <button
              onClick={() => setShowAddTagModal(true)}
              className="text-xs text-[#0D9488] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加/编辑关注项</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {(!activeProfile?.tags || activeProfile.tags.length === 0) ? (
              <div className="w-full py-2 text-xs text-gray-400 flex items-center justify-between">
                <span>暂未设置长辈重点关注标签</span>
                <button
                  onClick={() => setShowAddTagModal(true)}
                  className="text-teal-600 font-bold hover:underline"
                >
                  一键选择预设标签
                </button>
              </div>
            ) : (
              activeProfile.tags.map((tag, idx) => {
                const isDanger = tag.type === 'danger';
                const isWarning = tag.type === 'warning';
                const isInfo = tag.type === 'info';
                const isNormal = tag.type === 'normal';

                return (
                  <div
                    key={idx}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                      isDanger
                        ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                        : isWarning
                        ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs'
                        : isInfo
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isDanger ? 'bg-rose-500 animate-pulse' :
                      isWarning ? 'bg-amber-500' :
                      isInfo ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    <span>{tag.label}</span>
                    <button
                      onClick={() => activeProfileId && removeTagFromProfile(activeProfileId, tag.label)}
                      className="ml-1 opacity-60 hover:opacity-100 hover:text-red-600 cursor-pointer"
                      title="删除此标签"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 重点概览面板 (常驻四等分，点击记一笔) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-[#0D9488]" />
              <span>体征重点概览</span>
            </h3>
            <button
              onClick={() => handleOpenRecordSheet(activeTrendMetric)}
              className="text-xs text-[#0D9488] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>记一笔体征</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 text-center">
            {/* 血压 */}
            <div
              onClick={() => {
                setActiveTrendMetric('blood_pressure');
                handleOpenRecordSheet('blood_pressure');
              }}
              className="bg-gray-50/80 rounded-xl p-2 cursor-pointer hover:bg-teal-50/50 transition-colors"
            >
              <span className="text-[10px] text-gray-400 font-medium block">最新血压</span>
              <span className="text-sm font-extrabold text-gray-900 block mt-0.5">
                {latestBP ? `${latestBP.sys}/${latestBP.dia}` : '132/82'}
              </span>
              <span className="text-[9px] text-gray-400">mmHg</span>
            </div>

            {/* 血糖 */}
            <div
              onClick={() => {
                setActiveTrendMetric('blood_sugar');
                handleOpenRecordSheet('blood_sugar');
              }}
              className="bg-gray-50/80 rounded-xl p-2 cursor-pointer hover:bg-teal-50/50 transition-colors"
            >
              <span className="text-[10px] text-gray-400 font-medium block">空腹血糖</span>
              <span className="text-sm font-extrabold text-gray-900 block mt-0.5">
                {latestSugar ? latestSugar.value : '6.2'}
              </span>
              <span className="text-[9px] text-gray-400">mmol/L</span>
            </div>

            {/* 心率 */}
            <div
              onClick={() => {
                setActiveTrendMetric('heartRate');
                handleOpenRecordSheet('heartRate');
              }}
              className="bg-gray-50/80 rounded-xl p-2 cursor-pointer hover:bg-teal-50/50 transition-colors"
            >
              <span className="text-[10px] text-gray-400 font-medium block">静息心率</span>
              <span className="text-sm font-extrabold text-gray-900 block mt-0.5">
                {latestHR ? latestHR.value : '72'}
              </span>
              <span className="text-[9px] text-gray-400">bpm</span>
            </div>

            {/* BMI */}
            <div
              onClick={() => setShowBMISheet(true)}
              className="bg-gray-50/80 rounded-xl p-2 cursor-pointer hover:bg-teal-50/50 transition-colors"
            >
              <span className="text-[10px] text-gray-400 font-medium block">BMI指数</span>
              <span className="text-sm font-extrabold text-gray-900 block mt-0.5">
                {bmiValue}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold">正常</span>
            </div>
          </div>
        </div>

        {/* 核心折线趋势图组件 (下拉菜单选择指标 + 右侧筛选查找入口) */}
        <HealthTrendChart
          records={memberRecords}
          activeMetric={activeTrendMetric}
          onSelectMetric={(m) => setActiveTrendMetric(m)}
          onAddRecord={(m) => handleOpenRecordSheet(m)}
          onOpenFilter={() => setShowFilterModal(true)}
        />

        {/* 详细体征历史记录列表 (默认最多显示 5 条，支持手滑动展示更多，支持数据编辑和改写) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <span>体征明细记录流水 ({filteredRecords.length})</span>
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className="text-xs text-[#0D9488] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>筛选查找</span>
              </button>
            </div>
          </div>

          {/* 可滑动容器 (支持手滑动，最多默认显示 5 条) */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
            {displayedRecords.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                暂无符合筛选条件的测量记录
              </div>
            ) : (
              displayedRecords.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-teal-50/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-gray-900">{r.typeName}</span>
                      {r.scene && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-[#0D9488] font-bold">
                          {r.scene}
                        </span>
                      )}
                      {r.source === 'bluetooth' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium flex items-center space-x-0.5">
                          <Smartphone className="w-2.5 h-2.5" />
                          <span>蓝牙设备</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 font-mono">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{r.measuredAt || '2026-08-31 08:30:15'}</span>
                    </div>
                    {r.note && (
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        备注：{r.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <span className="text-sm font-black text-gray-900 block font-mono">
                        {r.type === 'blood_pressure' ? `${r.sys}/${r.dia}` : r.value}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">{r.unit}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                        r.status === 'danger' ? 'bg-red-100 text-red-700' :
                        r.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {r.status === 'danger' ? '异常警戒' : r.status === 'warning' ? '轻微偏高' : '正常'}
                      </span>
                    </div>

                    {/* 编辑改写按钮 */}
                    <button
                      onClick={() => handleOpenEditRecord(r)}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-white rounded-lg cursor-pointer"
                      title="编辑/改写此测量数据"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => {
                        showConfirmModal({
                          title: '确认删除记录？',
                          content: `确定删除该条 ${r.typeName} 测量记录吗？`,
                          confirmColor: 'bg-red-500',
                          onConfirm: () => deleteHealthRecord(r.id)
                        });
                      }}
                      className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 展开更多 / 收起按钮 */}
          {filteredRecords.length > 5 && (
            <div className="text-center pt-1 border-t border-gray-50">
              <button
                onClick={() => setIsListExpanded(!isListExpanded)}
                className="text-xs text-[#0D9488] font-bold hover:underline py-1 px-3 rounded-lg hover:bg-teal-50"
              >
                {isListExpanded ? '收起部分记录' : `展开查看全部 (${filteredRecords.length}条)`}
              </button>
            </div>
          )}
        </div>

        {/* 病历档案模块 (支持医生诊断、体检报告、日常记录 + 拍照/PDF上传) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#0D9488]" />
              <span>病历档案与体检报告</span>
            </h3>

            <button
              onClick={() => {
                setMedicalRecordToEdit(null);
                setShowMedicalRecordModal(true);
              }}
              className="text-xs bg-[#0D9488] text-white px-3 py-1.5 rounded-xl font-bold hover:bg-[#0f766e] flex items-center space-x-1 shadow-sm shadow-teal-100 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加病历/报告</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {memberMedicals.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-30 text-teal-600" />
                <p>暂无病历或体检报告，支持拍照与上传 PDF 电子档案</p>
              </div>
            ) : (
              memberMedicals.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedMedicalRecordDetail(rec)}
                  className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-teal-50/30 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        rec.templateType === 'doctor_diagnosis' ? 'bg-blue-100 text-blue-700' :
                        rec.templateType === 'health_checkup' ? 'bg-teal-100 text-teal-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {rec.templateType === 'doctor_diagnosis' ? '门诊/住院诊断' :
                         rec.templateType === 'health_checkup' ? '体检报告' : '日常健康记录'}
                      </span>
                      <h4 className="font-bold text-gray-900 text-xs truncate max-w-[180px]">
                        {rec.title}
                      </h4>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">{rec.date}</span>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2">
                    {rec.diagnosis || rec.conclusion || rec.chiefComplaint || rec.symptoms || '点击查看详情与附件'}
                  </p>

                  {/* 附件与照片标记 */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                    <div className="flex items-center space-x-3">
                      {rec.images && rec.images.length > 0 && (
                        <span className="flex items-center space-x-1 text-teal-700 font-medium">
                          <Camera className="w-3 h-3" />
                          <span>{rec.images.length}张照片</span>
                        </span>
                      )}
                      {(rec.pdfUrl || (rec.attachments && rec.attachments.length > 0)) && (
                        <span className="flex items-center space-x-1 text-red-600 font-medium">
                          <File className="w-3 h-3" />
                          <span>PDF/电子文档</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[#0D9488] font-bold flex items-center space-x-0.5">
                      <span>查看详情</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 筛选查找弹窗 (按时间、分类、异常状态精准筛选) */}
      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setShowFilterModal(false)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                  <Filter className="w-4 h-4 text-[#0D9488]" />
                  <span>筛选体征与趋势数据</span>
                </h3>
                <button onClick={() => setShowFilterModal(false)} className="text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* 时间范围 */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">时间范围</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'all', label: '全部' },
                      { key: '7', label: '近7天' },
                      { key: '30', label: '近30天' },
                      { key: '90', label: '近90天' }
                    ].map(t => (
                      <button
                        key={t.key}
                        onClick={() => setFilterTimeRange(t.key as any)}
                        className={`py-1.5 rounded-xl font-bold border transition-all ${
                          filterTimeRange === t.key
                            ? 'bg-[#0D9488] border-[#0D9488] text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 指标分类 */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">指标类型</label>
                  <select
                    value={filterMetricType}
                    onChange={(e) => setFilterMetricType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  >
                    <option value="all">全部体征类别</option>
                    <option value="blood_pressure">血压 (收缩压/舒张压)</option>
                    <option value="blood_sugar">血糖 (空腹/餐后)</option>
                    <option value="heartRate">静息心率</option>
                    <option value="temperature">体温</option>
                    <option value="spo2">血氧饱和度</option>
                    <option value="weight">体重</option>
                    <option value="uric_acid">血尿酸</option>
                  </select>
                </div>

                {/* 达标状态 */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1.5">达标状态</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'all', label: '全部状态' },
                      { key: 'normal', label: '正常' },
                      { key: 'warning', label: '轻度偏高' },
                      { key: 'danger', label: '高危预警' }
                    ].map(s => (
                      <button
                        key={s.key}
                        onClick={() => setFilterStatus(s.key)}
                        className={`py-1.5 rounded-xl font-bold border text-[11px] transition-all ${
                          filterStatus === s.key
                            ? 'bg-[#0D9488] border-[#0D9488] text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setFilterTimeRange('all');
                    setFilterMetricType('all');
                    setFilterStatus('all');
                    setFilterScene('all');
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 text-xs"
                >
                  重置筛选
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white text-xs"
                >
                  确定 ({filteredRecords.length}条结果)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 数据编辑与改写弹窗 (时间采用标准构件选择器，支持改写) */}
      <EditHealthRecordModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
      />

      {/* 添加重点关注标签弹窗 (支持自定义输入和严重等级颜色) */}
      <AnimatePresence>
        {showAddTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setShowAddTagModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">添加长辈重点关注标签</h3>
                <button onClick={() => setShowAddTagModal(false)} className="text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">标签名称</label>
                  <input
                    type="text"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="如：晨起血压警惕、低嘌呤饮食"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-600 block mb-1">严重程度与颜色标识</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'danger', label: '高危关注 (红色)', bg: 'bg-rose-50 border-rose-200 text-rose-700' },
                      { key: 'warning', label: '中度警惕 (橙黄)', bg: 'bg-amber-50 border-amber-200 text-amber-800' },
                      { key: 'info', label: '常规留意 (蓝色)', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
                      { key: 'normal', label: '稳定维持 (绿色)', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
                    ].map(st => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setNewTagType(st.key as any)}
                        className={`p-2 rounded-xl border text-left font-bold transition-all ${
                          newTagType === st.key ? `${st.bg} ring-2 ring-teal-500` : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-600 block mb-1">快捷选用常用标签</label>
                  <div className="flex flex-wrap gap-1.5">
                    {presetTags.map((pt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNewTagLabel(pt.label);
                          setNewTagType(pt.type);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-700 font-medium cursor-pointer"
                      >
                        + {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowAddTagModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCustomTag}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white text-xs"
                >
                  确认添加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 记一笔体征弹窗 (涵盖临床体检四大类分类 + 精确数值/滑块双向调节 + 标准构件时间选择) */}
      <HealthLogModal
        isOpen={showHealthLogModal}
        onClose={() => setShowHealthLogModal(false)}
        initialType={activeTrendMetric}
      />

      {/* BMI 调整半屏弹窗 */}
      <AnimatePresence>
        {showBMISheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">身高与体重指标</h3>
                <button onClick={() => setShowBMISheet(false)} className="text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-gray-600 block mb-1">身高 (cm)</label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center font-bold text-gray-900 text-base"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">体重 (kg)</label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center font-bold text-gray-900 text-base"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowBMISheet(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveBMI}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white text-xs"
                >
                  保存更新
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 综合病历档案录入/编辑弹窗 (支持下拉模板动态切换、医生评价/相片/科室、复查周期提醒排程、拍照与PDF) */}
      <MedicalRecordModal
        isOpen={showMedicalRecordModal}
        onClose={() => {
          setShowMedicalRecordModal(false);
          setMedicalRecordToEdit(null);
        }}
        recordToEdit={medicalRecordToEdit}
      />

      {/* 病历档案完整详情弹窗 (支持全字段展示、就医医生详情与评价、复查状态打卡、再次编辑与删除) */}
      <MedicalRecordDetailModal
        isOpen={!!selectedMedicalRecordDetail}
        onClose={() => setSelectedMedicalRecordDetail(null)}
        record={selectedMedicalRecordDetail}
        onEdit={(rec) => {
          setSelectedMedicalRecordDetail(null);
          setMedicalRecordToEdit(rec);
          setShowMedicalRecordModal(true);
        }}
      />
    </div>
  );
};
