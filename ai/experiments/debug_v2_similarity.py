
from emotion_engine_improved_v2 import analyze_emotion
from train_word2vec import tokenize

sentences = [
    "오늘은 모든 일이 잘 풀리는 것 같아",
    "열심히 준비한 일이 잘돼서 뿌듯해",
    "열심히 준비한 일이 실패해서 실망했어",
    "기대했던 일이 성공해서 기뻐",
    "기대했던 일이 실패해서 슬퍼",
]

for sentence in sentences:
    print("\n" + "=" * 60)
    print("입력 문장:", sentence)

    tokens = tokenize(sentence)
    print("형태소 분석:", tokens)

    result = analyze_emotion(sentence)

    print("최종 예측:", result["emotion"])

    print("\n감정별 유사도:")

    scores = result.get("scores", {})

    for emotion, score in sorted(
        scores.items(),
        key=lambda item: item[1],
        reverse=True
    ):
        print(f"{emotion}: {float(score):.4f}")

sentences = [
    "친구와 싸워서 너무 속상해",
    "친구와 다퉈서 마음이 아파",
    "친구와 즐겁게 놀아서 행복해",
    "친구 때문에 화가 나",
    "친구와 화해해서 기뻐",
]