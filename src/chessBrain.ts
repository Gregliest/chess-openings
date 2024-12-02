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
		let isFinished = false;
		let finalEval = 0;

		engine.evaluatePosition(fen);
		engine.onMessage(({ positionEvaluation, bestMove }) => {
			if (positionEvaluation && !isFinished) {
				finalEval = Number.parseInt(positionEvaluation) / 100;
				// Negate evaluation if it's black's turn since engine evals are from the perspective of the side to move
				const is_black = fen.split(" ")[1] === "b";
				if (is_black) {
					finalEval = -finalEval;
				}
			}
			if (bestMove) {
				isFinished = true;
				resolve(finalEval);
			}
		});
	});
}
function evaluatePositionWithStockfish(fen: string): Promise<number> {
	return new Promise((resolve) => {
		const stockfish = new Worker("./stockfish.wasm.js");
		let isFinished = false;
		let finalEval = 0;

		stockfish.addEventListener("message", (e) => {
			const message = e.data;
			const cpMatch = message.match(/cp\s+(\S+)/);
			const mateMatch = message.match(/mate\s+(\S+)/);
			const bestMoveMatch = message.match(/bestmove\s+(\S+)/);

			if (cpMatch && !isFinished) {
				finalEval = Number.parseInt(cpMatch[1]) / 100;
				console.log("finalEval", finalEval);
			}
			if (mateMatch && !isFinished) {
				const mateIn = Number.parseInt(mateMatch[1]);
				// Convert mate-in-n to a large evaluation score
				finalEval = mateIn > 0 ? 100 : -100;
			}
			if (bestMoveMatch) {
				isFinished = true;
				stockfish.terminate();
				resolve(finalEval);
			}
		});

		stockfish.postMessage("uci");
		stockfish.postMessage("isready");
		stockfish.postMessage(`position fen ${fen}`);
		stockfish.postMessage("go depth 12");
	});
}

async function getTraps(
	engine: Engine,
	fen: string,
	continuations: Continuation[],
): Promise<Continuation[]> {
	const traps: Continuation[] = [];

	const initialEval = await evaluatePosition(engine, fen);
	console.log("initialEval", initialEval);

	for (const continuation of continuations) {
		if (!continuation.fen) continue;

		const newEval = await evaluatePosition(engine, continuation.fen);
		// If eval changes by more than 2 points against the player to move, it's a trap
		const isWhiteToMove = continuation.fen.split(" ")[1] === "w";
		const evalDiff = newEval - initialEval;
		const isTrap = isWhiteToMove ? evalDiff < -2 : evalDiff > 2;

		if (isTrap) {
			console.log("fen", continuation.fen);
			console.log("trap", continuation.san, newEval);
			traps.push({
				...continuation,
				trapEval: newEval,
			});
		}
	}

	return traps;
}

export {
	getOpeningFromLichess,
	getPossibleContinuations,
	evaluatePosition,
	evaluatePositionWithStockfish,
	getTraps,
};
