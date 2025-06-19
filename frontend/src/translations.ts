interface Translation {
    classicMode: string;
    immersiveMode: string;
}

interface Translations {
    [key: string]: Translation;
}

export let currentLanguageIndex: number = 0;
export const languages: string[] = ['English', 'Italiano', 'Française'];

export const translations: Translations = {
    'English': {
        classicMode: 'Classic Mode',
        immersiveMode: 'Immersive Mode'
    },
    'Italiano': {
        classicMode: 'Modalità Classica',
        immersiveMode: 'Modalità Immersiva'
    },
    'Française': {
        classicMode: 'Mode Classique',
        immersiveMode: 'Mode Immersif'
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