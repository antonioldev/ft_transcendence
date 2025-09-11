import { AdvancedDynamicTexture, Control, Rectangle, TextBlock, Grid, ScrollViewer, StackPanel, MultiLine} from "@babylonjs/gui";
import { getCurrentTranslation } from '../../translations/translations.js';
import { AnimationManager, Motion } from "../AnimationManager.js";
import { H_RIGHT, BRACKET_STYLES, applyStyles, createRect, createTextBlock, createGrid, createImage, createStackPanel} from "./GuiStyle.js";

export class MatchTree {
	private playerTotal: number = 0;
	private bracketOverlay!: Rectangle;
	private bracketScroll!: ScrollViewer;
	private bracketGrid!: Grid;
	private isCreated: boolean = false;

	constructor(private adt: AdvancedDynamicTexture, private animationManager: AnimationManager) {

		const t = getCurrentTranslation();

		this.bracketOverlay = createRect("bracketOverlay", BRACKET_STYLES.bracketOverlay);
		this.bracketOverlay.paddingRight = `${this.bracketOverlay.thickness + 8}px`;
		this.adt.addControl(this.bracketOverlay);

		const container = createGrid("bracketContainer", BRACKET_STYLES.bracketContainer);
		container.addRowDefinition(BRACKET_STYLES.containerRows.header, false);
		container.addRowDefinition(BRACKET_STYLES.containerRows.content, false);
		container.addColumnDefinition(1, false);
		this.bracketOverlay.addControl(container);

		const headerGrid = createGrid("headerGrid", BRACKET_STYLES.headerGrid);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.icon, true);
		headerGrid.addColumnDefinition(BRACKET_STYLES.gridColumns.title, false);

		const bracketIcon = createImage("bracketIcon", BRACKET_STYLES.bracketIcon, "assets/icons/tournament.png");
		headerGrid.addControl(bracketIcon, 0, 0);

		const bracketTitle = createTextBlock("bracketTitle", BRACKET_STYLES.bracketTitle, t.tournamentTitle);
		headerGrid.addControl(bracketTitle, 0, 1);

		container.addControl(headerGrid, 0, 0);

		this.bracketScroll = new ScrollViewer("bracketScroll");
		applyStyles(this.bracketScroll, BRACKET_STYLES.bracketScroll);
		this.bracketScroll.verticalBar.isVisible = false;
		this.bracketScroll.horizontalBar.isVisible = true;
		container.addControl(this.bracketScroll, 1, 0);

		const contentWrap = createStackPanel("bracketContentWrap", BRACKET_STYLES.contentWrap);
		this.bracketScroll.addControl(contentWrap);

