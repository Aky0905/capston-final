# Feelody

감정을 글이나 음성으로 기록하고, 위로 메시지와 음악을 만나는 모바일 앱입니다. 제공받은 배경·구름 캐릭터·로고를 적용했습니다. React Native와 Expo SDK 55로 안드로이드와 iOS 코드를 함께 관리하며, Spring Boot 서버가 OpenAI API를 호출합니다.

현재는 개발 버전입니다. 설치형 APK/IPA를 생성하거나 스토어에 출시한 상태는 아닙니다. 기본 실행은 체험 모드이며 실제 AI 분석으로 오인하지 않도록 화면에 표시합니다.

## 구성

```text
mobile/                  Expo 앱, 화면, 데이터 저장, 음성 입력, YouTube 플레이어
backend/                 Java 17 + Spring Boot API 서버와 테스트
backend/feelody-api.jar   검증한 서버 실행 파일
supabase/schema.sql      사용자별 데이터 저장 테이블과 RLS 접근 정책
previews/                실제 앱의 웹 미리보기 캡처
.github/workflows/       GitHub Actions 검사
```

## 구현한 기능

- 홈: 인사말, 연속 기록 일수, 음악 추천, 최근 확인한 음악
- 감정 입력: 최대 500자, 감정 태그, 최대 60초 녹음, 인식 결과 확인·수정
- 분석: 대기 화면, OpenAI 구조화 응답 기반 감정 해석·위로 문장, 실패 안내
- 기록: 사용자 저장 버튼, 날짜별 다중 기록, 상세 조회·삭제, 월간 그래프
- 음악: 화면에 표시되는 YouTube 플레이어, 외부 YouTube Music 이동, 좋아요
- 플레이리스트: 생성·이름 변경·삭제, 곡 추가·제거
- 프로필: 닉네임 변경, 로그아웃, 체험 데이터 초기화
- 실제 연동 모드: Supabase 이메일 회원가입·로그인, 계정별 라이브러리 저장

체험 모드는 로컬 규칙으로 분석 예시를 표시합니다. 음성 인식은 실제 연동 모드에서만 작동합니다. 체험 데이터는 기기의 AsyncStorage에 보관되므로 민감한 실제 고민 대신 시연용 문장을 사용하세요. 앱을 삭제하면 체험 데이터도 사라질 수 있습니다.

## 바로 실행

Node.js 22 LTS 이상을 설치한 뒤 프로젝트의 `mobile` 폴더에서 실행합니다.

```powershell
npm ci
npm start
```

Windows에서는 루트의 `start-demo.cmd`로 실행할 수도 있습니다. 별도 API 키 없이 체험 모드로 시작합니다.

휴대폰과 PC를 같은 Wi-Fi에 연결하고, SDK 55를 지원하는 Expo Go에서 터미널의 QR 코드를 읽습니다. 설치된 Expo Go와 SDK 버전이 맞지 않으면 해당 SDK용 Expo Go 또는 개발 빌드가 필요합니다. 안드로이드 에뮬레이터가 설치되어 있으면 터미널에서 `a`로 열 수 있습니다. iOS 시뮬레이터 실행은 macOS가 필요합니다. 웹 미리보기는 터미널에서 `w` 또는 `npm run web`으로 엽니다.

## 실제 OpenAI와 Supabase 연결

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql`을 실행합니다. Auth의 이메일 로그인을 활성화합니다. 이메일 확인을 사용하는 경우 가입 후 메일을 확인한 다음 앱에서 로그인합니다.
2. `backend/.env.example`을 `backend/.env`로 복사하고 OpenAI API 키, Supabase URL, 공개 publishable/anon 키를 입력합니다. service_role 키는 사용하지 않습니다.
3. Java 17 이상을 설치한 뒤 루트에서 `run-backend.ps1`을 실행합니다. 이 스크립트는 `backend/.env`를 환경변수로 읽고 `backend/feelody-api.jar`를 실행합니다. 환경변수가 이미 설정되어 있다면 `java -jar backend/feelody-api.jar`로 실행할 수 있습니다.
4. `mobile/.env.example`을 `mobile/.env`로 복사합니다. `EXPO_PUBLIC_MODE=cloud`로 바꾸고 Supabase 설정과 API 서버 주소를 입력합니다. Expo Go로 휴대폰에서 개발할 때 서버 주소는 `http://PC의LAN주소:8080`을 사용합니다. 휴대폰의 `localhost`는 PC가 아닙니다.
5. Expo 개발 서버를 종료하고 `npx expo start --clear`로 다시 실행합니다. 환경변수는 앱 번들에 반영되므로 변경 후 재시작이 필요합니다.

