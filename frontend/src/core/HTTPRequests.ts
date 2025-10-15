// Funtions for handling HTTP requests

const base_url: string = "https://localhost:8443"; // TEMP


export function getSID() {
	let SID = sessionStorage.getItem('sid');
	if (!SID) {
		SID = crypto.randomUUID();
		sessionStorage.setItem('sid', SID);
	}
	return (SID);
}

export async function sendRootRequest(): Promise<string> {
	const url = base_url + `?sid=${getSID()}`;
	const response = await fetch(url, {
		method: "GET",
		headers: { "Content-Type": "application/json"},
	})
	const data = await response.json();
	console.log(data.message);
	return (data.wsURL);
}

export async function sendPOST(endpoint: string, body?: any) {
	const URL = `${base_url}/${endpoint}?sid=${getSID()}`

	const response = await fetch(URL, {
		method: "POST",
		headers: { "Content-Type": "application/json"},
		...(body && { body: JSON.stringify(body) }),
	});

	const data = await response.json();
	console.log(data.message);
	return data;
}

