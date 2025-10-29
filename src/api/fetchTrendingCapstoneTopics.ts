import { ai } from './client';
import { trendingTopicsSchema } from './schema';
import { API_MODELS, appConfig } from '../config';
import { cleanAndParseJson } from './jsonUtils';

const TRENDING_CAPSTONE_CACHE_PREFIX = 'eliceCreatorAITrendingCapstone_';

interface CachedTopics {
  topics: string[];
  timestamp: number;
}

export const fetchTrendingCapstoneTopics = async (industry: string): Promise<string[]> => {
  // return ['RAG App with LangChain', 'Real-Time Stock Dashboard with Next.js', 'Customer Churn Prediction with Scikit-learn', 'CI/CD Pipeline with GitLab'];
  const cacheKey = `${TRENDING_CAPSTONE_CACHE_PREFIX}${industry}`;
  
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
      ? 'in any tech industry'
      : `in the ${industry} industry`;

    const prompt = `As an expert project strategist, identify ${appConfig.UI_SETTINGS.trendingTopicsCount} trending, in-demand capstone project topics ${industryPrompt}. These topics should be specific and represent real-world applications, including suggestions based on popular and emerging frameworks or libraries. Each topic must be concise, with a maximum of 5 words. Good examples include: "AI-Powered Code Assistant", "Real-Time Fraud Detection using Kafka", "Micro-Frontends with Module Federation", "Building a RAG App with LangChain".`;

    const response = await ai.models.generateContent({
      model: API_MODELS.FETCH_TRENDING_CAPSTONE_TOPICS,
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
    console.error("Error fetching trending capstone topics:", error);
    return ['RAG App with LangChain', 'Real-Time Stock Dashboard with Next.js', 'Customer Churn Prediction with Scikit-learn', 'CI/CD Pipeline with GitLab'];
  }
};
