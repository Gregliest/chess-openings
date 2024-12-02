import { useState, useEffect } from "react";
import type { Continuation } from "./chessBrain";
import {
	getOpeningFromLichess,
	getPossibleContinuations,
	getTraps,
} from "./chessBrain";
import type Engine from "./stockfish/engine";

interface OpeningInfo {
	eco?: string;
	name?: string;
}

interface BookMovesProps {
	fen: string;
	rating: number;
	engine: Engine;
}

function BookMoves({ fen, rating, engine }: BookMovesProps) {
	const [opening, setOpening] = useState<OpeningInfo>({
		name: "Starting Position",
	});
	const [continuations, setContinuations] = useState<Continuation[]>([]);
	const [traps, setTraps] = useState<Continuation[]>([]);
	const [isLoadingContinuations, setIsLoadingContinuations] = useState(false);
	const [isLoadingTraps, setIsLoadingTraps] = useState(false);

	useEffect(() => {
		getOpeningFromLichess(fen, rating).then(setOpening);

		setIsLoadingContinuations(true);
		setIsLoadingTraps(true);

		getPossibleContinuations(fen, rating).then(async (moves) => {
			setContinuations(moves);
			setIsLoadingContinuations(false);

			const traps = await getTraps(engine, fen, moves);
			setTraps(traps);
			setIsLoadingTraps(false);
		});
	}, [fen, rating, engine]);

	const infoBoxStyle = {
		width: "200px",
		border: "1px solid #ccc",
		borderRadius: "6px",
		padding: "10px",
		height: "220px",
		overflowY: "auto" as const,
	};

	return (
		<div style={{ textAlign: "left" }}>
			<h2 style={{ marginBottom: "1rem" }}>
				{opening.eco && `${opening.eco}: `}
				{opening.name}
			</h2>
			<div style={{ display: "flex", gap: "1rem" }}>
				<div style={infoBoxStyle}>
					<h3>Book Moves</h3>
					<div>
						{isLoadingContinuations ? (
							<div style={{ color: "#666", fontStyle: "italic" }}>
								Loading moves...
							</div>
						) : (
							continuations.map((cont) => (
								<div
									key={cont.san}
									style={{
										padding: "4px",
										borderRadius: "4px",
										fontSize: "0.9rem",
									}}
								>
									{cont.opening?.name && (
										<div style={{ fontSize: "0.8rem", color: "#666" }}>
											{cont.opening.name}
										</div>
									)}
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
							))
						)}
					</div>
				</div>

				<div style={infoBoxStyle}>
					<h3>Opening Traps</h3>
					<div>
						{isLoadingTraps ? (
							<div style={{ color: "#666", fontStyle: "italic" }}>
								Analyzing traps...
							</div>
						) : traps.length === 0 ? (
							<div style={{ color: "#666", fontStyle: "italic" }}>
								No traps found
							</div>
						) : (
							traps.map((trap) => (
								<div
									key={trap.san}
									style={{
										padding: "4px",
										borderRadius: "4px",
										fontSize: "0.9rem",
										color:
											trap.trapEval && trap.trapEval < 0
												? "#d32f2f"
												: "#388e3c",
									}}
								>
									{trap.san} ({trap.trapEval?.toFixed(1)})
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default BookMoves;
