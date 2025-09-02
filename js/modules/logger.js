// ---- Comprehensive Logging System ----

let logBuffer = [];
let logFile = null;
let originalConsole = {};
let isLoggingEnabled = true;

// Log levels
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Initialize logging system
export function initLogger() {
  try {
    // Create log file handle for future downloads
    initLogFile();
    
    // Intercept console methods
    interceptConsole();
    
    // Add global error handler
    setupGlobalErrorHandler();
    
    // Add unhandled promise rejection handler
    setupUnhandledRejectionHandler();
    
    // Log system initialization
    log(LOG_LEVELS.INFO, 'Logger', 'Logging system initialized');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize logger:', error);
    return false;
  }
}

// Initialize log file system
function initLogFile() {
  try {
    // Log system info
    const systemInfo = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform
    };
    
    log(LOG_LEVELS.INFO, 'System', 'Application started', systemInfo);
  } catch (error) {
    console.error('Failed to initialize log file:', error);
  }
}

// Main logging function
export function log(level, module, message, data = null) {
  try {
    if (!isLoggingEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module,
      message,
      data: data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : data) : null,
      stack: level === LOG_LEVELS.ERROR ? new Error().stack : null
    };
    
    // Add to buffer
    logBuffer.push(logEntry);
    
    // Keep buffer size manageable
    if (logBuffer.length > 1000) {
      logBuffer = logBuffer.slice(-800); // Keep last 800 entries
    }
    
    // Format for console
    const consoleMessage = formatConsoleMessage(logEntry);
    
    // Output to console based on level
    switch (level) {
      case LOG_LEVELS.ERROR:
        originalConsole.error(consoleMessage);
        break;
      case LOG_LEVELS.WARN:
        originalConsole.warn(consoleMessage);
        break;
      case LOG_LEVELS.DEBUG:
        originalConsole.debug(consoleMessage);
        break;
      default:
        originalConsole.log(consoleMessage);
    }
    
    // Auto-save to localStorage periodically
    autoSaveLogs();
    
  } catch (error) {
    originalConsole.error('Logging error:', error);
  }
}

// Format message for console display
function formatConsoleMessage(entry) {
  let message = `[${entry.timestamp}] ${entry.level} [${entry.module}] ${entry.message}`;
  
  if (entry.data) {
    message += `\nData: ${entry.data}`;
  }
  
  return message;
}

// Intercept console methods
function interceptConsole() {
  // Save original console methods
  originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console)
  };
  
  // Override console methods
  console.log = (...args) => {
    log(LOG_LEVELS.INFO, 'Console', args.join(' '));
  };
  
  console.error = (...args) => {
    log(LOG_LEVELS.ERROR, 'Console', args.join(' '));
  };
  
  console.warn = (...args) => {
    log(LOG_LEVELS.WARN, 'Console', args.join(' '));
  };
  
  console.info = (...args) => {
    log(LOG_LEVELS.INFO, 'Console', args.join(' '));
  };
  
  console.debug = (...args) => {
    log(LOG_LEVELS.DEBUG, 'Console', args.join(' '));
  };
}

// Setup global error handler
function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    log(LOG_LEVELS.ERROR, 'Global', `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, {
      error: event.error ? event.error.stack : null,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}

// Setup unhandled promise rejection handler
function setupUnhandledRejectionHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    log(LOG_LEVELS.ERROR, 'Promise', 'Unhandled promise rejection', {
      reason: event.reason,
      stack: event.reason && event.reason.stack ? event.reason.stack : null
    });
  });
}

// Auto-save logs to localStorage
let lastSave = 0;
function autoSaveLogs() {
  const now = Date.now();
  if (now - lastSave > 5000) { // Save every 5 seconds
    lastSave = now;
    try {
      localStorage.setItem('appLogs', JSON.stringify(logBuffer.slice(-500))); // Keep last 500 entries
    } catch (error) {
      originalConsole.error('Failed to save logs to localStorage:', error);
    }
  }
}

// Export logs to downloadable file
export function exportLogs() {
  try {
    const logsText = logBuffer.map(entry => {
      let line = `[${entry.timestamp}] ${entry.level} [${entry.module}] ${entry.message}`;
      if (entry.data) {
        line += `\n  Data: ${entry.data}`;
      }
      if (entry.stack) {
        line += `\n  Stack: ${entry.stack}`;
      }
      return line;
    }).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `groqchat_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    log(LOG_LEVELS.INFO, 'Logger', 'Logs exported successfully');
    
    return true;
  } catch (error) {
    originalConsole.error('Failed to export logs:', error);
    return false;
  }
}

// Get logs from localStorage
export function loadStoredLogs() {
  try {
    const stored = localStorage.getItem('appLogs');
    if (stored) {
      const storedLogs = JSON.parse(stored);
      logBuffer = [...storedLogs, ...logBuffer];
      log(LOG_LEVELS.INFO, 'Logger', `Loaded ${storedLogs.length} stored log entries`);
    }
  } catch (error) {
    originalConsole.error('Failed to load stored logs:', error);
  }
}

// Clear all logs
export function clearLogs() {
  try {
    logBuffer = [];
    localStorage.removeItem('appLogs');
    log(LOG_LEVELS.INFO, 'Logger', 'Logs cleared');
    return true;
  } catch (error) {
    originalConsole.error('Failed to clear logs:', error);
    return false;
  }
}

// Get current logs
export function getLogs() {
  return [...logBuffer];
}

// Enable/disable logging
export function setLoggingEnabled(enabled) {
  isLoggingEnabled = enabled;
  log(LOG_LEVELS.INFO, 'Logger', `Logging ${enabled ? 'enabled' : 'disabled'}`);
}

// Get logging status
export function isLoggerEnabled() {
  return isLoggingEnabled;
}

// Convenience logging functions
export const logger = {
  error: (module, message, data) => log(LOG_LEVELS.ERROR, module, message, data),
  warn: (module, message, data) => log(LOG_LEVELS.WARN, module, message, data),
  info: (module, message, data) => log(LOG_LEVELS.INFO, module, message, data),
  debug: (module, message, data) => log(LOG_LEVELS.DEBUG, module, message, data)
};

// Performance monitoring
export function logPerformance(name, startTime) {
  const duration = performance.now() - startTime;
  log(LOG_LEVELS.INFO, 'Performance', `${name} took ${duration.toFixed(2)}ms`);
}

// API call logging helper
export function logApiCall(method, url, status, duration, error = null) {
  const level = error ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
  const message = `${method} ${url} - ${status} (${duration}ms)`;
  log(level, 'API', message, error ? { error: error.message, stack: error.stack } : null);
}