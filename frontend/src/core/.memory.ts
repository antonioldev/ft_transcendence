// FIREFOX
export class MemoryLeakDetector {
    private gameCount = 0;
    private startTime = Date.now();

    markGameStart(): void {
        this.gameCount++;
        console.log(`🎮 Game #${this.gameCount} started`);
    }

    markGameEnd(): void {
        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        console.error(`🏁 Game #${this.gameCount} ended (Uptime: ${uptime}s)`);
        
        // Count DOM elements as a rough memory indicator
        const elementCount = document.querySelectorAll('*').length;
        console.error(`📊 DOM elements: ${elementCount}`);
    }
}

//Chrome
// export class MemoryLeakDetector {
//     private baseline: number = 0;
//     private measurements: number[] = [];
//     private maxMeasurements = 20;
    
//     startMonitoring(): void {
//         if (!(performance as any).memory) {
//             console.warn('Memory monitoring not available in this browser');
//             return;
//         }
        
//         // Set baseline after initial load
//         setTimeout(() => {
//             this.baseline = (performance as any).memory.usedJSHeapSize;
//             console.log(`🔍 Memory baseline set: ${this.formatBytes(this.baseline)}`);
//         }, 2000);
        
//         setInterval(() => {
//             this.checkMemory();
//         }, 3000);
//     }
    
//     private checkMemory(): void {
//         const memory = (performance as any).memory;
//         const current = memory.usedJSHeapSize;
//         const growth = current - this.baseline;
        
//         this.measurements.push(current);
//         if (this.measurements.length > this.maxMeasurements) {
//             this.measurements.shift();
//         }
        
//         const trend = this.calculateTrend();
        
//         console.log('🧠 Memory:', {
//             used: this.formatBytes(current),
//             growth: this.formatBytes(growth, true),
//             trend: trend > 100000 ? '📈 GROWING' : trend < -100000 ? '📉 SHRINKING' : '➡️ STABLE',
//             trendBytes: this.formatBytes(trend, true)
//         });
        
//         // Alert on significant growth
//         if (growth > 50 * 1024 * 1024) { // 50MB over baseline
//             console.warn('🚨 MEMORY LEAK DETECTED: +' + this.formatBytes(growth));
//         }
        
//         // Alert on continuous growth trend
//         if (trend > 500000) { // 500KB per measurement
//             console.warn('🚨 CONTINUOUS MEMORY GROWTH: ' + this.formatBytes(trend) + ' per measurement');
//         }
//     }
    
//     private calculateTrend(): number {
//         if (this.measurements.length < 5) return 0;
        
//         const recent = this.measurements.slice(-5);
//         const older = this.measurements.slice(-10, -5);
        
//         if (older.length === 0) return 0;
        
//         const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
//         const olderAvg = older.reduce((a, b) => a + b) / older.length;
        
//         return recentAvg - olderAvg;
//     }
    
//     private formatBytes(bytes: number, showSign: boolean = false): string {
//         const sign = showSign && bytes > 0 ? '+' : '';
        
//         if (Math.abs(bytes) < 1024) return sign + bytes + 'B';
//         if (Math.abs(bytes) < 1024 * 1024) return sign + Math.round(bytes / 1024) + 'KB';
//         return sign + Math.round(bytes / (1024 * 1024)) + 'MB';
//     }
    
//     // Call this when starting a game to test for leaks
//     markGameStart(): void {
//         const current = (performance as any).memory?.usedJSHeapSize || 0;
//         console.log('🎮 Game started - Memory: ' + this.formatBytes(current));
//     }
    
//     // Call this when ending a game
//     markGameEnd(): void {
//         // Force garbage collection if possible
//         if ((window as any).gc) {
//             (window as any).gc();
//         }
        
//         setTimeout(() => {
//             const current = (performance as any).memory?.usedJSHeapSize || 0;
//             const growth = current - this.baseline;
//             console.log('🏁 Game ended - Memory: ' + this.formatBytes(current) + 
//                        ' (Growth: ' + this.formatBytes(growth, true) + ')');
            
//             if (growth > 10 * 1024 * 1024) { // 10MB
//                 console.warn('🚨 POSSIBLE LEAK: Memory didn\'t return to baseline after game end');
//             }
//         }, 1000); // Wait for cleanup
//     }
// }