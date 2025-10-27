import { UserStats, GameHistoryEntry } from '../shared/types.js';
import { EL, getElementById } from '../ui/elements.js';
import { authManager } from './AuthManager.js';
import { sendGET } from './HTTPRequests.js';

export class DashboardManager {
	clear(): void {
		const statsContainer = getElementById(EL.DASHBOARD.USER_STATS_CHART);
		if (statsContainer) statsContainer.innerHTML = '';

		const table = getElementById<HTMLTableElement>(EL.DASHBOARD.GAME_HISTORY_TABLE);
		if (table) table.innerHTML = '';
	}

	renderUserStats(stats: UserStats): void {
		const container = getElementById(EL.DASHBOARD.USER_STATS_CHART);
		if (!container) return;
		container.innerHTML = '';

		(container as HTMLElement).style.display = 'flex';
		(container as HTMLElement).style.flexDirection = 'column';
		(container as HTMLElement).style.alignItems = 'center';
		(container as HTMLElement).style.textAlign = 'center';
		(container as HTMLElement).style.gap = '16px';

		const tableWrapper = document.createElement('div');
    	tableWrapper.style.width = '100%';
    	tableWrapper.style.maxWidth = '900px';
    	tableWrapper.style.margin = '0 auto';

		const table = document.createElement('table');
		table.style.borderCollapse = 'collapse';
		table.style.width = 'auto';
		table.style.minWidth = '600px';
		table.style.minWidth = '420px';

		table.style.color = '#A0C878';
    	const commonThStyle = 'text-align:center; padding:6px 12px; min-width: 75px; height: 40px; line-height: 1.2; overflow: hidden; display: table-cell; vertical-align: middle; white-space: nowrap; font-size: clamp(10px, 2vw, 14px)';

		table.innerHTML = `
			<thead>
				<tr>
					<th style="${commonThStyle}">Victories</th>
					<th style="${commonThStyle}">Defeats</th>
					<th style="${commonThStyle}">Games</th>
					<th style="${commonThStyle}">Win Ratio</th>
					<th style="${commonThStyle}">Tournaments Played</th>
					<th style="${commonThStyle}">Tournament Wins</th>
					<th style="${commonThStyle}">Tournament Win Ratio</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td style="padding:6px 12px;">${stats.victories}</td>
					<td style="padding:6px 12px;">${stats.defeats}</td>
					<td style="padding:6px 12px;">${stats.games}</td>
					<td style="padding:6px 12px;">${(stats.winRatio * 100).toFixed(1)}%</td>
					<td style="padding:6px 12px;">${stats.tournamentsPlayed}</td>
					<td style="padding:6px 12px;">${stats.tournamentWins}</td>
					<td style="padding:6px 12px;">${(stats.tournamentWinRatio * 100).toFixed(1)}%</td>
				</tr>
			</tbody>
		`;

		const pieChart = this.createPieChart([
			{ label: 'Victories', value: stats.victories, color: '#A0C878' },
			{ label: 'Defeats', value: stats.defeats, color: '#EB5B00' }
		]);

		const tWins   = stats.tournamentWins ?? 0;
	    const tLosses = Math.max(0, (stats.tournamentsPlayed ?? 0) - tWins);
	    const pieChartTournament = this.createPieChart([
	      { label: 'Tournament Wins',   value: tWins,   color: '#A0C878' },
	      { label: 'Tournament Losses', value: tLosses, color: '#EB5B00' }
	    ]);

		// center & arrange table and pie chart
		const row = document.createElement('div');
		row.style.display = 'flex';
		row.style.flexDirection = 'column';
		row.style.alignItems = 'center';
		row.style.justifyContent = 'center';
		row.style.gap = '20px';
		row.style.width = '100%';
		row.appendChild(table);

		const pies = document.createElement('div');
    	pies.style.display = 'flex';
    	pies.style.gap = 'clamp(30px, 5vw, 256px)';
    	pies.style.alignItems = 'center';
		pies.style.justifyContent = 'center';
    	pies.appendChild(pieChart);
    	pies.appendChild(pieChartTournament);

		if (pieChart instanceof SVGElement) {
			pieChart.style.width = 'clamp(150px, 20vw, 200px)';
		    pieChart.style.height = 'clamp(150px, 20vw, 200px)';
		}

		if (pieChartTournament instanceof SVGElement) {
			pieChartTournament.style.width = 'clamp(150px, 20vw, 200px)';
		    pieChartTournament.style.height = 'clamp(150px, 20vw, 200px)';
		}

		row.appendChild(pies);
		container.appendChild(row);
	}


