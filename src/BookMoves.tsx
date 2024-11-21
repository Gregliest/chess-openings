import { useState, useEffect } from "react";
import { getOpeningFromLichess, getPossibleContinuations } from "./chessBrain";

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

interface BookMovesProps {
	fen: string;
	rating: number;
}

function BookMoves({ fen, rating }: BookMovesProps) {
	const [opening, setOpening] = useState<OpeningInfo>({
		name: "Starting Position",
	});
	const [continuations, setContinuations] = useState<Continuation[]>([]);

	useEffect(() => {
		getOpeningFromLichess(fen, rating).then(setOpening);
		getPossibleContinuations(fen, rating).then(setContinuations);
	}, [fen, rating]);

	const infoBoxStyle = {
		width: "200px",
		border: "1px solid #ccc",
		borderRadius: "6px",
		padding: "10px",
		height: "220px",
		overflowY: "auto" as const,
	};

	return (
		<div>
			<h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
				{opening.eco && `${opening.eco}: `}
				{opening.name}
			</h2>

			<div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
				<div style={infoBoxStyle}>
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

				<div style={infoBoxStyle}>
					<h3>Opening Traps</h3>
					<div>{/* Traps will be added here later */}</div>
				</div>
			</div>
		</div>
	);
}

export default BookMoves;
