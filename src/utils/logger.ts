/**
 * Centralized logging utility that respects user state and debug settings
 */

interface LoggerConfig {
  isEnabled: boolean;
  isDevelopment: boolean;
  userHasSponsor: boolean;
  suppressInitLogs: boolean;
}

class Logger {
  private config: LoggerConfig = {
    isEnabled: true,
    isDevelopment: process.env.NODE_ENV === 'development',
    userHasSponsor: false,
    suppressInitLogs: false
  };

  /**
   * Update logger configuration based on application state
   */
  updateConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log initialization messages (only when user has passed sponsor gate)
   */
  init(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    if (this.config.suppressInitLogs && !this.config.userHasSponsor) return;
    
    console.log(`🚀 ${message}`, ...args);
  }

  /**
   * Log success messages
   */
  success(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    if (this.config.suppressInitLogs && !this.config.userHasSponsor) return;
    
    console.log(`✅ ${message}`, ...args);
  }

  /**
   * Log update/sync messages (only when user has access)
   */
  update(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    if (this.config.suppressInitLogs && !this.config.userHasSponsor) return;
    
    console.log(`🔄 ${message}`, ...args);
  }

  /**
   * Log data/balance messages (only when user has access)
   */
  data(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    if (this.config.suppressInitLogs && !this.config.userHasSponsor) return;
    
    console.log(`💰 ${message}`, ...args);
  }

  /**
   * Log activity messages (only when user has access)
   */
  activity(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    if (this.config.suppressInitLogs && !this.config.userHasSponsor) return;
    
    console.log(`📋 ${message}`, ...args);
  }

  /**
   * Log cleanup messages (only when user has access)
   */
  cleanup(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    if (this.config.suppressInitLogs && !this.config.userHasSponsor) return;
    
    console.log(`🧹 ${message}`, ...args);
  }

  /**
   * Log status messages (always shown in development)
   */
  status(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    
    console.log(`🔒 ${message}`, ...args);
  }

  /**
   * Log warning messages (always shown)
   */
  warn(message: string, ...args: any[]) {
    console.warn(`⚠️ ${message}`, ...args);
  }

  /**
   * Log error messages (always shown)
   */
  error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, ...args: any[]) {
    if (!this.config.isDevelopment) return;
    
    console.debug(`🐛 ${message}`, ...args);
  }

  /**
   * Log a single informational message about hook status
   */
  hookStatus(isEnabled: boolean, reason: string) {
    if (!this.config.isDevelopment) return;
    
    if (isEnabled) {
      console.log('✅ Hooks enabled - user has access to features');
    } else {
      console.log(`🔒 Hooks disabled - ${reason}`);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Helper function to configure logger based on app state
export const configureLogger = (userHasSponsor: boolean, suppressLogs: boolean = true) => {
  logger.updateConfig({
    userHasSponsor,
    suppressInitLogs: suppressLogs
  });
};