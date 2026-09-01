export interface HealthTag {
  id: string;
  label: string;
  type: 'danger' | 'warning' | 'info' | 'normal';
  color?: string;
  avoidance?: string;
  sourceEventId?: string;
}

export interface HealthProfile {
  id: string;
  userId?: string;
  name: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  age: number;
  gender: 'male' | 'female';
  bmi: number;
  relation: 'self' | 'father' | 'mother' | 'spouse' | 'child' | 'other';
  role: 'manager' | 'cared';
  tags: HealthTag[];
  avatarColor: string;
  avatarUrl?: string;
  managedByUserId?: string;
  isSelfManaged?: boolean;
}

export type MemberProfile = HealthProfile;

export interface Medication {
  id: string;
  userId?: string;
  profileId: string;
  name: string;
  commonName?: string;
  specification?: string;
  form?: string; // 剂型
  image?: string;
  imageUrl?: string;
  dosage: string;
  dosageValue?: number;
  dosageUnit?: string;
  administrationRoute?: string;
  deliveryMethod?: string;
  mealTiming?: 'before_meal' | 'after_meal' | 'with_meal' | 'empty' | 'bedtime' | 'none' | string;
  mealTimingLabel?: string;
  precautions?: string[];
  missedDoseAction?: string;
  frequencyType?: string;
  frequency: number;
  interval?: number;
  scheduleTimes?: string[];
  customDoseSlots?: { time: string; dosage: string; promptText?: string }[];
  time: string;
  startDate?: string;
  endDate?: string;
  isLongTerm?: boolean;
  alarmEnabled?: boolean; // 是否开启到点智能闹钟强提醒，默认 true
  stock?: number;
  stockUnit?: string;
  stockAlertDays?: number;
  stockDays: number;
  location?: string;
  manufacturer?: string;
  approvalNumber?: string;
  batchNumber?: string;
  expireDate?: string;
  voiceType?: 'ai' | 'human' | 'tts';
  audioReminderUrl?: string;
  reminderText?: string;
  isInCabinetOnly?: boolean;
  status?: 'active' | 'paused' | 'completed';
}

export interface MedicineCabinetItem {
  id: string;
  userId: string;
  memberId?: string;
  name: string;
  commonName?: string; // 通用名
  brandName?: string; // 商品名/品牌
  form?: string; // 剂型: 片剂/胶囊/颗粒/溶液等
  specification?: string; // 规格 如 100mg*30片
  approvalNumber?: string; // 批准文号 如 国药准字H...
  manufacturer?: string; // 生产厂家
  batchNumber?: string; // 生产批号
  expireDate?: string; // 有效期至
  productionDate?: string; // 生产日期
  location?: string; // 存放位置
  stock: number; // 当前库存数量
  stockUnit: string; // 库存单位
  stockAlertDays: number; // 预警阈值(天数或余量)
  minStockAlert?: number; // 最低余量预警值
  administrationRoute?: string; // 给药途径
  deliveryMethod?: string; // 送服方式
  mealTiming?: string; // 用药时机
  precautions?: string[]; // 禁忌与注意事项
  imageUrl?: string; // 药品包装照片
  source?: 'manual' | 'from_plan' | 'scan';
  linkedMedicationId?: string;
  notes?: string;
}

export interface MedicationLog {
  id: string;
  userId?: string;
  medicationId: string;
  medicationName?: string;
  dosage?: string;
  profileId: string;
  date: string;
  doseIndex: number;
  scheduledTime?: string;
  taken: boolean;
  operatorId?: string;
  operatorName?: string;
  timestamp: string;
  status?: 'pending' | 'taken' | 'missed' | 'skipped';
  note?: string;
}

export interface HealthRecord {
  id: string;
  memberId: string;
  type: 'blood_pressure' | 'heartRate' | 'blood_sugar' | 'weight' | 'temperature' | 'spo2' | 'cholesterol' | 'uric_acid' | 'waist' | 'hba1c' | 'triglyceride' | 'ldl' | 'hdl' | 'bone_density' | 'creatinine' | 'alt' | 'egfr' | 'respiration' | 'steps' | 'sleep' | 'other' | string;
  typeName: string;
  value: number;
  sys?: number;
  dia?: number;
  sugarPeriod?: 'fasting' | 'postprandial' | 'random' | 'bedtime' | string;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  measuredAt: string; // 详细时间 如 "2026-08-31 08:30:15"
  scene?: string; // 测量情境 如 晨起静息、餐后2小时、睡前安静
  note?: string;
  source?: 'manual' | 'device' | 'bluetooth';
  operatorName?: string;
}

