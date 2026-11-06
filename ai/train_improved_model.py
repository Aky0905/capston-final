
from pathlib import Path

import pandas as pd
from gensim.models import Word2Vec

from train_word2vec import tokenize

BASE_DIR = Path(__file__).resolve().parent

TRAIN_PATH = BASE_DIR / "data" / "train_improved.csv"
MODEL_PATH = BASE_DIR / "emotion_word2vec_improved.model"


def main():
    # 개선된 학습 데이터 읽기
    df = pd.read_csv(
        TRAIN_PATH,
        encoding="utf-8-sig"
    )

    df = df[["text", "emotion"]].dropna()

    # Kiwi 형태소 분석
    sentences = [
        tokenize(str(text))
        for text in df["text"]
    ]

    sentences = [
        words for words in sentences if words
    ]

    print("=" * 50)
    print("개선 Word2Vec 모델 학습")
    print("=" * 50)

    print("학습 문장 수:", len(sentences))

    # 기존 모델과 동일한 주요 학습 설정
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

    # 기존 모델은 유지하고 새 이름으로 저장
    model.save(str(MODEL_PATH))

    print("모델 학습 완료")
    print("벡터 크기:", model.vector_size)
    print("학습된 단어 수:", len(model.wv))
    print("저장 위치:", MODEL_PATH)


if __name__ == "__main__":
    main()
