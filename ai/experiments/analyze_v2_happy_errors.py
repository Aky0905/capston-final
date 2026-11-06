
from pathlib import Path
import pandas as pd

from emotion_engine_improved import (
    analyze_emotion as predict_v1
)
from emotion_engine_improved_v2 import (
    analyze_emotion as predict_v2
)

BASE_DIR = Path(__file__).resolve().parent
TEST_PATH = BASE_DIR / "data" / "test.csv"
OUTPUT_PATH = BASE_DIR / "data" / "v2_happy_errors.csv"


def main():
    df = pd.read_csv(
        TEST_PATH,
        encoding="utf-8-sig"
    )

    happy_df = df[df["emotion"] == "행복"].copy()
    results = []

    for _, row in happy_df.iterrows():
        sentence = str(row["text"])

        old = predict_v1(sentence)
        new = predict_v2(sentence)

        results.append({
            "text": sentence,
            "v1_prediction": old["emotion"],
            "v2_prediction": new["emotion"],
        })

    result_df = pd.DataFrame(results)

    errors = result_df[
        result_df["v2_prediction"] == "슬픔"
    ].copy()

    errors.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    print("=" * 55)
    print("V2 행복 → 슬픔 오분류 분석")
    print("=" * 55)

    print("행복 문장 전체:", len(happy_df))
    print("슬픔으로 오분류:", len(errors))

    print("\n오분류 문장 목록:")

    for _, row in errors.iterrows():
        print("-" * 45)
        print("문장:", row["text"])
        print("V1 예측:", row["v1_prediction"])
        print("V2 예측:", row["v2_prediction"])

    print("\n결과 저장:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
