
from pathlib import Path

import numpy as np
import pandas as pd
from gensim.models import Word2Vec
from sklearn.feature_extraction.text import TfidfVectorizer

from train_word2vec import tokenize

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "emotion_word2vec_kiwi.model"
TRAIN_PATH = BASE_DIR / "data" / "train.csv"

EMOTIONS = ["행복", "슬픔", "분노", "피로", "평온"]

EMOJI_MAP = {
    "행복": "😊",
    "슬픔": "😢",
    "분노": "😡",
    "피로": "😫",
    "평온": "😌",
}

DESCRIPTION_MAP = {
    "행복": "기쁘고 즐거운 감정이 느껴져요.",
    "슬픔": "슬프거나 속상한 감정이 느껴져요.",
    "분노": "화가 나거나 답답한 감정이 느껴져요.",
    "피로": "피곤하거나 지친 감정이 느껴져요.",
    "평온": "차분하고 편안한 감정이 느껴져요.",
}

# 1. 기존 Word2Vec 모델 불러오기
model = Word2Vec.load(str(MODEL_PATH))

# 2. 학습 데이터만 불러오기
train_df = pd.read_csv(TRAIN_PATH, encoding="utf-8-sig")
train_df = train_df[["text", "emotion"]].dropna()

# 3. Kiwi 형태소 분석
tokenized_sentences = [
    tokenize(text)
    for text in train_df["text"]
]

# 4. 학습 데이터만 사용해 TF-IDF 학습
tfidf = TfidfVectorizer(
    analyzer=lambda tokens: tokens,
    lowercase=False,
    token_pattern=None,
)

tfidf.fit(tokenized_sentences)

# 단어별 IDF 값
idf_weights = dict(
    zip(
        tfidf.get_feature_names_out(),
        tfidf.idf_,
    )
)


def sentence_vector(text):
    words = tokenize(text)

    known_words = [
        word for word in words
        if word in model.wv
    ]

    if not known_words:
        return None

    # 입력 문장의 TF-IDF 가중치 계산
    tfidf_values = tfidf.transform([words]).toarray()[0]

    vocabulary = tfidf.vocabulary_

    vectors = []
    weights = []

    for word in known_words:
        if word not in vocabulary:
            continue

        index = vocabulary[word]
        weight = tfidf_values[index]

        if weight > 0:
            vectors.append(model.wv[word])
            weights.append(weight)

    if not vectors:
        return None

    return np.average(
        np.array(vectors),
        axis=0,
        weights=np.array(weights),
    )


def cosine_similarity(a, b):
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(
        np.dot(a, b) / (norm_a * norm_b)
    )


def build_emotion_vectors():
    emotion_vectors = {}

    for emotion in EMOTIONS:
        texts = train_df.loc[
            train_df["emotion"] == emotion,
            "text"
        ].tolist()

        vectors = []

        for text in texts:
            vector = sentence_vector(text)

            if vector is not None:
                vectors.append(vector)

        if not vectors:
            raise ValueError(
                f"{emotion} 대표 벡터 생성 실패"
            )

        emotion_vectors[emotion] = np.mean(
            vectors, axis=0
        )

        print(
            f"{emotion} TF-IDF 대표 벡터 생성 완료: "
            f"{len(vectors)}개"
        )

    return emotion_vectors


EMOTION_VECTORS = build_emotion_vectors()


def analyze_emotion(text, debug=False):
    words = tokenize(text)

    vector = sentence_vector(text)

    if vector is None:
        return {
            "emotion": "판단 어려움",
            "emoji": "🤔",
            "score": 0.0,
            "scores": {},
            "description": "분석할 수 있는 단어가 부족해요.",
        }

    scores = {
        emotion: cosine_similarity(vector, emotion_vector)
        for emotion, emotion_vector in EMOTION_VECTORS.items()
    }

    predicted = max(scores, key=scores.get)

    if debug:
        print("\n입력 문장:", text)
        print("분리된 단어:", words)
        print("감정별 유사도:", scores)
        print("예측 감정:", predicted)

    return {
        "emotion": predicted,
        "emoji": EMOJI_MAP[predicted],
        "score": scores[predicted],
        "scores": scores,
        "description": DESCRIPTION_MAP[predicted],
    }
