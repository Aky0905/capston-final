
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

TRAIN_PATH = DATA_DIR / "train.csv"
OUTPUT_PATH = DATA_DIR / "train_improved.csv"

# 행복: 기쁨, 성취감, 만족감, 설렘 등 다양한 표현
happy_sentences = [
    "오랫동안 준비한 시험에 합격해서 정말 뿌듯해",
    "어려운 문제를 혼자 해결해서 성취감이 느껴져",
    "친구에게 칭찬을 받아서 하루 종일 기분이 좋아",
    "기다리던 합격 소식을 듣고 너무 기뻤어",
    "열심히 운동한 결과가 보여서 만족스러워",
    "새로운 프로젝트를 성공적으로 완성해서 기뻐",
    "가족과 함께 맛있는 음식을 먹어서 행복했어",
    "오랜만에 친구들과 웃고 떠들어서 즐거웠어",
    "좋아하는 사람에게 연락이 와서 설레는 마음이야",
    "노력한 만큼 좋은 결과를 얻어서 보람을 느껴",
    "처음 도전한 일에서 성공해서 자신감이 생겼어",
    "목표했던 기록을 달성해서 기분이 최고야",
    "동료들이 내 노력을 인정해 줘서 뿌듯했어",
    "기대했던 여행을 떠나게 돼서 마음이 들떠",
    "좋은 기회를 얻게 되어 무척 신나",
    "어려웠던 과제를 끝내고 나니 후련하고 기뻐",
    "오늘은 좋은 소식이 연달아 들려와서 행복해",
    "소중한 사람과 특별한 추억을 만들어서 즐거워",
    "내가 만든 프로그램이 정상 작동해서 뿌듯해",
    "오랫동안 바라던 꿈에 한 걸음 가까워져서 기뻐",
    "운동을 끝낸 뒤 목표를 달성했다는 만족감이 커",
    "많은 사람 앞에서 발표를 잘 마쳐서 자랑스러워",
    "힘든 과정을 이겨내고 성공해서 보람차",
    "새로운 기술을 익혀서 자신감이 높아졌어",
    "친구의 응원 덕분에 마음이 따뜻하고 행복해",
]

# 피로: 신체적 피로, 정신적 피로, 에너지 부족
tired_sentences = [
    "오랫동안 공부했더니 머리가 무겁고 지쳐",
    "하루 종일 컴퓨터 앞에 앉아 있었더니 눈이 피곤해",
    "잠을 제대로 못 자서 몸에 힘이 하나도 없어",
    "운동을 너무 오래 했더니 근육이 뻐근해",
    "계속되는 야근 때문에 체력이 바닥났어",
    "하루 종일 서서 일했더니 다리가 아파",
    "해야 할 일이 너무 많아서 정신적으로 지쳤어",
    "충분히 쉬지 못해서 피로가 계속 쌓이고 있어",
    "아침부터 바쁘게 움직였더니 기운이 없어",
    "집에 돌아오자마자 쓰러져 잠들고 싶어",
    "반복되는 업무 때문에 집중력이 떨어졌어",
    "밤새 과제를 하느라 몸이 무겁고 피곤해",
    "오래 걸었더니 발이 아프고 힘이 빠져",
    "여러 가지 일을 동시에 처리해서 지쳤어",
    "계속 신경 쓸 일이 많아서 머리가 아파",
    "하루 종일 회의했더니 에너지가 다 소진됐어",
    "쉬는 시간도 없이 일해서 너무 피곤해",
    "몸이 축 처지고 아무것도 할 힘이 없어",
    "늦게까지 코딩했더니 눈과 어깨가 뻐근해",
    "아침부터 저녁까지 공부해서 완전히 녹초가 됐어",
    "사람들을 계속 상대했더니 정신적으로 피곤해",
    "잠깐만 누워서 쉬고 싶을 만큼 지쳤어",
    "무리하게 운동했더니 온몸에 힘이 빠졌어",
    "계속된 일정으로 몸과 마음이 모두 지쳐 있어",
    "일을 마무리했지만 너무 피곤해서 기쁨을 느낄 여유가 없어",
]

def main():
    # 기존 학습 데이터 읽기
    train_df = pd.read_csv(
        TRAIN_PATH,
        encoding="utf-8-sig"
    )

    # 추가 데이터 생성
    happy_df = pd.DataFrame({
        "text": happy_sentences,
        "emotion": "행복"
    })

    tired_df = pd.DataFrame({
        "text": tired_sentences,
        "emotion": "피로"
    })

    # 기존 학습 데이터와 합치기
    improved_df = pd.concat(
        [train_df, happy_df, tired_df],
        ignore_index=True
    )

    # 완전히 동일한 문장 제거
    improved_df = improved_df.drop_duplicates(
        subset=["text"]
    )

    # 기존 테스트 문장과 정확히 겹치는지 검사
    test_df = pd.read_csv(
        DATA_DIR / "test.csv",
        encoding="utf-8-sig"
    )

    overlap = set(improved_df["text"]) & set(test_df["text"])

    if overlap:
        raise ValueError(
            f"테스트 데이터와 중복된 문장 {len(overlap)}개 발견"
        )

    # 새 파일로 저장
    improved_df.to_csv(
        OUTPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    print("=" * 50)
    print("학습 데이터 개선 완료")
    print("=" * 50)

    print(f"기존 학습 문장: {len(train_df)}개")
    print(f"개선 학습 문장: {len(improved_df)}개")

    print("\n감정별 문장 수:")
    print(improved_df["emotion"].value_counts())

    print("\n저장 위치:", OUTPUT_PATH)


if __name__ == "__main__":
    main()
