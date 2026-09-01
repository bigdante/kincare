import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Check, Camera, Upload, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useHealthStore } from '../store';
import { MemberProfile } from '../types';

interface MemberEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: MemberProfile | null; // if null, mode is add
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  onClose,
  profileToEdit
}) => {
  const { addProfile, updateProfile, showToast, elderMode } = useHealthStore();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState<'self' | 'father' | 'mother' | 'child' | 'spouse' | 'other'>('father');
  const [age, setAge] = useState<number>(65);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(68);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profileToEdit) {
      setName(profileToEdit.name);
      setRelation(profileToEdit.relation);
      setAge(profileToEdit.age);
      setGender(profileToEdit.gender);
      setHeight(profileToEdit.height || 170);
      setWeight(profileToEdit.weight || 68);
      setAvatarUrl(profileToEdit.avatarUrl || '');
    } else {
      setName('');
      setRelation('father');
      setAge(68);
      setGender('male');
      setHeight(170);
      setWeight(68);
      setAvatarUrl('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80');
    }
  }, [profileToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setAvatarUrl(reader.result as string);
          showToast('头像上传成功');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('请输入成员姓名');
      return;
    }

    if (profileToEdit) {
      await updateProfile(profileToEdit.id, {
        name: name.trim(),
        relation,
        age,
        gender,
        height,
        weight,
        avatarUrl
      });
      showToast('家庭成员资料已更新');
    } else {
      await addProfile({
        name: name.trim(),
        relation,
        age,
        gender,
        height,
        weight,
        avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        tags: [{ id: `tag_${Date.now()}`, label: '日常健康关注', type: 'info' }]
      });
      showToast('已添加新家庭成员');
    }

    onClose();
  };

  // Preset avatar library for easy selection
  const sampleAvatars = [
    { label: '爷爷/父亲', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { label: '长辈', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { label: '奶奶/母亲', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
    { label: '青年女士', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { label: '青年男士', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { label: '男孩', url: 'https://images.unsplash.com/photo-1485290334039-a3c69043e517?w=150&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">
            {profileToEdit ? '编辑家庭成员资料' : '添加家庭成员'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 头像编辑与本地上传区 */}
        <div className="flex flex-col items-center space-y-2.5 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#0D9488] shadow-md bg-teal-50 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="头像" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-10 h-10 text-teal-600" />
              )}
            </div>

            {/* 点击更换按钮遮罩 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0D9488] text-white flex items-center justify-center shadow-md hover:bg-[#0f766e] transition-transform active:scale-90"
              title="拍照或从相册上传"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#0D9488] font-bold hover:underline flex items-center space-x-1"
            >
              <Upload className="w-3 h-3" />
              <span>上传本地照片</span>
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setCustomAvatarInput(!customAvatarInput)}
              className="text-gray-500 hover:text-gray-700"
            >
              {customAvatarInput ? '收起网络链接' : '网络图片链接'}
            </button>
          </div>

          {/* 自定义网络 URL 输入 */}
          {customAvatarInput && (
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="输入图片URL: https://..."
              className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800"
            />
          )}

          {/* 预设推荐头像库 */}
          <div className="w-full pt-1">
            <span className="text-[10px] text-gray-400 font-medium block mb-1">选择预设头像：</span>
            <div className="grid grid-cols-6 gap-1.5">
              {sampleAvatars.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setAvatarUrl(item.url)}
                  className={`relative cursor-pointer rounded-full overflow-hidden aspect-square border-2 transition-all hover:scale-105 ${
                    avatarUrl === item.url ? 'border-[#0D9488] ring-2 ring-teal-200' : 'border-transparent opacity-70'
                  }`}
                  title={item.label}
                >
                  <img src={item.url} alt={item.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {avatarUrl === item.url && (
                    <div className="absolute inset-0 bg-[#0D9488]/40 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 字段输入 */}
        <div className="space-y-2.5 text-xs">
          <div>
            <label className="font-bold text-gray-600 block mb-1">
              姓名 / 称呼 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：父亲 (李建国)、母亲、老伴"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">家庭关系</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'father', label: '父亲' },
                { key: 'mother', label: '母亲' },
                { key: 'spouse', label: '配偶' },
                { key: 'child', label: '子女' },
                { key: 'self', label: '本人' },
                { key: 'other', label: '其他长辈' }
              ].map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRelation(r.key as any)}
                  className={`py-1.5 rounded-lg border font-bold text-center transition-all ${
                    relation === r.key
                      ? 'bg-[#0D9488] border-[#0D9488] text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-600 block mb-1">年龄</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-600 block mb-1">生理性别</label>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 rounded-xl font-bold border ${gender === 'male' ? 'bg-[#0D9488] text-white border-[#0D9488]' : 'bg-gray-50 text-gray-700'}`}
                >
                  男
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 rounded-xl font-bold border ${gender === 'female' ? 'bg-[#0D9488] text-white border-[#0D9488]' : 'bg-gray-50 text-gray-700'}`}
                >
                  女
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-600 block mb-1">身高 (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-600 block mb-1">体重 (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 text-xs"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white text-xs shadow-md shadow-teal-100"
          >
            保存成员资料
          </button>
        </div>
      </motion.div>
    </div>
  );
};
