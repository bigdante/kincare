import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  HealthProfile, 
  Medication, 
  MedicineCabinetItem, 
  MedicationLog, 
  HealthRecord, 
  MedicalRecord, 
  TimelinePost, 
  AIDailyCare, 
  AIConfig, 
  Membership, 
  ModalConfirmConfig, 
  PlaceholderSheetConfig,
  HealthTag
} from './types';
import { mockGenerator, callAI } from './ai_service';

interface HealthContextType {
  // Profiles
  profiles: HealthProfile[];
  activeProfileId: string;
  activeProfile: HealthProfile | undefined;
  setActiveProfileId: (id: string) => void;
  addProfile: (profile: Omit<HealthProfile, 'id'>) => Promise<void>;
  updateProfile: (id: string, data: Partial<HealthProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  addTagToProfile: (profileId: string, tag: Omit<HealthTag, 'id'>) => Promise<void>;
  removeTagFromProfile: (profileId: string, tagId: string) => Promise<void>;
  
  // Medications & Cabinet
  medications: Medication[];
  medicineCabinet: MedicineCabinetItem[];
  medicationLogs: MedicationLog[];
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  updateMedication: (id: string, data: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  takeMedication: (medicationId: string, date: string, doseIndex: number, force?: boolean) => Promise<{ success: boolean; intervalWarning?: boolean; lastTime?: string }>;
  cancelMedicationTake: (medicationId: string, date: string, doseIndex: number) => Promise<void>;
  updateMedicationLog: (id: string, data: Partial<MedicationLog>) => Promise<void>;
  deleteMedicationLog: (id: string) => Promise<void>;
  addCabinetItem: (item: Omit<MedicineCabinetItem, 'id' | 'userId'>) => Promise<void>;
  updateCabinetItem: (id: string, data: Partial<MedicineCabinetItem>) => Promise<void>;
  deleteCabinetItem: (id: string) => Promise<void>;

  // Health Metrics & Records
  healthRecords: HealthRecord[];
  addHealthRecord: (record: Omit<HealthRecord, 'id'>) => Promise<void>;
  updateHealthRecord: (id: string, data: Partial<HealthRecord>) => Promise<void>;
  deleteHealthRecord: (id: string) => Promise<void>;

  // Medical Records (3 templates)
  medicalRecords: MedicalRecord[];
  addMedicalRecord: (record: Omit<MedicalRecord, 'id'>) => Promise<void>;
  updateMedicalRecord: (id: string, data: Partial<MedicalRecord>) => Promise<void>;
  deleteMedicalRecord: (id: string) => Promise<void>;

  // Timeline
  timelinePosts: TimelinePost[];
  addTimelinePost: (post: Omit<TimelinePost, 'id' | 'likes'>) => Promise<void>;
  updateTimelinePost: (id: string, data: Partial<TimelinePost>) => Promise<void>;
  deleteTimelinePost: (id: string) => Promise<void>;
  toggleTimelineLike: (postId: string) => Promise<void>;

  // AI & Voice
  aiDailyCareMap: Record<string, AIDailyCare>;
  refreshDailyCare: (profileId: string) => Promise<void>;
  aiConfig: AIConfig;
  updateAIConfig: (config: Partial<AIConfig>) => Promise<void>;
  speak: (text: string) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
  activeSpeechText: string;

  // Membership & User
  membership: Membership;
  updateMembership: (membership: Partial<Membership>) => Promise<void>;
  currentUser: { id: string; name: string; phone: string; avatarUrl: string };

  // Settings & Modes
  elderMode: boolean;
  setElderMode: (enabled: boolean) => void;

  // Global Modals & Sheets (PRD 8.0 & 9.0)
  confirmModal: ModalConfirmConfig | null;
  showConfirmModal: (config: ModalConfirmConfig) => void;
  closeConfirmModal: () => void;
  placeholderSheet: PlaceholderSheetConfig | null;
  showPlaceholderSheet: (config: PlaceholderSheetConfig) => void;
  closePlaceholderSheet: () => void;

  // Loading
  isDataLoaded: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const HealthContext = createContext<HealthContextType>({} as HealthContextType);

export const HealthProvider = ({ children }: { children: ReactNode }) => {
  const [profiles, setProfiles] = useState<HealthProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('p_father');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicineCabinet, setMedicineCabinet] = useState<MedicineCabinetItem[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [aiDailyCareMap, setAiDailyCareMap] = useState<Record<string, AIDailyCare>>({});
  
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
    voice: 'kore',
    isMock: true
  });

  const [membership, setMembership] = useState<Membership>({
    plan: 'free',
    expireAt: null,
    entitlements: {
      maxMembers: 2,
      aiEnabled: true,
      exportEnabled: true,
      cloudBackup: true,
      anomalyAlert: true,
      coManager: false
    },
    coManagers: [],
    status: 'active'
  });

  const [elderMode, setElderModeState] = useState<boolean>(() => {
    return localStorage.getItem('kincare_elder_mode') === 'true';
  });

  const [currentUser] = useState({
    id: 'u123',
    name: '李明',
    phone: '138****8899',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  });

  const [confirmModal, setConfirmModal] = useState<ModalConfirmConfig | null>(null);
  const [placeholderSheet, setPlaceholderSheet] = useState<PlaceholderSheetConfig | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2500);
  };

  const setElderMode = (enabled: boolean) => {
    setElderModeState(enabled);
    localStorage.setItem('kincare_elder_mode', String(enabled));
    if (enabled) {
      document.documentElement.classList.add('elder-mode');
    } else {
      document.documentElement.classList.remove('elder-mode');
    }
    showToast(enabled ? '已开启长辈关爱大字模式' : '已恢复标准视觉模式');
  };

  useEffect(() => {
    if (elderMode) {
      document.documentElement.classList.add('elder-mode');
    } else {
      document.documentElement.classList.remove('elder-mode');
    }
  }, [elderMode]);

  // Global Confirm Modal (PRD 8.0)
  const showConfirmModal = (config: ModalConfirmConfig) => {
    setConfirmModal(config);
  };
  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  // Global Placeholder Sheet (PRD 9.0)
  const showPlaceholderSheet = (config: PlaceholderSheetConfig) => {
    setPlaceholderSheet(config);
  };
  const closePlaceholderSheet = () => {
    setPlaceholderSheet(null);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        const loadedProfiles: HealthProfile[] = data.profiles || [];
        setProfiles(loadedProfiles);
        if (loadedProfiles.length > 0) {
          // Default to first cared member or self
          const cared = loadedProfiles.find(p => p.role === 'cared') || loadedProfiles[0];
          setActiveProfileId(cared.id);
        }

        setMedications(data.medications || []);
        setMedicineCabinet(data.medicineCabinet || []);
        setMedicationLogs(data.medicationLogs || []);
        setHealthRecords(data.healthRecords || []);
        setMedicalRecords(data.medicalRecords || []);
        setTimelinePosts(data.timelinePosts || []);
        
        if (data.aiConfig) {
          setAiConfig(data.aiConfig);
        }
        if (data.membership) {
          setMembership(data.membership);
        }

        // Initialize AI daily care map
        const initialCareMap: Record<string, AIDailyCare> = {};
        loadedProfiles.forEach(p => {
          initialCareMap[p.id] = mockGenerator.dailyCare(p);
        });
        setAiDailyCareMap(initialCareMap);

        setIsDataLoaded(true);
      } catch (error) {
        console.error('Failed to load KinCare data:', error);
        setIsDataLoaded(true);
      }
    };
    fetchData();
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Refresh daily care
  const refreshDailyCare = async (profileId: string) => {
    const targetProfile = profiles.find(p => p.id === profileId);
    if (!targetProfile) return;

    const newCare = mockGenerator.dailyCare(targetProfile);
    setAiDailyCareMap(prev => ({
      ...prev,
      [profileId]: newCare
    }));
  };

  // Speech synthesizer
  const speak = (text: string) => {
    if (!text) return;
    setActiveSpeechText(text);
    setIsSpeaking(true);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = elderMode ? 0.85 : 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setIsSpeaking(false);
        setActiveSpeechText('');
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveSpeechText('');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      showToast(`[语音播报]: ${text}`);
      setTimeout(() => {
        setIsSpeaking(false);
        setActiveSpeechText('');
      }, 3000);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveSpeechText('');
  };

  // Profile operations
  const addProfile = async (profileData: Omit<HealthProfile, 'id'>) => {
    const id = `p_${Date.now()}`;
    const heightM = profileData.height ? profileData.height / 100 : 0;
    const bmi = profileData.height && profileData.weight && heightM > 0
      ? Number((profileData.weight / (heightM * heightM)).toFixed(1))
      : profileData.bmi || 22.0;

    const newProfile: HealthProfile = {
      ...profileData,
      id,
      bmi,
      userId: currentUser.id,
      managedByUserId: currentUser.id
    };

    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile)
    });

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(id);
    setAiDailyCareMap(prev => ({
      ...prev,
      [id]: mockGenerator.dailyCare(newProfile)
    }));
    showToast('已添加家庭成员');
  };

  const updateProfile = async (id: string, data: Partial<HealthProfile>) => {
    const profile = profiles.find(p => p.id === id);
    if (!profile) return;

    let bmi = data.bmi ?? profile.bmi;
    const h = data.height ?? profile.height;
    const w = data.weight ?? profile.weight;
    if (h && w && h > 0) {
      const heightM = h / 100;
      bmi = Number((w / (heightM * heightM)).toFixed(1));
    }

    const updated = { ...profile, ...data, bmi };
    await fetch(`/api/profiles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    setProfiles(prev => prev.map(p => p.id === id ? updated : p));
    showToast('资料已更新');
  };

  const deleteProfile = async (id: string) => {
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    setProfiles(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (activeProfileId === id && filtered.length > 0) {
        setActiveProfileId(filtered[0].id);
      }
      return filtered;
    });
    showToast('已解除该成员');
  };

  const addTagToProfile = async (profileId: string, tag: Omit<HealthTag, 'id'>) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const newTag: HealthTag = { ...tag, id: `tag_${Date.now()}` };
    const updatedTags = [...(profile.tags || []), newTag];
    await updateProfile(profileId, { tags: updatedTags });
  };

  const removeTagFromProfile = async (profileId: string, tagId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    const updatedTags = (profile.tags || []).filter(t => t.id !== tagId);
    await updateProfile(profileId, { tags: updatedTags });
  };

  // Medication operations (with fallback to cabinet)
  const addMedication = async (medData: Omit<Medication, 'id'>) => {
    const id = `m_${Date.now()}`;
    const newMed: Medication = {
      ...medData,
      id,
      userId: currentUser.id,
      stockDays: medData.stockDays || medData.stock || 30
    };

    // 1. Save medication plan
    if (!medData.isInCabinetOnly) {
      await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed)
      });
      setMedications(prev => [...prev, newMed]);
    }

    // 2. Always ensure in cabinet (PRD 5.3.5 区域四 药箱兜底规则)
    const existingInCabinet = medicineCabinet.find(c => c.name === medData.name && c.memberId === medData.profileId);
    if (!existingInCabinet) {
      const cabinetItem: MedicineCabinetItem = {
        id: `c_${Date.now()}`,
        userId: currentUser.id,
        memberId: medData.profileId,
        name: medData.name,
        specification: medData.specification || '',
        stock: medData.stock || 30,
        stockUnit: medData.stockUnit || medData.dosageUnit || '片',
        stockAlertDays: medData.stockAlertDays || 7,
        location: '家庭常备药箱',
        administrationRoute: medData.administrationRoute || '口服',
        imageUrl: medData.imageUrl || '',
        source: 'from_plan',
        linkedMedicationId: medData.isInCabinetOnly ? '' : id
      };
      await fetch('/api/medicineCabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cabinetItem)
      });
      setMedicineCabinet(prev => [...prev, cabinetItem]);
    }

    showToast(medData.isInCabinetOnly ? '已加入药箱' : '用药计划已保存');
  };

  const updateMedication = async (id: string, data: Partial<Medication>) => {
    const med = medications.find(m => m.id === id);
    if (!med) return;

    const updated = { ...med, ...data };
    await fetch(`/api/medications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setMedications(prev => prev.map(m => m.id === id ? updated : m));
    showToast('用药计划已更新');
  };

  const deleteMedication = async (id: string) => {
    await fetch(`/api/medications/${id}`, { method: 'DELETE' });
    setMedications(prev => prev.filter(m => m.id !== id));
    showToast('用药计划已删除');
  };

  // Medication Check-in & Cancel (PRD 5.1.7)
  const takeMedication = async (
    medicationId: string, 
    dateOrIndex?: string | number, 
    doseIndexOrForce?: number | boolean, 
    forceOption?: boolean
  ) => {
    const med = medications.find(m => m.id === medicationId);
    if (!med) return { success: false };

    let date = new Date().toISOString().split('T')[0];
    let doseIndex = 0;
    let force = false;

    if (typeof dateOrIndex === 'number') {
      doseIndex = dateOrIndex;
      if (typeof doseIndexOrForce === 'boolean') {
        force = doseIndexOrForce;
      }
    } else if (typeof dateOrIndex === 'string') {
      date = dateOrIndex;
      if (typeof doseIndexOrForce === 'number') {
        doseIndex = doseIndexOrForce;
      }
      if (typeof forceOption === 'boolean') {
        force = forceOption;
      }
    }

    // Safety interval check (if multiple doses today)
    const requiredInterval = med.interval || 4;
    const existingLogsToday = medicationLogs.filter(l => l.medicationId === medicationId && l.date === date && l.taken);
    
    if (!force && existingLogsToday.length > 0) {
      const sorted = [...existingLogsToday].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastLog = sorted[0];
      const hoursDiff = (Date.now() - new Date(lastLog.timestamp).getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < requiredInterval && hoursDiff >= 0) {
        const lastTimeString = new Date(lastLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { success: false, intervalWarning: true, lastTime: lastTimeString };
      }
    }

    const logId = `log_${medicationId}_${date}_${doseIndex}`;
    const scheduledTime = med.scheduleTimes?.[doseIndex] || med.time || '08:00';
    const isSelf = activeProfile?.relation === 'self';
    const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const newLog: MedicationLog = {
      id: logId,
      userId: currentUser.id,
      medicationId,
      medicationName: med.name,
      dosage: med.dosage,
      profileId: med.profileId,
      date,
      doseIndex,
      scheduledTime,
      taken: true,
      operatorId: isSelf ? activeProfileId : currentUser.id,
      operatorName: isSelf ? '本人' : '家人代打卡',
      timestamp: nowIso,
      status: 'taken'
    };

    await fetch('/api/medicationLogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    });

    setMedicationLogs(prev => {
      const idx = prev.findIndex(l => l.medicationId === medicationId && l.date === date && l.doseIndex === doseIndex);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newLog;
        return copy;
      }
      return [newLog, ...prev];
    });

    // Reduce stock if needed
    if (med.stock && med.stock > 0) {
      const newStock = Math.max(0, med.stock - (med.dosageValue || 1));
      updateMedication(med.id, { stock: newStock, stockDays: newStock });
    }

    // Trigger physical feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    showToast('打卡成功');
    return { success: true };
  };

  const cancelMedicationTake = async (
    medicationId: string, 
    dateOrIndex?: string | number, 
    doseIndexParam?: number
  ) => {
    let date = new Date().toISOString().split('T')[0];
    let doseIndex = 0;

    if (typeof dateOrIndex === 'number') {
      doseIndex = dateOrIndex;
    } else if (typeof dateOrIndex === 'string') {
      date = dateOrIndex;
      if (typeof doseIndexParam === 'number') {
        doseIndex = doseIndexParam;
      }
    }

    const log = medicationLogs.find(l => l.medicationId === medicationId && l.date === date && l.doseIndex === doseIndex);
    if (log) {
      await fetch(`/api/medicationLogs/${log.id}`, { method: 'DELETE' });
    }
    setMedicationLogs(prev => prev.filter(l => !(l.medicationId === medicationId && l.date === date && l.doseIndex === doseIndex)));
    showToast('已取消打卡');
  };

  const updateMedicationLog = async (id: string, data: Partial<MedicationLog>) => {
    await fetch(`/api/medicationLogs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    setMedicationLogs(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    showToast('服药记录已更新');
  };

  const deleteMedicationLog = async (id: string) => {
    await fetch(`/api/medicationLogs/${id}`, { method: 'DELETE' });
    setMedicationLogs(prev => prev.filter(l => l.id !== id));
    showToast('服药记录已删除');
  };

  // Medicine Cabinet
  const addCabinetItem = async (itemData: Omit<MedicineCabinetItem, 'id' | 'userId'>) => {
    const id = `c_${Date.now()}`;
    const newItem: MedicineCabinetItem = {
      ...itemData,
      id,
      userId: currentUser.id
    };
    await fetch('/api/medicineCabinet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    setMedicineCabinet(prev => [...prev, newItem]);
    showToast('药品已存入药箱');
  };

  const updateCabinetItem = async (id: string, data: Partial<MedicineCabinetItem>) => {
    const item = medicineCabinet.find(c => c.id === id);
    if (!item) return;

    const updated = { ...item, ...data };
    await fetch(`/api/medicineCabinet/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setMedicineCabinet(prev => prev.map(c => c.id === id ? updated : c));
    showToast('药品信息已更新');
  };

  const deleteCabinetItem = async (id: string) => {
    await fetch(`/api/medicineCabinet/${id}`, { method: 'DELETE' });
    setMedicineCabinet(prev => prev.filter(c => c.id !== id));
    showToast('已从药箱移除');
  };

  // Health Metrics Records
  const addHealthRecord = async (recordData: Omit<HealthRecord, 'id'>) => {
    const id = `hr_${Date.now()}`;
    const newRecord: HealthRecord = {
      ...recordData,
      id
    };
    await fetch('/api/healthRecords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    setHealthRecords(prev => [newRecord, ...prev]);
    showToast('指标记录成功');
  };

  const updateHealthRecord = async (id: string, data: Partial<HealthRecord>) => {
    const rec = healthRecords.find(r => r.id === id);
    if (!rec) return;

    const updated = { ...rec, ...data };
    await fetch(`/api/healthRecords/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setHealthRecords(prev => prev.map(r => r.id === id ? updated : r));
    showToast('健康指标记录已修改');
  };

  const deleteHealthRecord = async (id: string) => {
    await fetch(`/api/healthRecords/${id}`, { method: 'DELETE' });
    setHealthRecords(prev => prev.filter(r => r.id !== id));
    showToast('指标记录已删除');
  };

  // Medical Records (3 templates)
  const addMedicalRecord = async (recordData: Omit<MedicalRecord, 'id'>) => {
    const id = `rec_${Date.now()}`;
    
    // Auto-generate AI summary if empty
    let aiSummary = recordData.aiSummary;
    if (!aiSummary) {
      const contextText = `${recordData.title} ${recordData.chiefComplaint || ''} ${recordData.diagnosis || ''} ${recordData.doctorAdvice || ''} ${recordData.conclusion || ''} ${recordData.symptoms || ''}`;
      const res = mockGenerator.analyzeText(contextText);
      aiSummary = res.analysis;
    }

    const newRecord: MedicalRecord = {
      ...recordData,
      id,
      aiSummary
    };

    await fetch('/api/medicalRecords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    setMedicalRecords(prev => [newRecord, ...prev]);
    showToast('病历档案已保存');
  };

  const updateMedicalRecord = async (id: string, data: Partial<MedicalRecord>) => {
    const rec = medicalRecords.find(r => r.id === id);
    if (!rec) return;

    const updated = { ...rec, ...data };
    await fetch(`/api/medicalRecords/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setMedicalRecords(prev => prev.map(r => r.id === id ? updated : r));
    showToast('病历已更新');
  };

  const deleteMedicalRecord = async (id: string) => {
    await fetch(`/api/medicalRecords/${id}`, { method: 'DELETE' });
    setMedicalRecords(prev => prev.filter(r => r.id !== id));
    showToast('病历已删除');
  };

  // Timeline
  const addTimelinePost = async (postData: Omit<TimelinePost, 'id' | 'likes'>) => {
    const id = `post_${Date.now()}`;
    
    // Auto AI analysis if not present
    let aiAnalysis = postData.aiAnalysis;
    let referenceSource = postData.referenceSource;
    if (!aiAnalysis) {
      const res = mockGenerator.analyzeText(postData.content);
      aiAnalysis = res.analysis;
      referenceSource = res.source;
    }

    const newPost: TimelinePost = {
      ...postData,
      id,
      likes: [],
      aiAnalysis,
      referenceSource
    };

    await fetch('/api/timelinePosts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    });
    setTimelinePosts(prev => [newPost, ...prev]);
    showToast('动态发布成功');
  };

  const updateTimelinePost = async (id: string, data: Partial<TimelinePost>) => {
    const post = timelinePosts.find(p => p.id === id);
    if (!post) return;

    let aiAnalysis = data.aiAnalysis || post.aiAnalysis;
    let referenceSource = data.referenceSource || post.referenceSource;

    // If content changed and no new aiAnalysis provided, re-analyze
    if (data.content && data.content !== post.content && !data.aiAnalysis) {
      const res = mockGenerator.analyzeText(data.content);
      aiAnalysis = res.analysis;
      referenceSource = res.source;
    }

    const updated = {
      ...post,
      ...data,
      aiAnalysis,
      referenceSource
    };

    await fetch(`/api/timelinePosts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setTimelinePosts(prev => prev.map(p => p.id === id ? updated : p));
    showToast('动态已成功更新');
  };

  const deleteTimelinePost = async (id: string) => {
    await fetch(`/api/timelinePosts/${id}`, { method: 'DELETE' });
    setTimelinePosts(prev => prev.filter(p => p.id !== id));
    showToast('动态已删除');
  };

  const toggleTimelineLike = async (postId: string) => {
    const post = timelinePosts.find(p => p.id === postId);
    if (!post) return;

    const hasLiked = post.likes.includes(currentUser.id);
    const updatedLikes = hasLiked
      ? post.likes.filter(uid => uid !== currentUser.id)
      : [...post.likes, currentUser.id];

    const updated = { ...post, likes: updatedLikes };
    await fetch(`/api/timelinePosts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    setTimelinePosts(prev => prev.map(p => p.id === postId ? updated : p));
  };

  // Config & Membership
  const updateAIConfig = async (configUpdate: Partial<AIConfig>) => {
    const updated = { ...aiConfig, ...configUpdate };
    setAiConfig(updated);
    await fetch('/api/updateConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiConfig: updated })
    });
    showToast('AI 配置已保存');
  };

  const updateMembership = async (membershipUpdate: Partial<Membership>) => {
    const updated = { ...membership, ...membershipUpdate };
    setMembership(updated);
    await fetch('/api/updateConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membership: updated })
    });
    showToast('会员状态已更新');
  };

  return (
    <HealthContext.Provider
      value={{
        profiles,
        activeProfileId,
        activeProfile,
        setActiveProfileId,
        addProfile,
        updateProfile,
        deleteProfile,
        addTagToProfile,
        removeTagFromProfile,
        medications,
        medicineCabinet,
        medicationLogs,
        addMedication,
        updateMedication,
        deleteMedication,
        takeMedication,
        cancelMedicationTake,
        updateMedicationLog,
        deleteMedicationLog,
        addCabinetItem,
        updateCabinetItem,
        deleteCabinetItem,
        healthRecords,
        addHealthRecord,
        updateHealthRecord,
        deleteHealthRecord,
        medicalRecords,
        addMedicalRecord,
        updateMedicalRecord,
        deleteMedicalRecord,
        timelinePosts,
        addTimelinePost,
        updateTimelinePost,
        deleteTimelinePost,
        toggleTimelineLike,
        aiDailyCareMap,
        refreshDailyCare,
        aiConfig,
        updateAIConfig,
        speak,
        stopSpeech,
        isSpeaking,
        activeSpeechText,
        membership,
        updateMembership,
        currentUser,
        elderMode,
        setElderMode,
        confirmModal,
        showConfirmModal,
        closeConfirmModal,
        placeholderSheet,
        showPlaceholderSheet,
        closePlaceholderSheet,
        isDataLoaded,
        toastMessage,
        showToast
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealthStore = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealthStore must be used within HealthProvider');
  }
  return context;
};
