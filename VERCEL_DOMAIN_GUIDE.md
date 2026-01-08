# Vercel 도메인 변경 가이드

## 🌐 도메인 변경 방법

### 1. 기본 도메인 변경 (예: project-name.vercel.app)

Vercel은 기본적으로 프로젝트 이름을 기반으로 도메인을 생성합니다.

**변경 방법:**
1. Vercel 대시보드 > 프로젝트 선택
2. Settings > General
3. **Project Name** 변경
4. 변경 후 새 도메인: `새프로젝트명.vercel.app`

**참고:** 
- 프로젝트 이름을 변경하면 도메인도 함께 변경됩니다
- 이전 도메인은 자동으로 새 도메인으로 리다이렉트됩니다 (영구적으로)

---

### 2. 커스텀 도메인 추가 (예: yourdomain.com)

**추가 방법:**

1. Vercel 대시보드 > 프로젝트 선택
2. Settings > Domains
3. "Add" 또는 "Add Domain" 클릭
4. 원하는 도메인 입력 (예: `example.com` 또는 `www.example.com`)
5. DNS 설정 안내 따라하기

**DNS 설정 방법:**

#### A. Vercel이 도메인을 관리하는 경우 (권장)
- Vercel이 자동으로 DNS 레코드를 추가합니다
- 도메인 제공업체의 네임서버를 Vercel로 변경:
  ```
  ns1.vercel-dns.com
  ns2.vercel-dns.com
  ```

#### B. 외부 DNS 제공업체 사용
도메인 제공업체(예: GoDaddy, Cloudflare, AWS Route53)에서 다음 레코드 추가:

**서브도메인이 있는 경우 (예: www.example.com):**
```
Type: CNAME
Name: www (또는 @)
Value: cname.vercel-dns.com
```

**루트 도메인인 경우 (예: example.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

또는

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**Vercel에서 제공하는 정확한 DNS 값 확인:**
- Vercel 대시보드 > Settings > Domains > 도메인 선택
- "Configuration" 섹션에서 정확한 값 확인

---

### 3. 여러 도메인 추가 (예: example.com + www.example.com)

1. Settings > Domains에서 각 도메인 추가
2. Vercel이 자동으로 둘 다 같은 프로젝트에 연결합니다
3. `www` 없이 접속해도 `www` 있게 리다이렉트 설정 가능

**자동 리다이렉트 설정:**
- Settings > Domains에서 도메인 선택
- "Redirect" 옵션에서 원하는 리다이렉트 설정

---

### 4. 프로덕션/프리뷰/개발 환경별 도메인

Vercel은 자동으로 환경별 도메인을 제공합니다:

- **Production**: `project-name.vercel.app` (또는 커스텀 도메인)
- **Preview**: `project-name-git-branch-username.vercel.app` (각 브랜치/PR마다)
- **Development**: 로컬 개발 환경

**프리뷰 도메인 설정:**
- Settings > Git
- "Production Branch" 설정으로 프로덕션 브랜치 지정
- 다른 브랜치는 자동으로 프리뷰 도메인 생성

---

## 🔧 도메인 설정 예시

### 커스텀 도메인 추가 시나리오

**목표:** `mynews.com`과 `www.mynews.com` 모두 같은 사이트로 연결

1. Vercel > Settings > Domains
2. `mynews.com` 추가
3. `www.mynews.com` 추가
4. DNS 설정:
   ```
   # 루트 도메인
   Type: A
   Name: @
   Value: 76.76.21.21
   
   # www 서브도메인
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. SSL 인증서 자동 발급 (몇 분 소요)

---

## ✅ 도메인 변경 체크리스트

- [ ] 프로젝트 이름 확인/변경 (기본 도메인)
- [ ] 커스텀 도메인 추가 (선택사항)
- [ ] DNS 레코드 설정 확인
- [ ] SSL 인증서 발급 확인 (자동, 몇 분 소요)
- [ ] 도메인 작동 확인
- [ ] 환경 변수 확인 (도메인 변경해도 유지됨)

---

## 🔍 DNS 확인 명령어

도메인이 제대로 연결되었는지 확인:

```bash
# DNS 확인
nslookup your-domain.com

# 또는
dig your-domain.com

# SSL 확인 (브라우저에서)
https://your-domain.com
```

---

## ⚠️ 주의사항

1. **프로젝트 이름 변경 시**
   - 이전 도메인은 자동으로 새 도메인으로 리다이렉트됨
   - 되돌릴 수 없으므로 신중하게 변경

2. **커스텀 도메인**
   - DNS 전파에 몇 분~최대 48시간 소요
   - SSL 인증서는 자동 발급 (보통 몇 분)

3. **무료 플랜**
   - 기본 `.vercel.app` 도메인 무제한
   - 커스텀 도메인도 무료로 추가 가능
   - 무료 SSL 인증서 (Let's Encrypt)

---

## 📞 추가 도움말

- Vercel 공식 문서: https://vercel.com/docs/concepts/projects/domains
- DNS 설정 도움말: Vercel 대시보드에서 각 도메인 설정 시 상세 가이드 제공

