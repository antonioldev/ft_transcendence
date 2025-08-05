// // FIREFOX
// export class MemoryLeakDetector {
//     private gameCount = 0;
//     private startTime = Date.now();

//     markGameStart(): void {
//         this.gameCount++;
//         console.log(`🎮 Game #${this.gameCount} started`);
//     }

//     markGameEnd(): void {
//         const uptime = Math.round((Date.now() - this.startTime) / 1000);
//         console.error(`🏁 Game #${this.gameCount} ended (Uptime: ${uptime}s)`);
        
//         // Count DOM elements as a rough memory indicator
//         const elementCount = document.querySelectorAll('*').length;
//         console.error(`📊 DOM elements: ${elementCount}`);
//     }
// }

//Chrome
export class MemoryLeakDetector {
    private baseline: number = 0;
    private measurements: number[] = [];
    private maxMeasurements = 20;
    private lastUsedMemory: number | null = null;
    
    startMonitoring(): void {
        if (!(performance as any).memory) {
            console.warn('Memory monitoring not available in this browser');
            return;
        }
        
        // Set baseline AFTER app is fully loaded (longer delay)
        setTimeout(() => {
            this.baseline = (performance as any).memory.usedJSHeapSize;
            console.log(`🔍 Memory baseline set: ${this.formatBytes(this.baseline)} (after app initialization)`);
        }, 5000); // Increased from 2000 to 5000
        
        setInterval(() => {
            this.checkMemory();
        }, 3000);
    }
    
    private checkMemory(): void {
        const memory = (performance as any).memory;
        const current = memory.usedJSHeapSize;
        const growth = current - this.baseline;
        
        // Calculate delta from last measurement
        const delta = this.lastUsedMemory !== null ? current - this.lastUsedMemory : 0;
        this.lastUsedMemory = current;

        this.measurements.push(current);
        if (this.measurements.length > this.maxMeasurements) {
            this.measurements.shift();
        }

        const trend = this.calculateTrend();

        console.warn('🧠 Memory:', {
            used: this.formatBytes(current),
            growth: this.formatBytes(growth, true),
            sinceLast: this.formatBytes(delta, true),  // NEW LINE
            trend: trend > 100000 ? '📈 GROWING' : trend < -100000 ? '📉 SHRINKING' : '➡️ STABLE',
            trendBytes: this.formatBytes(trend, true)
        });

        // Alert on significant growth from baseline
        if (growth > 50 * 1024 * 1024) {
            console.error('🚨 MEMORY LEAK DETECTED: +' + this.formatBytes(growth));
        }

        // Alert on continuous growth trend
        if (trend > 500000) {
            console.error('🚨 CONTINUOUS MEMORY GROWTH: ' + this.formatBytes(trend) + ' per measurement');
        }

        // Alert on large jump between two readings
        if (Math.abs(delta) > 10 * 1024 * 1024) {
            console.warn('🔄 MEMORY JUMP since last check: ' + this.formatBytes(delta, true));
        }
    }

    
    private calculateTrend(): number {
        if (this.measurements.length < 5) return 0;
        
        const recent = this.measurements.slice(-5);
        const older = this.measurements.slice(-10, -5);
        
        if (older.length === 0) return 0;
        
        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b) / older.length;
        
        return recentAvg - olderAvg;
    }
    
    private formatBytes(bytes: number, showSign: boolean = false): string {
        const sign = showSign && bytes > 0 ? '+' : '';
        
        if (Math.abs(bytes) < 1024) return sign + bytes + 'B';
        if (Math.abs(bytes) < 1024 * 1024) return sign + Math.round(bytes / 1024) + 'KB';
        return sign + Math.round(bytes / (1024 * 1024)) + 'MB';
    }
    
    // Call this when starting a game to test for leaks
    markGameStart(): void {
        const current = (performance as any).memory?.usedJSHeapSize || 0;
        console.log('🎮 Game started - Memory: ' + this.formatBytes(current));
    }
    setBaselineAfterFirstGame(): void {
        if ((performance as any).memory) {
            this.baseline = (performance as any).memory.usedJSHeapSize;
            console.log(`🔍 NEW BASELINE after first game: ${this.formatBytes(this.baseline)}`);
        }
    }
    // Call this when ending a game
    markGameEnd(): void {
    // Force garbage collection if possible
    if ((window as any).gc) {
        (window as any).gc();
    }
    
    setTimeout(() => {
        const current = (performance as any).memory?.usedJSHeapSize || 0;
        const growth = current - this.baseline;
        
        console.warn('🏁 Game ended - Memory: ' + this.formatBytes(current) + 
                   ' (Growth: ' + this.formatBytes(growth, true) + ')');
        
        // SHOW EXACT GROWTH DETAILS
        if (growth > 1024 * 1024) { // 1MB threshold for detailed reporting
            console.warn('📊 MEMORY GROWTH DETAILS:', {
                baseline: this.formatBytes(this.baseline),
                current: this.formatBytes(current),
                growth: this.formatBytes(growth, true),
                growthMB: Math.round(growth / (1024 * 1024) * 100) / 100, // Precise MB
                growthKB: Math.round(growth / 1024), // KB
                growthPercent: Math.round((growth / this.baseline) * 100) + '%'
            });
        }
        
        if (growth > 10 * 1024 * 1024) { // 10MB
            console.error('🚨 SIGNIFICANT LEAK: Memory didn\'t return to baseline after game end');
        } else if (growth > 5 * 1024 * 1024) { // 5MB  
            console.warn('⚠️ MODERATE LEAK: Memory increased by ' + this.formatBytes(growth));
        } else if (growth > 1 * 1024 * 1024) { // 1MB
            console.warn('ℹ️ MINOR GROWTH: Memory increased by ' + this.formatBytes(growth));
        } else {
            console.warn('✅ GOOD: Memory growth minimal (' + this.formatBytes(growth, true) + ')');
        }
        if (this.baseline === 0) {
        setTimeout(() => {
            this.setBaselineAfterFirstGame();
        }, 2000);
    }
    }, 1000); // Wait for cleanup
}
}