# Vercel 배포 완료 가이드

## ✅ 준비 완료된 것들

- ✅ `vercel.json` 설정 파일 준비됨
- ✅ 프로덕션 빌드 최적화 설정 완료
- ✅ 환경 변수 타입 정의 완료
- ✅ 코드 정리 완료 (console.log 등)

## 🚀 Vercel 배포 단계

### 1. Vercel 계정 및 프로젝트 연결

1. **https://vercel.com** 접속
2. "Sign Up" → GitHub/GitLab/Bitbucket 계정으로 로그인
3. 대시보드에서 **"Add New..."** → **"Project"** 클릭
4. GitHub 저장소 선택 또는 새로 Import

### 2. 프로젝트 설정 (자동 감지됨)

Vercel이 `vercel.json`과 `package.json`을 기반으로 자동으로 설정합니다:
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

### 3. 환경 변수 설정 ⚠️ 매우 중요!

**배포 전 반드시 설정해야 합니다:**

1. 프로젝트 설정 화면에서 **"Environment Variables"** 섹션 클릭
2. 다음 변수들을 추가:
   ```
   VITE_API_BASE_URL = https://your-api-server.com
   VITE_SEARCH_API_BASE_URL = https://your-search-api-server.com
   ```
3. Environment는 **Production, Preview, Development** 모두 선택

**⚠️ 중요:**
- `localhost` 대신 실제 프로덕션 API 서버 URL 사용
- HTTPS 사용 권장
- 배포 후 환경 변수 변경 시 재배포 필요

### 4. 배포 시작

1. **"Deploy"** 버튼 클릭
2. 빌드 진행 상황 확인
3. 완료되면 배포 URL 제공 (예: `https://your-project.vercel.app`)

### 5. 배포 후 확인

- [ ] 사이트 접속 확인
- [ ] 키워드 랭킹 로드 확인
- [ ] 검색 기능 테스트
- [ ] 모달 동작 확인
- [ ] 브라우저 콘솔에서 에러 확인

---

## 📝 Vercel CLI로 배포 (선택사항)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 배포
vercel

# 프로덕션 배포
vercel --prod

# 환경 변수 추가
vercel env add VITE_API_BASE_URL production
vercel env add VITE_SEARCH_API_BASE_URL production
```

---

## 🔄 자동 배포 설정

### Git 연동 시
- **Production**: 메인 브랜치에 push하면 자동 배포
- **Preview**: 다른 브랜치/PR 생성 시 자동 프리뷰 배포

### Production Branch 설정
- Settings → Git → Production Branch에서 변경 가능
- 기본값: `main` 또는 `master`

---

## 🌐 커스텀 도메인 설정

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. **"Add"** 클릭
3. 도메인 입력 (예: `example.com`)
4. DNS 설정 가이드 따라하기

자세한 내용은 `VERCEL_DOMAIN_GUIDE.md` 참고

---

## 🐛 문제 해결

### 빌드 실패
- Vercel 대시보드 → Deployments → 실패한 배포 클릭
- Build Logs 확인
- 로컬에서 `npm run build` 성공 여부 확인

### 환경 변수 불일치
- Settings → Environment Variables 재확인
- 재배포: Settings → General → Redeploy

### API 연결 오류
- 브라우저 개발자 도구 → Network 탭에서 실제 호출 URL 확인
- CORS 설정 확인
- 환경 변수가 올바르게 설정되었는지 확인

---

## 📞 추가 리소스

- Vercel 공식 문서: https://vercel.com/docs
- Vite + Vercel 가이드: https://vercel.com/guides/deploying-vite-with-vercel

**이제 준비가 완료되었습니다! Vercel에서 배포를 시작하세요! 🚀**

