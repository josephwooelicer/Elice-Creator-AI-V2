import { ai } from './client';
import { trendingTopicsSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
import { cleanAndParseJson } from './jsonUtils';

const TRENDING_TOPICS_CACHE_PREFIX = 'eliceCreatorAITrendingTopics_';

interface CachedTopics {
  topics: string[];
  timestamp: number;
}

export const fetchTrendingTopics = async (industry: string): Promise<string[]> => {
  //return ['Python Basics', 'Data Science Projects', 'Web Dev Fundamentals', 'Machine Learning'];
  const cacheKey = `${TRENDING_TOPICS_CACHE_PREFIX}${industry}`;
  
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { topics, timestamp }: CachedTopics = JSON.parse(cachedData);
      if (Date.now() - timestamp < appConfig.CACHE_DURATIONS.trendingTopics) {
        return topics;
      }
    }
  } catch (error) {
    console.error("Failed to load cached trending topics:", error);
    localStorage.removeItem(cacheKey);
  }

  try {
    const industryPrompt = industry === 'All'
      ? 'in any industry'
      : `in the ${industry} industry`;

    const prompt = `As an expert curriculum strategist, identify ${appConfig.UI_SETTINGS.trendingTopicsCount} trending, in-demand topics ${industryPrompt}. These topics should be specific and actionable, perfect for new courses. Focus on concrete technologies, frameworks, or advanced techniques. For example, instead of a broad topic like "React", suggest a specific one like "Advanced React Patterns". Each topic must be concise, with a maximum of 4 words. Good examples include: "LangChain for LLM Apps", "Serverless Architecture", "Fine-tuning LLMs".`;

    const response = await ai.models.generateContent({
      model: API_MODELS.FETCH_TRENDING_TOPICS,
      contents: [prompt],
      config: {
        responseMimeType: 'application/json',
        responseSchema: trendingTopicsSchema
      }
    });
    
    const parsedData = cleanAndParseJson<{ topics: string[] }>(response.text);
    const topics = parsedData.topics;

    try {
      const dataToCache: CachedTopics = { topics, timestamp: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    } catch (error) {
      console.error("Failed to cache trending topics:", error);
    }
    
    return topics;
    
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return ['Python Basics', 'Data Science Projects', 'Web Dev Fundamentals', 'Machine Learning'];
  }
};
