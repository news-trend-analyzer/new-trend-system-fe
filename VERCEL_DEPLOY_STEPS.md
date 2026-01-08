# Vercel 배포 단계별 가이드

## ✅ 배포 전 체크리스트

- [x] 빌드 에러 수정 완료
- [x] `vercel.json` 설정 파일 준비됨
- [ ] 환경 변수 준비 (API URL)

---

## 🚀 Vercel 배포 단계

### 방법 1: 웹 인터페이스로 배포 (가장 쉬움) ⭐

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - "Sign Up" → GitHub/GitLab/Bitbucket 계정으로 로그인

2. **프로젝트 추가**
   - 대시보드에서 "Add New..." → "Project" 클릭
   - GitHub 저장소 선택 (또는 새로 Import)
   - 저장소가 없다면 먼저 GitHub에 push 필요

3. **프로젝트 설정**
   - Framework Preset: **Vite** (자동 감지됨)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (자동 설정됨)
   - Output Directory: `dist` (자동 설정됨)
   - Install Command: `npm install` (자동 설정됨)

4. **환경 변수 설정** ⚠️ 중요!
   - "Environment Variables" 섹션 클릭
   - 다음 변수들 추가:
     ```
     VITE_API_BASE_URL = https://your-api-server.com
     VITE_SEARCH_API_BASE_URL = https://your-search-api-server.com
     ```
   - Environment: **Production, Preview, Development** 모두 선택

5. **배포 시작**
   - "Deploy" 버튼 클릭
   - 빌드 진행 상황 실시간 확인
   - 완료되면 `https://your-project.vercel.app` URL 제공

---

### 방법 2: CLI로 배포

```bash
# 1. Vercel CLI 설치 (전역)
npm i -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 디렉토리에서 배포
vercel

# 또는 프로덕션 배포
vercel --prod
```

**CLI 배포 시 환경 변수 설정:**
```bash
# 대화형으로 환경 변수 설정
vercel env add VITE_API_BASE_URL
vercel env add VITE_SEARCH_API_BASE_URL
```

---

## 🔧 배포 후 설정

### 환경 변수 확인
1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 모든 환경(Production, Preview, Development)에 변수 확인

### 커스텀 도메인 추가 (선택사항)
1. Settings → Domains
2. "Add" 클릭
3. 도메인 입력 및 DNS 설정

---

## 📝 참고사항

- **자동 배포**: GitHub에 push하면 자동으로 재배포됩니다
- **프리뷰 배포**: Pull Request 생성 시 자동으로 프리뷰 URL 생성
- **환경 변수**: 각 환경(Production/Preview/Development)별로 다르게 설정 가능
- **빌드 로그**: 배포 페이지에서 실시간 확인 가능

---

## 🐛 문제 해결

### 빌드 실패 시
- Vercel 대시보드 → Deployments → 실패한 배포 클릭
- Build Logs 확인
- 로컬에서 `npm run build` 성공하는지 확인

### 환경 변수 불일치
- Settings → Environment Variables에서 재확인
- 재배포 필요 (Settings → General → Redeploy)

### API 연결 오류
- 브라우저 콘솔에서 실제 API URL 확인
- CORS 설정 확인
- 환경 변수가 올바르게 설정되었는지 확인

