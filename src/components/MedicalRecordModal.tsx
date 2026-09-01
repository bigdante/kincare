import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Upload, 
  Plus, 
  Trash2, 
  FileText, 
  Sparkles, 
  Calendar, 
  Clock, 
  Star, 
  User, 
  Building2, 
  Stethoscope, 
  AlertCircle, 
  Check, 
  Bell, 
  File, 
  Tag, 
  Heart,
  ChevronDown
} from 'lucide-react';
import { MedicalRecord, MedicalRecordTemplateType, MedicalRecordAttachment } from '../types';
import { useHealthStore } from '../store';

interface MedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: MedicalRecord | null;
  initialTemplate?: MedicalRecordTemplateType;
}

interface TemplateConfig {
  type: MedicalRecordTemplateType;
  name: string;
  badge: string;
  iconColor: string;
  defaultTitle: string;
  symptomsLabel: string;
  symptomsPlaceholder: string;
  diagnosisLabel: string;
  diagnosisPlaceholder: string;
  adviceLabel: string;
  advicePlaceholder: string;
  defaultDepartment: string;
  suggestedRecheckDays: number;
  suggestedRecheckCycle: string;
  suggestedItems: string[];
}

const TEMPLATE_CONFIGS: Record<MedicalRecordTemplateType, TemplateConfig> = {
  doctor_diagnosis: {
    type: 'doctor_diagnosis',
    name: '门诊就医常规诊断',
    badge: '门诊诊断',
    iconColor: 'text-blue-600 bg-blue-50',
    defaultTitle: '门诊就医诊断记录',
    symptomsLabel: '就诊主诉与主要症状',
    symptomsPlaceholder: '如：反复头晕伴胸闷3天，晨起加重，自测血压165/95mmHg...',
    diagnosisLabel: '临床诊断结论',
    diagnosisPlaceholder: '如：原发性高血压2级（中危组），冠心病心肌供血不足待排...',
    adviceLabel: '医生治疗医嘱与用药方案',
    advicePlaceholder: '如：口服氨氯地平片5mg每日晨服一次，低盐低脂饮食，监测早晚血压...',
    defaultDepartment: '心血管内科',
    suggestedRecheckDays: 30,
    suggestedRecheckCycle: '1个月后',
    suggestedItems: ['血压监测表复核', '空腹血常规+生化', '静息心电图']
  },
  discharge_summary: {
    type: 'discharge_summary',
    name: '住院/出院小结档案',
    badge: '出院小结',
    iconColor: 'text-purple-600 bg-purple-50',
    defaultTitle: '住院诊疗与出院小结',
    symptomsLabel: '入院情况与主要病程',
    symptomsPlaceholder: '如：因急性心绞痛发作入院治疗，行冠脉造影及支架植入术...',
    diagnosisLabel: '出院诊断结论',
    diagnosisPlaceholder: '如：急性下壁心肌梗死（PCI术后），高血压病3级（极高危）...',
    adviceLabel: '出院后康复指导与带药医嘱',
    advicePlaceholder: '如：规律双抗血小板治疗1年，阿司匹林+氯吡格雷，避免剧烈情绪激动...',
    defaultDepartment: '心内科病房',
    suggestedRecheckDays: 14,
    suggestedRecheckCycle: '2周后',
    suggestedItems: ['血小板聚集率', '肝肾功能+心肌酶', '心脏彩超', '出院随访复诊']
  },
  recheck_report: {
    type: 'recheck_report',
    name: '专科复查与化验对比',
    badge: '专科复查',
    iconColor: 'text-teal-600 bg-teal-50',
    defaultTitle: '专科阶段性复查报告',
    symptomsLabel: '复查前近期状况',
    symptomsPlaceholder: '如：规律服药1个月，近期无胸闷，偶有下肢轻度浮肿...',
    diagnosisLabel: '复查评估与对比结论',
    diagnosisPlaceholder: '如：血压控制良好（128/80mmHg），靶器官无进行性损害，肝肾功正常...',
    adviceLabel: '调整方案与后续医嘱',
    advicePlaceholder: '如：维持现有降压方案，继续规律服药，下次复查糖化血红蛋白...',
    defaultDepartment: '心血管内科',
    suggestedRecheckDays: 90,
    suggestedRecheckCycle: '3个月后',
    suggestedItems: ['肝肾功能', '糖化血红蛋白 HbA1c', '血脂四项', '颈动脉超声']
  },
  health_checkup: {
    type: 'health_checkup',
    name: '年度体检与检验报告',
    badge: '体检报告',
    iconColor: 'text-emerald-600 bg-emerald-50',
    defaultTitle: '年度健康体检综合报告',
    symptomsLabel: '体检主要异常摘要',
    symptomsPlaceholder: '如：血脂偏高（甘油三酯2.4mmol/L），轻度脂肪肝，甲状腺结节TI-RADS 3类...',
    diagnosisLabel: '体检综述与医师建议',
    diagnosisPlaceholder: '如：心脑血管风险低度，代谢综合征倾向，建议低脂饮食与减重...',
    adviceLabel: '体检随访与就医指引',
    advicePlaceholder: '如：半年后复查甲状腺彩超，3个月后复查血脂，心内科门诊随访...',
    defaultDepartment: '健康体检中心',
    suggestedRecheckDays: 180,
    suggestedRecheckCycle: '半年后',
    suggestedItems: ['甲状腺彩超复查', '血脂复查', '腹部彩超']
  },
  emergency_visit: {
    type: 'emergency_visit',
    name: '急诊急救就医记录',
    badge: '急诊记录',
    iconColor: 'text-rose-600 bg-rose-50',
    defaultTitle: '急诊科就医处置记录',
    symptomsLabel: '急诊起病与紧急状况',
    symptomsPlaceholder: '如：突发剧烈眩晕、恶心呕吐1小时，站立不稳...',
    diagnosisLabel: '急诊诊断与排查结论',
    diagnosisPlaceholder: '如：良性阵发性位置性眩晕（耳石症），头颅CT未见急性脑出血及大面积脑梗...',
    adviceLabel: '急诊处置与离院医嘱',
    advicePlaceholder: '如：急诊行手法复位治疗，口服倍他司汀片，眩晕加重立即返急诊...',
    defaultDepartment: '急诊医学科',
    suggestedRecheckDays: 7,
    suggestedRecheckCycle: '1周后',
    suggestedItems: ['神经内科门诊复查', '前庭功能随访']
  },
  chronic_followup: {
    type: 'chronic_followup',
    name: '慢病随访与自测评估',
    badge: '慢病随访',
    iconColor: 'text-amber-600 bg-amber-50',
    defaultTitle: '慢性病季度随访评估',
    symptomsLabel: '近期自测数据与生活方式',
    symptomsPlaceholder: '如：近1个月空腹血糖平均 6.2 mmol/L，餐后2小时 7.8 mmol/L，无低血糖发生...',
    diagnosisLabel: '慢病控制综合评价',
    diagnosisPlaceholder: '如：2型糖尿病血糖达标良好，血压稳定，足部神经感觉正常...',
    adviceLabel: '下一阶段慢病管理目标',
    advicePlaceholder: '如：继续目前二甲双胍治疗方案，每日步行6000步，控制晚餐碳水...',
    defaultDepartment: '内分泌科',
    suggestedRecheckDays: 90,
    suggestedRecheckCycle: '3个月后',
    suggestedItems: ['糖化血红蛋白', '尿微量白蛋白', '眼底照相筛查']
  },
  daily_health_log: {
    type: 'daily_health_log',
    name: '日常健康随手记档案',
    badge: '日常档案',
    iconColor: 'text-indigo-600 bg-indigo-50',
    defaultTitle: '家庭健康与就医档案',
    symptomsLabel: '健康记录内容/病情变化',
    symptomsPlaceholder: '记录身体不适、就医咨询、日常用药感受或自测记录...',
    diagnosisLabel: '分析与总结',
    diagnosisPlaceholder: '总结病情规律与需要留意的异常...',
    adviceLabel: '后续关注重点',
    advicePlaceholder: '持续观察指标，如持续异常及时就医...',
    defaultDepartment: '全科医疗',
    suggestedRecheckDays: 30,
    suggestedRecheckCycle: '1个月后',
    suggestedItems: ['日常血压自测', '体征观察']
  }
};

