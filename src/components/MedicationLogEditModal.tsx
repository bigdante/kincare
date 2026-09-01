import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Check, 
  Trash2, 
  Clock, 
  CheckSquare, 
  AlertCircle, 
  User, 
  FileText,
  Calendar
} from 'lucide-react';
import { MedicationLog } from '../types';
import { useHealthStore } from '../store';

interface MedicationLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: any | null;
}

export const MedicationLogEditModal: React.FC<MedicationLogEditModalProps> = ({
  isOpen,
  onClose,
  log
}) => {
  const { updateMedicationLog, deleteMedicationLog, showConfirmModal, showToast } = useHealthStore();

  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [status, setStatus] = useState<'taken' | 'missed' | 'skipped'>('taken');
  const [dosage, setDosage] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (log) {
      // Parse timestamp or fallback
      const logDate = log.date || new Date().toISOString().split('T')[0];
      setDateStr(logDate);
      
      let parsedTime = log.scheduledTime || '08:00';
      if (log.timestamp && log.timestamp.includes(':')) {
        const parts = log.timestamp.split(' ');
        if (parts[1]) {
          parsedTime = parts[1].slice(0, 5);
        }
      }
      setTimeStr(parsedTime);
      setStatus(log.taken ? 'taken' : log.status === 'skipped' ? 'skipped' : 'missed');
      setDosage(log.dosage || '');
      setOperatorName(log.operatorName || '本人');
      setNote(log.note || '');
    }
  }, [log, isOpen]);

  if (!isOpen || !log) return null;

  const handleSave = async () => {
    const isTaken = status === 'taken';
    const updatedTimestamp = `${dateStr} ${timeStr}:00`;

    await updateMedicationLog(log.id, {
      date: dateStr,
      scheduledTime: timeStr,
      taken: isTaken,
      status: status,
      timestamp: updatedTimestamp,
      dosage: dosage.trim() || log.dosage,
      operatorName: operatorName.trim() || '本人',
      note: note.trim() || undefined
    });

    showToast('服药打卡流水已成功更新');
    onClose();
  };

  const handleDelete = () => {
    showConfirmModal({
      title: '删除该条服药记录？',
      content: `确认彻底删除「${log.medicationName || '该药品'}」在 ${dateStr} 的记录？`,
      confirmColor: 'bg-red-500',
      onConfirm: async () => {
        await deleteMedicationLog(log.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-xs"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900 text-sm">编辑服药打卡记录</h3>
            <p className="text-[10px] text-gray-400">{log.medicationName || '用药计划'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 打卡状态选择 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">打卡状态</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'taken', label: '✓ 已服药', color: 'bg-emerald-600 border-emerald-600 text-white' },
                { key: 'missed', label: '⏰ 逾期未服', color: 'bg-rose-600 border-rose-600 text-white' },
                { key: 'skipped', label: '✕ 已跳过', color: 'bg-gray-600 border-gray-600 text-white' }
              ].map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key as any)}
                  className={`py-2 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                    status === s.key ? s.color : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 打卡日期与精准时间（使用标准时间构件） */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">记录日期</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 font-bold text-gray-900 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">打卡时间</label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 font-bold text-gray-900 font-mono"
              />
            </div>
          </div>

          {/* 剂量与打卡人 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">服药剂量</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="如: 1片 (30mg)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">操作人 / 记录者</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="本人 / 家属"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-900 font-bold"
              />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">打卡备注 (选填)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="如: 饭后半小时服用，无不适"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 flex items-center justify-center cursor-pointer"
            title="删除此记录"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white hover:bg-teal-700 shadow-md cursor-pointer"
          >
            保存修改
          </button>
        </div>
      </motion.div>
    </div>
  );
};