실제 배포에서는 API를 HTTPS로 제공하세요. 설치형 앱에서는 운영체제의 HTTP 제한 때문에 LAN HTTP 주소가 차단될 수 있습니다. 모바일에 포함되는 `EXPO_PUBLIC_` 값은 공개 정보입니다. **OpenAI API 키나 Supabase service_role 키를 모바일 환경변수에 넣으면 안 됩니다.**

서버 상태 확인: `GET /api/health`. 이 응답은 서버 실행 여부만 보여주며 외부 서비스 자격증명까지 검증하지는 않습니다.

## API

| 경로 | 요청 | 응답 |
| --- | --- | --- |
| `GET /api/health` | 없음 | 서버 상태 |
| `POST /api/analyze` | Bearer 토큰, JSON `{ "text": "오늘의 마음" }` | 대표·보조 감정, 위로 메시지, 추천 곡, `source` |
| `POST /api/transcribe` | Bearer 토큰, multipart `file` | 인식한 `text` |

서버는 Supabase Auth에 토큰을 검증한 뒤 AI를 호출합니다. 사용자별로 분석·음성 요청을 합쳐 시간당 20회로 제한합니다. 제한은 서버 메모리에 저장되며 서버 재시작 시 초기화됩니다. 음성은 최대 10MB이며 저장소에 영구 보관하지 않고 요청 처리에 사용합니다. 기기의 녹음 캐시 파일은 운영체제의 캐시 정리 대상입니다.

OpenAI Responses API에 `store:false`와 JSON Schema를 전달합니다. 이 옵션은 응답 저장 설정이며 공급자의 모든 로그나 보존 정책을 없애는 뜻은 아닙니다. 모델은 환경변수로 변경할 수 있습니다. 기본값은 `gpt-5.4-mini`, 음성은 `gpt-transcribe`입니다. 감정 해석은 의료적 진단이 아닙니다.

## 음악 재생

웹에서는 Spotify Premium 계정을 연결해 Feelody 화면에서 전체곡을 재생합니다. 개발자 대시보드에서 Web API와 Web Playback SDK를 활성화하고 로컬 Redirect URI `http://127.0.0.1:8765/` 및 Vercel 배포 주소(끝에 `/` 포함)를 등록하세요. 개발 모드에서는 재생할 사용자를 앱의 허용 목록에 추가하세요. 브라우저에서 팝업을 허용해야 합니다. 공개 Client ID는 `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`로 설정할 수 있습니다.

감정 분석에서 제안한 곡명과 아티스트를 Spotify 검색으로 확인합니다. 연결 전에는 후보가 표시되고, 재생 시 일치 여부를 검사합니다. 설치형 앱은 Spotify 링크를 엽니다. 기존 저장곡은 제목과 아티스트로 검색합니다.

## 검증과 현재 한계

- TypeScript 검사 통과
- 날짜·월간 집계·연속 기록 테스트 6개 통과
- 서버 입력 검증·인증 차단·OpenAI 요청 및 응답·음성 전달·호출 제한 테스트 11개 통과
- Android·iOS Hermes 번들과 웹 번들 생성 성공
- 웹 미리보기에서 감정 입력 → 분석 예시 → 기록 저장 → 달력 조회, 플레이리스트 생성·곡 추가·좋아요, 새로고침 후 지속 저장 확인
- 실제 계정 설정이 없어 OpenAI 유료 호출, 실제 Supabase 프로젝트의 RLS 격리, 실기기 마이크와 YouTube 재생은 아직 확인하지 못함

