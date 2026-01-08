# 빠른 배포 가이드

## 🚀 Vercel 배포 (추천)

### 1. Vercel 계정 생성
- https://vercel.com 접속
- GitHub/GitLab/Bitbucket 계정으로 로그인

### 2. 프로젝트 연결
```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 배포
vercel
```

또는 웹에서:
1. Vercel 대시보드 > Add New Project
2. GitHub 저장소 선택
3. 프로젝트 설정 자동 감지됨 (Vite)

### 3. 환경 변수 설정
Vercel 대시보드 > Project Settings > Environment Variables에서 추가:
```
VITE_API_BASE_URL=https://your-api-server.com
VITE_SEARCH_API_BASE_URL=https://your-search-api-server.com
```

### 4. 배포 완료!
- 자동으로 배포 시작
- 완료되면 URL 발급 (예: `https://your-project.vercel.app`)

---

## 🌐 Netlify 배포

### 1. Netlify 계정 생성
- https://netlify.com 접속
- GitHub 계정으로 로그인

### 2. 프로젝트 연결
1. Netlify 대시보드 > Add new site > Import an existing project
2. GitHub 저장소 선택
3. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. 환경 변수 설정
Site settings > Environment variables에서 추가:
```
VITE_API_BASE_URL=https://your-api-server.com
VITE_SEARCH_API_BASE_URL=https://your-search-api-server.com
```

### 4. 배포 완료!

---

## ☁️ Cloudflare Pages 배포

### 1. Cloudflare 계정 생성
- https://pages.cloudflare.com 접속
- 로그인

### 2. 프로젝트 연결
1. Create a project > Connect to Git
2. GitHub 저장소 선택
3. 빌드 설정:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`

### 3. 환경 변수 설정
Settings > Environment variables에서 추가 (Production)

### 4. 배포 완료!

---

## 📦 GitHub Pages 배포

### 1. gh-pages 패키지 설치
```bash
npm install --save-dev gh-pages
```

### 2. package.json 수정
```json
{
  "homepage": "https://yourusername.github.io/news-trend-system-fe",
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### 3. 배포
```bash
npm run deploy
```

### 4. GitHub 설정
- Repository > Settings > Pages
- Source: `gh-pages` 브랜치 선택

**참고:** GitHub Pages는 환경 변수를 직접 설정할 수 없으므로, API URL을 코드에 하드코딩하거나 빌드 시점에 주입해야 합니다.

---

## 💡 추천 순서

1. **Vercel** - 가장 간단하고 빠름 ✅
2. **Netlify** - Vercel과 유사, 좋은 대안
3. **Cloudflare Pages** - 높은 트래픽 예상 시
4. **GitHub Pages** - 완전 무료이지만 설정 복잡

---

## 🔧 공통 체크리스트

배포 전 확인:
- [ ] `.env.production` 파일에 올바른 API URL 설정
- [ ] `npm run build` 성공적으로 완료
- [ ] `npm run preview`로 로컬에서 테스트
- [ ] 환경 변수가 배포 플랫폼에 설정됨
- [ ] API 서버가 실행 중이고 CORS 설정 완료

