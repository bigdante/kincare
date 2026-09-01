import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  Archive, 
  History, 
  Bell, 
  BellOff, 
  ShieldAlert, 
  Clock, 
  Check, 
  HelpCircle,
  Sparkles,
  Pill
} from 'lucide-react';
import { Medication, MedicineCabinetItem } from '../types';
import { useHealthStore } from '../store';

interface MedicationPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: Medication | null;
  onOpenCabinetPicker?: () => void;
  onOpenHistoryPicker?: () => void;
}

export const MedicationPlanModal: React.FC<MedicationPlanModalProps> = ({
  isOpen,
  onClose,
  planToEdit,
  onOpenCabinetPicker,
  onOpenHistoryPicker
}) => {
  const { 
    activeProfile, 
    activeProfileId, 
    addMedication, 
    updateMedication, 
    addCabinetItem, 
    medicineCabinet, 
    medications,
    profiles,
    showToast 
  } = useHealthStore();

  const isEditing = !!planToEdit;

  // Form States
  const [medName, setMedName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [specification, setSpecification] = useState('');
  const [medImage, setMedImage] = useState('');
  const [autoAddToCabinet, setAutoAddToCabinet] = useState(true);

  // Time Range (Placed ABOVE dosage)
  const [isLongTerm, setIsLongTerm] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Dosage
  const [dosageValue, setDosageValue] = useState<number>(1);
  const [dosageUnit, setDosageUnit] = useState('片');

  // Administration Route & Custom (+)
  const [adminRouteOptions, setAdminRouteOptions] = useState<string[]>([
    '口服', '嚼服', '含服', '冲服', '外用', '滴眼', '喷雾', '皮下注射', '雾化吸入', '贴敷'
  ]);
  const [adminRoute, setAdminRoute] = useState('口服');
  const [showAddRouteInput, setShowAddRouteInput] = useState(false);
  const [newRouteText, setNewRouteText] = useState('');

  // Delivery Method & Custom (+)
  const [deliveryMethodOptions, setDeliveryMethodOptions] = useState<string[]>([
    '温水送服', '足量水 (≥250ml)', '直接吞服', '餐前吞服', '睡前吞服', '随餐同服', '无特殊要求'
  ]);
  const [deliveryMethod, setDeliveryMethod] = useState('温水送服');
  const [showAddDeliveryInput, setShowAddDeliveryInput] = useState(false);
  const [newDeliveryText, setNewDeliveryText] = useState('');

  // Meal Timing
  const [mealTiming, setMealTiming] = useState('after_meal');
  const [mealTimingLabel, setMealTimingLabel] = useState('饭后 15–30 分钟');

  // Alarm Switch (Default Checked)
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // Frequency & Schedule Times (Bidirectional Sync)
  const [frequencyType, setFrequencyType] = useState('once_daily');
  const [frequency, setFrequency] = useState(1);
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['08:00']);
  const [customFrequencyName, setCustomFrequencyName] = useState('');
  const [showCustomFreqModal, setShowCustomFreqModal] = useState(false);

  // Precautions (Add & Delete)
  const [precautions, setPrecautions] = useState<string[]>(['忌酒']);
  const [newPrecautionText, setNewPrecautionText] = useState('');
  const [showAddPrecautionInput, setShowAddPrecautionInput] = useState(false);

  // Missed Dose Action (Add & Delete)
  const [missedDoseOptions, setMissedDoseOptions] = useState<string[]>([
    '距下次不足间隔则跳过，切勿双倍补服',
    '想起后立即补服，下次顺延',
    '一律跳过，按原时间服下次'
  ]);
  const [missedDoseAction, setMissedDoseAction] = useState('距下次不足间隔则跳过，切勿双倍补服');
  const [showAddMissedDoseInput, setShowAddMissedDoseInput] = useState(false);
  const [newMissedDoseText, setNewMissedDoseText] = useState('');

  const [notes, setNotes] = useState('');
  const imageUploadRef = useRef<HTMLInputElement | null>(null);

  // Built-in Cabinet & History Picker Dialog States
  const [showCabinetPicker, setShowCabinetPicker] = useState(false);
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

  // Autofill from Medicine Cabinet
  const handleSelectFromCabinet = (item: MedicineCabinetItem) => {
    setMedName(item.name || '');
    setGenericName(item.commonName || '');
    setSpecification(item.specification || '');
    if (item.imageUrl) setMedImage(item.imageUrl);
    if (item.precautions && item.precautions.length > 0) {
      setPrecautions(item.precautions);
    }
    if (item.notes) {
      setNotes(prev => prev ? `${prev}\n备注：${item.notes}` : `${item.notes}`);
    }
    setAutoAddToCabinet(false); // already in cabinet
    setShowCabinetPicker(false);
    showToast(`已从家庭药箱载入「${item.name}」信息`);
  };

  // Autofill from History Medication Plan
  const handleSelectFromHistory = (hist: Medication) => {
    setMedName(hist.name || '');
    setGenericName(hist.commonName || '');
    setSpecification(hist.specification || '');
    if (hist.dosageValue) setDosageValue(hist.dosageValue);
    if (hist.dosageUnit) setDosageUnit(hist.dosageUnit);
    if (hist.administrationRoute) setAdminRoute(hist.administrationRoute);
    if (hist.deliveryMethod) setDeliveryMethod(hist.deliveryMethod);
    if (hist.mealTiming) setMealTiming(hist.mealTiming);
    if (hist.mealTimingLabel) setMealTimingLabel(hist.mealTimingLabel);
    if (hist.frequencyType) setFrequencyType(hist.frequencyType);
    if (hist.frequency) setFrequency(hist.frequency);
    if (hist.scheduleTimes && hist.scheduleTimes.length > 0) setScheduleTimes(hist.scheduleTimes);
    if (hist.precautions && hist.precautions.length > 0) setPrecautions(hist.precautions);
    if (hist.missedDoseAction) setMissedDoseAction(hist.missedDoseAction);
    if (hist.imageUrl || hist.image) setMedImage(hist.imageUrl || hist.image || '');
    if (hist.reminderText) setNotes(hist.reminderText);
    setShowHistoryPicker(false);
    showToast(`已成功载入历史方案「${hist.name}」`);
  };

  const unitOptions = ['片', '粒', '包', '支', 'mg', 'g', 'ml', '滴', '喷', '揿', 'IU', '丸'];

  const presetPrecautions = [
    '忌酒',
    '忌与牛奶同服',
    '忌与钙铁剂同服',
    '忌与西柚汁同服',
    '不可嚼碎（缓释/肠溶）',
    '服药后不宜驾车/操作机械',
    '需避光密闭保存',
    '需冷藏（2–8℃）',
    '多喝温水（≥200ml）',
    '与其他药物间隔 2 小时',
    '晨起空腹整片吞服',
    '定期监测血压/血糖'
  ];

  // Populate when editing or switching plan
  useEffect(() => {
    if (planToEdit) {
      setMedName(planToEdit.name || '');
      setGenericName(planToEdit.commonName || '');
      setSpecification(planToEdit.specification || '');
      setMedImage(planToEdit.imageUrl || planToEdit.image || '');
      setIsLongTerm(planToEdit.isLongTerm !== undefined ? planToEdit.isLongTerm : true);
      setStartDate(planToEdit.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(planToEdit.endDate || '');
      setDosageValue(planToEdit.dosageValue || 1);
      setDosageUnit(planToEdit.dosageUnit || '片');
      
      if (planToEdit.administrationRoute) {
        if (!adminRouteOptions.includes(planToEdit.administrationRoute)) {
          setAdminRouteOptions(prev => [...prev, planToEdit.administrationRoute!]);
        }
        setAdminRoute(planToEdit.administrationRoute);
      }
      
      if (planToEdit.deliveryMethod) {
        if (!deliveryMethodOptions.includes(planToEdit.deliveryMethod)) {
          setDeliveryMethodOptions(prev => [...prev, planToEdit.deliveryMethod!]);
        }
        setDeliveryMethod(planToEdit.deliveryMethod);
      }

      setMealTiming(planToEdit.mealTiming || 'after_meal');
      setMealTimingLabel(planToEdit.mealTimingLabel || '饭后 15–30 分钟');
      setAlarmEnabled(planToEdit.alarmEnabled !== undefined ? planToEdit.alarmEnabled : true);
      
      const times = planToEdit.scheduleTimes && planToEdit.scheduleTimes.length > 0 ? planToEdit.scheduleTimes : ['08:00'];
      setScheduleTimes(times);
      setFrequency(times.length);
      setFrequencyType(planToEdit.frequencyType || (times.length === 1 ? 'once_daily' : times.length === 2 ? 'twice_daily' : times.length === 3 ? 'thrice_daily' : 'custom'));

      setPrecautions(planToEdit.precautions || ['忌酒']);
      if (planToEdit.missedDoseAction) {
        if (!missedDoseOptions.includes(planToEdit.missedDoseAction)) {
          setMissedDoseOptions(prev => [...prev, planToEdit.missedDoseAction!]);
        }
        setMissedDoseAction(planToEdit.missedDoseAction);
      }
      setNotes(planToEdit.reminderText || '');
    } else {
      // Reset for creating new plan
      setMedName('');
      setGenericName('');
      setSpecification('');
      setMedImage('');
      setIsLongTerm(true);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setDosageValue(1);
      setDosageUnit('片');
      setAdminRoute('口服');
      setDeliveryMethod('温水送服');
      setMealTiming('after_meal');
      setMealTimingLabel('饭后 15–30 分钟');
      setAlarmEnabled(true);
      setScheduleTimes(['08:00']);
      setFrequency(1);
      setFrequencyType('once_daily');
      setPrecautions(['忌酒']);
      setMissedDoseAction('距下次不足间隔则跳过，切勿双倍补服');
      setNotes('');
    }
  }, [planToEdit, isOpen]);

  // Check cabinet duplicate
  const memberCabinet = medicineCabinet.filter(c => !c.memberId || c.memberId === activeProfileId);
  const cabinetMatch = medName.trim()
    ? memberCabinet.find(c => c.name.toLowerCase().trim() === medName.toLowerCase().trim() || (c.genericName && c.genericName.toLowerCase().trim() === medName.toLowerCase().trim()))
    : null;

  // Handle Preset Frequency Click
  const handleFrequencyPreset = (key: string, label: string, times: string[]) => {
    setFrequencyType(key);
    setScheduleTimes(times);
    setFrequency(times.length);
  };

  // Add custom alarm time slot -> Syncs frequency
  const handleAddAlarmTime = () => {
    const defaultTime = scheduleTimes.length === 1 ? '19:00' : scheduleTimes.length === 2 ? '12:30' : '21:00';
    const newTimes = [...scheduleTimes, defaultTime];
    setScheduleTimes(newTimes);
    setFrequency(newTimes.length);
    setFrequencyType(newTimes.length === 2 ? 'twice_daily' : newTimes.length === 3 ? 'thrice_daily' : newTimes.length === 4 ? 'four_daily' : 'custom');
  };

  // Remove alarm time slot -> Syncs frequency
  const handleRemoveAlarmTime = (index: number) => {
    if (scheduleTimes.length <= 1) return;
    const newTimes = scheduleTimes.filter((_, i) => i !== index);
    setScheduleTimes(newTimes);
    setFrequency(newTimes.length);
    setFrequencyType(newTimes.length === 1 ? 'once_daily' : newTimes.length === 2 ? 'twice_daily' : newTimes.length === 3 ? 'thrice_daily' : 'custom');
  };

  // Custom route add
  const handleAddCustomRoute = () => {
    const trimmed = newRouteText.trim();
    if (trimmed) {
      if (!adminRouteOptions.includes(trimmed)) {
        setAdminRouteOptions([...adminRouteOptions, trimmed]);
      }
      setAdminRoute(trimmed);
      setNewRouteText('');
      setShowAddRouteInput(false);
      showToast(`已添加给药途径「${trimmed}」`);
    }
  };

  // Custom delivery add
  const handleAddCustomDelivery = () => {
    const trimmed = newDeliveryText.trim();
    if (trimmed) {
      if (!deliveryMethodOptions.includes(trimmed)) {
        setDeliveryMethodOptions([...deliveryMethodOptions, trimmed]);
      }
      setDeliveryMethod(trimmed);
      setNewDeliveryText('');
      setShowAddDeliveryInput(false);
      showToast(`已添加送服方式「${trimmed}」`);
    }
  };

  // Custom precaution add
  const handleAddPrecaution = () => {
    const trimmed = newPrecautionText.trim();
    if (trimmed) {
      if (!precautions.includes(trimmed)) {
        setPrecautions([...precautions, trimmed]);
      }
      setNewPrecautionText('');
      setShowAddPrecautionInput(false);
      showToast(`已添加注意事项「${trimmed}」`);
    }
  };

  // Custom missed dose add & remove
  const handleAddMissedDose = () => {
    const trimmed = newMissedDoseText.trim();
    if (trimmed) {
      if (!missedDoseOptions.includes(trimmed)) {
        setMissedDoseOptions([...missedDoseOptions, trimmed]);
      }
      setMissedDoseAction(trimmed);
      setNewMissedDoseText('');
      setShowAddMissedDoseInput(false);
      showToast(`已添加漏服策略`);
    }
  };

  const handleRemoveMissedDose = (opt: string) => {
    const next = missedDoseOptions.filter(x => x !== opt);
    setMissedDoseOptions(next);
    if (missedDoseAction === opt) {
      setMissedDoseAction(next[0] || '一律跳过，按原时间服下次');
    }
    showToast(`已删除该漏服策略`);
  };

  const isEndedPlan = isEditing && planToEdit && (
    planToEdit.status === 'completed' || 
    (planToEdit.endDate && new Date(planToEdit.endDate).getTime() < new Date().setHours(0,0,0,0) && !planToEdit.isLongTerm)
  );

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setMedImage(reader.result as string);
          showToast('已上传药品包装照片');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save or Update Plan
  const handleSave = async () => {
    if (!medName.trim()) {
      showToast('请输入药品常用名 / 商品名');
      return;
    }
    if (!activeProfileId) {
      showToast('未选中当前长辈');
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80';
    const planData = {
      profileId: activeProfileId,
      name: medName.trim(),
      commonName: genericName.trim() || undefined,
      specification: specification.trim() || '标准规格',
      dosage: `${dosageValue}${dosageUnit}`,
      dosageValue,
      dosageUnit,
      frequency,
      frequencyType,
      scheduleTimes: scheduleTimes.length > 0 ? scheduleTimes : ['08:00'],
      administrationRoute: adminRoute,
      deliveryMethod,
      mealTiming,
      mealTimingLabel,
      alarmEnabled,
      precautions,
      missedDoseAction,
      isLongTerm: isEndedPlan ? true : isLongTerm,
      startDate: isEndedPlan ? new Date().toISOString().split('T')[0] : startDate,
      endDate: isLongTerm || isEndedPlan ? undefined : endDate,
      imageUrl: medImage || defaultImg,
      image: medImage || defaultImg,
      reminderText: notes.trim() || undefined,
      status: 'active' as const
    };

    if (isEditing && planToEdit) {
      await updateMedication(planToEdit.id, planData);
      if (isEndedPlan) {
        showToast(`「${medName}」用药计划已重新启动！`);
      } else {
        showToast(`「${medName}」用药计划已立即更新`);
      }
    } else {
      // Create new plan
      await addMedication({
        ...planData,
        stock: 30,
        stockDays: 30,
        stockAlertDays: 7
      });

      // Auto add to cabinet if enabled and not matched
      if (autoAddToCabinet && !cabinetMatch) {
        await addCabinetItem({
          memberId: activeProfileId,
          name: medName.trim(),
          genericName: genericName.trim() || undefined,
          specifications: specification.trim() || '标准规格',
          stock: 3,
          unit: '盒',
          dosageForm: dosageUnit === '片' ? '薄膜衣片' : dosageUnit === '粒' ? '胶囊' : '常用剂型',
          expiryDate: '2028-12-31',
          storageLocation: '家庭常备药箱',
          storageCondition: '遮光、常温密封保存',
          precautions
        });
      }
      showToast(`「${medName}」用药计划已创建并生效`);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto scrollbar-hide text-xs"
      >
        {/* 顶部标题与关闭 */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-black text-gray-900 text-base">
              {isEditing ? `编辑用药计划 · ${planToEdit?.name}` : '创建用药计划'}
            </h3>
            <p className="text-[11px] text-gray-400">
              为「{activeProfile?.name || '家庭成员'}」设定精准用药时间、剂量与智能闹钟
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷选用入口 (仅在新建模式展示) */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenCabinetPicker) {
                  onOpenCabinetPicker();
                } else {
                  setShowCabinetPicker(true);
                }
              }}
              className="py-2.5 px-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0D9488] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Archive className="w-4 h-4" />
              <span>从药箱快速选择</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenHistoryPicker) {
                  onOpenHistoryPicker();
                } else {
                  setShowHistoryPicker(true);
                }
              }}
              className="py-2.5 px-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <History className="w-4 h-4" />
              <span>从历史方案选择</span>
            </button>
          </div>
        )}

        {/* 1. 药品基础信息 */}
        <div className="space-y-2.5 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
          <div>
            <label className="font-bold text-gray-800 block mb-1">
              药品常用名 / 商品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={medName}
              onChange={(e) => setMedName(e.target.value)}
              placeholder="如：拜新同、波立维、立普妥、阿司匹林"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:border-[#0D9488] transition-all text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">通用名称 (选填)</label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="如：硝苯地平控释片"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">包装规格</label>
              <input
                type="text"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="如：30mg*7片/盒"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
              />
            </div>
          </div>

          {/* 药品包装图片上传 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">药品图片（药盒 / 药粒照片）</label>
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                {medImage ? (
                  <>
                    <img src={medImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMedImage('')}
                      className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Camera className="w-6 h-6 text-gray-400" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={imageUploadRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageUploadRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl font-bold text-gray-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>拍照或从相册上传</span>
                </button>
                <p className="text-[10px] text-gray-400">长辈在服药打卡和闹钟弹窗中可直观辨识药盒</p>
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 space-y-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAddToCabinet}
                  onChange={(e) => setAutoAddToCabinet(e.target.checked)}
                  className="rounded text-[#0D9488] focus:ring-[#0D9488] w-4 h-4 accent-[#0D9488]"
                />
                <span className="font-bold text-teal-950 text-xs">自动将该药品同步存入家庭药箱</span>
              </label>
              {cabinetMatch && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                  💡 药箱中已存在「{cabinetMatch.name}」，保存将自动关联在库记录。
                </p>
              )}
            </div>
          )}
        </div>

        {/* 2. 【核心要求：用药时间范围放在单次剂量上面】 */}
        <div className="bg-teal-50/40 p-3.5 rounded-2xl border border-teal-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-black text-gray-900 text-xs flex items-center space-x-1">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <span>用药起止时间范围</span>
            </label>
            <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-teal-200">
              <input
                type="checkbox"
                checked={isLongTerm}
                onChange={(e) => setIsLongTerm(e.target.checked)}
                className="rounded text-[#0D9488] focus:ring-[#0D9488] accent-[#0D9488]"
              />
              <span className="font-bold text-[#0D9488] text-xs">长期规律用药</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] font-bold text-gray-500 block mb-1">开始日期</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 block mb-1">结束日期</span>
              <input
                type="date"
                disabled={isLongTerm}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold ${
                  isLongTerm ? 'opacity-40 cursor-not-allowed bg-gray-100' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* 3. 单次剂量与单位 */}
        <div className="grid grid-cols-2 gap-2 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
          <div>
            <label className="font-bold text-gray-800 block mb-1">单次剂量</label>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setDosageValue(Math.max(0.5, dosageValue - 0.5))}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={dosageValue}
                onChange={(e) => setDosageValue(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-xl py-1.5 text-center font-bold text-gray-900"
              />
              <button
                type="button"
                onClick={() => setDosageValue(dosageValue + 0.5)}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-800 block mb-1">剂量单位</label>
            <select
              value={dosageUnit}
              onChange={(e) => setDosageUnit(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
            >
              {unitOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. 给药途径（带 + 自定义）与 送服方式（带 + 自定义） */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 给药途径 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800">给药途径</label>
              <button
                type="button"
                onClick={() => setShowAddRouteInput(!showAddRouteInput)}
                className="text-[11px] text-[#0D9488] font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>新建类型</span>
              </button>
            </div>
            
            <select
              value={adminRoute}
              onChange={(e) => setAdminRoute(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold"
            >
              {adminRouteOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {showAddRouteInput && (
              <div className="flex items-center space-x-1 pt-1">
                <input
                  type="text"
                  value={newRouteText}
                  onChange={(e) => setNewRouteText(e.target.value)}
                  placeholder="新途径如: 舌下含化"
                  className="flex-1 bg-white border border-teal-300 rounded-lg px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRoute}
                  className="px-2 py-1 bg-[#0D9488] text-white rounded-lg font-bold"
                >
                  添加
                </button>
              </div>
            )}
          </div>

          {/* 送服方式 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800">送服方式</label>
              <button
                type="button"
                onClick={() => setShowAddDeliveryInput(!showAddDeliveryInput)}
                className="text-[11px] text-[#0D9488] font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>新建方式</span>
              </button>
            </div>

            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold"
            >
              {deliveryMethodOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {showAddDeliveryInput && (
              <div className="flex items-center space-x-1 pt-1">
                <input
                  type="text"
                  value={newDeliveryText}
                  onChange={(e) => setNewDeliveryText(e.target.value)}
                  placeholder="如: 温开水200ml"
                  className="flex-1 bg-white border border-teal-300 rounded-lg px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDelivery}
                  className="px-2 py-1 bg-[#0D9488] text-white rounded-lg font-bold"
                >
                  添加
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. 就餐时机 */}
        <div>
          <label className="font-bold text-gray-800 block mb-1">就餐时机</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'before_meal', label: '饭前 30 分钟' },
              { key: 'after_meal', label: '饭后 15–30 分钟' },
              { key: 'with_meal', label: '随餐同服' },
              { key: 'empty', label: '晨起空腹' },
              { key: 'bedtime', label: '睡前半小时' },
              { key: 'none', label: '无特殊要求' }
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setMealTiming(item.key);
                  setMealTimingLabel(item.label);
                }}
                className={`py-2 px-1.5 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer ${
                  mealTiming === item.key
                    ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. 【核心要求：单独设置是否开启闹钟按钮，默认选中】 */}
        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${alarmEnabled ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-200 text-gray-400'}`}>
              {alarmEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-black text-gray-900 text-xs block">
                是否开启到点闹钟强提醒
              </span>
              <p className="text-[10px] text-amber-900/80">
                {alarmEnabled
                  ? '到点将自动触发高分贝响铃、震动与语音播报提醒'
                  : '未勾选：到点不会自动闹钟响铃，仅记录服药计划'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alarmEnabled}
              onChange={(e) => setAlarmEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D9488]"></div>
          </label>
        </div>

        {/* 7. 【核心要求：服药频次多样化 + 增加自定义闹钟数量即每日频次，双向联动】 */}
        <div className="space-y-2 bg-gray-50/60 p-3 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="font-black text-gray-900 text-xs">
              服药频次（每日 {frequency} 次）
            </label>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
              闹钟时间点数与频次自动联动
            </span>
          </div>

          {/* 常用频次快速切换 */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { key: 'once_daily', label: '每日1次', times: ['08:00'] },
              { key: 'twice_daily', label: '每日2次', times: ['08:00', '19:00'] },
              { key: 'thrice_daily', label: '每日3次', times: ['08:00', '12:30', '19:00'] },
              { key: 'four_daily', label: '每日4次', times: ['08:00', '12:00', '16:00', '20:00'] },
              { key: 'weekly', label: '每周1次', times: ['09:00'] },
              { key: 'qod', label: '隔天1次', times: ['08:00'] },
              { key: 'prn', label: '按需服用', times: ['08:00'] },
              { key: 'custom', label: '自定义', times: scheduleTimes }
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => handleFrequencyPreset(f.key, f.label, f.times)}
                className={`py-1.5 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer ${
                  frequencyType === f.key
                    ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 闹钟时间点列表 */}
          <div className="space-y-1.5 pt-1">
            {scheduleTimes.map((st, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-200">
                <span className="text-[11px] font-black text-gray-500 w-16 shrink-0">
                  第 {idx + 1} 次闹钟:
                </span>
                <input
                  type="time"
                  value={st}
                  onChange={(e) => {
                    const copy = [...scheduleTimes];
                    copy[idx] = e.target.value;
                    setScheduleTimes(copy);
                  }}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 font-mono font-bold text-gray-900 text-sm"
                />
                {scheduleTimes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAlarmTime(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    title="移除此闹钟时刻"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddAlarmTime}
              className="w-full py-2 bg-teal-50 hover:bg-teal-100 border border-dashed border-teal-300 rounded-xl text-[#0D9488] font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 增加自定义闹钟时间点（自动增加每日频次）</span>
            </button>
          </div>
        </div>

        {/* 8. 【核心要求：注意事项支持添加与删除，显示完全】 */}
        <div className="space-y-2 bg-amber-50/30 p-3 rounded-2xl border border-amber-100">
          <div className="flex items-center justify-between">
            <label className="font-bold text-amber-950 flex items-center space-x-1">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>用药注意事项与禁忌（支持添加和删除）</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddPrecautionInput(!showAddPrecautionInput)}
              className="text-[11px] text-[#0D9488] font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>添加自定义禁忌</span>
            </button>
          </div>

          {showAddPrecautionInput && (
            <div className="flex items-center space-x-1 bg-white p-2 rounded-xl border border-amber-200">
              <input
                type="text"
                value={newPrecautionText}
                onChange={(e) => setNewPrecautionText(e.target.value)}
                placeholder="输入新注意事项如: 服药后多吃深绿色蔬菜"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddPrecaution}
                className="px-3 py-1 bg-[#0D9488] text-white rounded-lg font-bold"
              >
                确定添加
              </button>
            </div>
          )}

          {/* 当前已选注意事项列表（每个带 × 删除） */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {precautions.map(p => (
              <span
                key={p}
                className="inline-flex items-center space-x-1 bg-amber-100 text-amber-950 font-bold px-2.5 py-1 rounded-full border border-amber-300 text-[11px]"
              >
                <span>{p}</span>
                <button
                  type="button"
                  onClick={() => setPrecautions(precautions.filter(x => x !== p))}
                  className="w-3.5 h-3.5 rounded-full hover:bg-amber-300 flex items-center justify-center text-amber-800 cursor-pointer ml-1"
                >
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </button>
              </span>
            ))}
          </div>

          {/* 预设快捷禁忌点选 */}
          <div className="pt-1 border-t border-amber-200/50">
            <span className="text-[10px] text-gray-500 block mb-1">快捷点选预设禁忌：</span>
            <div className="flex flex-wrap gap-1">
              {presetPrecautions.map(p => {
                const isSelected = precautions.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setPrecautions(precautions.filter(x => x !== p));
                      } else {
                        setPrecautions([...precautions, p]);
                      }
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                      isSelected
                        ? 'bg-amber-200 text-amber-900 border-amber-400 font-bold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 9. 【核心要求：漏服处理方案像禁忌一样展示标签，不要下拉框，支持添加和删除小×】 */}
        <div className="space-y-2 bg-teal-50/40 p-3 rounded-2xl border border-teal-100">
          <div className="flex items-center justify-between">
            <label className="font-bold text-teal-950 flex items-center space-x-1">
              <span>漏服处理方案（点选生效，支持删除与添加）</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddMissedDoseInput(!showAddMissedDoseInput)}
              className="text-[11px] text-[#0D9488] font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>新建策略</span>
            </button>
          </div>

          {showAddMissedDoseInput && (
            <div className="flex items-center space-x-1 bg-white p-2 rounded-xl border border-teal-300">
              <input
                type="text"
                value={newMissedDoseText}
                onChange={(e) => setNewMissedDoseText(e.target.value)}
                placeholder="输入新策略如: 4小时内可补服半片"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddMissedDose}
                className="px-3 py-1 bg-[#0D9488] text-white rounded-lg font-bold"
              >
                添加
              </button>
            </div>
          )}

          {/* 漏服方案小标签展示列表 (支持点选，右侧小×删除) */}
          <div className="space-y-1.5 pt-1">
            {missedDoseOptions.map(opt => {
              const isSelected = missedDoseAction === opt;
              return (
                <div
                  key={opt}
                  onClick={() => setMissedDoseAction(opt)}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-100/70 border-[#0D9488] text-[#0D9488] font-bold shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#0D9488] bg-[#0D9488] text-white' : 'border-gray-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {missedDoseOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMissedDose(opt);
                      }}
                      className="w-5 h-5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center ml-2 cursor-pointer transition-colors"
                      title="删除此项漏服策略"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 底部保存与更新按钮 */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] hover:bg-[#0f766e] text-white shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isEndedPlan ? '重新启动计划' : isEditing ? '立即更新计划' : '保存用药排程'}
            </span>
          </button>
        </div>

        {/* =========================================================================
            子弹窗：从家庭药箱快速选择
        ========================================================================== */}
        <AnimatePresence>
          {showCabinetPicker && (
            <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Archive className="w-5 h-5 text-[#0D9488]" />
                    <h4 className="font-extrabold text-gray-900 text-sm">从家庭药箱选择药品</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCabinetPicker(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                  {medicineCabinet.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      药箱目前没有药品，请直接手动输入上方信息
                    </div>
                  ) : (
                    medicineCabinet.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectFromCabinet(item)}
                        className="p-3 rounded-2xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Pill className="w-5 h-5 text-teal-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900 group-hover:text-[#0D9488]">{item.name}</h5>
                            <p className="text-[10px] text-gray-400">
                              {item.specification || '常规规格'} · 库存: {item.stock}{item.stockUnit}
                              {item.expireDate && ` (效期: ${item.expireDate})`}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#0D9488] font-bold px-2 py-1 bg-teal-50 rounded-lg group-hover:bg-teal-100">
                          选取并填入 →
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            子弹窗：从历史用药方案快速选择
        ========================================================================== */}
        <AnimatePresence>
          {showHistoryPicker && (
            <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-teal-600" />
                    <h4 className="font-extrabold text-gray-900 text-sm">从历史服药方案选择</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryPicker(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                  {medications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      暂无历史用药计划记录
                    </div>
                  ) : (
                    medications.map((hist) => {
                      const mProf = profiles.find(p => p.id === hist.profileId);
                      return (
                        <div
                          key={hist.id}
                          onClick={() => handleSelectFromHistory(hist)}
                          className="p-3 rounded-2xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 overflow-hidden border border-teal-100 shrink-0 flex items-center justify-center">
                              {hist.imageUrl ? (
                                <img src={hist.imageUrl} alt={hist.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Pill className="w-5 h-5 text-teal-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h5 className="font-bold text-gray-900 group-hover:text-[#0D9488]">{hist.name}</h5>
                                {mProf && (
                                  <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                                    {mProf.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400">
                                {hist.dosage} · 每日{hist.scheduleTimes?.length || 1}次 · {hist.mealTimingLabel || '饭后'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] text-[#0D9488] font-bold px-2 py-1 bg-teal-50 rounded-lg group-hover:bg-teal-100">
                            载入方案 →
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
