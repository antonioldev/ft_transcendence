import { AdvancedDynamicTexture, Rectangle, TextBlock, Grid, StackPanel, Image } from "@babylonjs/gui";
import { AnimationManager, Motion } from "../services/AnimationManager.js";
import { BRACKET_STYLES, applyStyles,createImage, createRect, createTextBlock, createGrid, createStackPanel, COLORS } from "./GuiStyle.js";
import { getCurrentTranslation } from "../../translations/translations.js";
export class MatchTree {
	private playerTotal: number = 0;
	private isCreated: boolean = false;
	private overlay!: Rectangle;
	private bracketGrid!: Grid;
	private roundsCount = 0;
	private tabsBar!: Grid;
	private roundPanels: StackPanel[] = [];
	private tabButtons: Rectangle[] = [];
	private tabButtonsBg: Image[] = [];
	private tabLabels: TextBlock[] = [];
	private currentRound: number = 0;
	private isAnimating: boolean = false;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {
		const t = getCurrentTranslation();
		
		this.overlay = createRect("bracketOverlay", BRACKET_STYLES.bracketOverlay);
		this.adt.addControl(this.overlay);

		const container = createGrid("bracketContainer", BRACKET_STYLES.bracketGrid);
		container.addRowDefinition(BRACKET_STYLES.containerRows.header, false);
		container.addRowDefinition(BRACKET_STYLES.containerRows.content, false);
		container.addColumnDefinition(1, false);
		this.overlay.addControl(container);

		const headerGrid = createGrid("headerGrid", BRACKET_STYLES.headerGrid);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.icon, true);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.title, false);

		const bracketIcon = createImage("bracketIcon", BRACKET_STYLES.bracketIcon, "assets/icons/tournament.png");
		headerGrid.addControl(bracketIcon, 0, 0);

		const bracketTitle = createTextBlock("bracketTitle", BRACKET_STYLES.bracketTitle, t.tournamentTitle);
		headerGrid.addControl(bracketTitle, 0, 1);

		container.addControl(headerGrid, 0, 0);

		this.bracketGrid = createGrid("bracketGrid", BRACKET_STYLES.bracketGrid);
		this.bracketGrid.addRowDefinition(1, false);
		this.bracketGrid.addColumnDefinition(1, false);
		container.addControl(this.bracketGrid, 1, 0);
	}

	insert(
		roundIndex: number,
		roundsTotal: number,
		matchIndex: number,
		left: string | null,
		right: string | null,
		matchTotal?: number
	): void {
		if (!this.isCreated && matchTotal !== undefined) {
			this.initializeTabs(matchTotal, roundsTotal);
		}
		if (!this.isCreated) return;
		this.currentRound = Math.max(this.currentRound, roundIndex - 1);

		const leftSlot = matchIndex * 2;
		const rightSlot = matchIndex * 2 + 1;

		const leftId = `bracketCell_${roundIndex}_${leftSlot}`;
		const rightId = `bracketCell_${roundIndex}_${rightSlot}`;

		const leftTb = this.adt.getControlByName(leftId) as TextBlock | null;
		const rightTb = this.adt.getControlByName(rightId) as TextBlock | null;

		if (left !== null && leftTb) leftTb.text = left;
		if (right !== null && rightTb) rightTb.text = right;
		this.activateRound(this.currentRound);
	}

	update(winner: string, round_index: number, match_index: number): void {
		if (!this.adt) return;

		const leftSlot = match_index * 2;
		const rightSlot = match_index * 2 + 1;

		const leftId = `bracketCell_${round_index}_${leftSlot}`;
		const rightId = `bracketCell_${round_index}_${rightSlot}`;
		const nextId = `bracketCell_${round_index + 1}_${match_index}`;

		const leftTb = this.adt.getControlByName(leftId) as TextBlock | null;
		const rightTb = this.adt.getControlByName(rightId) as TextBlock | null;
		const leftRect = this.adt.getControlByName(`${leftId}_rect`) as Rectangle | null;
		const rightRect = this.adt.getControlByName(`${rightId}_rect`) as Rectangle | null;
		const nextTb = this.adt.getControlByName(nextId) as TextBlock | null;

		if (!leftTb || !rightTb || !leftRect || !rightRect) return;

		const isLeftWinner = leftTb.text === winner;
		const isRightWinner = rightTb.text === winner;

		if (isLeftWinner) {
			rightTb.text = "❌ " + rightTb.text;
			applyStyles(leftRect, BRACKET_STYLES.winnerCell);
			applyStyles(leftTb, BRACKET_STYLES.winnerText);
			applyStyles(rightRect, BRACKET_STYLES.loserCell);
			applyStyles(rightTb, BRACKET_STYLES.loserText);
		} else if (isRightWinner) {
			leftTb.text = "❌ " + leftTb.text;
			applyStyles(rightRect, BRACKET_STYLES.winnerCell);
			applyStyles(rightTb, BRACKET_STYLES.winnerText);
			applyStyles(leftRect, BRACKET_STYLES.loserCell);
			applyStyles(leftTb, BRACKET_STYLES.loserText);
		}

		if (nextTb) nextTb.text = winner;
	}

	toggle(): void {
		if (this.isAnimating) return;
		
		this.overlay.background = COLORS.TRANSPARENT_BLACK;
		const isCurrentlyVisible = this.overlay.isVisible;
		this.show(!isCurrentlyVisible);
	}

	show(show: boolean): void {
		if (!this.overlay || !this.animationManager || this.isAnimating) return;
		this.isAnimating = true;
		if (show) {
			this.activateRound(this.currentRound);
			this.overlay.isVisible = true;
			this.overlay.leftInPixels = 400;
			this.animationManager.slideFromDirection(this.overlay, 'left', 'in', 400, Motion.F.base).then(() => {
				this.overlay.leftInPixels = -20;
			});
		} else {
			this.animationManager.slideFromDirection(this.overlay, 'right', 'out', 400, Motion.F.xFast).then(() => {
				this.overlay.isVisible = false;
			});
		}
		this.isAnimating = false;
	}

	private initializeTabs(matchTotal: number, roundsTotal: number): void {
		this.playerTotal = matchTotal * 2;
		this.roundsCount = roundsTotal;

		const tabsRoot = createStackPanel("bracketTabsRoot", BRACKET_STYLES.tabsRoot);
		this.bracketGrid.addControl(tabsRoot, 0, 0);

		const headerRect = createRect("roundsHeaderRect", BRACKET_STYLES.tabHeaderRect);
		const roundsHeader = createTextBlock("roundsHeader", BRACKET_STYLES.tabHeader, "ROUNDS");
		const bg = createImage("cellBg", BRACKET_STYLES.bg, "/assets/bg/inactive.png");
		headerRect.addControl(bg);
		
		headerRect.addControl(roundsHeader);
		tabsRoot.addControl(headerRect);

		this.tabsBar = createGrid("bracketTabsBar", BRACKET_STYLES.tabsBar);
		for (let i = 0; i < this.roundsCount; i++)
			this.tabsBar.addColumnDefinition(1, false);
		tabsRoot.addControl(this.tabsBar);

		const panelsWrap = createStackPanel("roundPanelsWrap", BRACKET_STYLES.roundPanelsWrap);
		tabsRoot.addControl(panelsWrap);
		for (let r = 1; r <= this.roundsCount; r++) {
			const tab = createRect(`tab_round_${r}`, BRACKET_STYLES.tabButton);
			const bgTab = createImage(`tab_bg_${r}`, BRACKET_STYLES.bg, "/assets/bg/active.png");
			this.tabButtonsBg.push(bgTab);
			bgTab.isVisible = false;
			tab.addControl(bgTab);
			const tabLabelText = (r === this.roundsCount) ? "🏆" : `${r}`;
			const tabLabel = createTextBlock(`tab_label_${r}`, BRACKET_STYLES.tabLabelInactive, tabLabelText);
			tab.addControl(tabLabel);
			this.tabsBar.addControl(tab, 0, r - 1);

			tab.onPointerDownObservable.add(async () => this.activateRound(r - 1));

			this.tabButtons.push(tab);
			this.tabLabels.push(tabLabel);
			const panel = createStackPanel(`roundPanel_${r}`, BRACKET_STYLES.roundPanel);
			panel.isVisible = (r === this.currentRound);
			panelsWrap.addControl(panel);
			this.roundPanels.push(panel);

			const slots = this.playerTotal / Math.pow(2, r - 1);
			const matches = Math.ceil(slots / 2);

			for (let i = 0; i < matches; i++) {
				const leftSlot = i * 2;
				const rightSlot = i * 2 + 1;

				const leftId = `bracketCell_${r}_${leftSlot}`;
				const rightId = `bracketCell_${r}_${rightSlot}`;

				const rowRect = createRect(`matchRow_${r}_${i}`, BRACKET_STYLES.matchRowRect);
				panel.addControl(rowRect);

				const rowPanel = createStackPanel(`matchRowPanel_${r}_${i}`, BRACKET_STYLES.matchRowPanel);
				rowRect.addControl(rowPanel);

				const leftRect = createRect(`${leftId}_rect`, BRACKET_STYLES.matchPlayerRect);
				rowPanel.addControl(leftRect);
				const leftTb = createTextBlock(leftId, BRACKET_STYLES.matchPlayerText, "tbd");
				leftRect.addControl(leftTb);

				const vsTb = createTextBlock(`vs_${r}_${i}`, BRACKET_STYLES.matchVsText, "← vs →");
				rowPanel.addControl(vsTb);

				const rightRect = createRect(`${rightId}_rect`, BRACKET_STYLES.matchPlayerRect);
				rowPanel.addControl(rightRect);
				const rightTb = createTextBlock(rightId, BRACKET_STYLES.matchPlayerText, "tbd");
				rightRect.addControl(rightTb);
			}
		}

		this.applyTabActiveStyles(this.currentRound - 1);
		this.isCreated = true;
	}

	private applyTabActiveStyles(activeIdx: number): void {
		for (let i = 0; i < this.tabButtons.length; i++) {
			applyStyles(this.tabButtons[i], i === activeIdx ? BRACKET_STYLES.tabButtonActive : BRACKET_STYLES.tabButton);
			applyStyles(this.tabLabels[i], i === activeIdx ? BRACKET_STYLES.tabLabelActive : BRACKET_STYLES.tabLabelInactive);
		
			const bg = this.tabButtonsBg[i];
			if (bg)
				bg.isVisible = (i === activeIdx);
		}
	}

	private async animateMatchRowsIn(panel: StackPanel): Promise<void> {
		const children = panel.children;
		const animationPromises: Promise<void>[] = [];

		children.forEach((child) => {
			if (child.name?.startsWith('matchRow_'))
				animationPromises.push(this.animationManager.fade(child as any, 'in', Motion.F.fast));
		});

		await Promise.all(animationPromises);
	}

	private async activateRound(idx: number): Promise<void> {
		if (idx < 0 || idx >= this.roundPanels.length) return;

		this.applyTabActiveStyles(idx);
		for (let i = 0; i < this.roundPanels.length; i++)
			this.roundPanels[i].isVisible = (i === idx);
		await this.animateMatchRowsIn(this.roundPanels[idx]);
		
	}
}