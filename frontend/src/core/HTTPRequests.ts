import { UserStats, GameHistoryEntry } from "../shared/types";

const base_url: string = "https://localhost:8443/api"; // TEMP

export function getSID() {
	let SID = sessionStorage.getItem('sid');
	if (!SID) {
		SID = crypto.randomUUID();
		sessionStorage.setItem('sid', SID);
	}
	return (SID);
}

export async function sendRootRequest(): Promise<string> {
	const URL = base_url + '/root' + `?sid=${getSID()}`;
	console.log(`Sending user stats request to ${URL}`);

	const response = await fetch(URL, { method: "GET" })
	const data = await response.json();
	console.log(data.message);
	return (data.wsURL);
}

export async function sendPOST(endpoint: string, body?: any) {
	const URL = `${base_url}/${endpoint}?sid=${getSID()}`;
	console.log(`Sending ${endpoint} POST request to ${URL}`);

	const response = await fetch(URL, {
		method: "POST",
		...(body && { headers : { "Content-Type": "application/json" }}),
		...(body && { body: JSON.stringify(body) }),
	});

	const data = await response.json();
	console.log(data.message);
	return (data);
}

export async function sendUserStatsRequest(username: string): Promise<UserStats> {
	const URL = base_url + `/stats?username=${username}`;
	console.log(`Sending user stats request to ${URL}`);

	const response = await fetch(URL, { method: "GET" })
	const data = await response.json();
	console.log(data.message);
	return (data.stats);
}

export async function sendGameHistoryRequest(username: string): Promise<GameHistoryEntry[]> {
	const URL = base_url + `/history?username=${username}`;
	console.log(`Sending game history request to ${URL}`);

	const response = await fetch(URL, { method: "GET" })
	const data = await response.json();
	console.log(data.message);
	return (data.history);
}

// export async function sendGET(endpoint: string, query_params: any) {
// 	let url = base_url + `?sid=${getSID()}`;
// 	for (const param of query_params) {
// 		url += `?=${param}`;
// 	}
// 	const response = await fetch(url, {
// 		method: "GET",
// 		headers: { "Content-Type": "application/json"},
// 	})
// 	const data = await response.json();
// 	console.log(data.message);
// 	return (data.wsURL);
// }