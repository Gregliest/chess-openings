import type Engine from "./stockfish/engine";

async function getOpeningFromLichess(fen: string) {
	try {
		const response = await fetch(
			`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`,
		);
		const data = await response.json();
		return data.opening || { name: "Unknown Opening" };
	} catch (error) {
		console.error("Error fetching opening:", error);
		return { name: "Error fetching opening" };
	}
}

async function getPossibleContinuations(fen: string) {
	try {
		const response = await fetch(
			`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`,
		);
		const data = await response.json();
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
