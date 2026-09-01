import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  ScanBarcode, 
  Check, 
  Building2, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  Package,
  Plus,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { MedicineCabinetItem } from '../types';
import { useHealthStore } from '../store';

interface MedicineCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: MedicineCabinetItem | null;
}

export const MedicineCabinetModal: React.FC<MedicineCabinetModalProps> = ({
  isOpen,
  onClose,
  itemToEdit
}) => {
  const { activeProfileId, addCabinetItem, updateCabinetItem, showToast } = useHealthStore();
  const isEditing = !!itemToEdit;
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [cabName, setCabName] = useState('');
  const [cabGenericName, setCabGenericName] = useState('');
  const [cabManufacturer, setCabManufacturer] = useState('');
  const [cabApprovalNumber, setCabApprovalNumber] = useState('');
  const [cabBatchNumber, setCabBatchNumber] = useState('');
  const [cabSpec, setCabSpec] = useState('');
  const [cabDosageForm, setCabDosageForm] = useState('控释片');
  const [cabStock, setCabStock] = useState<number>(3);
  const [cabUnit, setCabUnit] = useState('盒');
  const [cabLocation, setCabLocation] = useState('客厅医药箱第一层');
  const [cabStorageCondition, setCabStorageCondition] = useState('遮光、密闭，在阴凉处(不超过20℃)保存');
  const [cabExpiryDate, setCabExpiryDate] = useState('2028-06-30');
  const [cabProductionDate, setCabProductionDate] = useState('2025-07-01');
  const [cabIndications, setCabIndications] = useState('');
  const [cabBarcode, setCabBarcode] = useState('');
  const [cabImage, setCabImage] = useState<string>('');
  const [cabPrecautions, setCabPrecautions] = useState<string[]>(['忌酒', '整片吞服']);
  const [newPrecaution, setNewPrecaution] = useState('');
  const [showAddPrecaution, setShowAddPrecaution] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setCabName(itemToEdit.name || '');
      setCabGenericName(itemToEdit.commonName || itemToEdit.genericName || '');
      setCabManufacturer(itemToEdit.manufacturer || '');
      setCabApprovalNumber(itemToEdit.approvalNumber || '');
      setCabBatchNumber(itemToEdit.batchNumber || '');
      setCabSpec(itemToEdit.specification || itemToEdit.specifications || '');
      setCabDosageForm(itemToEdit.dosageForm || itemToEdit.form || '控释片');
      setCabStock(itemToEdit.stock || 1);
      setCabUnit(itemToEdit.stockUnit || itemToEdit.unit || '盒');
      setCabLocation(itemToEdit.location || itemToEdit.storageLocation || '家庭医药箱');
      setCabStorageCondition(itemToEdit.storageCondition || '常温避光保存');
      setCabExpiryDate(itemToEdit.expireDate || itemToEdit.expiryDate || '2028-12-31');
      setCabProductionDate(itemToEdit.productionDate || '2025-01-01');
      setCabIndications(itemToEdit.indications || '');
      setCabBarcode(itemToEdit.barcode || '');
      setCabImage(itemToEdit.imageUrl || '');
      setCabPrecautions(itemToEdit.precautions || ['密封防潮']);
    } else {
      setCabName('');
      setCabGenericName('');
      setCabManufacturer('');
      setCabApprovalNumber('');
      setCabBatchNumber('');
      setCabSpec('');
      setCabDosageForm('控释片');
      setCabStock(3);
      setCabUnit('盒');
      setCabLocation('客厅医药箱第一层');
      setCabStorageCondition('遮光、密闭，在阴凉处(不超过20℃)保存');
      setCabExpiryDate('2028-06-30');
      setCabProductionDate('2025-07-01');
      setCabIndications('');
      setCabBarcode('');
      setCabImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80');
      setCabPrecautions(['忌酒', '整片吞服']);
    }
  }, [itemToEdit, isOpen]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setCabImage(reader.result as string);
          showToast('已成功上传药品包装照片');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateBarcodeScan = () => {
    showToast('正在扫码识别药盒条形码…');
    setTimeout(() => {
      setCabName('拜新同');
      setCabGenericName('硝苯地平控释片 (Adalat GITS)');
      setCabManufacturer('拜耳医药保健有限公司 (Bayer AG)');
      setCabApprovalNumber('国药准字 H20000079');
      setCabBatchNumber('20260315-B');
      setCabSpec('30mg * 7片/板 * 4板/盒');
      setCabDosageForm('控释片');
      setCabStock(4);
      setCabUnit('盒');
      setCabLocation('客厅家庭常备药箱上层');
      setCabStorageCondition('遮光，密封，在不超过30℃处保存');
      setCabExpiryDate('2028-12-31');
      setCabProductionDate('2025-11-10');
      setCabIndications('1. 原发性高血压；2. 冠心病、慢性稳定性心绞痛。');
      setCabBarcode('6901234567890');
      setCabImage('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80');
      setCabPrecautions(['不可嚼碎或碾碎', '忌与西柚同服', '按时服药']);
      showToast('已自动识别并补齐国家药品管理规范字段！');
    }, 500);
  };

  const handleAddPrecautionTag = () => {
    const trimmed = newPrecaution.trim();
    if (trimmed) {
      if (!cabPrecautions.includes(trimmed)) {
        setCabPrecautions([...cabPrecautions, trimmed]);
      }
      setNewPrecaution('');
      setShowAddPrecaution(false);
      showToast('已添加注意事项');
    }
  };

  const handleRemovePrecaution = (tag: string) => {
    setCabPrecautions(cabPrecautions.filter(p => p !== tag));
    showToast('已移除该注意事项');
  };

  const handleSave = async () => {
    if (!cabName.trim()) {
      showToast('请输入药品常用名 / 商品名');
      return;
    }

    const defaultImg = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80';
    const itemData = {
      memberId: activeProfileId === 'all' ? undefined : activeProfileId,
      name: cabName.trim(),
      commonName: cabGenericName.trim() || undefined,
      genericName: cabGenericName.trim() || undefined,
      manufacturer: cabManufacturer.trim() || undefined,
      approvalNumber: cabApprovalNumber.trim() || undefined,
      batchNumber: cabBatchNumber.trim() || undefined,
      specification: cabSpec.trim() || undefined,
      specifications: cabSpec.trim() || undefined,
      dosageForm: cabDosageForm,
      form: cabDosageForm,
      stock: cabStock,
      unit: cabUnit,
      stockUnit: cabUnit,
      expiryDate: cabExpiryDate,
      expireDate: cabExpiryDate,
      productionDate: cabProductionDate || undefined,
      storageLocation: cabLocation,
      location: cabLocation,
      storageCondition: cabStorageCondition,
      indications: cabIndications || undefined,
      barcode: cabBarcode || undefined,
      imageUrl: cabImage || defaultImg,
      precautions: cabPrecautions
    };

    if (isEditing && itemToEdit) {
      await updateCabinetItem(itemToEdit.id, itemData);
      showToast(`「${cabName}」药品信息已更新`);
    } else {
      await addCabinetItem({
        ...itemData,
        stockAlertDays: 7
      });
      showToast(`「${cabName}」已存入家庭药箱`);
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
        className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto scrollbar-hide text-xs"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-black text-gray-900 text-base">
              {isEditing ? `编辑药箱药品 · ${itemToEdit?.name}` : '添加药品到家庭药箱'}
            </h3>
            <p className="text-[11px] text-gray-400">完整录入国家药品管理规范字段，追踪库存与效期</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 扫码识别入口 */}
        <div className="flex items-center justify-between bg-teal-50/70 p-3 rounded-2xl border border-teal-100">
          <div className="flex items-center space-x-2">
            <ScanBarcode className="w-5 h-5 text-[#0D9488]" />
            <div>
              <span className="text-xs font-bold text-teal-950 block">智能扫码 / 药盒条码识别</span>
              <span className="text-[10px] text-teal-700">自动解析批准文号、生产厂家与效期</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSimulateBarcodeScan}
            className="px-3 py-1.5 rounded-xl bg-[#0D9488] text-white font-bold text-xs shadow-xs hover:bg-teal-700 cursor-pointer active:scale-95 transition-all"
          >
            一键扫码
          </button>
        </div>

        <div className="space-y-2.5">
          {/* 药品包装图片上传 */}
          <div className="bg-gray-50/60 p-3 rounded-2xl border border-gray-100 space-y-1.5">
            <label className="font-bold text-gray-800 block">药品外观 / 药盒照片</label>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 relative shadow-xs">
                {cabImage ? (
                  <>
                    <img src={cabImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCabImage('')}
                      className="absolute top-0 right-0 bg-black/60 text-white p-0.5 rounded-bl-lg cursor-pointer"
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
                  ref={imageInputRef}
                  onChange={handleImageFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl font-bold text-gray-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>拍照或从相册上传图片</span>
                </button>
                <p className="text-[10px] text-gray-400">药箱列表左侧将展示药品直观照片</p>
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-800 block mb-1">
              药品商品名 / 常用名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cabName}
              onChange={(e) => setCabName(e.target.value)}
              placeholder="如：拜新同、波立维、立普妥"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-900 focus:bg-white focus:border-[#0D9488]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">通用名称</label>
              <input
                type="text"
                value={cabGenericName}
                onChange={(e) => setCabGenericName(e.target.value)}
                placeholder="硝苯地平控释片"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">剂型</label>
              <select
                value={cabDosageForm}
                onChange={(e) => setCabDosageForm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-bold"
              >
                <option value="控释片">控释片</option>
                <option value="缓释胶囊">缓释胶囊</option>
                <option value="薄膜衣片">薄膜衣片</option>
                <option value="颗粒剂">颗粒剂</option>
                <option value="口服溶液">口服溶液</option>
                <option value="滴眼剂">滴眼剂</option>
                <option value="外用膏剂">外用膏剂</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">生产厂家 / 企业</label>
              <input
                type="text"
                value={cabManufacturer}
                onChange={(e) => setCabManufacturer(e.target.value)}
                placeholder="拜耳医药保健有限公司"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">批准文号（国药准字）</label>
              <input
                type="text"
                value={cabApprovalNumber}
                onChange={(e) => setCabApprovalNumber(e.target.value)}
                placeholder="国药准字 H20000079"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">包装规格</label>
              <input
                type="text"
                value={cabSpec}
                onChange={(e) => setCabSpec(e.target.value)}
                placeholder="30mg*7片/板*4板"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">生产批号</label>
              <input
                type="text"
                value={cabBatchNumber}
                onChange={(e) => setCabBatchNumber(e.target.value)}
                placeholder="20260315-B"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-gray-700 block mb-1">库存余量</label>
              <input
                type="number"
                min="0"
                value={cabStock}
                onChange={(e) => setCabStock(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-center font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">单位</label>
              <select
                value={cabUnit}
                onChange={(e) => setCabUnit(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-gray-900 font-bold"
              >
                <option value="盒">盒</option>
                <option value="瓶">瓶</option>
                <option value="板">板</option>
                <option value="支">支</option>
                <option value="包">包</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">有效期截止</label>
              <input
                type="date"
                value={cabExpiryDate}
                onChange={(e) => setCabExpiryDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-gray-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">存放位置</label>
            <input
              type="text"
              value={cabLocation}
              onChange={(e) => setCabLocation(e.target.value)}
              placeholder="客厅家庭常备药箱上层"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">贮藏条件</label>
            <input
              type="text"
              value={cabStorageCondition}
              onChange={(e) => setCabStorageCondition(e.target.value)}
              placeholder="遮光、密封，在阴凉处保存"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
            />
          </div>

          {/* 禁忌与注意事项 (支持删除与添加) */}
          <div className="space-y-1.5 bg-amber-50/50 p-2.5 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>注意事项与禁忌（点击小×删除）</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddPrecaution(!showAddPrecaution)}
                className="text-[11px] text-[#0D9488] font-bold flex items-center space-x-0.5 hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>添加</span>
              </button>
            </div>

            {showAddPrecaution && (
              <div className="flex items-center space-x-1 pt-1">
                <input
                  type="text"
                  value={newPrecaution}
                  onChange={(e) => setNewPrecaution(e.target.value)}
                  placeholder="如：饭前服用、忌辛辣"
                  className="flex-1 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddPrecautionTag}
                  className="px-3 py-1 bg-[#0D9488] text-white rounded-lg font-bold"
                >
                  确定
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {cabPrecautions.map(p => (
                <span
                  key={p}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200"
                >
                  <span>{p}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrecaution(p)}
                    className="hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-2 pt-2 border-t border-gray-100 sticky bottom-0 bg-white z-10">
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
            className="flex-1 py-2.5 rounded-xl font-bold bg-[#0D9488] text-white shadow-md flex items-center justify-center space-x-1 hover:bg-teal-700 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? '保存修改' : '确认入库'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
