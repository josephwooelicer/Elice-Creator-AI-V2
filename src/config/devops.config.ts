/**
 * =============================================================================
 * DEVOPS CONFIGURATION
 * =============================================================================
 * This file is the single source of truth for all configurations that the
 * DevOps team or administrators are likely to modify. It centralizes settings
 * for different environments, feature toggles, and performance tuning.
 *
 * PLEASE MAKE ANY ENVIRONMENT-SPECIFIC CHANGES HERE.
 */

// =============================================================================
// AI Model Selection
// =============================================================================
/**
 * Centralizes all AI model selections for different API calls.
 * To use a new model for a feature, simply change the string value here.
 */
export const API_MODELS = {
  // --- Discovery Feature ---
  /**
   * Model for fetching trending topics for courses.
   * A lightweight model is sufficient.
   */
  FETCH_TRENDING_TOPICS: 'gemini-flash-lite-latest',
  /**
   * Model for generating multiple curriculum outlines.
   * A balance of speed and quality is needed.
   */
  GENERATE_CURRICULUM: 'gemini-flash-lite-latest',

  // --- Generation Feature (User-selectable models) ---
  /**
   * High-quality model for generating detailed lesson plans.
   * Exposed as an option to the user in the UI.
   */
  GENERATION_PRO: 'gemini-2.5-pro',
  /**
   * Balanced model for generating lesson plans.
   * Exposed as an option to the user in the UI.
   */
  GENERATION_FLASH: 'gemini-flash-latest',
  /**
   * Fast, lightweight model for generating lesson plans.
   * Exposed as an option to the user in the UI.
   */
  GENERATION_FLASH_LITE: 'gemini-flash-lite-latest',
  
  // --- Capstone Assets Generation Feature ---
  /**
   * Model for fetching trending topics for capstone projects.
   * A lightweight model is sufficient.
   */
  FETCH_TRENDING_CAPSTONE_TOPICS: 'gemini-flash-lite-latest',
  /**
   * Model for generating multiple capstone project ideas.
   * A balance of speed and quality is needed.
   */
  GENERATE_CAPSTONE_PROJECTS: 'gemini-flash-lite-latest',
  /**
   * Model for generating detailed project specifications, including boilerplate code.
   * Requires a more powerful model for high-quality, complex output.
   */
  GENERATE_DETAILED_PROJECT: 'gemini-flash-lite-latest',
};

// =============================================================================
// Feature Flags
// =============================================================================
/**
 * Feature flags to enable or disable parts of the application.
 * Set a feature to `false` to disable it.
 */
export const FEATURE_FLAGS = {
  // Show or hide the file upload sections in Discovery and Capstone Assets.
  enableFileUpload: true,
  // Show or hide the "AI Agent Thoughts" in the RAG panel.
  showAgentThoughts: true,
};

// =============================================================================
// Performance & Caching
// =============================================================================
/**
 * Configuration for application performance and caching.
 */
export const PERFORMANCE = {
  /**
   * Cache durations for API calls in milliseconds.
   * Example: 24 * 60 * 60 * 1000 is one day.
   */
  CACHE_DURATIONS: {
    trendingTopics: 24 * 60 * 60 * 1000, // 1 day
  },
};
