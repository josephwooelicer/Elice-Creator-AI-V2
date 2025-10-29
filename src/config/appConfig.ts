import { PERFORMANCE, FEATURE_FLAGS } from './devops.config';

/**
 * =============================================================================
 * APPLICATION CONFIGURATION
 * =============================================================================
 * This file centralizes application-wide configurations for easy customization.
 * It combines DevOps-managed settings from `devops.config.ts` with UI-specific settings.
 *
 * Developers should use this `appConfig` object to access any configuration.
 * DevOps team should only modify `devops.config.ts`.
 */
export const appConfig = {
  /**
   * DevOps-managed cache durations. Modify in `devops.config.ts`.
   */
  CACHE_DURATIONS: PERFORMANCE.CACHE_DURATIONS,

  /**
   * Durations for simulated progress bars during API calls (in milliseconds).
   * This is a UI/UX setting and can be modified here.
   */
  SIMULATED_PROGRESS_DURATIONS: {
    discovery: 8000,
    generation: 6000,
    capstoneDiscovery: 8000,
    capstoneDetails: 12000,
  },

  /**
   * General UI settings that can be modified here.
   */
  UI_SETTINGS: {
    // Default duration for toast notifications to be displayed.
    toastDuration: 6000,
    // The number of trending topics to fetch and display.
    trendingTopicsCount: 6,
    // Whether collapsible sections should be open by default.
    defaultCollapsibleState: false,
  },
  
  /**
   * DevOps-managed feature flags. Modify in `devops.config.ts`.
   */
  FEATURE_FLAGS: FEATURE_FLAGS,
};
