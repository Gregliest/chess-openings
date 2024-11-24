import type { Chess } from "chess.js";

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

function MoveHistory({
	game,
	onNewGame,
}: { game: Chess; onNewGame: () => void }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1rem",
				height: "100%",
			}}
		>
			<button type="button" style={buttonStyle} onClick={onNewGame}>
				New game
			</button>
			<div
				style={{
					width: "200px",
					border: "1px solid #ccc",
					borderRadius: "6px",
					padding: "10px",
					height: "100%",
					flex: 1,
					overflowY: "auto" as const,
				}}
			>
				<h3>Move History</h3>
				<div>
					{game.history().reduce((acc: JSX.Element[], move, index) => {
						if (index % 2 === 0) {
							// Start of a new move pair
							acc.push(
								<div
									key={`move-${Math.floor(index / 2)}`}
									style={{
										padding: "4px",
										borderRadius: "4px",
									}}
								>
									{`${Math.floor(index / 2) + 1}. ${move}${
										game.history()[index + 1]
											? `   ${game.history()[index + 1]}`
											: ""
									}`}
								</div>,
							);
						}
						return acc;
					}, [])}
				</div>
			</div>
		</div>
	);
}

export default MoveHistory;
