interface Translation {
    classicMode: string;
    immersiveMode: string;
    gamePaused: string;
    exitGame: string;
    pauseControls: string;
}

interface Translations {
    [key: string]: Translation;
}

export let currentLanguageIndex: number = 0;
export const languages: string[] = ['English', 'Italiano', 'Française'];

export const translations: Translations = {
    'English': {
        classicMode: 'Classic Mode',
        immersiveMode: 'Immersive Mode',
        gamePaused: 'Game Paused',
        exitGame: 'Exit the game?',
        pauseControls: 'Y - Yes | N - No | ESC - Resume'
    },
    'Italiano': {
        classicMode: 'Modalità Classica',
        immersiveMode: 'Modalità Immersiva',
        gamePaused: 'Gioco in Pausa',
        exitGame: 'Uscire dal gioco?',
        pauseControls: 'Y - Sì | N - No | ESC - Riprendi'
    },
    'Française': {
        classicMode: 'Mode Classique',
        immersiveMode: 'Mode Immersif',
        gamePaused: 'Jeu en Pause',
        exitGame: 'Quitter le jeu?',
        pauseControls: 'Y - Oui | N - Non | ESC - Reprendre'
    }
 };

export function updateLanguageDisplay(): void {
    const currentLang: string = languages[currentLanguageIndex];
    const t: Translation = translations[currentLang];

    const languageDisplay: HTMLElement | null = document.getElementById('language_select');
    if (languageDisplay)
        languageDisplay.textContent = languages[currentLanguageIndex];

    const play2DBtn: HTMLElement | null = document.getElementById('play2D');
    if (play2DBtn)
        play2DBtn.textContent = t.classicMode;
    
    const play3DBtn: HTMLElement | null = document.getElementById('play3D');
    if (play3DBtn)
        play3DBtn.textContent = t.immersiveMode;
    
    const pauseTitles = document.querySelectorAll('.pause-title');
    pauseTitles.forEach((title: Element) => {
        (title as HTMLElement).textContent = t.gamePaused;
    });

    const pauseTexts = document.querySelectorAll('.pause-text');
    pauseTexts.forEach((text: Element) => {
        (text as HTMLElement).textContent = t.exitGame;
    });

    const pauseControls = document.querySelectorAll('.pause-control');
    pauseControls.forEach((control: Element) => {
        (control as HTMLElement).textContent = t.pauseControls;
    });
}

export function previousLanguage() {
    currentLanguageIndex = (currentLanguageIndex - 1 + languages.length) % languages.length;
    updateLanguageDisplay();
    console.log(`Language changed to: ${languages[currentLanguageIndex]}`);
}

export function nextLanguage() {
    currentLanguageIndex = (currentLanguageIndex + 1) % languages.length;
    updateLanguageDisplay();
    console.log(`Language changed to: ${languages[currentLanguageIndex]}`);
}