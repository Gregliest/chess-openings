import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';
import Engine from './stockfish/engine';
import EvalBar from './EvalBar';
import { evaluatePosition } from './chessBrain';
import MoveHistory from './MoveHistory';
import BookMoves from './BookMoves';

const buttonStyle = {
	cursor: 'pointer',
	padding: '10px 20px',
	margin: '10px 10px 0px 0px',
	borderRadius: '6px',
	backgroundColor: '#f0d9b5',
	border: 'none',
	boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)',
	color: '#000000',
};

const boardWrapper = {
	margin: '3rem auto',
	display: 'flex',
	gap: '2rem',
};

function App() {
	const ratingRanges = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];

	const engine = useMemo(() => new Engine(), []);
	const game = useMemo(() => new Chess(), []);
	const [gamePosition, setGamePosition] = useState(game.fen());
	const [selectedRating, setSelectedRating] = useState(1400);
	const [evaluation, setEvaluation] = useState<number>(0);

	function onDrop(
		sourceSquare: string,
		targetSquare: string,
		piece: string,
	): boolean {
		const move = game.move({
			from: sourceSquare,
			to: targetSquare,
			promotion: piece[1].toLowerCase() ?? 'q',
		});
		setGamePosition(game.fen());

		if (move === null) return false;
		if (game.isGameOver() || game.isDraw()) return false;

		evaluatePosition(engine, game.fen()).then((gameEval) => {
			console.log('Position evaluation:', gameEval);
			setEvaluation(gameEval);
		});

		return true;
	}

	const handleNewGame = () => {
		game.reset();
		setGamePosition(game.fen());
	};

	const handleUndo = () => {
		game.undo();
		setGamePosition(game.fen());
	};

	return (
		<div>
			<div style={boardWrapper}>
				<div style={{ display: 'flex', gap: '1rem' }}>
					<EvalBar evaluation={evaluation} />

					<div>
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								marginBottom: '1rem',
							}}
						>
							<select
								value={selectedRating}
								onChange={(e) => setSelectedRating(Number(e.target.value))}
								style={{
									...buttonStyle,
									width: '200px',
									backgroundColor: '#B58863',
									color: 'white',
								}}
							>
								{ratingRanges.map((rating, index) => (
									<option key={rating} value={rating}>
										{rating === 0
											? 'Beginner (0-999)'
											: rating === 2500
												? `Master (${rating}+)`
												: `${rating}-${ratingRanges[index + 1] - 1}`}
									</option>
								))}
							</select>
						</div>

						<div style={{ height: '60vh', width: '60vh' }}>
							<Chessboard
								id="PlayVsStockfish"
								position={gamePosition}
								onPieceDrop={onDrop}
							/>
						</div>
					</div>
				</div>

				<div style={{ height: '66vh' }}>
					<MoveHistory
						game={game}
						onNewGame={handleNewGame}
						onUndo={handleUndo}
					/>
				</div>
			</div>

			<BookMoves fen={gamePosition} rating={selectedRating} engine={engine} />
		</div>
	);
}

export default App;
