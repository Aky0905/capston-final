
# emotion_corrector.py

from train_word2vec import tokenize

EMOTION_KEYWORDS = {
    "행복": [
        "행복하", "기쁘", "즐겁", "뿌듯하",
        "신나", "만족하"
    ],
    "슬픔": [
        "슬프", "속상하", "우울하",
        "서운하", "실망하", "외롭"
    ],
    "분노": [
        "화나", "화", "짜증", "분노",
        "억울하", "열받"
    ],
    "피로": [
        "지치", "피곤하", "피로",
        "힘들", "녹초"
    ],
    "평온": [
        "편안하", "평온하", "차분하",
        "안정적"
    ]
}


def correct_emotion(text, predicted_emotion):
    tokens = tokenize(text)

    matched_emotions = set()

    for emotion, keywords in EMOTION_KEYWORDS.items():
        for token in tokens:
            if any(
                token.startswith(keyword)
                for keyword in keywords
            ):
                matched_emotions.add(emotion)
                break

    # 명확한 감정이 하나만 발견된 경우 보정
    if len(matched_emotions) == 1:
        corrected = next(iter(matched_emotions))
        return corrected

    # 감정이 없거나 여러 개면 기존 모델 예측 유지
    return predicted_emotion


if __name__ == "__main__":
    examples = [
        ("친구와 싸워서 너무 속상해", "행복"),
        ("시험에 합격해서 기뻐", "행복"),
        ("친구 때문에 화가 나", "행복"),
        ("운동을 많이 해서 지쳤어", "행복"),
    ]

    for sentence, predicted in examples:
        corrected = correct_emotion(sentence, predicted)

        print("입력:", sentence)
        print("기존 예측:", predicted)
        print("보정 결과:", corrected)
        print("-" * 40)
