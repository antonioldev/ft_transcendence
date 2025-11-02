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

		const mainWraper = document.createElement('div');
		mainWraper.style.width = '100%';
		mainWraper.style.maxWidth = '1200px';
		mainWraper.style.margin = '0 auto';
		mainWraper.style.display = 'flex';
		mainWraper.style.flexDirection = 'column';
		mainWraper.style.gap = '30px';
		mainWraper.style.backgroundColor = 'rgba(63, 42, 43, 0.2)';

		const columnsContainer = document.createElement('div');
		columnsContainer.style.display = 'flex';
		columnsContainer.style.gap = '30px';
		columnsContainer.style.alignItems = 'center';
		columnsContainer.style.justifyContent = 'left';
		columnsContainer.style.flexWrap = 'wrap';
		columnsContainer.style.borderRadius = '6px';
		columnsContainer.style.padding = '20px';
		columnsContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
		columnsContainer.style.maxWidth = '900px';
		columnsContainer.style.width = '100%';
		columnsContainer.style.margin = '0 auto';

		const leftColumn = document.createElement('div');
		leftColumn.style.flex = '1';
		leftColumn.style.minWidth = '300px';

		const table = document.createElement('table');
		table.style.borderCollapse = 'collapse';
		table.style.width = '100%';
		table.style.color = '#A0C878';

    	const commonThStyle = 'text-align:left; padding:10px 15px; min-width: 75px; height: 50px; line-height: 1.2; overflow: hidden; display: table-cell; vertical-align: middle; white-space: nowrap; font-size: clamp(14px, 3vw, 18px); font-weight: bold;';
		// const secondThStyle = 'text-align:left; padding:5px 30px; min-width: 50px; height: 30px; line-height: 0.5; overflow: hidden; display: table-cell; vertical-align: middle; white-space: nowrap; font-size: clamp(10px, 2vw, 14px); font-weight: light;';
		const commonTdStyle = 'text-align:center; padding:10px 15px; font-size: clamp(14px, 3vw, 18px); font-weight: 500;';
		// const secondTdStyle = 'text-align:center; padding:5px 30px; font-size: clamp(10px, 2vw, 14px); font-weight: 400;';


		table.innerHTML = `
			<tbody>
				<tr>
					<th style="${commonThStyle}">Victories</th>
					<td style="${commonTdStyle}">${stats.victories}</td>
				<tr>
					<th style="${commonThStyle} color: #FE5E41">Defeats</th>
					<td style="${commonTdStyle} color: #FE5E41">${stats.defeats}</td>
				</tr>
			</tbody>
		`;

		leftColumn.appendChild(table);

		const rightColumn = document.createElement('div');
		rightColumn.style.flex = '1';
		rightColumn.style.minWidth = '300px';
		rightColumn.style.display = 'flex';
		rightColumn.style.flexDirection = 'column';
		rightColumn.style.alignItems = 'center';
		rightColumn.style.justifyContent = 'center';

		const pieChart = this.createPieChart([
			{ label: 'Victories', value: stats.victories, color: '#A0C878' },
			{ label: 'Defeats', value: stats.defeats, color: '#EB5B00' }
		]);

		if (pieChart instanceof SVGElement) {
			pieChart.style.width = '150px';
			pieChart.style.height = '150px';
		}
		rightColumn.appendChild(pieChart);

		columnsContainer.appendChild(leftColumn);
		columnsContainer.appendChild(rightColumn);
		mainWraper.appendChild(columnsContainer);
		container.appendChild(mainWraper);

	}

	renderGameHistory(history: GameHistoryEntry[]): void {

		fetch('/log', {method:'POST', body:'xxx'})
		console.log(`### renderGameHistory ###`);
		const container = getElementById(EL.DASHBOARD.GAME_HISTORY_TABLE);
		if (!container) return;
		container.innerHTML = '';
		(container as HTMLElement).style.display = 'block';
		(container as HTMLElement).style.textAlign = 'center';

		// print only isTournament from history
		history.forEach(entry => {
			console.log(`### isTournament in history: ${entry.isTournament}`);
		});

    	const scrollWrapper = document.createElement('div');
    	scrollWrapper.style.maxHeight = '300px';
    	scrollWrapper.style.overflowY = 'auto';
    	scrollWrapper.style.overflowX = 'auto';
    	scrollWrapper.style.border = '';
    	scrollWrapper.style.borderRadius = '6px';
    	scrollWrapper.style.backgroundColor = 'rgba(63, 42, 43, 0.2)';
    	scrollWrapper.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    	scrollWrapper.style.scrollbarWidth = 'thin';
    	scrollWrapper.style.scrollbarColor = '#A0C878 #143D60';
		scrollWrapper.style.maxWidth = '100%';

		const table = document.createElement('table');
		table.style.borderCollapse = 'separate';
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

		scrollWrapper.appendChild(table);
		container.appendChild(scrollWrapper);
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
			path.setAttribute("stroke", "#143D60");		// separators
			path.setAttribute("stroke-width", "0.5");
			svg.appendChild(path);
		});

		// make it a donut
		const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		hole.setAttribute("cx", String(radius + 10));
		hole.setAttribute("cy", String(radius + 10));
		hole.setAttribute("r",  String(radius / 3));
		hole.setAttribute("fill", "#143D60");
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
