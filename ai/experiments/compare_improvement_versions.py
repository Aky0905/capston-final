
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from emotion_engine_tfidf import analyze_emotion as baseline
from emotion_engine_improved import analyze_emotion as version1
from emotion_engine_improved_v2 import analyze_emotion as version2

BASE_DIR = Path(__file__).resolve().parent
TEST_PATH = BASE_DIR / "data" / "test.csv"

EMOTIONS = ["행복", "슬픔", "분노", "피로", "평온"]


def evaluate(name, predict, df):
    actual = df["emotion"].astype(str).tolist()
    predicted = [
        predict(str(text))["emotion"]
        for text in df["text"]
    ]

    accuracy = accuracy_score(actual, predicted)

    print("\n" + "=" * 55)
    print(name)
    print("=" * 55)
    print(f"정확도: {accuracy * 100:.2f}%")

    print("\n감정별 성능")
    print(
        classification_report(
            actual,
            predicted,
            labels=EMOTIONS,
            zero_division=0
        )
    )

    matrix = confusion_matrix(
        actual,
        predicted,
        labels=EMOTIONS
    )

    print("\n혼동행렬")
    print(
        pd.DataFrame(
            matrix,
            index=EMOTIONS,
            columns=EMOTIONS
        )
    )

    return {
        "name": name,
        "accuracy": accuracy,
        "matrix": matrix
    }


def main():
    df = pd.read_csv(
        TEST_PATH,
        encoding="utf-8-sig"
    )

    df = df[["text", "emotion"]].dropna()

    results = [
        evaluate("기존 모델", baseline, df),
        evaluate("개선 V1", version1, df),
        evaluate("개선 V2", version2, df)
    ]

    print("\n" + "=" * 55)
    print("모델별 최종 비교")
    print("=" * 55)

    for result in results:
        matrix = result["matrix"]

        happy_correct = matrix[0, 0]
        sad_correct = matrix[1, 1]
        angry_correct = matrix[2, 2]
        tired_correct = matrix[3, 3]

        happy_to_tired = matrix[0, 3]

        print(f"\n[{result['name']}]")
        print(f"전체 정확도: {result['accuracy'] * 100:.2f}%")
        print(f"행복 정답: {happy_correct}/60")
        print(f"슬픔 정답: {sad_correct}/60")
        print(f"분노 정답: {angry_correct}/60")
        print(f"피로 정답: {tired_correct}/60")
        print(f"행복 → 피로 오분류: {happy_to_tired}개")


if __name__ == "__main__":
    main()
