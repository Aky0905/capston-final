
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

INPUT_PATH = DATA_DIR / "train_improved.csv"
OUTPUT_PATH = DATA_DIR / "train_improved_v2.csv"

additional_data = {
    "행복": [
        "친구와 다시 가까워져서 정말 기뻐",
        "오랫동안 만나지 못했던 친구를 다시 만나 행복해",
        "기대했던 일이 성공해서 기분이 좋아",
        "기대했던 결과보다 더 좋은 성과를 얻어서 뿌듯해",
        "친구에게 좋은 소식을 들어서 함께 기뻐했어",
        "친구와 화해해서 마음이 후련하고 행복해",
        "열심히 준비한 일이 잘 풀려서 즐거워",
        "소중한 친구와 좋은 추억을 만들어서 행복했어",
        "친구의 따뜻한 응원에 기분이 좋아졌어",
        "오랫동안 기다렸던 일이 이루어져서 신나",
    ],
    "슬픔": [
        "친구와 멀어져서 마음이 아프고 슬퍼",
        "친구와 사이가 멀어져서 속상한 마음이 들어",
        "친했던 친구와 연락이 끊겨서 서운해",
        "기대했던 일이 잘되지 않아서 너무 실망했어",
        "기대했던 결과를 얻지 못해서 마음이 무거워",
        "오랫동안 준비한 일이 실패해서 슬퍼",
        "친구와 다툰 뒤 화해하지 못해서 마음이 아파",
        "믿었던 사람에게 실망해서 눈물이 날 것 같아",
        "기대가 컸던 만큼 결과가 좋지 않아 속상해",
        "친구가 멀어지는 것 같아서 외롭고 슬퍼",
    ],
    "분노": [
        "계속 비꼬는 말을 들어서 너무 화가 나",
        "상대방이 비꼬는 말투로 이야기해서 기분이 상했어",
        "계속 무례한 말을 들어서 짜증이 나",
        "친구가 나를 무시하는 말을 해서 화가 났어",
        "반복해서 비난을 들으니 분노가 치밀어",
        "계속 약속을 어기는 행동 때문에 화가 나",
        "내 의견을 무시해서 기분이 나쁘고 짜증 나",
        "상대방이 계속 비꼬아서 불쾌하고 화가 나",
        "무례한 태도를 반복해서 보여서 화가 치밀어",
        "억울하게 비난받아서 정말 화가 났어",
    ],
    "피로": [
        "계속되는 업무 때문에 정신적으로 지쳤어",
        "반복되는 작업 때문에 몸이 피곤해",
        "오랫동안 쉬지 못해서 기운이 없어",
        "계속된 회의 때문에 머리가 무겁고 피곤해",
        "밤새 작업해서 체력이 완전히 바닥났어",
        "반복되는 일정 때문에 몸이 지쳐 있어",
        "오랜 시간 공부해서 집중할 힘이 없어",
        "휴식 없이 일해서 온몸이 피곤해",
        "잠을 충분히 자지 못해서 기운이 빠져",
        "계속되는 과제 때문에 피로가 쌓였어",
    ],
}

def main():
    df = pd.read_csv(INPUT_PATH, encoding="utf-8-sig")

    new_rows = [
        {"text": sentence, "emotion": emotion}
        for emotion, sentences in additional_data.items()
        for sentence in sentences
    ]

    new_df = pd.DataFrame(new_rows)

    combined = pd.concat(
        [df, new_df],
        ignore_index=True
    )

    # 동일 문장에 서로 다른 감정 라벨이 있는지 확인
    conflicts = (
        combined.groupby("text")["emotion"]
        .nunique()
    )

    if (conflicts > 1).any():
        raise ValueError("동일 문장에 서로 다른 감정 라벨이 존재합니다.")

    combined = combined.drop_duplicates(subset=["text"])

    test_df = pd.read_csv(
        DATA_DIR / "test.csv",
        encoding="utf-8-sig"
    )

    # 기존 테스트 문장과 완전히 같은 문장 제외
    test_texts = set(test_df["text"].astype(str))
    combined = combined[
        ~combined["text"].astype(str).isin(test_texts)
    ].copy()

    combined.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    print("=" * 50)
    print("학습 데이터 V2 생성 완료")
    print("=" * 50)

    print("전체 학습 문장:", len(combined))
    print("\n감정별 문장 수:")
    print(combined["emotion"].value_counts())

    print("\n저장 위치:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
