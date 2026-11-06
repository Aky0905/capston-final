
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from emotion_engine import (
    analyze_emotion as word2vec_predict
)
from emotion_engine_tfidf import (
    analyze_emotion as tfidf_word2vec_predict
)
from emotion_engine_logistic import (
    analyze_emotion as logistic_predict
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
    cm = confusion_matrix(
        y_true,
        y_pred,
        labels=EMOTIONS,
    )

    print(
        pd.DataFrame(
            cm,
            index=EMOTIONS,
            columns=EMOTIONS,
        )
    )

    return accuracy


def main():
    df = pd.read_csv(
        TEST_PATH,
        encoding="utf-8-sig",
    )

    df = df[["text", "emotion"]].dropna()

    results = {}

    results["Word2Vec"] = evaluate(
        "기존 Word2Vec",
        word2vec_predict,
        df,
    )

    results["TF-IDF + Word2Vec"] = evaluate(
        "TF-IDF + Word2Vec",
        tfidf_word2vec_predict,
        df,
    )

    results["TF-IDF + Logistic Regression"] = evaluate(
        "TF-IDF + Logistic Regression",
        logistic_predict,
        df,
    )

    print("\n" + "=" * 55)
    print("세 모델 최종 비교")
    print("=" * 55)

    for name, accuracy in results.items():
        print(f"{name}: {accuracy * 100:.2f}%")

    best_model = max(results, key=results.get)

    print("\n이번 평가에서 정확도가 가장 높은 모델:")
    print(best_model)


if __name__ == "__main__":
    main()
