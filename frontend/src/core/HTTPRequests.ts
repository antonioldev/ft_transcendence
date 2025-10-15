import { UserStats, GameHistoryEntry } from "../shared/types";

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
	console.log("SENDING / REQUEST");
	const url = base_url + '/' + `?sid=${getSID()}`;
	console.log(`URL = ${url}`);
	const response = await fetch(url, { method: "GET" })
	console.log(`FETCH SENT`);
	const data = await response.json();
	console.log(`RESPONSE RECEIVED`);
	console.log(data.message);
	return (data.wsURL);
}

export async function sendPOST(endpoint: string, body?: any) {
	const URL = `${base_url}/${endpoint}?sid=${getSID()}`;

	const response = await fetch(URL, {
		method: "POST",
		headers: { "Content-Type": "application/json"},
		...(body && { body: JSON.stringify(body) }),
	});

	const data = await response.json();
	console.log(data.message);
	return (data);
}

export async function sendUserStatsRequest(username: string): Promise<UserStats> {
	const url = base_url + `/stats?username=${username}`;
	const response = await fetch(url, { method: "GET" })
	const data = await response.json();
	console.log(data.message);
	return (data.stats);
}

export async function sendGameHistoryRequest(username: string): Promise<GameHistoryEntry[]> {
	const url = base_url + `/history?username=${username}`;
	const response = await fetch(url, { method: "GET" })
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