
export function applyTitleStyles(): void {
    const title: HTMLElement | null = document.getElementById('main-title');
    if (title) {
        title.textContent = '🏓 PONG';
        title.style.fontSize = '4rem';
        title.style.fontFamily = '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace';
        title.style.fontWeight = 'bold';
        title.style.textAlign = 'center';
        title.style.color = '#ff6b6b';
        title.style.userSelect = 'none';
    }
}

export function applyButtonStyles(): void {
    const buttons: NodeListOf<Element> = document.querySelectorAll('.buttons');
    buttons.forEach((button: Element) => {
        const btn: HTMLElement = button as HTMLElement;
        
        Object.assign(btn.style, {
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            cursor: 'pointer',
        });
    });
}

export function applyLanguageStyles(): void {
    // Style the table
    const table: HTMLElement | null = document.getElementById('list-buttons');
    if (table) {
        Object.assign(table.style, {
            margin: '2rem auto',
            borderCollapse: 'separate',
            borderSpacing: '10px'
        });
    }

    // Style the language selector container
    const languageSelector: HTMLElement | null = document.querySelector('.language-selector');
    if (languageSelector) {
        Object.assign(languageSelector.style, {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '350px',
            height: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
        });
    }

    // Style the language display
    const languageDisplay: HTMLElement | null = document.querySelector('.language-display');
    if (languageDisplay) {
        Object.assign(languageDisplay.style, {
            fontWeight: 'bold',
            textAlign: 'center',
            userSelect: 'none',
            flex: '1',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace'
        });
    }

    // Style the nav buttons (+ and -)
    const navButtons: NodeListOf<Element> = document.querySelectorAll('.nav-btn');
    navButtons.forEach((button: Element) => {
        const btn: HTMLElement = button as HTMLElement;
        
        Object.assign(btn.style, {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '2rem',
            padding: '0',
            margin: '0 10px',
            fontFamily: 'inherit',
        });
    });
}

export function applyOverlayStyles(): void {
    const overlays: NodeListOf<Element> = document.querySelectorAll('.game-overlay');
    overlays.forEach((overlay : Element) => {
        const overlayEl = overlay as HTMLElement;
        Object.assign(overlayEl.style, {
            display: 'none',
            position: 'fixed',         // Fixed position to cover screen
            top: '0',                  // Start from top
            left: '0',                 // Start from left
            width: '100vw',            // Full viewport width
            height: '100vh',           // Full viewport height
            backgroundColor: '#000',   // Black background
            zIndex: '2',            // Above everything else
            justifyContent: 'center',  // put in the middle
            alignItems: 'center'
    
        });
    });
}

export function applyPauseDialogStyles(): void {
    const pauseDialog: NodeListOf<Element> = document.querySelectorAll('.pause-dialog');
    pauseDialog.forEach((dialog: Element) => {
        const dialogEl = dialog as HTMLElement;

        Object.assign(dialogEl.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
            fontSize: '1.5rem',
            textAlign: 'center',
            userSelect: 'none',
            zIndex: '3'
        });
    });
}

export function showOverlay(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay)
        overlay.style.display = 'flex';
}

export function hideOverlay(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (overlay)
        overlay.style.display = 'none';
}

export function showPauseDialog(dialogId: string): void {
    const dialog = document.getElementById(dialogId);
    if (dialog)
        dialog.style.display = 'flex';
}

export function hidePauseDialog(dialogId: string): void {
    const dialog = document.getElementById(dialogId);
    if (dialog)
        dialog.style.display = 'none';
}
