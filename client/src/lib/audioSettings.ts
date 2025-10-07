/**
 * Audio Settings Storage
 * Manages global audio settings for text-to-speech functionality
 */

export interface AudioSettings {
  autoPlay: boolean;
  volume: number; // 0.0 to 1.0
  rate: number; // 0.5 to 2.0
}

const STORAGE_KEY = "dynamic-flashcard-audio-settings";

const DEFAULT_SETTINGS: AudioSettings = {
  autoPlay: true,
  volume: 1.0,
  rate: 0.9,
};

export class AudioSettingsStorage {
  /**
   * Load audio settings from localStorage
   */
  static loadSettings(): AudioSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_SETTINGS;

      const parsed = JSON.parse(stored);
      // Validate and merge with defaults to ensure all keys exist
      return {
        autoPlay: parsed.autoPlay ?? DEFAULT_SETTINGS.autoPlay,
        volume: parsed.volume ?? DEFAULT_SETTINGS.volume,
        rate: parsed.rate ?? DEFAULT_SETTINGS.rate,
      };
    } catch (error) {
      console.error("Error loading audio settings from localStorage:", error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save audio settings to localStorage
   */
  static saveSettings(settings: AudioSettings): void {
    try {
      // Validate settings before saving
      const validatedSettings = {
        autoPlay: Boolean(settings.autoPlay),
        volume: Math.max(0, Math.min(1, settings.volume)),
        rate: Math.max(0.5, Math.min(2, settings.rate)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedSettings));
    } catch (error) {
      console.error("Error saving audio settings to localStorage:", error);
      throw new Error("Failed to save audio settings.");
    }
  }

  /**
   * Update specific audio setting
   */
  static updateSetting<K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ): AudioSettings {
    const settings = this.loadSettings();
    const updatedSettings = { ...settings, [key]: value };
    this.saveSettings(updatedSettings);
    return updatedSettings;
  }

  /**
   * Reset to default settings
   */
  static resetToDefaults(): AudioSettings {
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  /**
   * Clear settings from localStorage
   */
  static clearSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing audio settings:", error);
    }
  }
}

