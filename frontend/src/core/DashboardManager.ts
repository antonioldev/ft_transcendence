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
		const container = getElementById(EL.DASHBOARD.USER_STATS_CHART);
		if (!container) return;
		container.innerHTML = '';
		(container as HTMLElement).style.display = 'block';
		(container as HTMLElement).style.textAlign = 'center';

		const tableWrapper = document.createElement('div');
    	tableWrapper.style.width = '100%';
    	tableWrapper.style.maxWidth = '900px';
    	tableWrapper.style.margin = '0 auto';

		const table = document.createElement('table');
		table.style.borderCollapse = 'collapse';
		table.style.width = '100%';
		table.style.minWidth = '600px';
		table.style.maxWidth = '900px';
		table.style.margin = '0 auto';
		table.style.color = '#A0C878';
    	const commonThStyle = 'text-align:center; padding:6px 12px; min-width: 75px; height: 40px; line-height: 1.2; overflow: hidden; display: table-cell; vertical-align: middle; white-space: nowrap; font-size: clamp(10px, 2vw, 14px)';

		table.innerHTML = `
			<thead>
				<tr>
					<th style="${commonThStyle}">Overall<br>Games</th>
					<th style="${commonThStyle}">Overall<br>Victories</th>
					<th style="${commonThStyle}">Overall<br>Defeats</th>
					<th style="${commonThStyle}">Overall<br>Win Ratio</th>
					<th style="${commonThStyle}">Tournament<br>Games</th>
					<th style="${commonThStyle}">Tournament<br>Victories</th>
					<th style="${commonThStyle}">Tournament<br>Defeats</th>
					<th style="${commonThStyle}">Tournament<br>Win Ratio</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td style="padding:6px 12px;">${stats.games}</td>
					<td style="padding:6px 12px;">${stats.victories}</td>
					<td style="padding:6px 12px;">${stats.defeats}</td>
					<td style="padding:6px 12px;">${(stats.winRatio * 100).toFixed(1)}%</td>
					<td style="padding:6px 12px;">${stats.tournamentsPlayed}</td>
					<td style="padding:6px 12px;">${stats.tournamentWins}</td>
					<td style="padding:6px 12px;">${stats.tournamentsPlayed - stats.tournamentWins}</td>
					<td style="padding:6px 12px;">${(stats.tournamentWinRatio * 100).toFixed(1)}%</td>
				</tr>
			</tbody>
		`;

		tableWrapper.appendChild(table);

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
		// row.style.gap = '1px';
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

		const spacer = document.createElement('div');
		spacer.style.height = '16px';
		container.appendChild(spacer);  // TODO this doesn't show

		
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


	private renderGameHistory(history: GameHistoryEntry[]): void {
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
						<td style="${commonThStyle}">${e.isTournament}</td>
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
	    const panelBg =
	      getComputedStyle(document.documentElement).getPropertyValue('--panel-bg').trim() ||
	      getComputedStyle(document.body).getPropertyValue('background-color') ||
	      'transparent';

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
			// hole.setAttribute("fill", "#000");
			hole.setAttribute("fill", panelBg);
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
			// path.setAttribute("stroke", "#000");		// separators
			path.setAttribute("stroke", panelBg);
			path.setAttribute("stroke-width", "1");
			svg.appendChild(path);
		});

		// make it a donut
		const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		hole.setAttribute("cx", String(radius + 10));
		hole.setAttribute("cy", String(radius + 10));
		hole.setAttribute("r",  String(radius / 3));
		// hole.setAttribute("fill", "#000");
		hole.setAttribute("fill", panelBg);
		svg.appendChild(hole);

		return svg;
	}
}

function polarToCartesian(radius: number, fraction: number): [number, number] {
	const angle = fraction * 2 * Math.PI - Math.PI / 2;
	return [radius + radius * Math.cos(angle), radius + radius * Math.sin(angle)];
}

export const dashboardManager = DashboardManager.getInstance();
