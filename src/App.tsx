import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./App.css";

function App() {
	const [game, setGame] = useState(new Chess());
	const [moveHistory, setMoveHistory] = useState<string[]>([]);
	const [bestMove, setBestMove] = useState<string | null>(null);
	const [playerColor, setPlayerColor] = useState<"w" | "b">("w");

	// Calculate best move using Stockfish
	const calculateBestMove = () => {
		const stockfish = new Worker("stockfish.js");

		stockfish.onmessage = (e) => {
			const message = e.data;
			if (message.startsWith("bestmove")) {
				const move = message.split(" ")[1];
				makeComputerMove(move);
				stockfish.terminate();
			}
		};

		stockfish.postMessage(`position fen ${game.fen()}`);
		stockfish.postMessage("go depth 15");
	};

	// Handle piece movement
	function makeAMove(sourceSquare: string, targetSquare: string) {
		if (game.turn() !== playerColor) return false;

		try {
			const move = game.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: "q", // always promote to queen for simplicity
			});

			if (move === null) return false; // illegal move
			setGame(new Chess(game.fen())); // update game state
			setMoveHistory(game.history());

			// Calculate computer's response
			calculateBestMove();
			return true;
		} catch (error) {
			return false;
		}
	}

	// Add this new function to handle computer moves
	const makeComputerMove = (moveNotation: string) => {
		const move = game.move(moveNotation);
		if (move) {
			setGame(new Chess(game.fen()));
			setMoveHistory(game.history());
		}
	};

	return (
		<div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
			<div style={{ width: "500px" }}>
				<div style={{ marginBottom: "10px" }}>
					<label>
						Play as:
						<select
							value={playerColor}
							onChange={(e) => setPlayerColor(e.target.value as "w" | "b")}
							style={{ marginLeft: "10px" }}
						>
							<option value="w">White</option>
							<option value="b">Black</option>
						</select>
					</label>
				</div>
				<Chessboard
					position={game.fen()}
					boardOrientation={playerColor === "w" ? "white" : "black"}
					onPieceDrop={(sourceSquare, targetSquare) =>
						makeAMove(sourceSquare, targetSquare)
					}
				/>
			</div>
			<div
				style={{
					width: "200px",
					border: "1px solid #ccc",
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
							style={{ cursor: "pointer" }}
							onClick={() => {
								const newGame = new Chess();
								for (let i = 0; i <= index; i++) {
									newGame.move(moveHistory[i]);
								}
								setGame(newGame);
								setMoveHistory(moveHistory.slice(0, index + 1));
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									const newGame = new Chess();
									for (let i = 0; i <= index; i++) {
										newGame.move(moveHistory[i]);
									}
									setGame(newGame);
									setMoveHistory(moveHistory.slice(0, index + 1));
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
			</div>
		</div>
	);
}

export default App;
