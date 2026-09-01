import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Heart, 
  Volume2, 
  Play, 
  Pause, 
  Sparkles, 
  FileText, 
  Pill, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  X, 
  Link, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Trash2,
  Edit3,
  AlertCircle,
  Square,
  RefreshCw,
  User
} from 'lucide-react';
import { useHealthStore } from '../store';
import { MemberSwitcherRail } from '../components/MemberSwitcherRail';
import { TimelinePost } from '../types';

const STATUS_TAG_OPTIONS = [
  { label: '身体状态良好', level: 'good', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: '指标平稳正常', level: 'good', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: '轻微不适', level: 'warning', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { label: '就医就诊中', level: 'info', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: '病后康复中', level: 'info', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: '用药打卡完毕', level: 'good', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
];

export const TimelineTab: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { 
    profiles,
    activeProfile, 
    activeProfileId, 
    timelinePosts, 
    addTimelinePost, 
    updateTimelinePost,
    deleteTimelinePost, 
    toggleTimelineLike, 
    currentUser, 
    elderMode,
    showConfirmModal,
    showToast
  } = useHealthStore();

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editingPost, setEditingPost] = useState<TimelinePost | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State (for Add & Edit)
  const [targetMemberId, setTargetMemberId] = useState<string>(activeProfileId === 'all' ? (profiles[0]?.id || 'p_father') : activeProfileId);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postStatus, setPostStatus] = useState('身体状态良好');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postVideo, setPostVideo] = useState('');
  const [postAudio, setPostAudio] = useState('');
  const [audioDuration, setAudioDuration] = useState(5);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // AI Analysis State
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    text: string;
    source: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (activeProfileId !== 'all') {
      setTargetMemberId(activeProfileId);
    }
  }, [activeProfileId]);

  // Displayed posts: all chronological or filtered by member
  const displayedPosts = activeProfileId === 'all'
    ? [...timelinePosts].sort((a, b) => {
        const timeA = new Date(a.date || a.id).getTime();
        const timeB = new Date(b.date || b.id).getTime();
        return timeB - timeA || b.id.localeCompare(a.id);
      })
    : timelinePosts.filter(p => p.memberId === activeProfileId);

  const toggleExpand = (postId: string) => {
    setExpandedCards(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAudioPlay = (postId: string) => {
    if (playingAudioId === postId) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(postId);
      setTimeout(() => {
        setPlayingAudioId(null);
      }, 5000);
    }
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(audioUrl);
          setPostAudio(audioUrl);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start(200);
      }
    } catch (err) {
      console.warn('Microphone permission or API not available, using simulated recording', err);
      // Fallback to simulated recording
      setRecordedAudioUrl('https://sample-audio.mp3');
      setPostAudio('https://sample-audio.mp3');
    }

    setIsRecording(true);
    setRecordingSeconds(0);
    clearInterval(recordTimerRef.current);
    recordTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (!isRecording) return;
    clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setAudioDuration(Math.max(1, recordingSeconds));

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (!recordedAudioUrl) {
      setRecordedAudioUrl('https://sample-audio.mp3');
      setPostAudio('https://sample-audio.mp3');
    }
    showToast(`录音完成 (${Math.max(1, recordingSeconds)}秒)`);
  };

  const handleAddSampleImage = () => {
    if (postImages.length >= 9) {
      showToast('最多上传9张图片');
      return;
    }
    const sampleImgs = [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80'
    ];
    const picked = sampleImgs[postImages.length % sampleImgs.length];
    setPostImages([...postImages, picked]);
  };

  const handleOpenAddModal = () => {
    setEditingPost(null);
    setTargetMemberId(activeProfileId === 'all' ? (profiles[0]?.id || 'p_father') : activeProfileId);
    setPostTitle('');
    setPostContent('');
    setPostStatus('身体状态良好');
    setPostImages([]);
    setPostVideo('');
    setPostAudio('');
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setShowPublishModal(true);
  };

  const handleOpenEditModal = (post: TimelinePost) => {
    setEditingPost(post);
    setTargetMemberId(post.memberId);
    setPostTitle(post.title || '');
    setPostContent(post.content || '');
    setPostStatus(post.status || '身体状态良好');
    setPostImages(post.images || []);
    setPostVideo(post.videoUrl || '');
    setPostAudio(post.audioUrl || '');
    setAudioDuration(post.audioDuration || 5);
    setRecordedAudioUrl(post.audioUrl || null);
    setShowPublishModal(true);
  };

  const handleSavePost = async () => {
    if (!postContent.trim() && postImages.length === 0 && !postAudio && !postVideo) {
      showToast('请填写内容或上传多媒体');
      return;
    }

    const title = postTitle.trim() || '日常健康动态';
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (editingPost) {
      // Update existing post
      await updateTimelinePost(editingPost.id, {
        memberId: targetMemberId,
        title,
        content: postContent,
        status: postStatus,
        images: postImages,
        videoUrl: postVideo,
        audioUrl: postAudio,
        audioDuration: audioDuration || 5
      });
    } else {
      // Add new post
      await addTimelinePost({
        memberId: targetMemberId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        date: dateStr,
        title,
        content: postContent,
        status: postStatus,
        images: postImages,
        videoUrl: postVideo,
        audioUrl: postAudio,
        audioDuration: audioDuration || 5
      });
    }

    setShowPublishModal(false);
  };

  const handleAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      const name = activeProfileId === 'all' ? '全家' : (activeProfile?.name || '当前成员');
      setAiAnalysisResult({
        text: `根据「${name}」近期各项生活记录与血压监测情况，整体生活方式健康规律。晨起散步习惯有助于心肺功能与情绪稳定，饮食粗细搭配合理。请继续保持按时服药与规律记录。`,
        source: '国家卫生健康委《中国家庭健康管理指南》'
      });
      showToast('已完成健康摘要分析');
    }, 800);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F9FAFB] pb-28 scrollbar-hide select-none relative">
      {/* 顶部自定义导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-900">健康时间轴</h1>
        <span className="text-xs text-gray-500 font-medium">
          记录点滴·关爱陪伴
        </span>
      </div>

      {/* 全局成员切换轨 (支持最左侧「全部」查看所有人) */}
      <MemberSwitcherRail />

      <div className="px-3.5 py-4 space-y-4">
        {/* 时间轴主体 */}
        <div className="relative pl-6 space-y-5 before:absolute before:top-3 before:bottom-3 before:left-2.5 before:w-0.5 before:bg-teal-300/40">
          {displayedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-xs ml-2">
              <Sparkles className="w-10 h-10 text-teal-400 mx-auto mb-2" />
              <p className="text-gray-500 font-bold text-sm">暂无健康时间轴动态</p>
              <p className="text-xs text-gray-400 mt-1">
                点击右下角「＋」记录生活状态、复查或就医动态
              </p>
            </div>
          ) : (
            displayedPosts.map((post) => {
              const isExpanded = !!expandedCards[post.id];
              const hasLiked = post.likes.includes(currentUser.id);
              const postMember = profiles.find(p => p.id === post.memberId);

              return (
                <div key={post.id} className="relative group">
                  {/* 轴线圆点 */}
                  <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-[#0D9488] ring-4 ring-teal-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* 气泡卡片 */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-gray-100 space-y-2.5">
                    {/* 头部：时间、所属成员标签、状态标签与操作 */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {/* 所属成员标牌 */}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-[#0D9488] border border-teal-100 flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{postMember?.name || '家庭成员'}</span>
                        </span>

                        {/* 身体状态标签 */}
                        {post.status && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {post.status}
                          </span>
                        )}

                        <span>{post.date}</span>
                      </div>

                      {/* 编辑与删除按钮 */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(post)}
                          className="text-gray-400 hover:text-[#0D9488] p-1 transition-colors cursor-pointer"
                          title="编辑此动态与状态"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            showConfirmModal({
                              title: '确认删除此条动态？',
                              content: '删除后该条记录及其多媒体文件将被移除，且无法恢复。',
                              confirmText: '确认删除',
                              confirmColor: 'bg-[#EF4444]',
                              onConfirm: async () => {
                                await deleteTimelinePost(post.id);
                              }
                            });
                          }}
                          className="text-gray-300 hover:text-red-500 p-1 transition-colors cursor-pointer"
                          title="删除此动态"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 标题 */}
                    <h3 className={`font-bold text-gray-900 ${elderMode ? 'text-lg' : 'text-sm'}`}>
                      {post.title}
                    </h3>

                    {/* 正文 */}
                    <p className={`text-gray-700 leading-relaxed ${elderMode ? 'text-base' : 'text-xs'}`}>
                      {post.content}
                    </p>

                    {/* 九宫格图片 */}
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {post.images.map((imgUrl, i) => (
                          <div
                            key={i}
                            onClick={() => setPreviewImage(imgUrl)}
                            className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer border border-gray-100"
                          >
                            <img
                              src={imgUrl}
                              alt="动态图片"
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 语音条 */}
                    {post.audioUrl && (
                      <div
                        onClick={() => handleAudioPlay(post.id)}
                        className="bg-teal-50 border border-teal-200/60 rounded-xl p-2.5 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                      >
                        <div className="flex items-center space-x-2 text-[#0D9488]">
                          {playingAudioId === post.id ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                          <span className="text-xs font-bold">语音留言 / 记录</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-1 h-3 bg-teal-500 rounded-full ${playingAudioId === post.id ? 'animate-soundwave-1' : ''}`} />
                          <div className={`w-1 h-4 bg-teal-500 rounded-full ${playingAudioId === post.id ? 'animate-soundwave-2' : ''}`} />
                          <div className={`w-1 h-2 bg-teal-500 rounded-full ${playingAudioId === post.id ? 'animate-soundwave-3' : ''}`} />
                          <span className="text-[11px] text-gray-500 ml-1.5">{post.audioDuration || 4}"</span>
                        </div>
                      </div>
                    )}

                    {/* AI 综合分析折叠栏 */}
                    {post.aiAnalysis && (
                      <div className="pt-2 border-t border-gray-50">
                        <button
                          onClick={() => toggleExpand(post.id)}
                          className="flex items-center space-x-1.5 text-xs text-[#0D9488] font-bold w-full text-left"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI 动态健康分析</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 ml-auto text-gray-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 ml-auto text-gray-400" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 text-xs text-gray-600 bg-teal-50/50 rounded-xl p-3 border border-teal-100/50 space-y-1.5 leading-relaxed"
                            >
                              <p>{post.aiAnalysis}</p>
                              {post.referenceSource && (
                                <div className="text-[10px] text-gray-400 border-t border-teal-100 pt-1">
                                  参考来源：{post.referenceSource}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* 底部互动栏 */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
                      <span>记录人：{post.authorName}</span>
                      <button
                        onClick={() => toggleTimelineLike(post.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded-full transition-all ${
                          hasLiked
                            ? 'bg-rose-50 text-rose-500 font-bold'
                            : 'hover:bg-gray-50 text-gray-400'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes.length || '点赞'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI 综合评估按钮 */}
        <div className="pt-2">
          <button
            onClick={handleAiAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 rounded-2xl bg-white border border-teal-200 text-[#0D9488] font-bold text-xs flex items-center justify-center space-x-2 shadow-xs hover:bg-teal-50 transition-all cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'AI 正在综合评估中…' : '生成时间轴 AI 健康摘要报告'}</span>
          </button>
        </div>

        {/* AI 评估结果卡片 */}
        {aiAnalysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border border-teal-200 shadow-sm space-y-2 relative"
          >
            <button
              onClick={() => setAiAnalysisResult(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 text-[#0D9488] font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>智能健康摘要</span>
              <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded font-normal">
                去诊断化评估
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {aiAnalysisResult.text}
            </p>
            <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
              免责声明：本内容由 AI 基于日常健康记录生成，仅供参考，不构成医疗建议。如有不适请及时就医。
            </div>
          </motion.div>
        )}
      </div>

      {/* 右下角 FAB 浮动发布按钮 (固定于页面右下角安全区域内，不会飞出屏幕) */}
      <div className="fixed bottom-22 right-4 sm:right-[max(1rem,calc(50%-220px))] z-30 pointer-events-none">
        <button
          onClick={handleOpenAddModal}
          className="pointer-events-auto w-14 h-14 rounded-full bg-[#0D9488] hover:bg-teal-700 text-white flex items-center justify-center shadow-2xl shadow-teal-800/40 active:scale-90 transition-all cursor-pointer"
          title="发布健康动态"
        >
          <Plus className="w-7 h-7 stroke-[2.8]" />
        </button>
      </div>

      {/* 发布与编辑多媒体动态弹窗 */}
      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md max-h-[90vh] bg-white rounded-3xl p-5 shadow-2xl flex flex-col overflow-hidden text-xs"
            >
              {/* 顶部栏 */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  取消
                </button>
                <h3 className="font-bold text-gray-900 text-sm">
                  {editingPost ? '编辑动态与身体状态' : '记录健康生活动态'}
                </h3>
                <button
                  onClick={handleSavePost}
                  className="bg-[#0D9488] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-teal-700 shadow-xs cursor-pointer"
                >
                  {editingPost ? '保存' : '发布'}
                </button>
              </div>

              <div className="overflow-y-auto flex-1 py-3 space-y-3.5 scrollbar-hide">
                {/* 成员选择 (如果是全部视图下录入) */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">为哪位家庭成员记录？</label>
                  <select
                    value={targetMemberId}
                    onChange={(e) => setTargetMemberId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.relation === 'self' ? '本人' : p.relation === 'parent' ? '长辈' : '家人'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 身体状态标签选择 */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">身体状态 / 事件标签 (可点击切换)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_TAG_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setPostStatus(opt.label)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          postStatus === opt.label
                            ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 标题输入 */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">标题</label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="标题 (如：晨练记录、复查正常、散步打卡)"
                    className="w-full text-xs font-bold text-gray-900 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500 bg-gray-50"
                  />
                </div>

                {/* 正文输入 */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">正文详细记录</label>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="写下今天的健康动态、饮食生活、服药反应或身体状况…"
                    rows={4}
                    className="w-full text-xs text-gray-700 resize-none focus:outline-none placeholder-gray-400 leading-relaxed border border-gray-200 rounded-xl p-3 bg-gray-50"
                  />
                </div>

                {/* 多媒体混排预览区 */}
                {postImages.length > 0 && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">已添加的照片 ({postImages.length}/9)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {postImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group border border-gray-200">
                          <img src={img} alt="上传预览" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPostImages(postImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 语音条预览与播放 */}
                {postAudio && (
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-[#0D9488] font-bold">
                      <Volume2 className="w-4 h-4" />
                      <span>已录制语音 ({audioDuration}秒)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlayingRecorded) {
                            audioPlayerRef.current?.pause();
                            setIsPlayingRecorded(false);
                          } else {
                            if (!audioPlayerRef.current) {
                              audioPlayerRef.current = new Audio(postAudio);
                              audioPlayerRef.current.onended = () => setIsPlayingRecorded(false);
                            }
                            audioPlayerRef.current.play().catch(() => {});
                            setIsPlayingRecorded(true);
                          }
                        }}
                        className="px-2.5 py-1 bg-white text-[#0D9488] rounded-lg font-bold border border-teal-200 flex items-center space-x-1"
                      >
                        {isPlayingRecorded ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPlayingRecorded ? '暂停' : '试听'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPostAudio('');
                          setRecordedAudioUrl(null);
                        }}
                        className="text-red-500 font-bold px-2 py-1"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}

                {/* 媒体快捷工具栏 */}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddSampleImage}
                    className="flex items-center space-x-1 text-xs text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 font-bold"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>添加照片</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      showToast('已绑定复查/活动短视频');
                      setPostVideo('https://sample-video.mp4');
                    }}
                    className="flex items-center space-x-1 text-xs text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl hover:bg-gray-200 font-bold"
                  >
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span>添加视频</span>
                  </button>
                </div>

                {/* 录音功能区 (完善支持点击开始/停止录音、倒计时与波形) */}
                <div className="pt-2 bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">语音留言 / 口述健康记录</span>
                    <span className="text-[11px] font-mono font-bold text-teal-700">
                      {isRecording ? `录制中 ${recordingSeconds}s / 60s` : '支持随时重录'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center space-x-2 shadow-md animate-pulse cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>停止并完成录音 ({recordingSeconds}s)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex-1 py-3 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>{postAudio ? '重新录音' : '点击开始录音'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">
                    支持老年人或家属口述生活状况与身体感觉，录音自动保存在动态中
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 图片全屏大图预览 */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              alt="大图预览"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
