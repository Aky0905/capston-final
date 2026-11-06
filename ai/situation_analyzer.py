
# situation_analyzer.py

SITUATION_KEYWORDS = {
    "인간관계": [
        "친구", "연인", "가족", "부모님",
        "다툼", "싸움", "연락", "이별",
        "사람", "관계", "화해"
    ],
    "학업": [
        "시험", "공부", "과제", "학교",
        "성적", "수업", "학점", "합격",
        "불합격", "발표"
    ],
    "업무": [
        "회사", "직장", "업무", "출근",
        "퇴근", "야근", "상사", "회의",
        "프로젝트", "마감"
    ],
    "운동": [
        "운동", "헬스", "러닝", "달리기",
        "근육", "체력", "훈련", "헬스장"
    ],
    "건강": [
        "감기", "아프", "두통", "몸살",
        "잠", "수면", "불면", "피곤",
        "컨디션", "병원"
    ],
    "일상": [
        "하루", "오늘", "산책", "휴식",
        "여행", "날씨", "주말"
    ]
}


def analyze_situation(text):
    scores = {}

    for situation, keywords in SITUATION_KEYWORDS.items():
        score = sum(
            1 for keyword in keywords
            if keyword in text
        )
        scores[situation] = score

    best_situation = max(scores, key=scores.get)

    if scores[best_situation] == 0:
        return "기타"

    return best_situation


if __name__ == "__main__":
    examples = [
        "친구와 싸워서 너무 속상해",
        "시험에 떨어져서 슬퍼",
        "회사 일이 너무 많아서 지쳤어",
        "운동을 끝내서 뿌듯해",
        "오늘은 마음이 편안해"
    ]

    for sentence in examples:
        print(sentence, "→", analyze_situation(sentence))
