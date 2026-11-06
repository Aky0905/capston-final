
from pathlib import Path

import pandas as pd
from gensim.models import Word2Vec

from train_word2vec import tokenize

BASE_DIR = Path(__file__).resolve().parent

TRAIN_PATH = BASE_DIR / "data" / "train_improved_v2.csv"
MODEL_PATH = BASE_DIR / "emotion_word2vec_improved_v2.model"


def main():
    df = pd.read_csv(
        TRAIN_PATH,
        encoding="utf-8-sig"
    )

    df = df[["text", "emotion"]].dropna()

    sentences = [
        tokenize(str(text))
        for text in df["text"]
    ]

    sentences = [
        tokens for tokens in sentences if tokens
    ]

    print("=" * 50)
    print("Word2Vec 개선 V2 모델 학습")
    print("=" * 50)

    print("전체 학습 문장:", len(sentences))

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

    print("\n모델 학습 완료")
    print("벡터 크기:", model.vector_size)
    print("학습된 단어 수:", len(model.wv))
    print("저장 위치:", MODEL_PATH)


if __name__ == "__main__":
    main()
