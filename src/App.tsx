import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./App.css";
import Engine from "./stockfish/engine";

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
	const [possibleMoves, setPossibleMoves] = useState<any[]>([]);

	async function getOpeningFromLichess(fen: string) {
		try {
			const response = await fetch(
				`https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`,
			);
			const data = await response.json();
			return data.opening || { name: "Unknown Opening" };
		} catch (error) {
			console.error("Error fetching opening:", error);
			return { name: "Unknown Opening" };
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

	function findBestMove() {
		engine.evaluatePosition(game.fen(), stockfishLevel);
		engine.onMessage(({ bestMove }) => {
			if (bestMove) {
				game.move({
					from: bestMove.substring(0, 2),
					to: bestMove.substring(2, 4),
					promotion: bestMove.substring(4, 5),
				});
				setGamePosition(game.fen());
				setMoveHistory(game.history());
			}
		});
	}

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
		getPossibleContinuations(game.fen()).then(setPossibleMoves);

		findBestMove();
		return true;
	}
	function goToPosition(moveIndex: number) {
		const newGame = new Chess();
		for (let i = 0; i <= moveIndex; i++) {
			newGame.move(moveHistory[i]);
		}
		game.load(newGame.fen());
		setGamePosition(game.fen());
		const newHistory = moveHistory.slice(0, moveIndex + 1);
		setMoveHistory(newHistory);

		getOpeningFromLichess(game.fen()).then(setCurrentOpening);
		getPossibleContinuations(game.fen()).then(setPossibleMoves);
	}

	return (
		<div style={boardWrapper}>
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
					}}
				>
					New game
				</button>
			</div>

			<div
				style={{
					width: "200px",
					border: "1px solid #ccc",
					borderRadius: "6px",
					padding: "10px",
					height: "500px",
					overflowY: "auto",
				}}
			>
				<h3>Move History</h3>
				<div>
					{moveHistory.map((move, index) => (
						<div
							key={`move-${index}`}
							style={{
								cursor: "pointer",
								padding: "4px",
								backgroundColor:
									index === moveHistory.length - 1 ? "#f0d9b5" : "transparent",
								borderRadius: "4px",
							}}
							onClick={() => goToPosition(index)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									goToPosition(index);
								}
							}}
							tabIndex={0}
							role="button"
						>
							{Math.floor(index / 2) + 1}.{" "}
							{index % 2 === 0 ? move : `... ${move}`}
						</div>
					))}
				</div>

				<h3>Possible Continuations</h3>
				<div>
					{possibleMoves.map((move, index) => (
						<div
							key={`continuation-${index}`}
							style={{
								padding: "4px",
								borderRadius: "4px",
							}}
						>
							{move.san} ({move.white + move.draws + move.black} games)
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default App;
