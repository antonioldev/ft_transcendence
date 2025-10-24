const base_url: string = `https://${window.location.hostname}:8443/api`; // TEMP

export function getSID() {
	let SID = sessionStorage.getItem('sid');
	if (!SID) {
		SID = crypto.randomUUID();
		sessionStorage.setItem('sid', SID);
	}
	return (SID);
}

export async function sendPOST(endpoint: string, body?: any) {
	const URL = `${base_url}/${endpoint}?sid=${getSID()}`;
	console.log(`Sending ${endpoint} POST request to ${URL}`);

	const response = await fetch(URL, {
		method: "POST",
		...(body && { headers : { "Content-Type": "application/json" }}),
		...(body && { body: JSON.stringify(body) }),
	});

	// const data = await response.json(); // this fails if no content is returned ***
	const text = await response.text();
	const data = text ? JSON.parse(text) : {};
	console.log(data.message);
	return (data);
}

export async function sendGET(endpoint: string, query_params?: string[]) {
	let URL = `${base_url}/${endpoint}?sid=${getSID()}`;
	for (const param of query_params ?? []) {
		URL += `&${param}`;
	}
	console.log(`Sending ${endpoint} GET request to ${URL}`);

	const response = await fetch(URL, { method: "GET" });
	// const data = await response.json();
	const text = await response.text();
	const data = text ? JSON.parse(text) : {};
	console.log(data.message);
	return (data);
}
