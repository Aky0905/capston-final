import pandas as pd

# CSV 데이터 불러오기
df = pd.read_csv("data/emotion_dataset.csv")

# 전체 데이터 개수 확인
print("전체 데이터:", len(df))

# 감정별 데이터 개수 확인
print("\n감정별 데이터 수:")
print(df["emotion"].value_counts())

# 데이터 미리보기
print("\n데이터 미리보기:")
print(df.head())