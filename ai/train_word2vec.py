
from pathlib import Path
from collections import Counter

import pandas as pd
from gensim.models import Word2Vec
from kiwipiepy import Kiwi

BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = BASE_DIR / "data" / "train.csv"
MODEL_PATH = BASE_DIR / "emotion_word2vec_kiwi.model"

kiwi = Kiwi()

# 감정 분석에 사용할 품사
ALLOWED_TAGS = {
    "NNG",  # 일반 명사
    "NNP",  # 고유 명사
    "NNB",  # 의존 명사
    "VV",   # 동사
    "VA",   # 형용사
    "MAG",  # 일반 부사
    "MAJ",  # 접속 부사
    "XR",   # 어근
}


def tokenize(text):
    tokens = kiwi.tokenize(str(text))

    words = []

    for token in tokens:
        # VA-I 등의 태그도 처리
        tag = token.tag.split("-")[0]

        if tag in ALLOWED_TAGS:
            words.append(token.form)

    return words


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"학습 데이터가 없습니다: {DATA_PATH}"
        )

    df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
    df = df[["text", "emotion"]].dropna()

    sentences = [
        tokenize(text)
        for text in df["text"]
    ]

    # 빈 문장 제거
    sentences = [
        sentence
        for sentence in sentences
        if sentence
    ]

    print("=" * 50)
    print("Kiwi 기반 Word2Vec 학습")
    print("=" * 50)

    print("전체 학습 문장 수:", len(sentences))
    print("\n감정별 데이터 수:")
    print(df["emotion"].value_counts())

    print("\n형태소 분석 예시:")
    for text in df["text"].head(3):
        print(text, "->", tokenize(text))

    model = Word2Vec(
        sentences=sentences,
        vector_size=100,
        window=5,
        min_count=1,
        workers=1,
        sg=1,
        epochs=100,
        seed=42
    )

    model.save(str(MODEL_PATH))

    print("\n" + "=" * 50)
    print("Word2Vec 모델 학습 완료!")
    print("=" * 50)

    print("저장 위치:", MODEL_PATH)
    print("벡터 크기:", model.vector_size)
    print("학습된 단어 수:", len(model.wv))

    word_counts = Counter(
        word
        for sentence in sentences
        for word in sentence
    )

    print("\n자주 등장한 단어 TOP 20:")
    for word, count in word_counts.most_common(20):
        print(f"{word}: {count}회")


if __name__ == "__main__":
    main()
