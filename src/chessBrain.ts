import { Chess } from "chess.js";
import type Engine from "./stockfish/engine";

export interface Continuation {
	san: string;
	white: number;
	draws: number;
	black: number;
	fen?: string;
	trapEval?: number;
	opening?: {
		eco?: string;
		name?: string;
	};
}

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
async function getPossibleContinuations(
	fen: string,
	rating?: number,
): Promise<Continuation[]> {
	console.log("getPossibleContinuations", fen, rating);
	try {
		const ratingParam = rating ? `&ratings=${rating}` : "";
		const response = await fetch(
			`${ENDPOINT}?fen=${encodeURIComponent(fen)}${ratingParam}`,
		);
		const data = await response.json();

		// Get the moves and add opening info if available
		const moves = data.moves || [];
		const movesWithOpenings = await Promise.all(
			moves.map(async (move: Continuation) => {
				if (!move.fen) {
					// Create a new chess instance with the current position
					const chess = new Chess(fen);
					// Make the move
					chess.move(move.san);
					// Add the calculated fen to the move
					move.fen = chess.fen();
				}

				// Get opening info for each continuation
				const openingInfo = await getOpeningFromLichess(move.fen, rating);
				console.log("openingInfo", openingInfo);
				return {
					...move,
					opening: openingInfo,
				};
			}),
		);
		console.log("movesWithOpenings", movesWithOpenings);

		return movesWithOpenings;
	} catch (error) {
		console.error("Error fetching continuations:", error);
		return [];
	}
}
function evaluatePosition(engine: Engine, fen: string): Promise<number> {
	return new Promise((resolve) => {
		engine.evaluatePosition(fen);
		engine.onMessage(({ positionEvaluation }) => {
			console.log("positionEvaluation", positionEvaluation);
			if (positionEvaluation) {
				resolve(Number.parseInt(positionEvaluation) / 100);
			}
		});
	});
}

async function getTraps(
	engine: Engine,
	fen: string,
	continuations: Continuation[],
): Promise<Continuation[]> {
	const traps: Continuation[] = [];

	const initialEval = await evaluatePosition(engine, fen);

	for (const continuation of continuations) {
		if (!continuation.fen) continue;

		const newEval = await evaluatePosition(engine, continuation.fen);

		// If eval changes by more than 2 points, it's a trap
		if (Math.abs(newEval - initialEval) > 2) {
			traps.push({
				...continuation,
				trapEval: newEval,
			});
			break;
		}
	}

	return traps;
}

export {
	getOpeningFromLichess,
	getPossibleContinuations,
	evaluatePosition,
	getTraps,
};
