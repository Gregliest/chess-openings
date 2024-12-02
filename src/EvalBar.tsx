interface EvalBarProps {
	evaluation: number;
}

function EvalBar({ evaluation }: EvalBarProps) {
	return (
		<div
			style={{
				width: "30px",
				height: "80%",
				backgroundColor: "#eee",
				marginTop: "72px",
				position: "relative",
				flex: 1,
			}}
		>
			<span
				style={{
					position: "absolute",
					left: "50%",
					top: "-25px",
					transform: "translateX(-50%)",
					color: "#000",
					whiteSpace: "nowrap",
				}}
			>
				{evaluation > 0 ? "+" : ""}
				{evaluation.toFixed(1)}
			</span>
			<div
				style={{
					width: "100%",
					height: `${Math.abs(evaluation) >= 100 ? (evaluation > 0 ? 0 : 100) : 50 - (evaluation * 50) / 10}%`,
					backgroundColor: "#B58863",
					transition: "height 0.3s ease",
				}}
			/>
		</div>
	);
}

export default EvalBar;
