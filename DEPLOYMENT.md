# 배포 가이드 (Deployment Guide)

## 📋 목차
1. [사전 준비사항](#사전-준비사항)
2. [환경 변수 설정](#환경-변수-설정)
3. [빌드](#빌드)
4. [배포 방법](#배포-방법)
5. [배포 후 확인사항](#배포-후-확인사항)

---

## 사전 준비사항

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- 프로덕션 API 서버가 실행 중이어야 함

### 프로젝트 의존성 설치
```bash
npm install
# 또는
yarn install
```

---

## 환경 변수 설정

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env.production` 파일을 생성하고 API 서버 URL을 설정합니다:

```bash
cp .env.example .env.production
```

### 2. 환경 변수 값 설정

`.env.production` 파일을 열어 다음 값을 수정합니다:

```env
# 프로덕션 API 서버 URL
VITE_API_BASE_URL=https://your-api-server.com
VITE_SEARCH_API_BASE_URL=https://your-search-api-server.com
```

**중요:**
- 프로덕션 환경에서는 절대 `localhost`를 사용하지 마세요
- HTTPS를 사용하는 것이 좋습니다
- CORS 설정이 올바르게 되어 있는지 확인하세요

---

## 빌드

### 프로덕션 빌드 실행

```bash
npm run build
# 또는
yarn build
```

빌드가 완료되면 `dist` 폴더에 프로덕션용 파일들이 생성됩니다.

### 빌드 결과물 확인

```bash
npm run preview
# 또는
yarn preview
```

로컬에서 빌드된 결과물을 미리 확인할 수 있습니다.

---

## 배포 방법

### 1. 정적 파일 서버 (Static File Server)

#### Nginx 사용 예시

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (필요한 경우)
    location /api {
        proxy_pass http://your-api-server:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /search-api {
        proxy_pass http://your-search-api-server:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Apache 사용 예시

`.htaccess` 파일을 `dist` 폴더에 생성:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 2. 클라우드 서비스 배포

#### Vercel

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정:
   - `VITE_API_BASE_URL`
   - `VITE_SEARCH_API_BASE_URL`
3. 빌드 명령: `npm run build`
4. 출력 디렉토리: `dist`

#### Netlify

1. [Netlify](https://netlify.com)에 프로젝트 연결
2. 환경 변수 설정 (Site settings > Environment variables)
3. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### GitHub Pages

```bash
# gh-pages 패키지 설치
npm install --save-dev gh-pages

# package.json에 추가
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/news-trend-system-fe"
}

# 배포
npm run deploy
```

### 3. Docker 배포

#### Dockerfile 예시

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf 예시

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### 빌드 및 실행

```bash
docker build -t news-trend-system-fe .
docker run -p 80:80 news-trend-system-fe
```

---

## 배포 후 확인사항

### 1. 빌드 파일 확인
- ✅ `dist` 폴더에 모든 파일이 생성되었는지 확인
- ✅ `index.html`이 존재하는지 확인
- ✅ 정적 파일들이 올바르게 포함되었는지 확인

### 2. 환경 변수 확인
- ✅ 프로덕션 환경 변수가 올바르게 설정되었는지 확인
- ✅ API URL이 `localhost`가 아닌 실제 도메인인지 확인

### 3. 기능 테스트
- ✅ 키워드 랭킹 조회
- ✅ 검색 기능
- ✅ 페이지네이션
- ✅ 모달 동작
- ✅ 반응형 디자인

### 4. 성능 확인
- ✅ 페이지 로딩 속도
- ✅ API 응답 시간
- ✅ 번들 크기 (Chrome DevTools > Network)

### 5. 보안 확인
- ✅ HTTPS 사용 (프로덕션)
- ✅ CORS 설정 확인
- ✅ 환경 변수 노출 확인 (빌드된 파일에 포함되지 않았는지)

---

## 트러블슈팅

### 빌드 에러
```bash
# 캐시 삭제 후 재빌드
rm -rf node_modules dist
npm install
npm run build
```

### API 연결 실패
- 환경 변수가 올바르게 설정되었는지 확인
- API 서버가 실행 중인지 확인
- CORS 설정 확인

### 라우팅 문제 (404 에러)
- 서버 설정에서 SPA 라우팅을 지원하는지 확인
- Nginx/Apache 설정에서 `try_files` 또는 `RewriteRule` 확인

---

## 추가 최적화

### 1. 코드 스플리팅
이미 `vite.config.ts`에 설정되어 있습니다:
- React vendor 분리
- Framer Motion 분리

### 2. 이미지 최적화
- WebP 포맷 사용 고려
- 이미지 압축 도구 사용

### 3. CDN 사용
- 정적 파일을 CDN에 배포하여 로딩 속도 향상

---

## 연락처 및 지원

문제가 발생하면:
1. 브라우저 콘솔 확인
2. 네트워크 탭에서 API 호출 확인
3. 빌드 로그 확인

