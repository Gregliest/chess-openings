interface EvalBarProps {
	evaluation: number;
}

function EvalBar({ evaluation }: EvalBarProps) {
	return (
		<div
			style={{
				width: "30px",
				height: "400px",
				backgroundColor: "#eee",
				marginTop: "72px",
				position: "relative",
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
					height: `${50 - (evaluation * 50) / 10}%`,
					backgroundColor: "#B58863",
					transition: "height 0.3s ease",
				}}
			/>
		</div>
	);
}

export default EvalBar;
