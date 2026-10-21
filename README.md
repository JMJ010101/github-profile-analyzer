# GitHub 프로필 분석기

GitHub 유저 이름을 입력하면 **프로필**, **사용 언어 비율**, **인기 저장소 TOP 5**를 보여주는 간단한 웹 페이지예요.
빌드 도구나 프레임워크 없이 HTML, CSS, JavaScript(바닐라) 3개 파일만으로 동작해요.

## 주요 기능

- **검색**: 유저 이름 입력 후 검색 버튼 또는 Enter 키로 검색
- **프로필 카드**: 아바타, 이름, 소개(bio), 팔로워/팔로잉, 공개 저장소 수, 가입일
- **언어 비율**: 저장소의 `language` 값을 집계해 CSS로 그린 막대 그래프로 표시 (fork한 저장소 제외)
- **인기 저장소 TOP 5**: 스타(`stargazers_count`) 많은 순으로 이름, 설명, 스타 수, 언어, 링크 표시
- **상태 표시**: 로딩 중, 에러, 빈 입력 안내
- **반응형**: 모바일(너비 360px)에서도 가로 스크롤 없이 표시

> 저장소가 100개를 넘는 유저는 최근 업데이트된 100개까지만 분석해요.

## 사용 방법

1. 이 폴더의 `index.html`을 브라우저에서 엽니다. (설치나 빌드 과정이 필요 없어요)
2. 입력창에 GitHub 유저 이름(예: `torvalds`)을 입력합니다.
3. 검색 버튼을 누르거나 Enter 키를 누릅니다.

CSS/JS를 수정했는데 반영되지 않으면 강력 새로고침(`Ctrl+F5`)을 해주세요.

## 파일 구조

```
github-profile-analyzer/
├── index.html   # 화면 구조
├── style.css    # 스타일 (다크 + 픽셀 느낌)
├── app.js       # API 호출, 데이터 계산, 화면 그리기
├── README.md    # 프로젝트 소개
└── CLAUDE.md    # 프로젝트 작업 규칙
```

## 사용하는 API

인증 없이 호출할 수 있는 [GitHub REST API](https://docs.github.com/en/rest)만 사용해요.

| 용도 | 엔드포인트 |
|---|---|
| 프로필 | `GET https://api.github.com/users/{username}` |
| 저장소 목록 | `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated` |

인증 없이 호출하면 시간당 호출 횟수가 제한돼요. 한도를 넘으면 "호출 한도를 초과했어요" 안내가 나오니 잠시 기다렸다가 다시 시도해 주세요.

## 에러 처리

| 상황 | 화면 문구 |
|---|---|
| 없는 유저 (404) | 존재하지 않는 유저예요 |
| 호출 한도 초과 (403 + `x-ratelimit-remaining: 0`) | 호출 한도를 초과했어요. 잠시 후 다시 시도해 주세요 |
| 네트워크 오류 | 네트워크 연결을 확인해 주세요 |
| 빈 입력 | 요청을 보내지 않고 입력창 아래에 안내 표시 |

에러가 나면 이전 결과는 지워지고 화면이 깨지지 않아요.

## 보안

- 유저 입력과 API 응답 값은 `textContent`로만 화면에 넣어서 XSS(악성 스크립트 실행 공격)를 막아요.
- 외부로 나가는 링크에는 `target="_blank" rel="noopener noreferrer"`를 붙여요.
- GitHub 토큰 등 비밀값은 코드에 넣지 않아요.

## 기술 스택

- HTML, CSS, JavaScript (바닐라, 외부 라이브러리 없음)
- 한글 도트 폰트 [Galmuri9](https://github.com/quiple/galmuri) (jsDelivr CDN에서 `@import`로 로드)
- 배포: Netlify (GitHub 저장소 연결, `main` 브랜치 push 시 자동 배포)
