import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ShieldAlert } from 'lucide-react';
import { useHealthStore } from '../store';

export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const { elderMode, showToast } = useHealthStore();
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'user' | 'privacy' | null>(null);

  const handleLoginClick = () => {
    if (isLoading) return;
    if (!agreed) {
      setShowPrivacySheet(true);
      return;
    }
    executeLogin();
  };

  const executeLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('欢迎进入亲安，守护家人健康');
      onLogin();
    }, 700);
  };

  const handleAgreeAndLogin = () => {
    setAgreed(true);
    setShowPrivacySheet(false);
    executeLogin();
  };

  return (
    <div className="flex flex-col justify-between h-full bg-gradient-to-b from-[#ECFDF5] via-emerald-50/40 to-white px-6 py-12 relative overflow-hidden select-none">
      {/* 顶部装饰光斑 */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* 第一层级：品牌区 (占据上部空间) */}
      <div className="flex flex-col items-center pt-8 z-10">
        {/* Logo 容器: 翡翠绿大圆角方形 + 白色医疗十字 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-24 h-24 bg-[#059669] rounded-[36px] flex items-center justify-center shadow-xl shadow-emerald-600/25 mb-6 relative group"
        >
          {/* 白色十字 */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute w-10 h-3 bg-white rounded-full" />
            <div className="absolute w-3 h-10 bg-white rounded-full" />
          </div>
        </motion.div>

        {/* 品牌名称「亲安」 */}
        <h1 className="text-3xl font-extrabold text-[#059669] tracking-[0.2em] mb-2">
          亲安
        </h1>

        {/* 副标题 */}
        <p className="text-gray-500 text-sm font-medium tracking-wider">
          家庭智能健康管理
        </p>
      </div>

      {/* 第二层级：操作区 */}
      <div className="w-full space-y-5 z-10">
        {/* 微信一键登录按钮 */}
        <button
          onClick={handleLoginClick}
          disabled={isLoading}
          className={`w-full h-12 rounded-full font-bold text-white bg-[#059669] hover:bg-[#047857] active:scale-98 transition-all flex items-center justify-center space-x-2.5 shadow-lg shadow-emerald-700/20 disabled:opacity-75 cursor-pointer ${
            elderMode ? 'h-14 text-lg' : 'text-base'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>登录中…</span>
            </div>
          ) : (
            <>
              {/* 微信图标 */}
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 2.01 1.06 3.81 2.72 5.02L3 17l3.75-1.12c.55.15 1.14.24 1.75.24.19 0 .37-.01.56-.03C8.69 15.39 8.5 14.71 8.5 14c0-3.87 3.58-7 8-7 .25 0 .5.01.74.04C16.27 4.12 12.72 2 8.5 2zM16.5 8c-3.59 0-6.5 2.46-6.5 5.5 0 1.71.92 3.23 2.37 4.25L12 21l3.21-.96c.42.11.85.18 1.29.18 3.59 0 6.5-2.46 6.5-5.5S20.09 8 16.5 8zM6 6.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3.5 6c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zm4 0c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75z" />
              </svg>
              <span>微信一键登录</span>
            </>
          )}
        </button>

        {/* 隐私协议勾选行 */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className={`w-4.5 h-4.5 rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
              agreed
                ? 'bg-[#059669] border-[#059669] text-white'
                : 'border-gray-300 bg-white hover:border-emerald-500'
            }`}
          >
            {agreed && <Check className="w-3 h-3 stroke-[3]" />}
          </button>
          <span>已阅读并同意</span>
          <button
            onClick={() => setShowTermsModal('user')}
            className="text-[#059669] underline underline-offset-2 hover:text-emerald-700 cursor-pointer"
          >
            《用户协议》
          </button>
          <span>和</span>
          <button
            onClick={() => setShowTermsModal('privacy')}
            className="text-[#059669] underline underline-offset-2 hover:text-emerald-700 cursor-pointer"
          >
            《隐私政策》
          </button>
        </div>

        {/* 第三层级：提示区 */}
        <p className="text-center text-xs text-gray-400">
          登录后自动获取微信头像与昵称
        </p>
      </div>

      {/* 隐私协议确认弹窗 (PRD 2.4) */}
      <AnimatePresence>
        {showPrivacySheet && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs"
            onClick={() => setShowPrivacySheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
              
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-lg pt-1">
                <ShieldAlert className="w-5 h-5 text-[#059669]" />
                <span>隐私协议确认</span>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">
                为了向您提供家庭成员管理、用药提醒排程与健康指标自测记录服务，亲安需要获取您的基础公开资料（昵称、头像），并在本地及云端加密存储您的家庭健康数据。
              </p>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleAgreeAndLogin}
                  className="w-full py-3.5 rounded-full font-bold text-white bg-[#059669] hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all active:scale-98 text-sm"
                >
                  同意并登录
                </button>
                <button
                  onClick={() => setShowPrivacySheet(false)}
                  className="w-full py-3 rounded-full font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all text-sm border border-gray-200"
                >
                  暂不使用
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 用户协议 / 隐私政策 内容展示弹窗 */}
      <AnimatePresence>
        {showTermsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowTermsModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md max-h-[80vh] bg-white rounded-3xl p-6 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 text-lg">
                  {showTermsModal === 'user' ? '亲安用户服务协议' : '亲安隐私保护政策'}
                </h3>
                <button
                  onClick={() => setShowTermsModal(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 text-xs text-gray-600 space-y-3 leading-relaxed pr-1 scrollbar-hide">
                <p><strong>1. 导言与服务范围</strong><br />欢迎使用亲安（KinCare）。亲安是一款专注于家庭健康监测、服药计划与体征自测的智能管理工具。本工具所展示的AI生成建议仅供健康生活参考，不构成医疗诊断或处方建议。</p>
                <p><strong>2. 账户与数据安全</strong><br />我们采用端到端加密与安全云存储技术保护您和家人的健康档案。所有健康指标、服药日志及病历图片仅供授权家庭成员查看与管理。</p>
                <p><strong>3. 用户权利与注销</strong><br />您可以随时在「我的」-「设置」中导出、修改或物理注销账户及全部关联数据。</p>
              </div>

              <button
                onClick={() => setShowTermsModal(null)}
                className="w-full mt-4 py-3 rounded-full font-bold text-white bg-[#059669] hover:bg-emerald-700 text-sm"
              >
                已了解并关闭
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
