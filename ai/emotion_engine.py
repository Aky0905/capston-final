
from pathlib import Path

import numpy as np
import pandas as pd
from gensim.models import Word2Vec

from train_word2vec import tokenize

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "emotion_word2vec_kiwi.model"
DATA_PATH = BASE_DIR / "data" / "train.csv"

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

model = Word2Vec.load(str(MODEL_PATH))


def sentence_vector(text):
    words = tokenize(text)
    known_words = [w for w in words if w in model.wv]

    if not known_words:
        return None

    vectors = [model.wv[w] for w in known_words]
    return np.mean(vectors, axis=0)


def cosine_similarity(a, b):
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def build_emotion_vectors():
    df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
    emotion_vectors = {}

    for emotion in EMOTIONS:
        texts = df.loc[
            df["emotion"] == emotion, "text"
        ].tolist()

        vectors = []

        for text in texts:
            vector = sentence_vector(text)

            if vector is not None:
                vectors.append(vector)

        if not vectors:
            raise ValueError(
                f"{emotion} 감정의 대표 벡터를 생성할 수 없습니다."
            )

        emotion_vectors[emotion] = np.mean(
            vectors, axis=0
        )

        print(
            f"{emotion} 대표 벡터 생성 완료: "
            f"{len(vectors)}개 문장"
        )

    return emotion_vectors


EMOTION_VECTORS = build_emotion_vectors()


def analyze_emotion(text, debug=False):
    words = tokenize(text)
    known_words = [w for w in words if w in model.wv]

    if debug:
        print("\n입력 문장:", text)
        print("분리된 단어:", words)
        print("학습된 단어:", known_words)

    vector = sentence_vector(text)

    if vector is None:
        return {
            "emotion": "판단 어려움",
            "emoji": "🤔",
            "score": 0.0,
            "scores": {},
            "description": "분석할 수 있는 단어가 부족해요.",
        }

    scores = {}

    for emotion, emotion_vector in EMOTION_VECTORS.items():
        scores[emotion] = cosine_similarity(
            vector, emotion_vector
        )

    predicted = max(scores, key=scores.get)

    if debug:
        print("\n감정별 유사도")
        for emotion, score in scores.items():
            print(f"{emotion}: {score:.4f}")

        print("\n최종 분석 결과:", predicted)

    return {
        "emotion": predicted,
        "emoji": EMOJI_MAP[predicted],
        "score": scores[predicted],
        "scores": scores,
        "description": DESCRIPTION_MAP[predicted],
    }
