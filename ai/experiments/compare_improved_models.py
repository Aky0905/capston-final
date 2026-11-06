
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from emotion_engine_tfidf import (
    analyze_emotion as baseline_predict
)

from emotion_engine_improved import (
    analyze_emotion as improved_predict
)

BASE_DIR = Path(__file__).resolve().parent
TEST_PATH = BASE_DIR / "data" / "test.csv"

EMOTIONS = ["행복", "슬픔", "분노", "피로", "평온"]


def evaluate(name, predict, df):
    y_true = df["emotion"].astype(str).tolist()

    y_pred = [
        predict(str(text))["emotion"]
        for text in df["text"]
    ]

    accuracy = accuracy_score(y_true, y_pred)

    print("\n" + "=" * 55)
    print(name)
    print("=" * 55)

    print(f"전체 테스트: {len(df)}개")
    print(f"정답 수: {sum(a == b for a, b in zip(y_true, y_pred))}개")
    print(f"정확도: {accuracy * 100:.2f}%")

    print("\n감정별 평가:")
    print(
        classification_report(
            y_true,
            y_pred,
            labels=EMOTIONS,
            zero_division=0,
        )
    )

    print("\n혼동행렬:")
    labels = EMOTIONS + ["판단 어려움"]

    cm = confusion_matrix(
        y_true,
        y_pred,
        labels=labels,
    )

    print(
        pd.DataFrame(
            cm,
            index=labels,
            columns=labels,
        )
    )

    return accuracy, cm


def main():
    df = pd.read_csv(
        TEST_PATH,
        encoding="utf-8-sig"
    )

    df = df[["text", "emotion"]].dropna()

    old_accuracy, old_cm = evaluate(
        "기존 TF-IDF + Word2Vec",
        baseline_predict,
        df,
    )

    new_accuracy, new_cm = evaluate(
        "개선 TF-IDF + Word2Vec",
        improved_predict,
        df,
    )

    print("\n" + "=" * 55)
    print("최종 비교 결과")
    print("=" * 55)

    print(f"기존 정확도: {old_accuracy * 100:.2f}%")
    print(f"개선 정확도: {new_accuracy * 100:.2f}%")
    print(
        f"정확도 차이: "
        f"{(new_accuracy - old_accuracy) * 100:+.2f}%p"
    )

    # 행복 → 피로 오분류 확인
    happy_idx = EMOTIONS.index("행복")
    tired_idx = EMOTIONS.index("피로")

    print("\n행복을 피로로 잘못 분류한 문장 수")
    print("기존:", old_cm[happy_idx, tired_idx])
    print("개선:", new_cm[happy_idx, tired_idx])

    print("\n행복 문장 정답 수")
    print("기존:", old_cm[happy_idx, happy_idx])
    print("개선:", new_cm[happy_idx, happy_idx])


if __name__ == "__main__":
    main()
