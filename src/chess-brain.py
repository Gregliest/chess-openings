# chess_eval.py
import chess
import chess.engine
import os

STOCKFISH_PATH = "./public/stockfish/stockfish-macos-m1-apple-silicon"
print(os.access(STOCKFISH_PATH, os.R_OK))


def evaluate(fen):
    print(os.getcwd())

    try:
        with chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH) as engine:
            board = chess.Board(fen)
            result = engine.analyse(board, chess.engine.Limit(time=0.1))
            # Get the score from the perspective of the side to move
            score = result["score"].relative
            # Convert centipawns to pawns
            score_in_pawns = (
                score.score(mate_score=10000) / 100 if score is not None else 0
            )
            # Adjust score to always be from White's perspective
            if board.turn == chess.BLACK:
                score_in_pawns = -score_in_pawns
            return score_in_pawns
    except Exception as e:
        print(f"Error evaluating position: {e}")
        return 0


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Please provide a FEN string as argument")
        sys.exit(1)

    fen = sys.argv[1]
    try:
        score = evaluate(fen)
        print(score)  # Output the evaluation score in pawns
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
