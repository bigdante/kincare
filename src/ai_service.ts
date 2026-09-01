import { aiConfig } from './ai_config';
import { AIDailyCare, AIConfig, HealthProfile, Medication, MedicalRecord } from './types';

// 云对象内置 Mock Generator (PRD 7.3 & 10.3)
export const mockGenerator = {
  dailyCare(member: Partial<HealthProfile>, date?: string): AIDailyCare {
    const age = member.age || 65;
    const statusPool: ('good' | 'normal' | 'poor')[] = age > 60 
      ? ['good', 'normal', 'normal', 'poor'] 
      : ['good', 'good', 'normal', 'poor'];
    const status = statusPool[Math.floor(Math.random() * statusPool.length)];
    
    const summaries = {
      good: [
        '今日各项指标平稳，血压控制良好，建议保持当前用药节奏，适当散步。',
        '身体状况不错，睡眠质量尚可，建议继续保持规律作息与清淡饮食。',
        '今日状态良好，早晨运动后心率平稳，记得按时服药即可。'
      ],
      normal: [
        '今日血糖略有波动，建议减少晚餐主食摄入，监测睡前血糖。',
        '血压处于正常偏高水平，建议避免情绪激动，保持充足饮水。',
        '今日活动量偏少，建议晚饭后在室内或小区散步20分钟。'
      ],
      poor: [
        '今日心率偏快，建议避免剧烈活动，如有胸闷气短请及时就医。',
        '血压波动较大，请确认是否已按时服药，建议今日多测量一次。',
        '今日精神状态一般，建议保证充足睡眠，注意保暖防风。'
      ]
    };
    
    return {
      status,
      summary: summaries[status][Math.floor(Math.random() * summaries[status].length)],
      dietAdvice: age > 60 
        ? '建议低盐低脂饮食，每日蛋白质摄入不少于60g，多吃深绿色蔬菜。'
        : '建议均衡饮食，控制精制糖和高脂食物摄入，每日饮水1500ml以上。',
      exerciseAdvice: '建议每日散步30分钟或进行轻度伸展操，避免正午高温外出。',
      medicationAdvice: '请严格按照医嘱规律用药，不可自行增减剂量，漏服后请勿补服双倍。',
      newsChips: [
        { title: '高血压患者秋冬防护指南', url: '#' },
        { title: '老年人安全用药十大常识', url: '#' },
        { title: '如何通过饮食平稳血糖', url: '#' }
      ],
      isMock: true,
      mockReason: 'AI服务未配置或调用失败，已启用亲安健康知识库模拟数据'
    };
  },

  analyzeText(text: string) {
    const keywords = [
      { keys: ['头晕', '晕', '眩晕'], analysis: '监测到提及"头晕"现象。头晕常与血压波动、体位改变或疲劳有关。建议：1. 立即静坐测量血压；2. 避免突然起立站立；3. 记录发生时间和持续时长，如持续不缓解请及时就医。', source: '国家心血管病中心《头晕与血压波动健康管理建议》' },
      { keys: ['血糖', '糖', '胰岛素', '多饮'], analysis: '血糖管理需保持长期规律性。建议：1. 规律用药/注射，避免漏服；2. 饭后适当走动；3. 定期监测空腹及餐后2小时血糖并记录。', source: '中华医学会糖尿病学分会《中国2型糖尿病日常管理指南》' },
      { keys: ['胸闷', '胸痛', '心慌', '心悸'], analysis: '胸闷心慌需引起重视。建议立即停止一切活动并就地静坐休息，如备有硝酸甘油且有医嘱可遵医嘱含服，如持续超过15分钟未缓解请立即拨打120。', source: '国家卫生健康委《心血管急症日常识别与防护》' },
      { keys: ['失眠', '睡不着', '早醒', '多梦'], analysis: '睡眠质量影响身体机能修复。建议：1. 睡前1小时避免使用手机或饮用浓茶咖啡；2. 保持室内温湿度适宜；3. 白天适当增加日光照射与散步。', source: '中国睡眠研究会《健康睡眠指南》' }
    ];
    
    const match = keywords.find(k => k.keys.some(key => text.includes(key)));
    if (match) {
      return { analysis: match.analysis, source: match.source, isMock: true };
    }
    
    return {
      analysis: '健康记录已同步记录。近阶段各项生活记录良好，建议保持规律作息、合理膳食、适度运动，并定期进行健康指标自测。如有不适症状请及时就医。',
      source: '国家基本公共卫生服务《健康生活方式建议》',
      isMock: true
    };
  },

  suggestTags(medicalRecords: MedicalRecord[], medications: Medication[]) {
    const tags: { id: string; label: string; type: 'danger' | 'warning' | 'info' | 'normal' }[] = [];
    const medNames = medications.map(m => m.name).join('');
    const medHistory = medicalRecords.map(h => (h.diagnosis || '') + (h.chiefComplaint || '') + (h.title || '')).join('');
    
    if (medNames.includes('降压') || medNames.includes('硝苯地平') || medHistory.includes('高血压')) {
      tags.push({ id: `st_${Date.now()}_1`, label: '高血压管理', type: 'danger' });
    }
    if (medNames.includes('二甲双胍') || medNames.includes('降糖') || medHistory.includes('糖尿病')) {
      tags.push({ id: `st_${Date.now()}_2`, label: '糖尿病关注', type: 'danger' });
    }
    if (medNames.includes('阿司匹林') || medNames.includes('他汀') || medHistory.includes('血脂')) {
      tags.push({ id: `st_${Date.now()}_3`, label: '心脑血管养护', type: 'warning' });
    }
    if (medHistory.includes('过敏')) {
      tags.push({ id: `st_${Date.now()}_4`, label: '过敏体质', type: 'danger' });
    }
    if (medHistory.includes('骨质疏松') || medHistory.includes('钙')) {
      tags.push({ id: `st_${Date.now()}_5`, label: '骨骼养护与补钙', type: 'warning' });
    }
    
    if (tags.length === 0) {
      tags.push({ id: `st_${Date.now()}_6`, label: '日常规律作息', type: 'info' });
      tags.push({ id: `st_${Date.now()}_7`, label: '定期体检关注', type: 'normal' });
    }
    return tags;
  },

  ocrResult() {
    return {
      medicines: [
        {
          name: '硝苯地平控释片',
          specification: '30mg*7片',
          dosage: '1片',
          dosageValue: 1,
          dosageUnit: '片',
          frequency: 1,
          frequencyType: 'once_daily',
          mealTiming: 'after_meal',
          mealTimingLabel: '饭后 15–30 分钟',
          precautions: ['忌酒', '不可嚼碎（缓释/肠溶）', '多喝水（≥200ml）'],
          confidence: 0.95
        },
        {
          name: '阿莫西林胶囊',
          specification: '0.5g*24粒',
          dosage: '1粒',
          dosageValue: 1,
          dosageUnit: '粒',
          frequency: 3,
          frequencyType: 'thrice_daily',
          mealTiming: 'after_meal',
          mealTimingLabel: '饭后 15–30 分钟',
          precautions: ['忌酒'],
          confidence: 0.91
        }
      ],
      hospital: '北京市朝阳区三甲医院',
      date: new Date().toISOString().split('T')[0],
      isMock: true
    };
  }
};

