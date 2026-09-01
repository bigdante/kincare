import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  Building2, 
  Stethoscope, 
  User, 
  Star, 
  Heart, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Camera, 
  File, 
  Share2, 
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { MedicalRecord } from '../types';
import { useHealthStore } from '../store';

interface MedicalRecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord | null;
  onEdit: (record: MedicalRecord) => void;
}

export const MedicalRecordDetailModal: React.FC<MedicalRecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onEdit
}) => {
  const { profiles, deleteMedicalRecord, updateMedicalRecord, showConfirmModal, showToast } = useHealthStore();
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const member = profiles.find(p => p.id === record.memberId);

  // Calculate days until recheck
  let recheckDaysDiff: number | null = null;
  let isRecheckOverdue = false;
  if (record.recheckDate) {
    const today = new Date().setHours(0, 0, 0, 0);
    const target = new Date(record.recheckDate).setHours(0, 0, 0, 0);
    recheckDaysDiff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    isRecheckOverdue = recheckDaysDiff < 0;
  }

  // Handle toggle recheck status
  const handleToggleRecheckStatus = async () => {
    const nextStatus = record.recheckStatus === 'completed' ? 'pending' : 'completed';
    await updateMedicalRecord(record.id, { recheckStatus: nextStatus });
    showToast(nextStatus === 'completed' ? '已标记此复查为「已完成」' : '已重置复查状态为「待复查」');
  };

  const templateBadges: Record<string, { label: string; bg: string }> = {
    doctor_diagnosis: { label: '门诊就医常规诊断', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    discharge_summary: { label: '住院/出院小结', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    recheck_report: { label: '专科复查与化验对比', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    health_checkup: { label: '年度体检与检验报告', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    emergency_visit: { label: '急诊急救就医记录', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    chronic_followup: { label: '慢病随访评估', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    daily_health_log: { label: '日常健康随手记', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  };

  const badgeInfo = templateBadges[record.templateType] || { label: '病历档案', bg: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto scrollbar-hide text-xs"
      >
        {/* 顶部标题与操作栏 */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 sticky top-0 bg-white z-20">
          <div className="flex items-center space-x-2 min-w-0">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeInfo.bg}`}>
              {badgeInfo.label}
            </span>
            <h3 className="font-black text-gray-900 text-base truncate">
              {record.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 基础医院与患者信息栏 */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/80 border border-gray-100">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 text-gray-800 font-extrabold text-xs">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{record.hospital || '就诊医院'} · {record.department || '常规科室'}</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span>就诊日期：{record.date}</span>
            </div>
          </div>

          {member && (
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-full border border-gray-200 shrink-0">
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ backgroundColor: member.avatarColor || '#0D9488' }}
              >
                {member.name.slice(0, 1)}
              </div>
              <span className="font-bold text-gray-800 text-[11px]">{member.name}</span>
            </div>
          )}
        </div>

        {/* 【核心展示8】：主治医师专属名片、照片、星级好评、印象与关键叮嘱 */}
        {(record.doctor || record.doctorKeyAdvice || record.doctorAvatarUrl || record.doctorImpression) && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/60 to-amber-50/40 border border-teal-100/80 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-teal-200 flex items-center justify-center shrink-0 shadow-xs">
                  {record.doctorAvatarUrl ? (
                    <img
                      src={record.doctorAvatarUrl}
                      alt={record.doctor || '医生'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-6 h-6 text-teal-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-black text-gray-900 text-sm">{record.doctor || '接诊医师'}</h4>
                    <span className="text-[10px] bg-teal-100/80 text-teal-800 font-bold px-2 py-0.5 rounded-md">
                      {record.doctorTitle || '主任医师'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (record.doctorRating || 5)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-amber-700 font-bold ml-1">
                      {(record.doctorRating || 5)}星好评
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200 font-bold shadow-xs">
                主诊医嘱档案
              </span>
            </div>

            {/* 医生印象标签 */}
            {record.doctorTags && record.doctorTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {record.doctorTags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-white text-gray-700 border border-amber-200/80 px-2 py-0.5 rounded-full font-medium shadow-xs">
                    🏷 {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 医生评价 */}
            {record.doctorImpression && (
              <p className="text-[11px] text-gray-600 bg-white/80 p-2 rounded-xl border border-gray-200/60">
                <span className="font-bold text-gray-800">就医印象：</span>{record.doctorImpression}
              </p>
            )}

            {/* 【高光展示】：医生当时叮嘱的关键一句话 */}
            {record.doctorKeyAdvice && (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1 shadow-xs">
                <div className="flex items-center space-x-1 text-amber-800 font-black text-xs">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>医生重点交代的核心一句话 (关键备忘)：</span>
                </div>
                <p className="text-xs font-bold leading-relaxed pl-1 italic text-amber-900">
                  “ {record.doctorKeyAdvice} ”
                </p>
              </div>
            )}
          </div>
        )}

        {/* 临床诊断与主诉详情 */}
        <div className="space-y-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
          {(record.chiefComplaint || record.symptoms) && (
            <div>
              <span className="font-extrabold text-gray-500 block mb-0.5 text-[10px]">就诊主诉与发病症状</span>
              <p className="text-gray-900 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-gray-200/70">
                {record.chiefComplaint || record.symptoms}
              </p>
            </div>
          )}

          <div>
            <span className="font-extrabold text-gray-500 block mb-0.5 text-[10px]">临床诊断结论 / 检查报告分析</span>
            <div className="p-2.5 rounded-xl bg-white border border-teal-100 text-gray-900 font-bold leading-relaxed">
              {record.diagnosis || record.conclusion || '临床诊断结论'}
            </div>
          </div>

          {record.doctorAdvice && (
            <div>
              <span className="font-extrabold text-gray-500 block mb-0.5 text-[10px]">医生治疗方案与日常用药医嘱</span>
              <p className="text-gray-800 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-gray-200/70">
                {record.doctorAdvice}
              </p>
            </div>
          )}
        </div>

        {/* 【核心展示6】：复查提醒与就医随访规划卡片 */}
        {record.recheckEnabled && record.recheckDate && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-black text-indigo-950 text-xs">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>复查与随访规划</span>
                {record.recheckCycleLabel && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-normal">
                    {record.recheckCycleLabel}
                  </span>
                )}
              </div>

              {/* 倒计时或逾期状态 */}
              <div className="flex items-center space-x-1.5">
                {record.recheckStatus === 'completed' ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>已完成复查</span>
                  </span>
                ) : isRecheckOverdue ? (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                    <AlertTriangle className="w-3 h-3" />
                    <span>已逾期 {Math.abs(recheckDaysDiff || 0)} 天</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                    {recheckDaysDiff === 0 ? '今天复查' : `还有 ${recheckDaysDiff} 天复查`}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex justify-between items-center text-gray-700">
                <span className="text-gray-400">预计复查日期</span>
                <span className="font-bold font-mono text-indigo-900">{record.recheckDate}</span>
              </div>

              {record.recheckItems && record.recheckItems.length > 0 && (
                <div>
                  <span className="text-gray-400 block mb-1">重点检查项目</span>
                  <div className="flex flex-wrap gap-1">
                    {record.recheckItems.map((item) => (
                      <span key={item} className="text-[10px] bg-indigo-50 text-indigo-900 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {record.recheckFasting && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>空腹提醒：抽血前清晨禁食8-12小时，尽量空腹就诊</span>
                </div>
              )}

              {record.recheckPrecautions && (
                <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <span className="font-bold text-gray-800">注意事项：</span>{record.recheckPrecautions}
                </div>
              )}

              {/* 标记已复查切换按钮 */}
              <div className="pt-1 text-right">
                <button
                  onClick={handleToggleRecheckStatus}
                  className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  {record.recheckStatus === 'completed' ? '⟲ 重新标记为待复查' : '✓ 标记已完成此复查'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 附件与照片展示 (点击可放大) */}
        {((record.images && record.images.length > 0) || (record.attachments && record.attachments.length > 0)) && (
          <div className="space-y-2 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
            <h4 className="font-extrabold text-gray-800 text-xs flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>病历原件与报告附件</span>
            </h4>

            {record.images && record.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {record.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPreviewImage(img)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white cursor-pointer group hover:opacity-90"
                  >
                    <img src={img} alt="record photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                      点击查看
                    </div>
                  </div>
                ))}
              </div>
            )}

            {record.attachments && record.attachments.length > 0 && (
              <div className="space-y-1 pt-1">
                {record.attachments.map((att, idx) => (
                  <a
                    key={att.id || idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-200 hover:bg-rose-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <File className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-bold text-gray-800 text-xs truncate">{att.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{att.size}</span>
                    </div>
                    <span className="text-[11px] text-rose-600 font-bold shrink-0">查看文档 →</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 底部操作按钮：【核心要求5】：显示要全，并且同样支持可以编辑 */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white z-10">
          <button
            onClick={() => {
              showConfirmModal({
                title: '删除病历档案',
                content: `确定要删除「${record.title}」吗？此操作无法撤销。`,
                confirmColor: 'bg-red-500',
                onConfirm: async () => {
                  await deleteMedicalRecord(record.id);
                  onClose();
                }
              });
            }}
            className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold flex items-center justify-center transition-colors cursor-pointer"
            title="删除病历"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors cursor-pointer text-xs"
          >
            关闭
          </button>

          <button
            onClick={() => {
              onEdit(record);
            }}
            className="flex-1 py-3 rounded-2xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-teal-600/20 active:scale-95 cursor-pointer text-xs"
          >
            <Edit3 className="w-4 h-4" />
            <span>编辑此病历档案</span>
          </button>
        </div>
      </motion.div>

      {/* 照片全屏大图预览 */}
      <AnimatePresence>
        {selectedPreviewImage && (
          <div
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPreviewImage(null)}
          >
            <div className="relative max-w-xl max-h-[90vh]">
              <img
                src={selectedPreviewImage}
                alt="preview"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setSelectedPreviewImage(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