	renderGameHistory(history: GameHistoryEntry[]): void {
		const container = getElementById(EL.DASHBOARD.GAME_HISTORY_TABLE);
		if (!container) return;
		container.innerHTML = '';
		(container as HTMLElement).style.display = 'block';
		(container as HTMLElement).style.textAlign = 'center';

		const table = document.createElement('table');
		table.style.borderCollapse = 'collapse';
		table.style.width = '100%';
		table.style.maxWidth = '900px';
		table.style.margin = '0 auto';

		const commonThStyle = 'text-align:center; padding:6px 12px';

		table.innerHTML = `
			<thead>
				<tr>
					<th style="${commonThStyle}">Date & Time</th>
					<th style="${commonThStyle}">Opponent</th>
					<th style="${commonThStyle}">Score</th>
					<th style="${commonThStyle}">Result</th>
					<th style="${commonThStyle}">Tournament</th>
					<th style="${commonThStyle}">Duration</th>
				</tr>
			</thead>
			<tbody>
				${history.map(e => `
					<tr>
						<td style="${commonThStyle}">${new Date(e.playedAt).toLocaleString()}</td>
						<td style="${commonThStyle}">${e.opponent}</td>
						<td style="${commonThStyle}">${e.score}</td>
						<td style="${commonThStyle}">${e.result}</td>
						<td style="${commonThStyle}">${e.isTournament ? 'No' : 'Yes'}</td>
						<td style="${commonThStyle}">${e.duration}s</td>
					</tr>
				`).join('')}
			</tbody>
		`;
		container.appendChild(table);
	}


	private createPieChart(data: { label: string; value: number; color: string }[]): SVGElement {
		const radius = 50;
		const total  = data.reduce((sum, d) => sum + d.value, 0);
		let cumulative = 0;

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", "120");
		svg.setAttribute("height", "120");
		svg.setAttribute("viewBox", "0 0 120 120");

		// handle 0 or 1 win/loss cases
		const nonZero = data.filter(d => d.value > 0);
		if (total <= 0 || nonZero.length === 1) {
			const cx = radius + 10, cy = radius + 10;
			const color = nonZero[0]?.color
				|| data.find(d => /victor/i.test(d.label))?.color
				|| data[0]?.color || '#4caf50';

			const full = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			full.setAttribute("cx", String(cx));
			full.setAttribute("cy", String(cy));
			full.setAttribute("r",  String(radius));
			full.setAttribute("fill", color);
			svg.appendChild(full);

			const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			hole.setAttribute("cx", String(cx));
			hole.setAttribute("cy", String(cy));
			hole.setAttribute("r",  String(radius / 3));
			hole.setAttribute("fill", "#143D60");
			svg.appendChild(hole);

			return svg;
		}

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
			path.setAttribute("stroke", "#000");		// separators
			path.setAttribute("stroke-width", "1");
			svg.appendChild(path);
		});

		// make it a donut
		const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		hole.setAttribute("cx", String(radius + 10));
		hole.setAttribute("cy", String(radius + 10));
		hole.setAttribute("r",  String(radius / 3));
		hole.setAttribute("fill", "#000");
		svg.appendChild(hole);

		return svg;
	}

	async loadUserDashboard(): Promise<void> {
		if (!authManager.isUserAuthenticated()) return;
		
		const user = authManager.getCurrentUser();
		if (!user) return;

		const username = user.username;
		this.clear();
		
		// Fetch and render stats
		const statsData: { success: boolean, message: string, stats: UserStats } = 
			await sendGET("stats", [`username=${username}`]);
		
		if (!statsData.success)
			console.error(`Failed to load stats: ${statsData.message}`);
		else
			this.renderUserStats(statsData.stats);

		// Fetch and render history
		const historyData: { success: boolean, message: string, history: GameHistoryEntry[] } = 
			await sendGET("history", [`username=${username}`]);
		
		if (!historyData.success)
			console.error(`Failed to load history: ${historyData.message}`);
		else
			this.renderGameHistory(historyData.history);
	}

}

function polarToCartesian(radius: number, fraction: number): [number, number] {
	const angle = fraction * 2 * Math.PI - Math.PI / 2;
	return [radius + radius * Math.cos(angle), radius + radius * Math.sin(angle)];
}

export const dashboardManager = new DashboardManager();
