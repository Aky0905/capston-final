
import streamlit as st
from urllib.parse import quote_plus

from emotion_engine_improved_v2 import analyze_emotion
from emotion_corrector import correct_emotion
from context_response import generate_context_response
from music_data import recommend_songs


# ==========================================
# 1. 페이지 기본 설정
# ==========================================

st.set_page_config(
    page_title="Word2Vec 마음 플레이리스트",
    page_icon="🎧",
    layout="centered"
)


# ==========================================
# 2. 제목 및 프로젝트 소개
# ==========================================

st.title("🎧 마음 플레이리스트")

st.write(
    "오늘의 감정을 이야기해 주세요. "
    "Word2Vec 기반 감정 분석을 통해 "
    "현재 감정과 상황에 어울리는 메시지와 "
    "음악을 추천해 드립니다."
)

st.info(
    "이 프로그램은 Word2Vec 기반 감정 분석과 "
    "규칙 기반 감정 보정 및 상황 분석을 활용합니다. "
    "감정 분석 결과는 실제 감정과 다를 수 있습니다."
)

st.divider()


# ==========================================
# 3. 사용자 입력
# ==========================================

st.subheader("✏️ 오늘의 이야기")

user_text = st.text_area(
    "오늘 어떤 일이 있었나요?",
    placeholder=(
        "예: 오늘 시험에 합격해서 정말 행복해!\n"
        "예: 친구와 싸워서 너무 속상해.\n"
        "예: 운동을 많이 해서 지쳤어."
    ),
    height=150
)


# ==========================================
# 4. 음악 추천 설정
# ==========================================

st.subheader("🎵 음악 추천 설정")

purpose = st.radio(
    "노래 추천 방식",
    [
        "현재 감정에 어울리는 노래",
        "기분 전환"
    ],
    horizontal=True
)

genre = st.selectbox(
    "🎼 좋아하는 음악 장르",
    [
        "전체",
        "K-POP",
        "발라드",
        "인디",
        "힙합",
        "팝"
    ]
)

song_count = st.slider(
    "추천받을 노래 수",
    min_value=3,
    max_value=10,
    value=3,
    step=1
)

st.caption(
    "특정 장르에 등록된 곡이 적으면 "
    "선택한 곡 수보다 적게 추천될 수 있습니다."
)

st.divider()


# ==========================================
# 5. 감정 분석 실행
# ==========================================

if st.button(
    "🧠 감정 분석하기",
    type="primary",
    use_container_width=True
):

    if not user_text.strip():
        st.warning("분석할 문장을 먼저 입력해 주세요.")

    else:
        with st.spinner("감정과 상황을 분석하고 있습니다..."):

            # Word2Vec 기반 감정 분석
            result = analyze_emotion(user_text)

            # 원본 모델의 예측 감정 저장
            original_emotion = result["emotion"]

            # 감정 표현 기반 보정
            final_emotion = correct_emotion(
                user_text,
                original_emotion
            )

            # 보정 결과 반영
            result["original_emotion"] = original_emotion
            result["emotion"] = final_emotion

            emoji_map = {
                "행복": "😊",
                "슬픔": "😢",
                "분노": "😡",
                "피로": "😫",
                "평온": "😌",
                "판단 어려움": "🤔"
            }

            result["emoji"] = emoji_map.get(
                final_emotion,
                "🙂"
            )

            # 감정 + 상황에 맞춘 메시지
            response_result = generate_context_response(
                user_text,
                final_emotion
            )

            # 분석 결과 저장
            st.session_state["analysis"] = {
                "text": user_text,
                "result": result,
                "response_result": response_result,
                "purpose": purpose,
                "genre": genre,
                "song_count": song_count
            }


# ==========================================
# 6. 분석 결과 출력
# ==========================================

