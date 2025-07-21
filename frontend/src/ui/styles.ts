// ========================================
// COLOR PALETTE
// ========================================
export const UI_COLORS = {
    primary: '#ff6b6b',
    background: '#1a1a1a',
    surface: '#333',
    text: 'white',
    textSecondary: '#ccc',
    overlay: 'rgba(0, 0, 0, 0.9)'
};

export const UI_STYLES = {
    // ========================================
    // LAYOUT & CONTAINERS
    // ========================================
    screen: {
        display: 'none',
        position: 'fixed' as const,
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'black',
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        zIndex: '10',
        padding: '20px',
        boxSizing: 'border-box' as const
    },

    overlay: {
        display: 'flex',
        backgroundColor: UI_COLORS.overlay
    },

    container: {
        backgroundColor: UI_COLORS.background,
        padding: '2rem',
        borderRadius: '10px',
        textAlign: 'center' as const,
        border: `2px solid ${UI_COLORS.primary}`,
        width: '90vw',
        maxWidth: '500px',
        height: 'auto',
        maxHeight: '85vh',
        overflow: 'auto',
        margin: '20px auto',
        boxSizing: 'border-box' as const
    },

    // ========================================
    // FORM ELEMENTS
    // ========================================
    formGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        gap: '15px',
        margin: '1rem auto',
        width: '100%',
        maxWidth: '400px'
    },

    fieldset: {
        border: 'none',
        padding: '0',
        margin: '0'
    },

    input: {
        width: '100%',
        maxWidth: '400px',
        height: '50px',
        fontSize: '1rem',
        padding: '8px',
        border: `2px solid ${UI_COLORS.primary}`,
        borderRadius: '5px',
        backgroundColor: UI_COLORS.surface,
        color: UI_COLORS.text,
        textAlign: 'center' as const,
        boxSizing: 'border-box' as const
    },

    label: {
        fontSize: '1rem',
        color: UI_COLORS.text,
        marginTop: '5px',
        display: 'block'
    },

    // ========================================
    // BUTTONS
    // ========================================
    button: {
        fontWeight: 'bold',
        cursor: 'pointer' as const,
        backgroundColor: UI_COLORS.surface,
        color: UI_COLORS.text,
        border: `2px solid ${UI_COLORS.primary}`,
        borderRadius: '5px',
        width: '100%',
        maxWidth: '350px',
        height: '50px',
        fontSize: '1rem',
        boxSizing: 'border-box' as const
    },

    playButton: {
        fontSize: '3rem',
        fontWeight: 'bold',
        width: '100%',
        maxWidth: '400px',
        height: '100px',
        marginBottom: '2rem',
        backgroundColor: UI_COLORS.primary,
        color: 'white',
        borderColor: UI_COLORS.primary,
        boxSizing: 'border-box' as const
    },

    secondary: { 
        width: '150px', 
        height: '35px', 
        fontSize: '0.8rem',
        backgroundColor: '#666',
        borderColor: 'white',
        margin: '10px'
    },

    navButton: {
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        margin: '0 10px',
        width: 'auto',
        height: 'auto',
        color: UI_COLORS.text
    },

    // ========================================
    // TYPOGRAPHY
    // ========================================
    title: {
        fontSize: '1.8rem',
        color: UI_COLORS.primary,
        marginBottom: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'center' as const,
        userSelect: 'none' as const
    },

    mainTitle: { 
        fontSize: '4rem',
        marginBottom: '3rem'
    },

    infoText: {
        fontSize: '0.9rem',
        color: UI_COLORS.textSecondary,
        fontStyle: 'italic' as const
    },

    // ========================================
    // SELECTORS & NAVIGATION
    // ========================================
    selector: {
        display: 'inline-flex',
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        width: '350px',
        height: '50px',
        fontSize: '1rem',
        fontWeight: 'bold'
    },

    selectorText: {
        fontWeight: 'bold',
        textAlign: 'center' as const,
        userSelect: 'none' as const,
        flex: '1',
        color: UI_COLORS.text
    },

    // ========================================
    // AUTHENTICATION & USER INFO
    // ========================================
    authArea: {
        position: 'fixed' as const,
        top: '20px',
        right: '20px',
        display: 'flex',
        gap: '10px',
        zIndex: '1000',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: '5px',
        borderRadius: '8px'
    },

    userInfo: {
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        border: `1px solid ${UI_COLORS.primary}`
    },
        
    userName: {
        color: UI_COLORS.text,
        minWidth: '120px',
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '5px',
        userSelect: 'none' as const,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '5px 10px',
        borderRadius: '5px',
        border: `1px solid ${UI_COLORS.primary}`
    },

    // ========================================
    // CONNECTION STATUS
    // ========================================
    connectionStatus: {
        position: 'fixed' as const,
        top: '20px',
        left: '20px', 
        padding: '4px 8px',
        borderRadius: '5px',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        zIndex: '1000',
        backgroundColor: 'transparent',
        color: 'white'
    },

    // ========================================
    // GAME DIALOGS & OVERLAYS
    // ========================================
    gameOverlay: {
        position: 'absolute' as const,
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'none',
        flexDirection: 'column' as const,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        color: UI_COLORS.text,
        textAlign: 'center' as const,
        userSelect: 'none' as const,
        zIndex: '1000' !important
    },

    // Pause dialog text sizes
    pauseLarge: { fontSize: '1.5rem', marginBottom: '1rem' },
    pauseMedium: { fontSize: '1.2rem', marginBottom: '0.5rem' },
    pauseSmall: { fontSize: '1rem' },

    // Loading items
    loadingContent: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        gap: '20px'
    },
    progressBar: {
        width: '300px',
        height: '20px',
        backgroundColor: '#333',
        borderRadius: '10px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: UI_COLORS.primary,
        width: '0%',
        transition: 'width 0.3s ease'
    },

    // ========================================
    // FORM SPECIFIC
    // ========================================

    setupForm: { 
        display: 'none', 
        margin: '1rem 0' 
    }
};