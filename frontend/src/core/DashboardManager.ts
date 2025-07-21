// src/ui/DashboardManager.ts
import Chart from 'chart.js/auto';
import { UserStats, GameHistoryEntry } from '../shared/types.js';
import { WebSocketEvent } from '../shared/constants.js';
import { getElementById } from '../ui/elements.js';
import { webSocketClient } from './WebSocketClient.js';

export class DashboardManager {
    private static instance: DashboardManager;

    static getInstance(): DashboardManager {
        if (!DashboardManager.instance)
            DashboardManager.instance = new DashboardManager();
        return DashboardManager.instance;
    }

    initialize(): void {
        webSocketClient.registerCallback(WebSocketEvent.USER_STATS, (stats: UserStats) => {
            this.renderUserStats(stats);
        });

        webSocketClient.registerCallback(WebSocketEvent.GAME_HISTORY, (entries: GameHistoryEntry[]) => {
            this.renderGameHistory(entries);
        });
    }

    clear(): void {
        const oldChart = getElementById('user-stats-chart');
        if (oldChart) {
            const newChart = document.createElement('canvas');
            newChart.id = 'user-stats-chart'; // set same id so Chart.js can re-render
            oldChart.replaceWith(newChart);
        }

        const table = getElementById('game-history-table')?.querySelector('tbody');
        if (table) table.innerHTML = '';
    }

    private renderUserStats(stats: UserStats): void {
        const chartEl = getElementById('user-stats-chart') as HTMLCanvasElement;
        if (!chartEl) return;

        new Chart(chartEl, {
            type: 'bar',
            data: {
                labels: ['Victories', 'Defeats', 'Games'],
                datasets: [{
                    label: 'User Stats',
                    data: [stats.victories, stats.defeats, stats.games],
                    backgroundColor: ['#4caf50', '#f44336', '#2196f3']
                }]
            }
        });
    }

    private renderGameHistory(history: GameHistoryEntry[]): void {
        const tbody = getElementById('game-history-table')?.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        history.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.playedAt}</td>
                <td>${entry.opponent}</td>
                <td>${entry.score}</td>
                <td>${entry.result}</td>
                <td>${entry.duration}s</td>
            `;
            tbody.appendChild(row);
        });
    }
}

export const dashboardManager = DashboardManager.getInstance();
