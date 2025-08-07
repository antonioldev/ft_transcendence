import { UserStats, GameHistoryEntry } from '../shared/types.js';
import { WebSocketEvent } from '../shared/constants.js';
import { EL, getElementById } from '../ui/elements.js';
import { webSocketClient } from './WebSocketClient.js';

export class DashboardManager {
    private static instance: DashboardManager;

    static getInstance(): DashboardManager {
        if (!DashboardManager.instance)
            DashboardManager.instance = new DashboardManager();
        return DashboardManager.instance;
    }

    static initialize(): void {
        const instance = DashboardManager.getInstance();
        webSocketClient.registerCallback(WebSocketEvent.USER_STATS, (stats: UserStats) => {
            instance.renderUserStats(stats);
        });

        webSocketClient.registerCallback(WebSocketEvent.GAME_HISTORY, (entries: GameHistoryEntry[]) => {
            instance.renderGameHistory(entries);
        });
    }

    clear(): void {
        const statsContainer = getElementById(EL.DASHBOARD.USER_STATS_CHART);
        if (statsContainer) statsContainer.innerHTML = '';

        const table = getElementById<HTMLTableElement>(EL.DASHBOARD.GAME_HISTORY_TABLE);
        if (table) table.innerHTML = '';
    }

    private renderUserStats(stats: UserStats): void {
        console.log('[DASH] stats payload', stats);
        const container = getElementById(EL.DASHBOARD.USER_STATS_CHART);
        if (!container) return;
        container.innerHTML = '';

        // Bar Chart
        const barChart = this.createBarChart([
            { label: 'Victories', value: stats.victories, color: '#4caf50' },
            { label: 'Defeats', value: stats.defeats, color: '#f44336' },
            { label: 'Games', value: stats.games, color: '#2196f3' }
        ]);
        container.appendChild(barChart);

        // Pie Chart
        const pieChart = this.createPieChart([
            { label: 'Victories', value: stats.victories, color: '#4caf50' },
            { label: 'Defeats', value: stats.defeats, color: '#f44336' }
        ]);
        container.appendChild(pieChart);
    }

    private renderGameHistory(history: GameHistoryEntry[]): void {
        const tbody = getElementById<HTMLTableElement>(EL.DASHBOARD.GAME_HISTORY_TABLE);
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

    private createBarChart(data: { label: string; value: number; color: string }[]): HTMLElement {
        const max = Math.max(...data.map(d => d.value));
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'flex-end';
        container.style.gap = '10px';
        container.style.height = '150px';
        container.style.marginBottom = '20px';

        data.forEach(d => {
            const bar = document.createElement('div');
            const height = (d.value / max) * 100;
            bar.style.width = '50px';
            bar.style.height = `${height}%`;
            bar.style.backgroundColor = d.color;
            bar.title = `${d.label}: ${d.value}`;

            const label = document.createElement('div');
            label.innerText = d.label;
            label.style.textAlign = 'center';
            label.style.marginTop = '5px';

            const barWrapper = document.createElement('div');
            barWrapper.style.display = 'flex';
            barWrapper.style.flexDirection = 'column';
            barWrapper.style.alignItems = 'center';

            barWrapper.appendChild(bar);
            barWrapper.appendChild(label);
            container.appendChild(barWrapper);
        });

        return container;
    }

    private createPieChart(data: { label: string; value: number; color: string }[]): SVGElement {
        const radius = 50;
        const total = data.reduce((sum, d) => sum + d.value, 0);
        let cumulative = 0;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "120");
        svg.setAttribute("height", "120");
        svg.setAttribute("viewBox", "0 0 120 120");

        data.forEach(d => {
            const [startX, startY] = polarToCartesian(radius, cumulative / total);
            cumulative += d.value;
            const [endX, endY] = polarToCartesian(radius, cumulative / total);
            const largeArcFlag = d.value / total > 0.5 ? 1 : 0;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const dAttr = [
                `M ${radius + 10} ${radius + 10}`,
                `L ${startX + 10} ${startY + 10}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX + 10} ${endY + 10}`,
                `Z`
            ].join(' ');

            path.setAttribute("d", dAttr);
            path.setAttribute("fill", d.color);
            path.setAttribute("title", d.label);

            svg.appendChild(path);
        });

        return svg;
    }
}

function polarToCartesian(radius: number, fraction: number): [number, number] {
    const angle = fraction * 2 * Math.PI - Math.PI / 2;
    return [radius + radius * Math.cos(angle), radius + radius * Math.sin(angle)];
}

export const dashboardManager = DashboardManager.getInstance();
