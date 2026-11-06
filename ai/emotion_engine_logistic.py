
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from train_word2vec import tokenize

BASE_DIR = Path(__file__).resolve().parent
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


def kiwi_tokenizer(text):
    return tokenize(text)


# 학습 데이터 불러오기
train_df = pd.read_csv(
    TRAIN_PATH,
    encoding="utf-8-sig"
)

train_df = train_df[["text", "emotion"]].dropna()

# TF-IDF + Logistic Regression 파이프라인
pipeline = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            tokenizer=kiwi_tokenizer,
            token_pattern=None,
            lowercase=False,
            ngram_range=(1, 2),
        ),
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=2000,
            random_state=42,
        ),
    ),
])

print("TF-IDF + Logistic Regression 학습 시작")

pipeline.fit(
    train_df["text"].astype(str),
    train_df["emotion"].astype(str),
)

print(
    f"학습 완료: {len(train_df)}개 문장"
)


def analyze_emotion(text, debug=False):
    text = str(text).strip()

    if not text:
        return {
            "emotion": "판단 어려움",
            "emoji": "🤔",
            "score": 0.0,
            "scores": {},
            "description": "분석할 문장을 입력해 주세요.",
        }

    probabilities = pipeline.predict_proba([text])[0]
    classes = pipeline.classes_

    scores = {
        emotion: float(probability)
        for emotion, probability in zip(
            classes, probabilities
        )
    }

    predicted = max(scores, key=scores.get)

    if debug:
        print("\n입력 문장:", text)
        print("분리된 단어:", tokenize(text))
        print("감정별 예측 확률:", scores)
        print("최종 분석 결과:", predicted)

    return {
        "emotion": predicted,
        "emoji": EMOJI_MAP[predicted],
        "score": scores[predicted],
        "scores": scores,
        "description": DESCRIPTION_MAP[predicted],
    }
