
from pathlib import Path
import pandas as pd

from emotion_engine_tfidf import (
    analyze_emotion as old_predict
)
from emotion_engine_improved import (
    analyze_emotion as new_predict
)

BASE_DIR = Path(__file__).resolve().parent
TEST_PATH = BASE_DIR / "data" / "test.csv"
OUTPUT_PATH = BASE_DIR / "data" / "improved_error_analysis.csv"


def main():
    df = pd.read_csv(TEST_PATH, encoding="utf-8-sig")
    df = df[["text", "emotion"]].dropna()

    results = []

    for _, row in df.iterrows():
        text = str(row["text"])
        actual = str(row["emotion"])

        old_result = old_predict(text)
        new_result = new_predict(text)

        old_emotion = old_result["emotion"]
        new_emotion = new_result["emotion"]

        if old_emotion == actual and new_emotion != actual:
            change = "새롭게 틀림"
        elif old_emotion != actual and new_emotion == actual:
            change = "새롭게 맞힘"
        elif old_emotion != actual and new_emotion != actual:
            change = "둘 다 틀림"
        else:
            change = "둘 다 맞힘"

        results.append({
            "text": text,
            "actual": actual,
            "old_prediction": old_emotion,
            "new_prediction": new_emotion,
            "change": change,
        })

    result_df = pd.DataFrame(results)

    result_df.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    print("\n예측 변화 요약")
    print(result_df["change"].value_counts())

    for emotion in ["행복", "슬픔", "분노", "피로"]:
        print("\n" + "=" * 55)
        print(f"{emotion} 감정 - 새롭게 틀린 문장")
        print("=" * 55)

        errors = result_df[
            (result_df["actual"] == emotion)
            & (result_df["change"] == "새롭게 틀림")
        ]

        for _, error in errors.head(10).iterrows():
            print("문장:", error["text"])
            print("기존 예측:", error["old_prediction"])
            print("개선 예측:", error["new_prediction"])
            print("-" * 40)

    print("\n분석 결과 저장:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
