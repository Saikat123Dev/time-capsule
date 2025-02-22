const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

class AIService {
  static async analyzeContent(content) {
    const geminiAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(`Analyze this content: ${JSON.stringify(content)}`);
    return result.response.text();
  }

  static async enhanceStorytelling(analysis) {
    const geminiAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(`Enhance this story: ${analysis}`);
    return result.response.text();
  }

  static async compareThenNow(story) {
    const geminiAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = geminiAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(`Compare then vs now for: ${story}`);
    return result.response.text();
  }
}

module.exports = AIService;
