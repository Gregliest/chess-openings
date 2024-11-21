import type Engine from "./stockfish/engine";

const ENDPOINT = "https://explorer.lichess.ovh/lichess";
async function getOpeningFromLichess(fen: string, rating?: number) {
	console.log("getOpeningFromLichess", fen, rating);
	try {
		const ratingParam = rating ? `&ratings=${rating}` : "";
		const response = await fetch(
			`${ENDPOINT}?fen=${encodeURIComponent(fen)}${ratingParam}`,
		);
		const data = await response.json();
		return data.opening || { name: "Unknown Opening" };
	} catch (error) {
		console.error("Error fetching opening:", error);
		return { name: "Error fetching opening" };
	}
}

async function getPossibleContinuations(fen: string, rating?: number) {
	console.log("getPossibleContinuations", fen, rating);
	try {
		const ratingParam = rating ? `&ratings=${rating}` : "";
		const response = await fetch(
			`${ENDPOINT}?fen=${encodeURIComponent(fen)}${ratingParam}`,
		);
		const data = await response.json();
		console.log("getPossibleContinuations data", data);
		return data.moves || [];
	} catch (error) {
		console.error("Error fetching continuations:", error);
		return [];
	}
}

function evaluatePosition(engine: Engine, fen: string): Promise<number> {
	return new Promise((resolve) => {
		engine.evaluatePosition(fen);
		engine.onMessage(({ positionEvaluation }) => {
			if (positionEvaluation) {
				resolve(Number.parseInt(positionEvaluation) / 100);
			}
		});
	});
}

export { getOpeningFromLichess, getPossibleContinuations, evaluatePosition };
