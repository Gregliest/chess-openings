import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

function App() {
	const [game, setGame] = useState(new Chess());
	const [moveHistory, setMoveHistory] = useState<string[]>([]);
	const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

	// Calculate best move using Stockfish
	const calculateBestMove = (): Promise<string> => {
		console.log('calculating best move');
		return new Promise((resolve) => {
			const stockfish = new Worker('stockfish.js');
			console.log('stockfish worker created');

			stockfish.onmessage = (e) => {
				const message = e.data;
				console.log('stockfish message', message);
				if (message.startsWith('bestmove')) {
					const move = message.split(' ')[1];
					stockfish.terminate();
					resolve(move);
				}
			};

			stockfish.postMessage(`position fen ${game.fen()}`);
			stockfish.postMessage('go movetime 1000');
		});
	};

	function playerMove(sourceSquare: string, targetSquare: string) {
		console.log('player move', sourceSquare, targetSquare);
		if (game.turn() !== playerColor) return false;

		console.log('player move 1');
		try {
			const move = game.move({
				from: sourceSquare,
				to: targetSquare,
				promotion: 'q', // always promote to queen for simplicity
			});

			if (move === null) return false; // illegal move
			console.log('player move 2');
			setGame(new Chess(game.fen())); // update game state
			setMoveHistory(game.history());

			// Calculate and make computer's response
			calculateBestMove().then((bestMove) => {
				console.log('Computer plays:', bestMove);
				computerMove(bestMove);
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	const computerMove = (moveNotation: string) => {
		console.log('computer move', moveNotation);
		const move = game.move(moveNotation);
		if (move) {
			setGame(new Chess(game.fen()));
			setMoveHistory(game.history());
		}
	};

	return (
		<div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
			<div style={{ width: '500px' }}>
				<div style={{ marginBottom: '10px' }}>
					<label>
						Play as:
						<select
							value={playerColor}
							onChange={(e) => setPlayerColor(e.target.value as 'w' | 'b')}
							style={{ marginLeft: '10px' }}
						>
							<option value="w">White</option>
							<option value="b">Black</option>
						</select>
					</label>
				</div>
				<Chessboard
					position={game.fen()}
					boardOrientation={playerColor === 'w' ? 'white' : 'black'}
					onPieceDrop={(sourceSquare, targetSquare) =>
						playerMove(sourceSquare, targetSquare)
					}
				/>
			</div>
			<div
				style={{
					width: '200px',
					border: '1px solid #ccc',
					padding: '10px',
					height: '500px',
					overflowY: 'auto',
				}}
			>
				<h3>Move History</h3>
				<div>
					{moveHistory.map((move, index) => (
						<div
							key={`move-${index}`}
							style={{ cursor: 'pointer' }}
							onClick={() => {
								const newGame = new Chess();
								for (let i = 0; i <= index; i++) {
									newGame.move(moveHistory[i]);
								}
								setGame(newGame);
								setMoveHistory(moveHistory.slice(0, index + 1));
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
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
							{Math.floor(index / 2) + 1}.{' '}
							{index % 2 === 0 ? move : `... ${move}`}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default App;
