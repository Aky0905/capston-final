
from kiwipiepy import Kiwi

kiwi = Kiwi()

sentences = [
    "친구들과 즐겁게 놀아서 기뻤어",
    "오늘 정말 행복한 하루였어",
    "약속을 어겨서 너무 화가 났어",
    "밤새 공부했더니 너무 피곤해",
    "조용히 산책하니까 마음이 편안해",
]

for sentence in sentences:
    print("\n입력 문장:", sentence)

    tokens = kiwi.tokenize(sentence)

    print("형태소 분석 결과:")
    print([(token.form, token.tag) for token in tokens])

    print("단어 추출 결과:")
    words = [
        token.form
        for token in tokens
        if token.tag.startswith(("N", "V", "M"))
    ]

    print(words)
