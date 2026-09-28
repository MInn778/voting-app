# 투표 앱 (Voting App)

동아리용 투표 앱. 용어는 `CONTEXT.md`, 스펙과 티켓은 `.scratch/voting-app/`에 있다.

## 처음 설정

1. `.env.example`을 참고해 `.env.local`에 `DATABASE_URL`, `OPERATOR_PASSWORD`, `SESSION_SECRET`을 채운다.
2. Neon 대시보드 → **SQL Editor**에 `db/schema.sql` 내용을 붙여넣고 **Run**을 눌러 테이블을 만든다(한 번만).

## 실행

```bash
npm run dev        # http://localhost:3000
npm run test:e2e   # Playwright 브라우저 테스트 (실제 Neon DB 사용, "[e2e]"로 시작하는 투표만 만들고 지움)
```
