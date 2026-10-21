# GitHub 프로필 분석기

GitHub 유저 이름을 입력하면 프로필, 사용 언어 비율, 인기 저장소를 보여주는 **HTML + CSS + JS 3개 파일짜리** 페이지.

## 프로젝트 목표
- 개발자 포트폴리오용 연습 프로젝트
- 빌드 도구와 프레임워크 없이 `index.html`, `style.css`, `app.js`만으로 동작
- 키 없이 호출 가능한 GitHub REST API만 사용

## 기술 스택
- HTML, CSS, JavaScript (바닐라)
- 구조는 `index.html`, 스타일은 `style.css`, 동작은 `app.js`로 나눠 작성한다
- 외부 라이브러리와 CDN은 사용하지 않는다 (예외: 한글 도트 폰트 `Galmuri9`을 `style.css`의 `@import`로 jsDelivr에서 불러온다)
- 데이터: GitHub REST API (인증 없음)
- 배포: Netlify (GitHub 저장소 연결, `main` 브랜치 push 시 자동 배포)

## 파일 구조
```
(현재 작업 폴더)/
├── index.html   # 화면 구조(HTML)만 작성
├── style.css    # 스타일
├── app.js       # API 호출, 데이터 계산, 화면 그리기
└── CLAUDE.md
```
- 이 3개 파일 외에 다른 파일(폴더, 추가 JS/CSS)을 만들지 않는다. 더 필요하면 먼저 사용자에게 묻는다.
- `index.html`에는 `<link rel="stylesheet" href="style.css">`와 `<script src="app.js" defer></script>`만 연결한다. `<style>`, `<script>` 안에 코드를 직접 쓰지 않는다.
- `app.js`는 기능별로 주석 구분선을 둔다.

## 사용하는 API
| 용도 | 엔드포인트 |
|---|---|
| 프로필 | `GET https://api.github.com/users/{username}` |
| 저장소 목록 | `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated` |

- 요청 헤더: `Accept: application/vnd.github+json`
- 저장소가 100개를 넘는 유저는 첫 100개까지만 분석한다 (화면에 "최근 업데이트 100개 기준"이라고 표시).
- 인증 없이는 시간당 호출 횟수가 적다 (60회로 알려져 있음, 공식 문서에서 확인 필요).
- 응답 헤더 `x-ratelimit-remaining`으로 남은 횟수를 확인할 수 있다.

## 구현할 기능
1. 유저 이름 입력창 + 검색 버튼 (Enter 키로도 검색)
2. 프로필 카드: 아바타, 이름, 소개(bio), 팔로워/팔로잉, 공개 저장소 수, 가입일
3. 언어 비율: 저장소의 `language` 값을 집계해 막대 그래프로 표시 (fork한 저장소는 제외, 그래프는 CSS로 직접 그린다)
4. 인기 저장소 TOP 5: `stargazers_count` 내림차순, 이름/설명/스타 수/언어/링크
5. 상태 표시: 로딩 중, 결과 없음, 에러

## 에러 처리 규칙
| 상황 | 처리 |
|---|---|
| 404 | "존재하지 않는 유저예요" 표시 |
| 403 + `x-ratelimit-remaining: 0` | "호출 한도를 초과했어요. 잠시 후 다시 시도해 주세요" 표시 |
| 네트워크 오류 | "네트워크 연결을 확인해 주세요" 표시 |
| 빈 입력 | 요청을 보내지 않고 입력창에 안내 표시 |

- 모든 `fetch`는 `try/catch`로 감싸고, `res.ok`를 확인한 뒤 `res.json()`을 호출한다.
- 에러가 나도 화면이 깨지지 않고 이전 결과는 지워진다.

## 코드 규칙
- 변수명, 함수명은 영어 camelCase, 화면에 보이는 문구와 주석은 한국어
- `var` 대신 `const`/`let`, `async/await` 사용
- 함수는 역할별로 나눈다: `fetchProfile`, `fetchRepos`, `calcLanguageStats`, `renderProfile`, `renderLanguages`, `renderTopRepos`, `showError`
- 유저 입력과 API 응답 값을 화면에 넣을 때는 `textContent`를 쓴다. `innerHTML`에 그대로 넣지 않는다 (XSS 방지: 악성 스크립트가 화면에서 실행되는 공격).
- 링크는 `target="_blank" rel="noopener noreferrer"`를 붙인다.
- 입력값은 `trim()` 후 사용하고, URL에 넣을 때는 `encodeURIComponent`를 쓴다.
- 반응형: 모바일(너비 360px)에서도 가로 스크롤 없이 보여야 한다. `<meta name="viewport">`를 넣는다.

## 보안 규칙
- GitHub 토큰을 HTML/JS 코드에 절대 넣지 않는다 (HTML만 쓰는 구조에서는 토큰을 숨길 방법이 없다).
- 호출 한도가 부족하면 토큰을 쓰지 말고, 사용자가 잠시 기다리도록 안내한다.
- `style.css`, `app.js`는 브라우저에 그대로 공개되는 파일이다. 비밀값을 넣지 않는다.

## 배포 규칙 (Netlify)
- 이 폴더의 최상위에 `index.html`이 있으면, 폴더 전체를 그대로 배포하면 된다. 별도 빌드 명령은 필요 없다.
- 폴더/파일 이름의 대소문자를 구분하는 환경이므로 `index.html`, `style.css`, `app.js`는 항상 소문자로 쓰고, HTML에서 연결할 때도 똑같이 쓴다.
- 이 폴더에는 공개돼도 되는 파일만 둔다.

## Git 규칙
- 이 폴더가 Git 저장소의 최상위다. 하위 폴더에 `.git` 폴더를 만들지 않는다 (GitHub에서 폴더가 404로 뜨는 원인이 된다).
- 작업 전 `git pull origin main`으로 원격 변경 사항을 먼저 받는다.
- 커밋 메시지는 한국어로 짧게 쓴다 (예: `프로필 카드 추가`).
- `git push --force`는 사용자가 명시적으로 요청할 때만 쓴다.

## 작업 방식
- 새 기능은 한 번에 하나씩 추가하고, 추가할 때마다 브라우저에서 `index.html`을 열어 동작을 확인한다. 수정한 CSS/JS가 반영이 안 되면 강력 새로고침(Ctrl+F5)을 한다.
- 확인되지 않은 API 동작(응답 필드, 호출 한도 등)은 추측하지 말고 공식 문서(https://docs.github.com/en/rest)를 기준으로 한다.
- 코드를 설명할 때는 어려운 용어를 초보자도 이해할 수 있게 풀어 쓴다.

## 완료 기준
- [ ] 유효한 유저 이름(예: `torvalds`)으로 프로필, 언어 비율, TOP 5가 표시된다
- [ ] 없는 유저 이름이면 안내 문구가 표시된다
- [ ] 로딩 중 상태가 보인다
- [ ] 모바일 화면에서 레이아웃이 깨지지 않는다
- [ ] Netlify 배포 주소에서 정상 동작한다