사용자가 추후 정하기로 한 감정·통계 규칙은 문서에 확정 반영하지 않았습니다. 앱에서는 시연을 위해 7개 감정과 기록 건수 기준 집계를 임시 적용했습니다. 하루에 여러 건을 기록하면 각각 집계하며, 비율은 반올림합니다.

라이브러리는 캡스톤 단일 기기 사용에 맞춘 JSON 문서형 구조입니다. 다중 기기 동시 편집은 마지막 저장이 앞선 변경을 덮어쓸 수 있습니다. 저장 오류는 화면에서 안내하며 실패한 변경은 앱 상태에 적용하지 않습니다. 최종 서비스에는 기록별 테이블 분리와 충돌 처리가 필요합니다.

디자인에 없는 로그인·오류·빈 화면은 앱 흐름에 맞춰 보완했습니다. 폰트 원본, 헤드폰 구름·노란 구름 소재가 없어 시스템 폰트와 제공된 캐릭터를 사용했습니다. 알림 발송과 YouTube Music 계정 동기화는 구현하지 않았습니다.

## 검사와 빌드

```powershell
cd mobile
npm run typecheck
npm test
npx expo export --platform all
```

서버는 `backend` 폴더에서 Maven 3.9와 Java 17 이상으로 `mvn test`, `mvn package`를 실행합니다. 소스를 수정한 뒤에는 새 JAR를 사용해야 합니다. 포함된 `backend/feelody-api.jar`는 현재 소스의 빌드 결과입니다.

Android APK는 Expo 계정으로 로그인한 환경에서 `mobile` 폴더에서 `npx eas-cli build --platform android --profile preview`로 만들 수 있습니다. EAS 설정과 이용 요금은 계정에서 확인해야 합니다. iOS 배포에는 Apple 계정과 서명 설정이 별도로 필요합니다. 아직 EAS 빌드를 실행하지 않았습니다.

## GitHub에 올리기

앱·서버·SQL을 한 저장소로 관리하도록 구성했습니다. `.gitignore`는 `.env`, 설치 패키지, 임시 빌드 결과와 서명 키를 제외합니다. `.env.example`에는 실제 비밀값이 없습니다. 제공받은 디자인 소재를 팀 외부에 공개할 수 있는지는 저장소 공개 여부를 정할 때 확인하세요.

GitHub에서 빈 저장소를 만든 다음 프로젝트 루트에서 실행합니다.

```powershell
git init
git add .
git commit -m "Build Feelody mobile app and API"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/feelody.git
git push -u origin main
```

GitHub Actions는 모바일 검사·번들 생성과 서버 테스트를 수행하며, 배포나 유료 API 호출은 하지 않습니다. 실제 업로드는 아직 수행하지 않았습니다.

## Vercel 웹 배포

GitHub 저장소를 Vercel에서 가져오고 Root Directory를 `mobile`로 지정합니다. 포함된 `vercel.json`이 Expo 웹 빌드 명령과 `dist` 출력 폴더를 설정합니다. 기본 체험 모드로는 서버나 비밀 키 없이 배포할 수 있습니다.

실제 연동 모드에는 Vercel 프로젝트 환경변수로 `EXPO_PUBLIC_MODE=cloud`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`를 설정합니다. Spring Boot 서버는 별도의 Java/컨테이너 호스팅에 배포하고, 서버의 `CORS_ORIGINS`에 배포된 웹 사이트의 정확한 origin을 설정합니다. API 주소는 HTTPS여야 합니다. OpenAI 비밀 키는 Spring Boot 서버에만 설정합니다. 환경변수 변경 후에는 웹을 다시 빌드해야 합니다.

Vercel 배포는 휴대폰 브라우저에서 URL로 여는 웹 버전입니다. 안드로이드 APK와 iOS 설치 파일은 Expo/EAS에서 별도로 빌드합니다. Vercel 계정 연동이나 실제 배포는 아직 수행하지 않았습니다.
