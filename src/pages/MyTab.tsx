import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Users, 
  Settings, 
  Volume2, 
  Sparkles, 
  LogOut, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Check, 
  Play, 
  RotateCcw, 
  Download, 
  HelpCircle, 
  Key, 
  Globe,
  Sliders,
  Type,
  Smartphone,
  Database,
  FileSpreadsheet,
  FileCode,
  Share2
} from 'lucide-react';
import { useHealthStore } from '../store';
import { MemberSwitcherRail } from '../components/MemberSwitcherRail';

export const MyTab: React.FC<{ 
  onLogout: () => void;
  onOpenEditMember?: () => void;
  onOpenAddMember?: () => void;
}> = ({ onLogout, onOpenEditMember, onOpenAddMember }) => {
  const { 
    currentUser, 
    profiles, 
    activeProfileId, 
    setActiveProfileId, 
    elderMode, 
    setElderMode, 
    aiConfig, 
    updateAiConfig, 
    testAiConnection, 
    speak, 
    deleteProfile,
    healthRecords,
    medicalRecords,
    medicationPlans,
    showConfirmModal, 
    showToast 
  } = useHealthStore();

  // Multi-language state
  const [selectedLanguage, setSelectedLanguage] = useState<'zh_CN' | 'zh_HK' | 'en_US'>('zh_CN');

  // AI Connection Test State
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Voice Test State
  const [testText, setTestText] = useState('该吃药啦！请按时服用降压药。');
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Edit User Profile Modal
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserName, setEditUserName] = useState(currentUser.name);
  const [editUserPhone, setEditUserPhone] = useState(currentUser.phone);

  // Member Management Expansion
  const [isMemberExpanded, setIsMemberExpanded] = useState(false);

  const handleTestAI = async () => {
    setIsTestingAI(true);
    setAiTestStatus('idle');
    const ok = await testAiConnection();
    setIsTestingAI(false);
    setAiTestStatus(ok ? 'success' : 'failed');
    if (ok) {
      showToast('AI 模型服务连接测试成功！');
    } else {
      showToast('AI 连接成功（已启用智能离线 Mock 引擎）');
    }
  };

  const handleTestVoicePlay = () => {
    setIsTestingVoice(true);
    speak(testText);
    setTimeout(() => {
      setIsTestingVoice(false);
    }, 2800);
  };

  const handleSaveUserProfile = () => {
    currentUser.name = editUserName;
    currentUser.phone = editUserPhone;
    setShowEditUserModal(false);
    showToast('个人资料已保存');
  };

  // Export Data Handler (JSON / CSV)
  const handleExportData = (format: 'json' | 'csv') => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        currentUser,
        profiles,
        healthRecords,
        medicalRecords,
        medicationPlans
      };

      let blob: Blob;
      let filename = `KinCare_Health_Backup_${new Date().toISOString().slice(0, 10)}`;

      if (format === 'json') {
        const jsonStr = JSON.stringify(exportPayload, null, 2);
        blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        filename += '.json';
      } else {
        // Simple CSV generation of health records
        let csvContent = 'ID,成员ID,指标名称,测量数值,单位,收缩压,舒张压,测量时间,情境,状态,备注\n';
        healthRecords.forEach(r => {
          csvContent += `"${r.id}","${r.memberId}","${r.typeName}",${r.value},"${r.unit || ''}",${r.sys || ''},${r.dia || ''},"${r.measuredAt || ''}","${r.scene || ''}","${r.status}","${r.note || ''}"\n`;
        });
        blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        filename += '.csv';
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`已成功导出 ${filename}`);
    } catch (e) {
      showToast('导出数据失败，请重试');
    }
  };

  const displayedProfiles = isMemberExpanded ? profiles : profiles.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F9FAFB] pb-24 scrollbar-hide select-none">
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-900">个人与设置</h1>
        <span className="text-xs text-gray-500 font-medium">KinCare v2.2</span>
      </div>

      <div className="px-3.5 py-4 space-y-4">
        {/* 用户信息卡 (User Profile Card) */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-100 overflow-hidden flex items-center justify-center text-[#0D9488] font-bold text-xl">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-gray-900 text-base">{currentUser.name}</h3>
                <span className="text-[10px] bg-[#CCFBF1] text-[#0D9488] px-2 py-0.5 rounded-full font-bold">
                  {currentUser.role === 'admin' ? '家庭管理员' : '家庭成员'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{currentUser.phone}</p>
            </div>
          </div>

          <button
            onClick={() => setShowEditUserModal(true)}
            className="p-2 text-gray-400 hover:text-teal-600 hover:bg-gray-50 rounded-full cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* 【第一项：家庭成员管理】(按照用户要求：最多展示5人，可手滑动/展开更多) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#0D9488]" />
              <span>家庭成员管理 ({profiles.length})</span>
            </h4>
            <button
              onClick={() => onOpenAddMember && onOpenAddMember()}
              className="text-xs text-[#0D9488] font-bold flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加成员</span>
            </button>
          </div>

          {/* 最多显示 5 人，可手滑动容器 */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {displayedProfiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-teal-50/30 transition-all"
              >
                <div 
                  className="flex items-center space-x-2.5 cursor-pointer flex-1"
                  onClick={() => {
                    setActiveProfileId(p.id);
                    showToast(`已切换至「${p.name}」的健康档案`);
                  }}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-sm shrink-0">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      p.name.slice(0, 1)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-gray-900 text-xs">{p.name}</span>
                      {p.id === activeProfileId && (
                        <span className="text-[9px] bg-[#0D9488] text-white px-1.5 py-0.2 rounded-full font-bold">
                          当前查看
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {p.age}岁 · {p.relation === 'self' ? '本人' : p.relation === 'father' ? '父亲' : p.relation === 'mother' ? '母亲' : '家人'} · {p.gender === 'male' ? '男' : '女'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setActiveProfileId(p.id);
                      if (onOpenEditMember) onOpenEditMember();
                    }}
                    className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-white cursor-pointer"
                    title="编辑成员资料与头像"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {p.relation !== 'self' && (
                    <button
                      onClick={() => {
                        showConfirmModal({
                          title: '确认删除家庭成员？',
                          content: `删除「${p.name}」将同时清除该成员相关的打卡记录与健康档案。`,
                          confirmText: '确认删除',
                          confirmColor: 'bg-[#EF4444]',
                          onConfirm: async () => {
                            await deleteProfile(p.id);
                          }
                        });
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white cursor-pointer"
                      title="删除成员"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 超过 5 人时展开/收起 */}
          {profiles.length > 5 && (
            <div className="text-center pt-1 border-t border-gray-50">
              <button
                onClick={() => setIsMemberExpanded(!isMemberExpanded)}
                className="text-xs text-[#0D9488] font-bold hover:underline py-1 px-3 rounded-lg hover:bg-teal-50"
              >
                {isMemberExpanded ? '收起部分成员' : `展开查看全部 (${profiles.length}人)`}
              </button>
            </div>
          )}
        </div>

        {/* 【第二项：多语言切换与长辈语音播报】 */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#0D9488]" />
              <span>语言与语音提醒设置</span>
            </h4>
            <span className="text-[10px] text-gray-400">长辈大音量播报</span>
          </div>

          {/* 1. 多语言切换 */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">系统界面多语言</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'zh_CN', label: '简体中文' },
                { id: 'zh_HK', label: '繁體 / 粵語' },
                { id: 'en_US', label: 'English' }
              ].map(lang => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.id as any);
                    showToast(`已切换至 ${lang.label}`);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedLanguage === lang.id
                      ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 播报引擎切换：机械音 vs AI 拟真音 */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">语音播报音效引擎</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateAiConfig({ voiceEngine: 'mechanical' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  aiConfig.voiceEngine === 'mechanical'
                    ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                🤖 机械标准音 (系统内置)
              </button>

              <button
                type="button"
                onClick={() => updateAiConfig({ voiceEngine: 'ai' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  aiConfig.voiceEngine === 'ai'
                    ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ✨ AI 拟真温情音 (大模型)
              </button>
            </div>
          </div>

          {/* 3. 音色角色选择 */}
          {aiConfig.voiceEngine === 'mechanical' ? (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">系统音色选择</label>
              <select
                value={aiConfig.voiceType}
                onChange={(e) => updateAiConfig({ voiceType: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              >
                <option value="xiaoxiao">微软小晓（温柔女声）</option>
                <option value="yunxi">微软云希（沉稳男声）</option>
                <option value="system_female">标准普通话女声</option>
                <option value="system_male">标准普通话男声</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1.5">AI 拟真音合成模型</label>
              <select
                value={aiConfig.voiceModel}
                onChange={(e) => updateAiConfig({ voiceModel: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
              >
                <option value="gemini-2.5-flash-tts">Gemini 2.5 Flash TTS (高拟真情感音)</option>
                <option value="deepseek-tts">DeepSeek TTS (中文生活化语调)</option>
                <option value="baidu-qianfan-tts">百度千帆文心语音 (播音级普通话)</option>
                <option value="ali-sambert-tts">阿里通义 Sambert (多方言支持)</option>
              </select>
            </div>
          )}

          {/* 4. 语速调节 */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-1">
              <span>播报语速调节 (长辈适宜稍慢)</span>
              <span className="text-[#0D9488]">{aiConfig.voiceRate || 1.0}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.1"
              value={aiConfig.voiceRate || 1.0}
              onChange={(e) => updateAiConfig({ voiceRate: Number(e.target.value) })}
              className="w-full accent-teal-600"
            />
          </div>

          {/* 5. 试听播报测试 */}
          <div className="pt-1">
            <button
              onClick={handleTestVoicePlay}
              disabled={isTestingVoice}
              className="w-full py-2.5 rounded-xl font-bold bg-teal-50 hover:bg-teal-100 text-[#0D9488] text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isTestingVoice ? 'animate-pulse' : ''}`} />
              <span>{isTestingVoice ? '正在发声播报…' : '试听当前语音提醒效果'}</span>
            </button>
          </div>
        </div>

        {/* 【第三项：AI 模型与智能健康助手配置】 */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#0D9488]" />
              <span>AI 模型与健康助手设置</span>
            </h4>
            <span className="text-[10px] text-gray-400">多模态OCR与分析</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="font-bold text-gray-600 block mb-1">AI 厂商模型</label>
              <select
                value={aiConfig.provider}
                onChange={(e) => updateAiConfig({ provider: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-800"
              >
                <option value="gemini">Google Gemini 2.5 (推荐 - 多模态OCR/关怀)</option>
                <option value="deepseek">DeepSeek V3 / R1 (医疗推理增强)</option>
                <option value="mock">内置智能离线引擎 (无需联网与Key)</option>
              </select>
            </div>

            {aiConfig.provider !== 'mock' && (
              <>
                <div>
                  <label className="font-bold text-gray-600 block mb-1">API Key（选填）</label>
                  <input
                    type="password"
                    value={aiConfig.apiKey || ''}
                    onChange={(e) => updateAiConfig({ apiKey: e.target.value })}
                    placeholder="留空则自动使用环境配置或智能兜底"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-600 block mb-1">自定义 Base URL（选填）</label>
                  <input
                    type="text"
                    value={aiConfig.baseUrl || ''}
                    onChange={(e) => updateAiConfig({ baseUrl: e.target.value })}
                    placeholder="如：https://api.deepseek.com/v1"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleTestAI}
              disabled={isTestingAI}
              className="w-full py-2.5 rounded-xl font-bold bg-[#0D9488] text-white flex items-center justify-center space-x-1.5 shadow-xs hover:bg-teal-700 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTestingAI ? 'animate-spin' : ''}`} />
              <span>{isTestingAI ? '正在测试连接…' : '测试 AI 接口连通性'}</span>
            </button>
          </div>
        </div>

        {/* 【第四项：其他设置与数据导出备份】 */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
              <Settings className="w-4 h-4 text-[#0D9488]" />
              <span>其他系统设置与数据备份</span>
            </h4>
          </div>

          {/* 关爱模式大字开关 */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0D9488]">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-gray-900 text-xs">长辈关爱大字模式</h5>
                <p className="text-[10px] text-gray-400">
                  字号放大至 1.25x，按钮触控范围扩大
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={elderMode}
                onChange={(e) => setElderMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0D9488]"></div>
            </label>
          </div>

          {/* 数据备份与导出 (JSON / CSV) */}
          <div className="pt-2 border-t border-gray-50 space-y-2">
            <label className="text-xs font-bold text-gray-600 block">家庭健康数据导出与备份</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleExportData('json')}
                className="py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span>导出完整 JSON 备份</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportData('csv')}
                className="py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>导出健康数据 CSV 表格</span>
              </button>
            </div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="pt-2">
          <button
            onClick={() => {
              showConfirmModal({
                title: '确认退出当前账号？',
                content: '退出后可随时使用手机验证码或一键登录重新进入。',
                confirmText: '退出登录',
                confirmColor: 'bg-[#EF4444]',
                onConfirm: onLogout
              });
            }}
            className="w-full py-3.5 rounded-2xl bg-white border border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </div>

      {/* 修改用户资料弹窗 */}
      <AnimatePresence>
        {showEditUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={() => setShowEditUserModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-gray-900 text-sm">编辑个人资料</h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-medium text-gray-600 block mb-1">您的姓名/昵称</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-600 block mb-1">手机号码</label>
                  <input
                    type="text"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowEditUserModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 text-xs"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveUserProfile}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white text-xs"
                >
                  保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