if "analysis" in st.session_state:

    analysis = st.session_state["analysis"]

    result = analysis["result"]
    response_result = analysis["response_result"]

    saved_purpose = analysis["purpose"]
    saved_genre = analysis["genre"]
    saved_count = analysis["song_count"]

    st.divider()

    st.subheader("📋 분석 결과")

    st.write("**입력한 문장**")
    st.write(analysis["text"])

    st.subheader(
        f"🧠 감정 분석 결과: "
        f"{result['emoji']} {result['emotion']}"
    )

    # 감정 보정 여부 표시
    original_emotion = result.get(
        "original_emotion",
        result["emotion"]
    )

    if original_emotion != result["emotion"]:
        st.caption(
            f"🔧 감정 보정 적용: "
            f"{original_emotion} → {result['emotion']}"
        )
    else:
        description = result.get("description")

        if description:
            st.write(description)

    # ======================================
    # 7. 상황 분석 결과
    # ======================================

    st.write("### 🔍 상황 분석")

    st.write(
        f"분석된 상황: "
        f"**{response_result['situation']}**"
    )

    # ======================================
    # 8. 맞춤형 공감 메시지
    # ======================================

    st.write("### 💬 마음을 위한 한마디")

    st.success(response_result["response"])

    # ======================================
    # 9. 감정별 유사도
    # ======================================

    scores = result.get("scores", {})

    if scores:

        st.caption(
            "아래 코사인 유사도는 감정 보정 이전의 "
            "Word2Vec 모델이 계산한 값입니다."
        )

        score = result.get("score")

        if score is not None:
            st.caption(
                f"원본 모델의 최고 코사인 유사도: "
                f"{score:.3f}"
            )

        with st.expander("📊 감정별 유사도 자세히 보기"):

            for emotion, similarity in scores.items():

                st.write(
                    f"**{emotion}**: {similarity:.3f}"
                )

                # Streamlit 진행바는 0~1 범위
                progress_value = max(
                    0.0,
                    min(1.0, float(similarity))
                )

                st.progress(progress_value)

    # ======================================
    # 10. 음악 추천
    # ======================================

    st.divider()

    st.subheader("🎵 추천 노래")

    if result["emotion"] == "판단 어려움":

        st.warning(
            "감정을 판단하기 어려워 음악을 추천하지 못했습니다. "
            "조금 더 자세하게 이야기해 주세요."
        )

    else:

        st.write(
            f"**추천 기준 감정:** {result['emotion']}"
        )

        st.write(
            f"**추천 방식:** {saved_purpose}"
        )

        st.write(
            f"**선택한 장르:** {saved_genre}"
        )

        st.write(
            f"**요청한 추천 곡 수:** {saved_count}곡"
        )

        # 감정, 추천 목적, 장르, 곡 수 반영
        songs = recommend_songs(
            result["emotion"],
            saved_purpose,
            count=saved_count,
            genre=saved_genre
        )

        if not songs:

            st.warning(
                "선택한 조건에 맞는 음악이 없습니다. "
                "다른 장르를 선택해 주세요."
            )

        else:

            st.success(
                f"총 {len(songs)}곡을 추천합니다!"
            )

            for index, (title, artist, reason) in enumerate(
                songs,
                start=1
            ):

                with st.container(border=True):

                    st.markdown(
                        f"### 🎶 {index}. {title}"
                    )

                    st.write(
                        f"**가수:** {artist}"
                    )

                    st.write(
                        f"💡 **추천 이유:** {reason}"
                    )

                    # YouTube 검색 링크 생성
                    search_query = quote_plus(
                        f"{title} {artist}"
                    )

                    youtube_url = (
                        "https://www.youtube.com/results"
                        f"?search_query={search_query}"
                    )

                    st.link_button(
                        "▶ YouTube에서 노래 검색",
                        youtube_url
                    )

    st.divider()

    st.caption(
        "🎧 Word2Vec 기반 감정 분석 및 "
        "맞춤형 음악 추천 프로젝트"
    )
