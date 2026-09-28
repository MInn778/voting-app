# 01: 기반 설정 (DB 연결, 스키마 SQL, 테스트 도구)

**What to build:** 이후 모든 티켓이 올라설 바닥을 만든다. 개발자가 저장소에 있는 테이블 생성 SQL을 Neon SQL Editor에서 직접 실행하면 투표·선택지 테이블이 생긴다. 앱은 `.env.local`의 `DATABASE_URL`로 그 DB에 연결되고, Playwright가 `npm run dev`로 앱을 띄워 브라우저 테스트를 돌릴 수 있다. 스모크 테스트 하나가 "앱이 뜨고 DB에 연결된다"를 초록으로 증명한다.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] 테이블 생성 SQL 파일이 저장소에 있다: polls(id, question, created_at), options(id, poll_id → polls on delete cascade, label, position, vote_count 기본 0). 스펙의 스키마와 일치한다.
- [x] SQL을 사람이 Neon SQL Editor에서 실행하는 방법이 README 등에 한두 줄로 안내되어 있다.
- [x] DB 연결은 투표 도메인 모듈 하나를 통해서만 이뤄진다. 화면과 API는 SQL을 직접 쓰지 않는다.
- [x] 환경변수 `DATABASE_URL`, `OPERATOR_PASSWORD`, `SESSION_SECRET`이 어떤 값인지 예시 파일(비밀 값 없이 이름만)로 안내되어 있다. `.env.local`은 커밋되지 않는다.
- [x] Playwright가 설치되어 있고, 테스트 실행 시 `npm run dev`로 앱을 자동으로 띄운다.
- [x] 테스트는 실제 Neon DB를 쓰되 테스트 접두어가 붙은 투표만 만들고 지운다. 실행 시작 시 같은 접두어의 남은 투표를 먼저 정리한다. 테이블 전체를 비우지 않는다.
- [x] 스모크 테스트: 첫 화면이 열리고, DB 연결이 성공한다. 테스트가 초록이다.
