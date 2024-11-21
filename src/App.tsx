import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./App.css";
import Engine from "./stockfish/engine";
import EvalBar from "./EvalBar";
import {
	getOpeningFromLichess,
	getPossibleContinuations,
	evaluatePosition,
} from "./chessBrain";

const buttonStyle = {
	cursor: "pointer",
	padding: "10px 20px",
	margin: "10px 10px 0px 0px",
	borderRadius: "6px",
	backgroundColor: "#f0d9b5",
	border: "none",
	boxShadow: "0 2px 5px rgba(0, 0, 0, 0.5)",
	color: "#000000",
};

const boardWrapper = {
	width: "70vw",
	maxWidth: "70vh",
	margin: "3rem auto",
	display: "flex",
	gap: "2rem",
};

interface OpeningInfo {
	eco?: string;
	name?: string;
}

interface Continuation {
	san: string;
	white: number;
	draws: number;
	black: number;
}

function App() {
	const levels = {
		"Easy 🤓": 2,
		"Medium 🧐": 8,
		"Hard 😵": 18,
	};

	const engine = useMemo(() => new Engine(), []);
	const game = useMemo(() => new Chess(), []);
	const [gamePosition, setGamePosition] = useState(game.fen());
	const [stockfishLevel, setStockfishLevel] = useState(2);
	const [moveHistory, setMoveHistory] = useState<string[]>([]);
	const [currentOpening, setCurrentOpening] = useState<OpeningInfo>({
		name: "Starting Position",
	});
	const [evaluation, setEvaluation] = useState<number>(0);
	const [continuations, setContinuations] = useState<Continuation[]>([]);

	function onDrop(
		sourceSquare: string,
		targetSquare: string,
		piece: string,
	): boolean {
		const move = game.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: piece[1].toLowerCase() ?? "q",
		});
		setGamePosition(game.fen());

		if (move === null) return false;
		if (game.isGameOver() || game.isDraw()) return false;

		const newHistory = game.history();
		setMoveHistory(newHistory);

		getOpeningFromLichess(game.fen()).then(setCurrentOpening);
		getPossibleContinuations(game.fen()).then(setContinuations);
		evaluatePosition(engine, game.fen()).then(setEvaluation);

		// findbestmove();
		return true;
	}

	return (
		<div style={boardWrapper}>
			<div style={{ display: "flex", gap: "1rem" }}>
				<EvalBar evaluation={evaluation} />

				<div>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							marginBottom: "1rem",
						}}
					>
						{Object.entries(levels).map(([level, depth]) => (
							<button
								key={level}
								type="button"
								style={{
									...buttonStyle,
									backgroundColor:
										depth === stockfishLevel ? "#B58863" : "#f0d9b5",
								}}
								onClick={() => setStockfishLevel(depth)}
							>
								{level}
							</button>
						))}
					</div>

					<div
						style={{
							textAlign: "center",
							marginBottom: "1rem",
							fontSize: "1.2rem",
							fontWeight: "bold",
						}}
					>
						{currentOpening.eco && `${currentOpening.eco}: `}
						{currentOpening.name}
					</div>

					<Chessboard
						id="PlayVsStockfish"
						position={gamePosition}
						onPieceDrop={onDrop}
					/>

					<button
						type="button"
						style={buttonStyle}
						onClick={() => {
							game.reset();
							setGamePosition(game.fen());
							setMoveHistory([]);
							setContinuations([]);
						}}
					>
						New game
					</button>
				</div>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				<div
					style={{
						width: "200px",
						border: "1px solid #ccc",
						borderRadius: "6px",
						padding: "10px",
						height: "250px",
						overflowY: "auto",
					}}
				>
					<h3>Move History</h3>
					<div>
						{moveHistory.map((move, index) => (
							<div
								key={`${move}-${index}`}
								style={{
									padding: "4px",
									borderRadius: "4px",
								}}
							>
								{Math.floor(index / 2) + 1}.{" "}
								{index % 2 === 0 ? move : `... ${move}`}
							</div>
						))}
					</div>
				</div>

				<div
					style={{
						width: "200px",
						border: "1px solid #ccc",
						borderRadius: "6px",
						padding: "10px",
						height: "220px",
						overflowY: "auto",
					}}
				>
					<h3>Book Moves</h3>
					<div>
						{continuations.map((cont) => (
							<div
								key={cont.san}
								style={{
									padding: "4px",
									borderRadius: "4px",
									fontSize: "0.9rem",
								}}
							>
								{cont.san} (
								{Math.round(
									((cont.white + cont.black + cont.draws) /
										continuations.reduce(
											(sum, c) => sum + c.white + c.black + c.draws,
											0,
										)) *
										100,
								)}
								%)
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
