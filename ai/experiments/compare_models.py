
from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score, classification_report

from emotion_engine import analyze_emotion as baseline_predict
from emotion_engine_tfidf import analyze_emotion as tfidf_predict

BASE_DIR = Path(__file__).resolve().parent
TEST_PATH = BASE_DIR / "data" / "test.csv"

EMOTIONS = ["행복", "슬픔", "분노", "피로", "평온"]


def evaluate(name, predict, df):
    y_true = []
    y_pred = []

    for _, row in df.iterrows():
        result = predict(str(row["text"]))

        y_true.append(str(row["emotion"]))
        y_pred.append(result["emotion"])

    accuracy = accuracy_score(y_true, y_pred)

    print("\n" + "=" * 55)
    print(name)
    print("=" * 55)
    print(f"정확도: {accuracy * 100:.2f}%")

    print(
        classification_report(
            y_true,
            y_pred,
            labels=EMOTIONS,
            zero_division=0,
        )
    )

    return accuracy


def main():
    df = pd.read_csv(TEST_PATH, encoding="utf-8-sig")
    df = df[["text", "emotion"]].dropna()

    baseline_acc = evaluate(
        "기존 Word2Vec 모델",
        baseline_predict,
        df,
    )

    tfidf_acc = evaluate(
        "TF-IDF + Word2Vec 모델",
        tfidf_predict,
        df,
    )

    print("\n" + "=" * 55)
    print("최종 비교 결과")
    print("=" * 55)

    print(f"기존 모델: {baseline_acc * 100:.2f}%")
    print(f"개선 모델: {tfidf_acc * 100:.2f}%")
    print(
        f"정확도 차이: "
        f"{(tfidf_acc - baseline_acc) * 100:+.2f}%p"
    )


if __name__ == "__main__":
    main()
