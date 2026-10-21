// ============================================================
// 설정 / 요소 가져오기
// ============================================================
const API_BASE = 'https://api.github.com';
const API_HEADERS = { Accept: 'application/vnd.github+json' };

const searchForm = document.getElementById('searchForm');
const usernameInput = document.getElementById('usernameInput');
const searchButton = document.getElementById('searchButton');
const inputHint = document.getElementById('inputHint');
const statusBox = document.getElementById('status');
const resultBox = document.getElementById('result');
const profileCard = document.getElementById('profileCard');
const languageList = document.getElementById('languageList');
const topRepoList = document.getElementById('topRepoList');

// 에러 종류를 구분하기 위한 클래스 (message에 화면용 문구를 담는다)
class ApiError extends Error {}

// ============================================================
// API 호출
// ============================================================
// 공통: 요청을 보내고, 실패하면 규칙에 맞는 ApiError를 던진다
async function requestJson(url) {
  let res;
  try {
    res = await fetch(url, { headers: API_HEADERS });
  } catch (err) {
    throw new ApiError('네트워크 연결을 확인해 주세요');
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError('존재하지 않는 유저예요');
    }
    if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
      throw new ApiError('호출 한도를 초과했어요. 잠시 후 다시 시도해 주세요');
    }
    throw new ApiError(`요청에 실패했어요 (오류 코드 ${res.status})`);
  }

  try {
    return await res.json();
  } catch (err) {
    throw new ApiError('응답을 읽는 중 문제가 생겼어요');
  }
}

async function fetchProfile(username) {
  return requestJson(`${API_BASE}/users/${encodeURIComponent(username)}`);
}

async function fetchRepos(username) {
  return requestJson(`${API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
}

// ============================================================
// 데이터 계산
// ============================================================
// fork 제외, language가 있는 저장소만 세어 비율(%)을 계산한다
function calcLanguageStats(repos) {
  const counts = {};
  let total = 0;

  repos.forEach((repo) => {
    if (repo.fork || !repo.language) return;
    counts[repo.language] = (counts[repo.language] || 0) + 1;
    total += 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count, percent: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

function pickTopRepos(repos) {
  return [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);
}

// 언어 이름으로 항상 같은 색을 만든다
function languageColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 60%, 50%)`;
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// ============================================================
// 화면 그리기 (모든 외부 값은 textContent로 넣는다)
// ============================================================
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function createLink(href, className, text) {
  const a = createEl('a', className, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function createStat(value, label) {
  const li = document.createElement('li');
  li.append(createEl('strong', '', String(value)), ' ', createEl('span', '', label));
  return li;
}

function renderProfile(profile) {
  profileCard.replaceChildren();

  const avatar = createEl('img', 'avatar');
  avatar.src = profile.avatar_url;
  avatar.alt = `${profile.login}의 프로필 사진`;

  const info = createEl('div', 'profile-info');
  info.append(createEl('h2', 'profile-name', profile.name || profile.login));

  const login = createEl('p', 'profile-login');
  login.append(createLink(profile.html_url, '', `@${profile.login}`));
  info.append(login);

  info.append(createEl('p', 'profile-bio', profile.bio || '소개가 없어요.'));

  const stats = createEl('ul', 'profile-stats');
  stats.append(
    createStat(profile.followers, '팔로워'),
    createStat(profile.following, '팔로잉'),
    createStat(profile.public_repos, '공개 저장소')
  );
  info.append(stats);
  info.append(createEl('p', 'profile-joined', `가입일 ${formatDate(profile.created_at)}`));

  profileCard.append(avatar, info);
}

function renderLanguages(stats) {
  languageList.replaceChildren();

  if (stats.length === 0) {
    languageList.append(createEl('p', 'empty-text', '분석할 언어 정보가 없어요.'));
    return;
  }

  stats.forEach((item) => {
    const row = createEl('div', 'language-row');
    const track = createEl('div', 'bar-track');
    const fill = createEl('div', 'bar-fill');
    fill.style.width = `${item.percent}%`;
    fill.style.background = languageColor(item.name);
    track.append(fill);

    row.append(
      createEl('span', 'language-name', item.name),
      track,
      createEl('span', 'language-percent', `${item.percent.toFixed(1)}%`)
    );
    languageList.append(row);
  });
}

function renderTopRepos(repos) {
  topRepoList.replaceChildren();

  if (repos.length === 0) {
    const li = createEl('li', 'empty-text', '공개 저장소가 없어요.');
    topRepoList.append(li);
    return;
  }

  repos.forEach((repo) => {
    const li = createEl('li', 'repo-item');
    const meta = createEl('div', 'repo-meta');
    meta.append(createEl('span', '', `⭐ ${repo.stargazers_count}`));
    meta.append(createEl('span', '', repo.language || '언어 정보 없음'));

    li.append(
      createLink(repo.html_url, 'repo-name', repo.name),
      createEl('p', 'repo-desc', repo.description || '설명이 없어요.'),
      meta
    );
    topRepoList.append(li);
  });
}

// ============================================================
// 상태 표시 (로딩 / 에러 / 입력 안내)
// ============================================================
function clearResult() {
  resultBox.hidden = true;
  profileCard.replaceChildren();
  languageList.replaceChildren();
  topRepoList.replaceChildren();
}

function showLoading() {
  clearResult();
  statusBox.className = 'status';
  statusBox.replaceChildren(createEl('span', 'spinner'), '불러오는 중이에요...');
  statusBox.hidden = false;
}

function hideStatus() {
  statusBox.hidden = true;
  statusBox.replaceChildren();
}

function showError(message) {
  clearResult();
  statusBox.className = 'status error';
  statusBox.textContent = message;
  statusBox.hidden = false;
}

function showInputHint(message) {
  inputHint.textContent = message;
  inputHint.hidden = false;
  usernameInput.classList.add('invalid');
}

function clearInputHint() {
  inputHint.hidden = true;
  inputHint.textContent = '';
  usernameInput.classList.remove('invalid');
}

// ============================================================
// 검색 실행
// ============================================================
async function search() {
  const username = usernameInput.value.trim();
  clearInputHint();

  if (!username) {
    showInputHint('GitHub 유저 이름을 입력해 주세요');
    return;
  }

  searchButton.disabled = true;
  showLoading();

  try {
    const [profile, repos] = await Promise.all([fetchProfile(username), fetchRepos(username)]);

    renderProfile(profile);
    renderLanguages(calcLanguageStats(repos));
    renderTopRepos(pickTopRepos(repos));

    hideStatus();
    resultBox.hidden = false;
  } catch (err) {
    showError(err instanceof ApiError ? err.message : '알 수 없는 오류가 발생했어요');
  } finally {
    searchButton.disabled = false;
  }
}

// ============================================================
// 이벤트 연결 (form submit은 버튼 클릭과 Enter 키를 모두 처리한다)
// ============================================================
searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  search();
});

usernameInput.addEventListener('input', clearInputHint);