export type MedicalRecordTemplateType = 
  | 'doctor_diagnosis' 
  | 'discharge_summary' 
  | 'recheck_report' 
  | 'health_checkup' 
  | 'emergency_visit' 
  | 'chronic_followup' 
  | 'daily_health_log';

export interface MedicalRecordAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  size?: string;
  uploadedAt?: string;
}

export interface MedicalRecord {
  id: string;
  memberId: string;
  templateType: MedicalRecordTemplateType;
  title: string;
  date: string;
  hospital?: string;
  department?: string;
  
  // 医生专属信息与评价
  doctor?: string; // 医生姓名
  doctorTitle?: string; // 职称 如 主任医师、知名专家
  doctorAvatarUrl?: string; // 医生照片
  doctorRating?: number; // 星级评分 1-5
  doctorTags?: string[]; // 印象标签 如「和蔼耐心」「问诊细致」
  doctorImpression?: string; // 医德医风与问诊评价
  doctorKeyAdvice?: string; // 医生叮嘱的关键一句话 (核心备忘)

  // 复查计划设置
  recheckEnabled?: boolean; // 是否开启复查提醒
  recheckDate?: string; // 复查具体日期
  recheckCycleLabel?: string; // 周期描述 如 "1个月后"
  recheckCycleDays?: number; // 周期天数
  recheckItems?: string[]; // 复查项目清单 如 ["血常规", "心电图"]
  recheckRemindDaysBefore?: number; // 提前几天提醒 如 1, 3, 7
  recheckFasting?: boolean; // 是否需要空腹
  recheckPrecautions?: string; // 复查注意事项 (如停服降糖药等)
  recheckStatus?: 'pending' | 'completed' | 'delayed'; // 复查状态

  visitType?: string;
  checkupType?: string;
  category?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  doctorAdvice?: string;
  conclusion?: string;
  abnormalItems?: string[];
  symptoms?: string;
  medicationTaken?: string;
  selfMeasuredData?: string;
  dailyDiet?: string;
  images?: string[];
  pdfUrl?: string;
  attachments?: MedicalRecordAttachment[];
  aiSummary?: string;
}

export interface TimelinePost {
  id: string;
  memberId: string;
  authorId: string;
  authorName: string;
  date: string;
  title: string;
  content: string;
  status?: string; // 身体状态 如 良好、平稳、轻微不适、就医中、康复中
  statusLevel?: 'good' | 'normal' | 'warning' | 'info';
  images: string[];
  videoUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  aiAnalysis?: string;
  referenceSource?: string;
  likes: string[];
}

export interface AIDailyCare {
  status: 'good' | 'normal' | 'poor';
  summary: string;
  dietAdvice: string;
  exerciseAdvice: string;
  medicationAdvice: string;
  newsChips: { title: string; url: string }[];
  isMock?: boolean;
  mockReason?: string;
}

export interface AIConfig {
  provider: 'openai' | 'bailian' | 'tongyi' | 'deepseek' | 'gemini' | 'custom';
  apiKey: string;
  model: string;
  baseUrl: string;
  voice: 'kore' | 'zephyr' | 'mechanical';
  isMock: boolean;
}

export interface Membership {
  plan: 'free' | 'pro' | 'family';
  expireAt: string | null;
  entitlements: {
    maxMembers: number;
    aiEnabled: boolean;
    exportEnabled: boolean;
    cloudBackup: boolean;
    anomalyAlert: boolean;
    coManager: boolean;
  };
  coManagers: string[];
  status: 'active' | 'expired' | 'cancelled';
}

export interface ModalConfirmConfig {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface PlaceholderSheetConfig {
  title: string;
  description: string;
  iconName?: string;
}
