// Declares global types for the Google library.
declare global {
	interface Window {
		google: typeof google.accounts;
		GOOGLE_CLIENT_ID?: string;
	}
}

/**
 * @brief Dynamically loads the Google Identity Services script.
 * @returns A promise that resolves when the script is loaded.
 */
function loadGoogleScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (document.getElementById('google-gsi-script')) {
			resolve();
			return;
		}
		const script = document.createElement('script');
		script.id = 'google-gsi-script';
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load Google GSI script.'));
		document.head.appendChild(script);
	});
}

/**
 * @brief Initializes the Google Identity Services client.
 * @param clientId The Google client ID.
 * @param callback The function to be called after a successful login.
 */
export async function initializeGoogleSignIn(clientId: string, callback: (response: google.accounts.id.CredentialResponse) => void): Promise<void> {
	try {
		await loadGoogleScript();
		if (window.google) {
			window.google.accounts.id.initialize({
				client_id: clientId,
				callback: callback
			});
		} else {
			throw new Error('Google GSI library not available on window.');
		}
	} catch (error) {
		console.error("Error initializing Google Sign-In:", error);
	}
}

/**
 * @brief Renders the Google login button in a specific container.
 * @param containerId The ID of the `div` element where the button will be rendered.
 */
export function renderGoogleButton(containerId: string): void {
	const container = document.getElementById(containerId);
	if (window.google && container) {
		window.google.accounts.id.renderButton(container, {
			theme: 'outline',
			size: 'large',
			type: 'standard',
			shape: 'pill'
		});
	} else {
		console.error('Google GSI client or container not found for rendering button.');
	}
}