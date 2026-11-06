
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)

from emotion_engine import analyze_emotion

BASE_DIR = Path(__file__).resolve().parent
TEST_PATH = BASE_DIR / "data" / "test.csv"

EMOTIONS = ["행복", "슬픔", "분노", "피로", "평온"]


def main():
    df = pd.read_csv(TEST_PATH, encoding="utf-8-sig")
    df = df[["text", "emotion"]].dropna()

    y_true = []
    y_pred = []
    errors = []

    for _, row in df.iterrows():
        text = str(row["text"])
        actual = str(row["emotion"])

        result = analyze_emotion(text)
        predicted = result["emotion"]

        y_true.append(actual)
        y_pred.append(predicted)

        if actual != predicted:
            errors.append({
                "text": text,
                "actual": actual,
                "predicted": predicted,
            })

    accuracy = accuracy_score(y_true, y_pred)

    print("\n" + "=" * 55)
    print("Kiwi + Word2Vec 감정 분석 성능 평가")
    print("=" * 55)

    print(f"전체 테스트 문장: {len(df)}개")
    print(f"정답 수: {sum(a == b for a, b in zip(y_true, y_pred))}개")
    print(f"오답 수: {len(errors)}개")
    print(f"정확도: {accuracy * 100:.2f}%")

    print("\n감정별 평가 결과:")
    print(
        classification_report(
            y_true,
            y_pred,
            labels=EMOTIONS + ["판단 어려움"],
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

    print("\n오답 예시 (최대 20개):")
    for error in errors[:20]:
        print(
            f"문장: {error['text']}\n"
            f"정답: {error['actual']} / "
            f"예측: {error['predicted']}\n"
        )

    # 오답 전체 저장
    error_df = pd.DataFrame(
        errors,
        columns=["text", "actual", "predicted"],
    )

    output_path = BASE_DIR / "data" / "evaluation_errors.csv"

    error_df.to_csv(
        output_path,
        index=False,
        encoding="utf-8-sig",
    )

    print("오답 저장 위치:", output_path)


if __name__ == "__main__":
    main()
