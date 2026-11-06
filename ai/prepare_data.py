
from pathlib import Path
from collections import defaultdict
from difflib import SequenceMatcher
import re

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

SOURCE_PATH = DATA_DIR / "emotion_dataset.csv"
TRAIN_PATH = DATA_DIR / "train.csv"
TEST_PATH = DATA_DIR / "test.csv"

# 동일한 문장에 붙인 도입 표현 제거
PREFIXES = [
    "오늘은", "오늘따라", "요즘은", "지금은",
    "왠지", "문득", "생각보다", "오랜만에",
    "하루 종일", "나는", "정말", "너무",
]

def normalize_text(text):
    text = str(text).strip()
    text = re.sub(r"\s+", " ", text)

    changed = True
    while changed:
        changed = False

        for prefix in sorted(PREFIXES, key=len, reverse=True):
            if text.startswith(prefix + " "):
                text = text[len(prefix):].strip()
                changed = True
                break

    return text


def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()


def make_groups(texts, threshold=0.88):
    """
    정규화 후 같은 문장이나 매우 비슷한 문장을
    하나의 그룹으로 묶는다.
    """
    normalized = [normalize_text(t) for t in texts]
    parent = list(range(len(texts)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    for i in range(len(texts)):
        for j in range(i + 1, len(texts)):
            if similar(normalized[i], normalized[j]) >= threshold:
                union(i, j)

    groups = defaultdict(list)

    for i in range(len(texts)):
        groups[find(i)].append(i)

    return list(groups.values())


def main():
    if not SOURCE_PATH.exists():
        raise FileNotFoundError(
            f"CSV 파일이 없습니다: {SOURCE_PATH}"
        )

    df = pd.read_csv(SOURCE_PATH, encoding="utf-8-sig")
    df = df[["text", "emotion"]].dropna().copy()
    df["text"] = df["text"].astype(str).str.strip()
    df["emotion"] = df["emotion"].astype(str).str.strip()

    # 같은 문장에 서로 다른 감정 라벨이 있는지 확인
    conflicts = df.groupby("text")["emotion"].nunique()
    if (conflicts > 1).any():
        raise ValueError(
            "동일 문장에 서로 다른 감정 라벨이 있습니다."
        )

    # 완전히 동일한 문장 제거
    df = df.drop_duplicates(subset=["text", "emotion"])
    df = df.reset_index(drop=True)

    train_parts = []
    test_parts = []

    for emotion, subset in df.groupby("emotion", sort=True):
        subset = subset.reset_index(drop=True)
        groups = make_groups(subset["text"].tolist())

        # 큰 그룹부터 배치하여 비슷한 문장 분리 방지
        groups.sort(key=lambda g: (-len(g), min(g)))

        target_test = round(len(subset) * 0.2)
        test_indices = set()

        for group in groups:
            if len(test_indices) + len(group) <= target_test:
                test_indices.update(group)

        # 테스트 데이터가 비어 있으면 경고
        if not test_indices:
            print(f"경고: {emotion} 테스트 그룹이 없습니다.")

        mask = subset.index.isin(test_indices)

        train_parts.append(subset.loc[~mask])
        test_parts.append(subset.loc[mask])

        print(
            f"{emotion}: "
            f"학습 {sum(~mask)}개 / "
            f"테스트 {sum(mask)}개 / "
            f"유사 그룹 {len(groups)}개"
        )

    train_df = pd.concat(train_parts, ignore_index=True)
    test_df = pd.concat(test_parts, ignore_index=True)

    train_df = train_df.sample(frac=1, random_state=42)
    test_df = test_df.sample(frac=1, random_state=42)

    train_df.to_csv(
        TRAIN_PATH, index=False, encoding="utf-8-sig"
    )
    test_df.to_csv(
        TEST_PATH, index=False, encoding="utf-8-sig"
    )

    print("\n" + "=" * 50)
    print("데이터 분리 완료")
    print("=" * 50)
    print("학습 데이터:", len(train_df))
    print("테스트 데이터:", len(test_df))
    print("학습 파일:", TRAIN_PATH)
    print("테스트 파일:", TEST_PATH)

    overlap = set(train_df["text"]) & set(test_df["text"])
    print("완전 중복 문장:", len(overlap))


if __name__ == "__main__":
    main()
