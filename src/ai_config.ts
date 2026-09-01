/**
 * AI 配置文件 (ai_config.ts)
 * 支持一键切换国内免费大模型或谷歌 Gemini 模型。
 */
export const aiConfig = {
  // 当前激活的模型提供商: 'deepseek', 'qwen', 'gemini'
  // 优先使用国内免费模型，如果没有配置，可切换为 gemini
  activeProvider: 'gemini', // 默认使用 Gemini，因为在 AI Studio 中它总是可用的

  providers: {
    deepseek: {
      name: 'DeepSeek (国内免费/低价)',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: 'YOUR_DEEPSEEK_API_KEY', // 替换为实际的 DeepSeek API Key
      model: 'deepseek-chat'
    },
    qwen: {
      name: '通义千问 (国内)',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      apiKey: 'YOUR_DASHSCOPE_API_KEY', // 替换为实际的通义千问 API Key
      model: 'qwen-turbo'
    },
    gemini: {
      name: 'Google Gemini (免费/需网络)',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-preview:generateContent',
      apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBauqPhllD78toLTWNPOJbwY0ypxm9ZC0w', // 替换为实际的 Gemini API Key
      model: 'gemini-3.1-flash-preview'
    }
  },
  systemPrompt: '你是一个专业的AI健康管理助手。请基于提供的用户健康数据，给出专业的建议（包括饮食和运动）。注意：你的建议仅供参考，不能替代专业医生的诊断。请用简短、亲切的语言回复。',
  
  voiceConfig: {
    // 'mechanical' (browser synthesis) or 'ai' (Gemini/other API)
    engine: 'mechanical' as 'mechanical' | 'ai',
    
    // Only used if engine is 'ai'
    aiProvider: 'gemini' as 'gemini' | 'other',
    
    // Gemini specific settings
    gemini: {
      model: 'gemini-2.5-flash-preview-tts',
      // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
      voiceName: 'Kore' as 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr',
      apiKey: process.env.GEMINI_API_KEY || ''
    },
    
    // Mechanical specific settings
    mechanical: {
      lang: 'zh-CN',
      pitch: 1,
      rate: 1,
    }
  }
};

export default aiConfig;
