import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Check, 
  Trash2, 
  Clock, 
  Activity, 
  Calendar 
} from 'lucide-react';
import { HealthRecord } from '../types';
import { useHealthStore } from '../store';

interface EditHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HealthRecord | null;
}

export const EditHealthRecordModal: React.FC<EditHealthRecordModalProps> = ({
  isOpen,
  onClose,
  record
}) => {
  const { updateHealthRecord, deleteHealthRecord, showConfirmModal, showToast } = useHealthStore();

  const [metricValue, setMetricValue] = useState<number>(120);
  const [recordDateTime, setRecordDateTime] = useState<string>('');
  const [recordStatus, setRecordStatus] = useState<'normal' | 'high' | 'low'>('normal');
  const [recordNote, setRecordNote] = useState<string>('');

  useEffect(() => {
    if (record) {
      setMetricValue(record.value);
      setRecordStatus(record.status || 'normal');
      setRecordNote(record.note || '');

      // Format datetime-local string
      const datePart = record.date || new Date().toISOString().split('T')[0];
      const timePart = record.time ? (record.time.length === 5 ? record.time : record.time.slice(0, 5)) : '08:00';
      setRecordDateTime(`${datePart}T${timePart}`);
    }
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleSave = async () => {
    const [dPart, tPart] = recordDateTime.split('T');
    const displayTime = tPart ? tPart.slice(0, 5) : '08:00';
    const displayDate = dPart || record.date;

    await updateHealthRecord(record.id, {
      value: metricValue,
      date: displayDate,
      time: displayTime,
      timestamp: `${displayDate} ${displayTime}:00`,
      status: recordStatus,
      note: recordNote.trim() || undefined
    });

    showToast(`已更新「${record.metricName || record.type}」记录`);
    onClose();
  };

  const handleDelete = () => {
    showConfirmModal({
      title: '删除该条健康记录？',
      content: `确认彻底删除 ${record.date} 的「${record.metricName || record.type}」记录？`,
      confirmColor: 'bg-red-500',
      onConfirm: async () => {
        await deleteHealthRecord(record.id);
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
            <h3 className="font-black text-gray-900 text-sm">编辑体征记录</h3>
            <p className="text-[10px] text-gray-400">{record.metricName || record.type}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 指标数值与单位 */}
          <div className="bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100 space-y-2">
            <label className="font-bold text-teal-950 block">测量数值</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.1"
                value={metricValue}
                onChange={(e) => setMetricValue(Number(e.target.value))}
                className="flex-1 bg-white border border-teal-200 rounded-xl px-3 py-2 font-mono font-black text-xl text-[#0D9488]"
              />
              <span className="text-sm font-bold text-gray-500">{record.unit}</span>
            </div>
          </div>

          {/* 测量时间（组件选择） */}
          <div className="space-y-1 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <label className="font-bold text-gray-800 flex items-center space-x-1">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <span>测量时间（组件选择）</span>
            </label>
            <input
              type="datetime-local"
              value={recordDateTime}
              onChange={(e) => setRecordDateTime(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold font-mono text-gray-900"
            />
          </div>

          {/* 状态选择 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">指标状态评估</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'normal', label: '正常范围', color: 'bg-emerald-600 border-emerald-600 text-white' },
                { key: 'high', label: '偏高预警', color: 'bg-rose-600 border-rose-600 text-white' },
                { key: 'low', label: '偏低提示', color: 'bg-amber-600 border-amber-600 text-white' }
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setRecordStatus(st.key as any)}
                  className={`py-2 rounded-xl font-bold text-xs border text-center transition-all cursor-pointer ${
                    recordStatus === st.key ? st.color : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="font-bold text-gray-700 block mb-1">测量备注</label>
            <input
              type="text"
              value={recordNote}
              onChange={(e) => setRecordNote(e.target.value)}
              placeholder="如: 晨起测量，服降压药前"
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