export const callAI = async (prompt: string, jsonMode: boolean = false, images: string[] = []): Promise<string> => {
  const provider = aiConfig.providers[aiConfig.activeProvider as keyof typeof aiConfig.providers];
  
  try {
    if (!provider || !provider.apiKey || provider.apiKey.includes('YOUR_')) {
      return '';
    }

    if (aiConfig.activeProvider === 'gemini') {
      const parts: any[] = [{ text: prompt }];
      
      if (images.length > 0) {
        images.forEach(img => {
          if (img.includes(',')) {
            parts.push({
              inlineData: { data: img.split(',')[1], mimeType: img.split(';')[0].split(':')[1] }
            });
          }
        });
      }

      const response = await fetch(`${provider.baseUrl}?key=${provider.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: aiConfig.systemPrompt }] },
          contents: [{ parts }],
          generationConfig: jsonMode ? { responseMimeType: 'application/json' } : undefined
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      const content: any[] = [{ type: 'text', text: prompt }];
      
      if (images.length > 0) {
        images.forEach(img => {
          content.push({
            type: 'image_url',
            image_url: { url: img }
          });
        });
      }

      const response = await fetch(provider.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: aiConfig.systemPrompt },
            { role: 'user', content }
          ],
          response_format: jsonMode ? { type: "json_object" } : undefined
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.warn('AI call error, will fallback to mock generator:', error);
    return '';
  }
};

export const testAIConnection = async (config: Partial<AIConfig>): Promise<{ success: boolean; message: string }> => {
  if (!config.apiKey) {
    return { success: false, message: '请先填写 API Key' };
  }
  
  try {
    // 模拟测试请求
    if (config.provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-2.5-flash'}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: '你好，测试连通性，请回复"连接成功"' }] }]
        })
      });
      if (res.ok) {
        return { success: true, message: '连接正常' };
      }
      return { success: false, message: `连接失败 (${res.status})` };
    } else {
      const baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'deepseek-chat',
          messages: [{ role: 'user', content: '测试' }]
        })
      });
      if (res.ok) {
        return { success: true, message: '连接正常' };
      }
      return { success: false, message: `连接失败: HTTP ${res.status}` };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || '网络请求失败，请检查 Base URL 和 API Key' };
  }
};
