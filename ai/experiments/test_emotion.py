
from emotion_engine import analyze_emotion

# 모델을 확인하기 위한 테스트 문장
test_data = [
    ("오늘 정말 신나고 기분이 좋아", "행복"),
    ("친구들과 즐겁게 놀아서 기뻤어", "행복"),
    ("기다리던 소식이 와서 너무 설레", "행복"),

    ("혼자 있으니 마음이 쓸쓸해", "슬픔"),
    ("소중한 사람과 멀어져서 속상해", "슬픔"),
    ("기대했던 일이 실패해서 눈물이 나", "슬픔"),

    ("약속을 어겨서 너무 짜증 나", "분노"),
    ("나를 무시하는 태도에 화가 나", "분노"),
    ("억울한 일을 당해서 정말 열받아", "분노"),

    ("밤새 공부했더니 너무 졸려", "피로"),
    ("하루 종일 일해서 몸이 지쳤어", "피로"),
    ("아무것도 하기 싫고 쉬고 싶어", "피로"),

    ("조용히 산책하니까 마음이 편해", "평온"),
    ("오늘은 걱정 없이 차분한 하루야", "평온"),
    ("따뜻한 차를 마시며 여유를 느껴", "평온"),
]

correct = 0

print("=" * 60)
print("Word2Vec 감정 분석 테스트")
print("=" * 60)

for text, expected in test_data:

    result = analyze_emotion(text, debug=True)
    predicted = result["emotion"]

    is_correct = predicted == expected

    if is_correct:
        correct += 1

    print("\n입력 문장:", text)
    print("정답 감정:", expected)
    print("예측 감정:", predicted)
    print("결과:", "정답" if is_correct else "오답")
    print("-" * 60)

total = len(test_data)
accuracy = correct / total * 100

print("\n" + "=" * 60)
print("최종 테스트 결과")
print("=" * 60)
print(f"전체 문장: {total}개")
print(f"정답 문장: {correct}개")
print(f"오답 문장: {total - correct}개")
print(f"정확도: {accuracy:.2f}%")
