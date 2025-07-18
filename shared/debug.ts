const LEVEL = 3;
// 0 = ERROR only
// 1 = ERROR + WARN  
// 2 = ERROR + WARN + INFO
// 3 = ERROR + WARN + INFO + DEBUG

// ========================================
// LOGGING FUNCTIONS
// ========================================

export const log = {
    error: (message: string, ...args: any[]) => {
        if (LEVEL >= 0) console.error(`[ERROR] ${message}`, ...args);
    },

    warn: (message: string, ...args: any[]) => {
        if (LEVEL >= 1) console.warn(`[WARN] ${message}`, ...args);
    },

    info: (message: string, ...args: any[]) => {
        if (LEVEL >= 2) console.info(`[INFO] ${message}`, ...args);
    },

    debug: (message: string, ...args: any[]) => {
        if (LEVEL >= 3) console.log(`[DEBUG] ${message}`, ...args);
    }
};

// log.debug('Game started');
// log.info('User action');
// log.warn('Network issue');
// log.error('Critical error');