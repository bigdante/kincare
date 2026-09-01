import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Check, 
  Clock, 
  AlertCircle, 
  Pill, 
  ShieldAlert, 
  ChevronRight, 
  RotateCw,
  Sparkles,
  X
} from 'lucide-react';
import { Medication, HealthProfile } from '../types';
import { useHealthStore } from '../store';

interface MedicationAlarmModalProps {
  isOpen: boolean;
  medication: Medication | null;
  doseIndex: number;
  scheduledTime: string;
  profile: HealthProfile | null;
  onTake: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export const MedicationAlarmModal: React.FC<MedicationAlarmModalProps> = ({
  isOpen,
  medication,
  doseIndex,
  scheduledTime,
  profile,
  onTake,
  onSnooze,
  onDismiss
}) => {
  const { speak, stopSpeech, elderMode } = useHealthStore();
  const [isMuted, setIsMuted] = useState(false);
  const [showPrecautions, setShowPrecautions] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundIntervalRef = useRef<any>(null);

  const stopAllAudioAndVoice = () => {
    stopSpeech();
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const handleTake = () => {
    stopAllAudioAndVoice();
    onTake();
  };

  const handleSnooze = (mins: number) => {
    stopAllAudioAndVoice();
    onSnooze(mins);
  };

  const handleDismiss = () => {
    stopAllAudioAndVoice();
    onDismiss();
  };

  // Play synthetic pleasant alarm sound using Web Audio API
  const playAlarmBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pleasant dual-tone chime (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);

      // Trigger phone vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 150, 300]);
      }
    } catch (e) {
      console.warn('Audio alarm could not play:', e);
    }
  };

  useEffect(() => {
    if (isOpen && medication) {
      // Start loop alarm sound
      playAlarmBeep();
      soundIntervalRef.current = setInterval(() => {
        if (!isMuted) {
          playAlarmBeep();
        }
      }, 2500);

      // Voice broadcast
      const memberName = profile?.name || '长辈';
      const promptText = `家庭健康用药提醒：${memberName}，现在是设定服药时间 ${scheduledTime}。请服用 ${medication.name}，每次 ${medication.dosage || '1片'}，${medication.deliveryMethod || '温水送服'}。`;
      
      const voiceTimer = setTimeout(() => {
        speak(promptText);
      }, 1000);

      return () => {
        if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
        clearTimeout(voiceTimer);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
      };
    }
  }, [isOpen, medication, isMuted]);

  if (!isOpen || !medication) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden border border-teal-100"
      >
        {/* 顶部闹钟动态光环 */}
        <div className="flex flex-col items-center justify-center text-center space-y-3 pt-2">
          <div className="relative">
            {/* 脉冲光环 */}
            <motion.div
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="absolute -inset-3 rounded-full bg-teal-400/30 blur-md pointer-events-none"
            />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white flex items-center justify-center shadow-lg shadow-teal-500/30 relative z-10 animate-bounce">
              <Bell className="w-8 h-8" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-red-50 text-red-600 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>服药时间到达 · {scheduledTime}</span>
            </div>
            <h2 className={`font-black text-gray-900 mt-2 ${elderMode ? 'text-2xl' : 'text-xl'}`}>
              该吃药了 · {profile?.name || '家庭成员'}
            </h2>
          </div>
        </div>

        {/* 药品详细信息卡片 */}
        <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-teal-100 p-1 shrink-0 overflow-hidden shadow-xs">
              <img
                src={medication.imageUrl || medication.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80'}
                alt={medication.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <h4 className={`font-extrabold text-gray-900 leading-tight ${elderMode ? 'text-lg' : 'text-base'}`}>
                {medication.name}
              </h4>
              <p className="text-xs text-teal-800 font-bold">
                单次用量：{medication.dosage || '1片'} · {medication.deliveryMethod || '温水送服'}
              </p>
              {medication.mealTimingLabel && (
                <span className="inline-block px-2 py-0.5 bg-white/80 rounded-md text-[11px] font-medium text-teal-700">
                  {medication.mealTimingLabel}
                </span>
              )}
            </div>
          </div>

          {/* 用药禁忌及注意事项提示 */}
          {medication.precautions && medication.precautions.length > 0 && (
            <div className="pt-2 border-t border-teal-100/80 text-xs">
              <button
                onClick={() => setShowPrecautions(!showPrecautions)}
                className="flex items-center justify-between w-full text-teal-800 font-bold hover:underline"
              >
                <span className="flex items-center space-x-1 text-amber-700">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>用药安全注意事项 ({medication.precautions.length}项)</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPrecautions ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showPrecautions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-2 flex flex-wrap gap-1.5"
                  >
                    {medication.precautions.map((p, idx) => (
                      <span key={idx} className="bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                        ⚠️ {p}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 响铃静音控制 */}
        <div className="flex items-center justify-between px-2 text-xs text-gray-500 font-medium">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center space-x-1.5 text-gray-600 hover:text-gray-900"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />}
            <span>{isMuted ? '闹铃已静音' : '闹铃响铃中 (点击静音)'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
          >
            稍后自服
          </button>
        </div>

        {/* 操作按钮组 (大按钮易点击) */}
        <div className="space-y-2.5 pt-1">
          {/* 一键打卡服药 */}
          <button
            onClick={handleTake}
            className="w-full py-4 rounded-2xl font-black bg-[#0D9488] text-white flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/25 hover:bg-[#0f766e] active:scale-98 transition-all text-base cursor-pointer"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>我已服药 · 立即打卡</span>
          </button>

          {/* 稍后提醒 (贪睡) */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleSnooze(5)}
              className="flex-1 py-3 rounded-xl font-bold bg-amber-50 text-amber-800 border border-amber-200 text-xs flex items-center justify-center space-x-1 hover:bg-amber-100 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>5分钟后再提醒</span>
            </button>
            <button
              onClick={() => handleSnooze(15)}
              className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 cursor-pointer"
            >
              <span>15分钟后提醒</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
