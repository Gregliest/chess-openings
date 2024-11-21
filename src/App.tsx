import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./App.css";
import Engine from "./stockfish/engine";
import EvalBar from "./EvalBar";
import { evaluatePosition } from "./chessBrain";
import MoveHistory from "./MoveHistory";
import BookMoves from "./BookMoves";

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
	const [evaluation, setEvaluation] = useState<number>(0);

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

		evaluatePosition(engine, game.fen()).then(setEvaluation);

		// findbestmove();
		return true;
	}

	const handleNewGame = () => {
		game.reset();
		setGamePosition(game.fen());
	};

	return (
		<div>
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

						<Chessboard
							id="PlayVsStockfish"
							position={gamePosition}
							onPieceDrop={onDrop}
						/>
					</div>
				</div>

				<MoveHistory game={game} onNewGame={handleNewGame} />
			</div>

			<BookMoves fen={gamePosition} />
		</div>
	);
}

export default App;