		this.bracketGrid = createGrid("bracketGrid", BRACKET_STYLES.bracketGrid);
		this.bracketGrid.addRowDefinition(1, false);
		contentWrap.addControl(this.bracketGrid);

	}

	update(winner: string, round_index: number, match_index: number): void {
		if (!this.adt) return;
		if (!this.bracketGrid) return;

		const leftSlot = match_index * 2;
		const rightSlot = match_index * 2 + 1;

		const leftId = `bracketCell_${round_index}_${leftSlot}`;
		const rightId = `bracketCell_${round_index}_${rightSlot}`;
		const nextId = `bracketCell_${round_index + 1}_${match_index}`;

		const leftTb = this.adt.getControlByName(leftId) as TextBlock;
		const rightTb = this.adt.getControlByName(rightId) as TextBlock;
		const leftRect = this.adt.getControlByName(`${leftId}_rect`) as Rectangle;
		const rightRect = this.adt.getControlByName(`${rightId}_rect`) as Rectangle;
		const nextTb   = this.adt.getControlByName(nextId) as TextBlock;

		if (!leftTb || !rightTb || !leftRect || !rightRect) return;

		const isLeftWinner  = leftTb.text  === winner;
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
		if (nextTb)
			nextTb.text = winner;
	}

	insert(
		roundIndex: number,
		matchIndex: number,
		left: string | null,
		right: string | null,
		matchTotal?: number
	): void {
		if (!this.bracketGrid) return;
		if (!this.isCreated && matchTotal !== undefined)
			this.initializeGrid(matchTotal);

		const colPanel = this.bracketGrid.getChildByName(`bracketCol_${roundIndex - 1}`) as StackPanel;
		if (!colPanel) return;

		const leftSlot = matchIndex * 2;
		const rightSlot = matchIndex * 2 + 1;

		const leftId  = `bracketCell_${roundIndex}_${leftSlot}`;
		const rightId = `bracketCell_${roundIndex}_${rightSlot}`;

		const leftTb  = this.adt?.getControlByName(leftId)  as TextBlock;
		const rightTb = this.adt?.getControlByName(rightId) as TextBlock;

		if (left !== null && leftTb !== null)
			leftTb.text = left;
		if (right !== null && rightTb !== null)
			rightTb.text = right;
	}

	show(show: boolean): void {
		if (!this.bracketOverlay || !this.animationManager) return;
		if (show) {
			this.bracketOverlay.isVisible = true;

			this.bracketOverlay.horizontalAlignment = H_RIGHT;
			this.bracketOverlay.paddingRight = "5px"
			this.bracketOverlay.leftInPixels = 400;


			this.animationManager.slideInX(this.bracketOverlay, 400, Motion.F.base);
		} else {
			this.animationManager.slideOutX(this.bracketOverlay, 400, Motion.F.xFast).then(() => {
			this.bracketOverlay!.isVisible = false;
		});
		}
	}

	private initializeGrid(matchTotal: number): void {
		this.playerTotal = matchTotal * 2;
		const rounds = Math.ceil(Math.log2(this.playerTotal));
		const totalColumns = rounds + 1;

		for (let col = 0; col < totalColumns; col++) {
			this.bracketGrid?.addColumnDefinition(220, true);

			const colPanel = createStackPanel(`bracketCol_${col}`, BRACKET_STYLES.bracketColPanel);
			this.bracketGrid?.addControl(colPanel, 1, col);

			const slots = this.playerTotal / Math.pow(2, col);
			for (let i = 0; i < slots; i++) {
				const cellName = `bracketCell_${col + 1}_${i}`;
				const cellHeight = 50 * Math.pow(2, col);
				const cellRect = createRect(`${cellName}_rect`, BRACKET_STYLES.bracketCellRect);
				cellRect.height = `${cellHeight}px`;
				colPanel.addControl(cellRect);
				const tb = createTextBlock( cellName, BRACKET_STYLES.bracketCellText, "");
				tb.fontSize = col === rounds ? 48 : 16;
				tb.text = col === rounds ? "🏆" : "tbd";
				cellRect.addControl(tb);
			}
			this.wireRound(col);
		}
		this.isCreated = true;
	}

	private createAnchorPoint(parentControl: Control, position: 'left' | 'right'): Control {
		const anchor = new Control(`anchor_${parentControl.name}_${position}`);
		anchor.widthInPixels = 1;
		anchor.heightInPixels = 1;
		anchor.isVisible = false;
		anchor.isPointerBlocker = false;
		
		// Position the anchor at the edge of the parent control
		if (position === 'right') {
			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
		} else {
			anchor.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
		}
		anchor.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
		
		// Add the anchor to the same parent as the control
		parentControl.parent?.addControl(anchor);
		
		return anchor;
	}

	private addConnector(src: Control, dst: Control, color = "#BBB", width = 2): MultiLine {
		const line = new MultiLine(`conn_${src.name}_${dst.name}`);
		line.lineWidth = width;
		line.color = color;
		line.alpha = 0.9;
		line.isPointerBlocker = false;
		
		const srcRightAnchor = this.createAnchorPoint(src, 'right');
		const dstLeftAnchor = this.createAnchorPoint(dst, 'left');
		
		line.add(srcRightAnchor);
		line.add(dstLeftAnchor);
		
		this.bracketOverlay?.addControl(line);
		line.zIndex = 5;
		return line;
	}

	
	private wireRound(roundIndex: number): void {
		const slotsInThisRound = this.playerTotal / Math.pow(2, roundIndex - 1);
		const nextRoundMatches = Math.ceil(slotsInThisRound / 2);

		for (let match = 0; match < nextRoundMatches; match++) {
			const leftIdx  = match * 2;
			const rightIdx = match * 2 + 1;

			const left  = this.adt?.getControlByName(`bracketCell_${roundIndex}_${leftIdx}`)  as Control | null;
			const right = this.adt?.getControlByName(`bracketCell_${roundIndex}_${rightIdx}`) as Control | null;
			const next  = this.adt?.getControlByName(`bracketCell_${roundIndex + 1}_${match}`) as Control | null;

			if (!left || !right || !next) continue;

			this.addConnector(left,  next);
			this.addConnector(right, next);
		}
	}

	dispose():void {
		this.bracketGrid.dispose();
		this.bracketScroll.dispose()
		this.bracketOverlay.dispose()

	}

}