const COMMON_DEPARTMENTS = [
  '心血管内科', '内分泌科', '神经内科', '消化内科', '呼吸内科', 
  '骨科', '老年医学科', '全科医疗', '中医科', '眼科', '耳鼻喉科', '泌尿外科'
];

const DOCTOR_TITLES = ['主任医师', '副主任医师', '主治医师', '知名特聘专家', '住院医师', '科室主任'];

const PRESET_DOCTOR_TAGS = [
  '态度和蔼耐心', '问诊极其细致', '用药精准有效', '通俗解释病情',
  '医德高尚仁心', '经验丰富老到', '耐心解答疑问', '不乱开贵重药'
];

const PRESET_RECHECK_ITEMS = [
  '空腹血常规+生化', '肝肾功能全套', '糖化血红蛋白 HbA1c', 
  '血脂四项', '静息心电图', '心脏彩超', '头颅CT/MRI', 
  '颈动脉超声', '胸部CT', '腹部B超', '门诊随访复诊'
];

const PRESET_DOCTOR_AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813628-989f5bcfe155?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
];

export const MedicalRecordModal: React.FC<MedicalRecordModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  initialTemplate = 'doctor_diagnosis'
}) => {
  const { 
    activeProfile, 
    activeProfileId, 
    addMedicalRecord, 
    updateMedicalRecord, 
    showToast 
  } = useHealthStore();

  const isEditing = !!recordToEdit;

  // Template State
  const [templateType, setTemplateType] = useState<MedicalRecordTemplateType>(
    recordToEdit?.templateType || initialTemplate
  );

  const currentConfig = TEMPLATE_CONFIGS[templateType] || TEMPLATE_CONFIGS.doctor_diagnosis;

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('心血管内科');
  
  // Doctor Fields
  const [doctorName, setDoctorName] = useState('');
  const [doctorTitle, setDoctorTitle] = useState('主任医师');
  const [doctorAvatarUrl, setDoctorAvatarUrl] = useState('');
  const [doctorRating, setDoctorRating] = useState<number>(5);
  const [doctorTags, setDoctorTags] = useState<string[]>(['态度和蔼耐心', '问诊极其细致']);
  const [doctorImpression, setDoctorImpression] = useState('');
  const [doctorKeyAdvice, setDoctorKeyAdvice] = useState('');

  // Medical Content
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');

  // Recheck & Follow-up Settings
  const [recheckEnabled, setRecheckEnabled] = useState(true);
  const [recheckCycleDays, setRecheckCycleDays] = useState(30);
  const [recheckCycleLabel, setRecheckCycleLabel] = useState('1个月后');
  const [recheckDate, setRecheckDate] = useState('');
  const [recheckItems, setRecheckItems] = useState<string[]>(['空腹血常规+生化', '静息心电图']);
  const [recheckRemindDaysBefore, setRecheckRemindDaysBefore] = useState(3);
  const [recheckFasting, setRecheckFasting] = useState(true);
  const [recheckPrecautions, setRecheckPrecautions] = useState('抽血需清晨空腹8-12小时，降压药遵医嘱正常服用');
  
  // Custom tag & item input
  const [customTagInput, setCustomTagInput] = useState('');
  const [customItemInput, setCustomItemInput] = useState('');

  // Attachments
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<MedicalRecordAttachment[]>([]);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const doctorAvatarInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to calculate target date based on days from visit date
  const calculateTargetDate = (baseDateStr: string, days: number) => {
    const d = new Date(baseDateStr || new Date());
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // Populate data on mount or when recordToEdit changes
  useEffect(() => {
    if (recordToEdit) {
      setTemplateType(recordToEdit.templateType || 'doctor_diagnosis');
      setTitle(recordToEdit.title || '');
      setDate(recordToEdit.date || new Date().toISOString().split('T')[0]);
      setHospital(recordToEdit.hospital || '');
      setDepartment(recordToEdit.department || '心血管内科');
      
      setDoctorName(recordToEdit.doctor || '');
      setDoctorTitle(recordToEdit.doctorTitle || '主任医师');
      setDoctorAvatarUrl(recordToEdit.doctorAvatarUrl || '');
      setDoctorRating(recordToEdit.doctorRating || 5);
      setDoctorTags(recordToEdit.doctorTags || ['态度和蔼耐心', '问诊极其细致']);
      setDoctorImpression(recordToEdit.doctorImpression || '');
      setDoctorKeyAdvice(recordToEdit.doctorKeyAdvice || '');

      setSymptoms(recordToEdit.chiefComplaint || recordToEdit.symptoms || '');
      setDiagnosis(recordToEdit.diagnosis || recordToEdit.conclusion || '');
      setDoctorAdvice(recordToEdit.doctorAdvice || '');

      setRecheckEnabled(recordToEdit.recheckEnabled !== undefined ? recordToEdit.recheckEnabled : true);
      setRecheckDate(recordToEdit.recheckDate || calculateTargetDate(recordToEdit.date, 30));
      setRecheckCycleLabel(recordToEdit.recheckCycleLabel || '1个月后');
      setRecheckCycleDays(recordToEdit.recheckCycleDays || 30);
      setRecheckItems(recordToEdit.recheckItems || ['空腹血常规+生化', '静息心电图']);
      setRecheckRemindDaysBefore(recordToEdit.recheckRemindDaysBefore || 3);
      setRecheckFasting(recordToEdit.recheckFasting !== undefined ? recordToEdit.recheckFasting : true);
      setRecheckPrecautions(recordToEdit.recheckPrecautions || '抽血需清晨空腹8-12小时，降压药遵医嘱正常服用');

      setImages(recordToEdit.images || []);
      setAttachments(recordToEdit.attachments || []);
    } else {
      // New record defaults
      const config = TEMPLATE_CONFIGS[initialTemplate] || TEMPLATE_CONFIGS.doctor_diagnosis;
      setTemplateType(initialTemplate);
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(todayStr);
      setTitle(config.defaultTitle);
      setHospital('北京协和医院');
      setDepartment(config.defaultDepartment);

      setDoctorName('');
      setDoctorTitle('主任医师');
      setDoctorAvatarUrl('');
      setDoctorRating(5);
      setDoctorTags(['态度和蔼耐心', '问诊极其细致']);
      setDoctorImpression('');
      setDoctorKeyAdvice('');

      setSymptoms('');
      setDiagnosis('');
      setDoctorAdvice('');

      setRecheckEnabled(true);
      setRecheckCycleDays(config.suggestedRecheckDays);
      setRecheckCycleLabel(config.suggestedRecheckCycle);
      setRecheckDate(calculateTargetDate(todayStr, config.suggestedRecheckDays));
      setRecheckItems(config.suggestedItems);
      setRecheckRemindDaysBefore(3);
      setRecheckFasting(true);
      setRecheckPrecautions('抽血需清晨空腹8-12小时，按时携带既往检查单就诊');

      setImages([]);
      setAttachments([]);
    }
  }, [recordToEdit, initialTemplate, isOpen]);

  // When user changes template via dropdown in creation mode, update suggested fields
  const handleTemplateDropdownChange = (newType: MedicalRecordTemplateType) => {
    setTemplateType(newType);
    const cfg = TEMPLATE_CONFIGS[newType];
    if (!isEditing) {
      if (!title || Object.values(TEMPLATE_CONFIGS).some(c => c.defaultTitle === title)) {
        setTitle(cfg.defaultTitle);
      }
      if (!department || Object.values(TEMPLATE_CONFIGS).some(c => c.defaultDepartment === department)) {
        setDepartment(cfg.defaultDepartment);
      }
      setRecheckCycleDays(cfg.suggestedRecheckDays);
      setRecheckCycleLabel(cfg.suggestedRecheckCycle);
      setRecheckDate(calculateTargetDate(date, cfg.suggestedRecheckDays));
      setRecheckItems(cfg.suggestedItems);
    }
    showToast(`已切换为「${cfg.name}」模版`);
  };

  // Quick cycle pill click
  const handleSelectCycle = (days: number, label: string) => {
    setRecheckCycleDays(days);
    setRecheckCycleLabel(label);
    setRecheckDate(calculateTargetDate(date, days));
  };

  // Toggle doctor impression tag
  const handleToggleDoctorTag = (tag: string) => {
    if (doctorTags.includes(tag)) {
      setDoctorTags(doctorTags.filter(t => t !== tag));
    } else {
      setDoctorTags([...doctorTags, tag]);
    }
  };

  // Add custom doctor tag
  const handleAddCustomDoctorTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !doctorTags.includes(trimmed)) {
      setDoctorTags([...doctorTags, trimmed]);
      setCustomTagInput('');
    }
  };

  // Toggle recheck item
  const handleToggleRecheckItem = (item: string) => {
    if (recheckItems.includes(item)) {
      setRecheckItems(recheckItems.filter(i => i !== item));
    } else {
      setRecheckItems([...recheckItems, item]);
    }
  };

  // Add custom recheck item
  const handleAddCustomRecheckItem = () => {
    const trimmed = customItemInput.trim();
    if (trimmed && !recheckItems.includes(trimmed)) {
      setRecheckItems([...recheckItems, trimmed]);
      setCustomItemInput('');
    }
  };

  // Handle Photo & Doc Uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
      showToast(`已添加 ${files.length} 张病历/检验报告照片`);
    }
  };

  const handleDoctorAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setDoctorAvatarUrl(reader.result as string);
          showToast('已上传医生照片');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const newAtt: MedicalRecordAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'document',
          url: URL.createObjectURL(file),
          size: `${(file.size / 1024).toFixed(1)} KB`,
          uploadedAt: new Date().toISOString().split('T')[0]
        };
        setAttachments(prev => [...prev, newAtt]);
      });
      showToast(`已上传 ${files.length} 个检验/电子文档报告`);
    }
  };

  // Save Record
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('请输入病历/报告标题');
      return;
    }
    if (!activeProfileId) {
      showToast('未指定家庭成员');
      return;
    }

    const payload: Omit<MedicalRecord, 'id'> = {
      memberId: activeProfileId === 'all' ? (activeProfile?.id || 'p_father') : activeProfileId,
      templateType,
      title: title.trim(),
      date,
      hospital: hospital.trim() || undefined,
      department: department.trim() || undefined,
      
      doctor: doctorName.trim() || undefined,
      doctorTitle: doctorName.trim() ? doctorTitle : undefined,
      doctorAvatarUrl: doctorAvatarUrl || undefined,
      doctorRating,
      doctorTags,
      doctorImpression: doctorImpression.trim() || undefined,
      doctorKeyAdvice: doctorKeyAdvice.trim() || undefined,

      chiefComplaint: symptoms.trim() || undefined,
      symptoms: symptoms.trim() || undefined,
      diagnosis: diagnosis.trim() || undefined,
      conclusion: diagnosis.trim() || undefined,
      doctorAdvice: doctorAdvice.trim() || undefined,

      recheckEnabled,
      recheckDate: recheckEnabled ? (recheckDate || calculateTargetDate(date, recheckCycleDays)) : undefined,
      recheckCycleLabel: recheckEnabled ? recheckCycleLabel : undefined,
      recheckCycleDays: recheckEnabled ? recheckCycleDays : undefined,
      recheckItems: recheckEnabled ? recheckItems : undefined,
      recheckRemindDaysBefore: recheckEnabled ? recheckRemindDaysBefore : undefined,
      recheckFasting: recheckEnabled ? recheckFasting : undefined,
      recheckPrecautions: recheckEnabled ? recheckPrecautions.trim() : undefined,
      recheckStatus: recheckEnabled ? 'pending' : undefined,

      images,
      attachments,
      pdfUrl: attachments.length > 0 ? attachments[0].url : undefined
    };

    if (isEditing && recordToEdit) {
      await updateMedicalRecord(recordToEdit.id, payload);
      showToast('病历档案已更新');
    } else {
      await addMedicalRecord(payload);
      showToast('新病历档案已保存并设置复查提醒');
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
        className="w-full max-w-xl bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto scrollbar-hide text-xs"
      >
        {/* 顶部标题栏 & 核心下拉模版选择器 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-20">
          <div>
            <h3 className="font-black text-gray-900 text-base flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#0D9488]" />
              <span>{isEditing ? '编辑病历与就医档案' : '录入病历与体检报告'}</span>
            </h3>
            <p className="text-[11px] text-gray-400">
              为「{activeProfile?.name || '家庭长辈'}」记录完整就诊过程、主治医师印象及复查规划
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 【核心要求7】：顶部下拉框模版选择器，选中后表单自动切换 */}
        <div className="bg-gradient-to-r from-teal-50/80 to-emerald-50/60 p-3.5 rounded-2xl border border-teal-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-extrabold text-teal-900 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>病历档案模版 (下拉自动智能切换表单)</span>
            </label>
            <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full">
              {currentConfig.badge}
            </span>
          </div>

          <div className="relative">
            <select
              value={templateType}
              onChange={(e) => handleTemplateDropdownChange(e.target.value as MedicalRecordTemplateType)}
              className="w-full bg-white border-2 border-teal-200 focus:border-[#0D9488] rounded-xl px-3 py-2.5 font-bold text-gray-900 text-xs shadow-xs cursor-pointer appearance-none pr-8"
            >
              {Object.entries(TEMPLATE_CONFIGS).map(([key, cfg]) => (
                <option key={key} value={key}>
                  📄 {cfg.name}（适用于：{cfg.badge}）
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-teal-600 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* 1. 基础就诊信息 */}
        <div className="space-y-2.5 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
          <h4 className="font-extrabold text-gray-800 text-xs flex items-center space-x-1.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>就诊机构与病历标题</span>
          </h4>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              病历/报告标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：北京协和医院 心内科门诊病历"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">就诊医院 / 体检中心</label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                placeholder="北京协和医院"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">就诊/报告日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
              />
            </div>
          </div>

          {/* 就诊科室快捷选与输入 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-gray-700">就诊科室</label>
              <span className="text-[10px] text-gray-400">点击快捷填入或手动输入</span>
            </div>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="如：心血管内科"
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold mb-1.5"
            />
            <div className="flex flex-wrap gap-1">
              {COMMON_DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDepartment(dept)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    department === dept
                      ? 'bg-teal-50 border-teal-300 text-[#0D9488] font-bold'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 【核心要求8】：主诊医生专属信息、照片、评价、医德印象与关键叮嘱 */}
        <div className="space-y-3 bg-teal-50/40 p-3.5 rounded-2xl border border-teal-100">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-gray-900 text-xs flex items-center space-x-1.5">
              <Stethoscope className="w-4 h-4 text-[#0D9488]" />
              <span>主诊医生信息与服务评价 (长久备忘记忆)</span>
            </h4>
            <span className="text-[10px] text-teal-700 font-bold">很多年后翻看依然清晰</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 医生照片录入 */}
            <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl border border-gray-200 space-y-1.5">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-teal-200 flex items-center justify-center relative group">
                {doctorAvatarUrl ? (
                  <img
                    src={doctorAvatarUrl}
                    alt={doctorName || '医生'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={doctorAvatarInputRef}
                onChange={handleDoctorAvatarUpload}
                className="hidden"
              />
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => doctorAvatarInputRef.current?.click()}
                  className="text-[10px] px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg font-bold flex items-center space-x-0.5 cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  <span>上传照片</span>
                </button>
                {doctorAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setDoctorAvatarUrl('')}
                    className="text-[10px] p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 预设医生头像快速点选 */}
              <div className="flex space-x-1 pt-1">
                {PRESET_DOCTOR_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDoctorAvatarUrl(url)}
                    className="w-5 h-5 rounded-full overflow-hidden border border-gray-200 hover:scale-110 transition-transform"
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* 医生姓名与职称 */}
            <div className="sm:col-span-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">主诊医生姓名</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="如：张建国 教授"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">医生职称</label>
                  <select
                    value={doctorTitle}
                    onChange={(e) => setDoctorTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold"
                  >
                    {DOCTOR_TITLES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 医生星级评价 */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">医生接诊评价星级</label>
                <div className="flex items-center space-x-1.5 bg-white p-2 rounded-xl border border-gray-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDoctorRating(star)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= doctorRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-[11px] font-extrabold text-amber-600 ml-2">
                    {doctorRating === 5 ? '⭐️⭐️⭐️⭐️⭐️ 极佳非常满意' :
                     doctorRating === 4 ? '⭐️⭐️⭐️⭐️ 满意和蔼' :
                     doctorRating === 3 ? '⭐️⭐️⭐️ 一般平稳' : '需多关注'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 医生印象标签 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1.5">医生印象与医德评价标签</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {PRESET_DOCTOR_TAGS.map((tag) => {
                const isSelected = doctorTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleDoctorTag(tag)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>
            
            {/* 自定义输入标签 */}
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="输入其他评价标签，如「对老年人特别耐心」"
                className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px]"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomDoctorTag())}
              />
              <button
                type="button"
                onClick={handleAddCustomDoctorTag}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-[11px]"
              >
                添加
              </button>
            </div>
          </div>

          {/* 【核心叮嘱备忘】：医生当时叮嘱的关键一句话 */}
          <div>
            <label className="font-bold text-gray-800 block mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>医生重点叮嘱的关键一句话 (核心备忘录)</span>
              </span>
              <span className="text-[10px] text-gray-400 font-normal">多年后回看仍历历在目</span>
            </label>
            <textarea
              rows={2}
              value={doctorKeyAdvice}
              onChange={(e) => setDoctorKeyAdvice(e.target.value)}
              placeholder="如：医生反复交代：这药必须早晨空腹吃半片，千万不能自己随意停药，血压降下来也要维持..."
              className="w-full bg-white border border-amber-200 focus:border-amber-400 rounded-xl p-2.5 text-gray-900 font-medium placeholder-gray-400"
            />
          </div>
        </div>

        {/* 2. 诊断与病历详细内容 (随模版自动变换提示语) */}
        <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
          <h4 className="font-extrabold text-gray-800 text-xs flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>诊疗与病情详情</span>
          </h4>

          {/* 主诉/症状 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              {currentConfig.symptomsLabel}
            </label>
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={currentConfig.symptomsPlaceholder}
              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900"
            />
          </div>

          {/* 诊断结论 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              {currentConfig.diagnosisLabel}
            </label>
            <textarea
              rows={2}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder={currentConfig.diagnosisPlaceholder}
              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900 font-bold"
            />
          </div>

          {/* 治疗建议与医嘱 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              {currentConfig.adviceLabel}
            </label>
            <textarea
              rows={2}
              value={doctorAdvice}
              onChange={(e) => setDoctorAdvice(e.target.value)}
              placeholder={currentConfig.advicePlaceholder}
              className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900"
            />
          </div>
        </div>

        {/* 【核心要求6】：就医复查设置与随访周期智能提醒 */}
        <div className="space-y-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-indigo-950 text-xs flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>复查提醒与就医随访设置</span>
            </h4>
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={recheckEnabled}
                onChange={(e) => setRecheckEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-[11px] font-bold text-indigo-900">开启复查提醒</span>
            </label>
          </div>

          {recheckEnabled && (
            <div className="space-y-3 pt-1">
              {/* 快捷周期选择 */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">建议复查周期快捷设定</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { days: 7, label: '1周后' },
                    { days: 14, label: '2周后' },
                    { days: 30, label: '1个月后' },
                    { days: 90, label: '3个月后' },
                    { days: 180, label: '半年后' },
                    { days: 365, label: '1年后' }
                  ].map((cycle) => (
                    <button
                      key={cycle.days}
                      type="button"
                      onClick={() => handleSelectCycle(cycle.days, cycle.label)}
                      className={`py-1.5 px-2 rounded-xl font-bold text-[11px] border transition-all cursor-pointer ${
                        recheckCycleDays === cycle.days
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cycle.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 具体复查日期与提前提醒 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">预计复查具体日期</label>
                  <input
                    type="date"
                    value={recheckDate}
                    onChange={(e) => {
                      setRecheckDate(e.target.value);
                      setRecheckCycleLabel('自定义日期');
                    }}
                    className="w-full bg-white border border-indigo-200 focus:border-indigo-500 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">提前提醒通知</label>
                  <select
                    value={recheckRemindDaysBefore}
                    onChange={(e) => setRecheckRemindDaysBefore(Number(e.target.value))}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  >
                    <option value={1}>提前 1 天提醒</option>
                    <option value={3}>提前 3 天提醒 (推荐)</option>
                    <option value={7}>提前 7 天提醒</option>
                    <option value={14}>提前 14 天提醒</option>
                  </select>
                </div>
              </div>

              {/* 复查项目清单勾选 */}
              <div>
                <label className="font-bold text-gray-700 block mb-1.5">计划复查重点项目</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_RECHECK_ITEMS.map((item) => {
                    const isChecked = recheckItems.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleRecheckItem(item)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-900 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}{item}
                      </button>
                    );
                  })}
                </div>

                {/* 自定义添加复查项 */}
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customItemInput}
                    onChange={(e) => setCustomItemInput(e.target.value)}
                    placeholder="输入其他复查项目，如「颈椎动态位X光片」"
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px]"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomRecheckItem())}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomRecheckItem}
                    className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold rounded-xl text-[11px]"
                  >
                    添加项目
                  </button>
                </div>
              </div>

              {/* 空腹要求与复查注意事项 */}
              <div className="space-y-2 pt-1 border-t border-indigo-100">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recheckFasting}
                    onChange={(e) => setRecheckFasting(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-bold text-gray-800 text-xs">
                    需空腹抽血检查 (提醒长辈抽血前禁食8-12小时，少饮白水)
                  </span>
                </label>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">复查就诊备忘与特殊注意事项</label>
                  <input
                    type="text"
                    value={recheckPrecautions}
                    onChange={(e) => setRecheckPrecautions(e.target.value)}
                    placeholder="如：带上近一个月的自测血压日记本、既往造影胶片"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. 照片与 PDF/文档附件上传 */}
        <div className="space-y-2.5 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
          <label className="font-bold text-gray-800 block">病历照片与电子档案 (拍照 / PDF报告)</label>
          <div className="flex space-x-2">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={imageInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-teal-50 border border-teal-200 text-[#0D9488] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>拍照/相册单据 ({images.length})</span>
            </button>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              ref={pdfInputRef}
              onChange={handlePdfUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>上传PDF检验单 ({attachments.length})</span>
            </button>
          </div>

          {/* 图片预览小缩略图 */}
          {images.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto py-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 group">
                  <img src={img} alt="attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 附件文件列表 */}
          {attachments.length > 0 && (
            <div className="space-y-1">
              {attachments.map((att, idx) => (
                <div key={att.id || idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200">
                  <div className="flex items-center space-x-2 truncate">
                    <File className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-bold text-gray-800 text-xs truncate">{att.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{att.size}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部保存与取消按钮 */}
        <div className="flex space-x-2.5 pt-3 border-t border-gray-100 sticky bottom-0 bg-white z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-2 py-3 rounded-2xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? '保存修改并同步' : '确认保存病历档案'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
