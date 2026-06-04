# VeriPacket Upgrade Plan

작성일: 2026-06-03

## 핵심 방향

이 프로젝트가 GitHub 스타를 받으려면 기능 수보다 "한 번 보면 바로 쓸 곳이 떠오르는 흐름"이 중요하다. 업그레이드 방향은 다음 세 축으로 잡는 것이 좋다.

1. 일반 사용자에게는 "분쟁 스크린샷 정리 자동화"
2. 개발자에게는 "검증 가능한 로컬 evidence manifest"
3. 보안/프라이버시 커뮤니티에는 "서버 업로드 없는 redaction + PDF export"

가장 좋은 제품 문장은 다음이다.

> Turn messy dispute screenshots into a private, chronological, verifiable PDF evidence packet.

## 업그레이드 우선순위 요약

| 우선순위 | 기능 | 스타 기여도 | 난이도 | 판단 |
| --- | --- | --- | --- | --- |
| P0 | 클립보드/드래그 이미지 인입 | 매우 높음 | 낮음 | 데모 체감이 즉시 좋아짐 |
| P0 | 시간순 evidence timeline | 매우 높음 | 중간 | 제품의 중심 |
| P0 | PDF evidence packet export | 매우 높음 | 중간 | README 데모의 결말 |
| P0 | 불투명 redaction | 높음 | 중간 | privacy-first 신뢰 포인트 |
| P0 | SHA-256 manifest + verify 화면 | 높음 | 중간 | 개발자/보안 커뮤니티 포인트 |
| P1 | 샘플 케이스/데모 데이터 | 매우 높음 | 낮음 | 스타 확보에 직접 기여 |
| P1 | one-click "privacy review" checklist | 높음 | 낮음 | 일반 사용자에게 유용 |
| P1 | evidence quality score | 높음 | 중간 | 제품이 똑똑해 보임 |
| P1 | PDF 템플릿 3종 | 중간 | 낮음 | 실사용성 상승 |
| P1 | manifest schema 문서화 | 중간 | 낮음 | OSS 신뢰도 상승 |
| P2 | PWA share target | 높음 | 중간 | 모바일 증거 수집에 강함 |
| P2 | local OCR 개인정보 후보 탐지 | 높음 | 높음 | 좋지만 MVP 후 |
| P2 | CLI verifier | 중간 | 중간 | 개발자 채택에 좋음 |
| P2 | opt-in timestamp provider | 중간 | 높음 | 법적 효력 과장 리스크 관리 필요 |
| P3 | 브라우저 확장 캡처 | 높음 | 높음 | 제품 범위가 커지므로 후순위 |
| P3 | 협업/클라우드 동기화 | 낮음 | 높음 | 기본 방향과 충돌 |

## MVP를 더 강하게 만드는 P0 업그레이드

### 1. Inbox-first 이미지 수집

기존 MVP는 "업로드"라고 표현되어 있는데, 실제 사용자는 Finder, 카카오톡 저장 이미지, 문자 캡처, 브라우저 다운로드가 뒤섞여 있다.

추가하면 좋은 흐름:

- 드래그 앤 드롭
- 클립보드 붙여넣기
- 파일 선택
- 최근 추가순 임시 inbox
- 여러 이미지를 한 번에 선택해 사건에 추가

README 데모 문장:

> Paste screenshots directly from your clipboard, then sort them into a dispute timeline.

### 2. Evidence timeline을 제품의 첫 화면으로

대시보드보다 타임라인이 먼저 보여야 한다. 이 도구의 가치는 "정리"이기 때문이다.

권장 화면 구조:

- 왼쪽: evidence list / timeline
- 중앙: 선택 이미지 preview
- 오른쪽: metadata, note, source, redaction controls
- 상단: case title, privacy status, export PDF

핵심 기능:

- 날짜 없는 항목은 `Needs date`로 표시
- 순서 충돌 항목은 `Check order` 표시
- 중요한 항목은 `Key evidence` 플래그
- 항목마다 "왜 중요한지" 한 줄 설명 필수

### 3. PDF export를 "제출 가능한 문서"처럼 보이게 만들기

PDF가 예쁘고 설득력 있어야 스타가 붙는다.

권장 PDF 구조:

1. Cover
   - case title
   - generated at
   - number of evidence items
   - tool version
   - integrity summary

2. Case summary
   - user-written 5 bullet summary
   - requested outcome
   - parties as aliases only

3. Timeline
   - chronological table
   - item number
   - timestamp
   - source
   - short note
   - key evidence marker

4. Evidence pages
   - screenshot
   - note
   - source
   - original hash
   - redacted render hash

5. Appendix
   - manifest digest
   - privacy checklist result
   - legal limitation note

### 4. Redaction을 blur가 아니라 black box로

블러는 복원 가능성 논란이 있다. 기본값은 완전 불투명 박스여야 한다.

추가하면 좋은 옵션:

- black box
- white box
- label 포함: `REDACTED PHONE`, `REDACTED ADDRESS`
- redaction list export
- redaction 미적용 항목 경고

피해야 할 표현:

- "secure blur"
- "AI privacy guaranteed"
- "legally safe redaction"

### 5. Verify 화면

이 기능은 개발자와 보안 커뮤니티에 가장 강하다.

필수 검증:

- manifest JSON 해시 확인
- original file hash 확인
- redacted render hash 확인
- PDF embedded manifest digest 확인

README 데모:

1. PDF와 manifest를 생성한다.
2. 원본 이미지 하나를 수정한다.
3. verifier에서 `hash mismatch`가 뜬다.

이 20초 데모가 "오픈소스답다"는 느낌을 만든다.

## 스타를 더 받을 수 있는 P1 기능

### 1. Sample evidence packets

저장소에 샘플을 넣어야 한다. 빈 앱보다 샘플 PDF가 훨씬 강하다.

추천 샘플:

- `examples/marketplace-refund/`
- `examples/repair-defect/`
- `examples/freelance-payment/`

각 샘플 구성:

- dummy screenshots
- case manifest
- generated PDF
- expected hashes
- README walkthrough

주의:

- 실제 플랫폼 로고/실명/전화번호를 쓰지 않는다.
- 가상의 거래 UI를 만들어야 한다.

### 2. Evidence quality score

법적 효력 점수가 아니라, 제출자료 정리 완성도 점수로 표현한다.

예시:

- 날짜가 있는가
- 출처가 적혀 있는가
- 설명이 있는가
- 개인정보 체크가 끝났는가
- 원본 해시가 있는가
- 핵심 증거가 표시됐는가

표현:

- 좋음: `Packet readiness`
- 나쁨: `Legal score`, `Court score`

### 3. Dispute playbooks

사용자는 빈 사건 템플릿보다 상황별 질문지를 원한다.

템플릿:

- 중고거래 환불
- 온라인 쇼핑몰 하자
- 수리/시공 하자
- 프리랜서 미지급
- 숙박/예약 취소
- 택배 파손

각 템플릿 질문:

- 무엇을 샀는가?
- 약속된 상태/조건은 무엇인가?
- 결제/전달 시점은 언제인가?
- 문제가 처음 확인된 시점은 언제인가?
- 상대방의 답변은 무엇인가?
- 요청하는 해결책은 무엇인가?

### 4. Privacy review checklist

PDF export 전 체크리스트:

- 전화번호
- 주소
- 계좌번호
- 주문번호
- 송장번호
- 아이디/닉네임
- 얼굴/차량번호
- 미성년자 정보
- 상대방 개인정보

UX 포인트:

- 체크리스트를 강제하되, 법률 판단으로 보이지 않게 한다.
- `I reviewed the packet for sensitive information` 정도가 적절하다.

### 5. README demo assets

스타는 README에서 결정된다.

필수 README 섹션:

- 12초 GIF: paste screenshots -> timeline -> redact -> export PDF
- sample PDF 미리보기 이미지
- "No upload" 배지
- "Local-first" 배지
- "MIT/Apache-2.0" 배지
- "Not legal advice" 짧은 고지

## P2 이후 고급 기능

### 1. PWA share target

모바일에서 강력한 기능이다.

흐름:

1. 사용자가 휴대폰에서 스크린샷을 찍는다.
2. 공유 메뉴에서 `VeriPacket`을 고른다.
3. PWA가 해당 이미지를 inbox에 넣는다.
4. 나중에 데스크톱에서 PDF를 정리한다.

주의:

- 브라우저/PWA 지원 편차가 있다.
- MVP에서는 설계만 열어두고, v0.2 이후가 적절하다.

### 2. Local OCR 기반 개인정보 후보 탐지

강력하지만 리스크도 크다.

추천 원칙:

- 기본 비활성화
- 서버 전송 없음
- OCR 결과 저장 여부 선택
- 감지 결과는 "후보"로만 표시

탐지 후보:

- 전화번호 패턴
- 이메일
- 주소 일부
- 계좌번호 패턴
- 주문번호/송장번호 형태
- 주민등록번호 같은 고위험 패턴

### 3. CLI verifier

개발자/보안 커뮤니티를 위한 기능이다.

예시 사용:

```bash
veripacket verify evidence-manifest.json
veripacket verify packet.pdf evidence-manifest.json
```

장점:

- GitHub에서 기술 신뢰도가 올라간다.
- CI fixture 테스트가 가능하다.
- third-party verifier 생태계를 만들 수 있다.

### 4. Optional timestamp proof

RFC 3161 또는 OpenTimestamps 같은 외부 timestamping은 차별화가 되지만, 서버 업로드 없음 원칙과 충돌하지 않도록 조심해야 한다.

권장 접근:

- MVP 제외
- opt-in only
- 이미지 원문이 아니라 digest만 전송
- README에 외부 서비스 사용 여부 명확히 표시

표현:

- 좋음: `optional timestamp proof for manifest digest`
- 나쁨: `blockchain court evidence`

### 5. Browser extension

나중에 붙일 수 있지만, 초기부터 들어가면 제품 범위가 Hunchly/ArchiveWeb.page 쪽으로 커진다.

좋은 사용처:

- 판매글 페이지 캡처
- 주문 상세 페이지 캡처
- URL, title, capturedAt 자동 기록

후순위 이유:

- 브라우저별 권한/배포 비용
- 개인정보 권한 우려
- PDF evidence packet이라는 핵심이 흐려질 수 있음

## 기능보다 중요한 오픈소스 포장

### 1. Manifest schema를 공개 자산으로 만들기

이 프로젝트의 오픈소스 가치는 앱 UI만이 아니라 evidence manifest 포맷이다.

권장 파일:

- `schema/evidence-manifest.schema.json`
- `docs/integrity-model.md`
- `docs/redaction-model.md`
- `examples/*/manifest.json`

manifest 핵심 필드:

- case id
- tool version
- generated at
- item id
- original filename
- original sha256
- rendered sha256
- source label
- captured at
- imported at
- redactions
- notes
- manifest digest

### 2. 정직한 limitation 문서

오픈소스 보안/포렌식 커뮤니티는 과장을 싫어한다.

필수 문서:

- 이 도구가 보장하는 것
- 이 도구가 보장하지 않는 것
- 조작된 스크린샷 문제
- 기기 시간 문제
- 외부 타임스탬프 미사용 시 한계
- 법률 자문 아님

### 3. 테스트 가능한 PDF export

PDF는 렌더링이 흔들리기 쉽다. 개발자가 기여하려면 회귀 테스트가 있어야 한다.

권장 테스트:

- manifest hash deterministic test
- redaction render test
- PDF page count test
- sample packet snapshot test
- verifier mismatch test

## 90초 런치 데모 구성

1. 0-10초
   - 제목: "I had 12 screenshots for a marketplace dispute."
   - 여러 스크린샷이 바탕화면에 흩어진 장면

2. 10-25초
   - 앱에 드래그 앤 드롭
   - 자동으로 inbox 생성

3. 25-45초
   - 타임라인 정렬
   - 각 항목에 짧은 설명 추가
   - `Key evidence` 표시

4. 45-60초
   - 전화번호/주소 redaction
   - privacy checklist 통과

5. 60-75초
   - PDF export
   - 표지, timeline, evidence page 보여주기

6. 75-90초
   - manifest verify
   - 이미지 수정 후 hash mismatch 표시
   - 마무리 문장: "No uploads. No account. Just a clean evidence packet."

## 피해야 할 기능 확장

1. AI 자동 판정
   - "누가 잘못했는지 판단"은 법률/윤리 리스크가 크다.

2. 클라우드 evidence vault
   - 제품의 신뢰 모델을 흐린다.

3. 상대방에게 자동 발송
   - 괴롭힘/분쟁 악화/법적 리스크가 생긴다.

4. 법원 제출 보장 문구
   - 국가/사안/절차마다 다르고, 과장된 마케팅이 된다.

5. 초반부터 브라우저 확장
   - 핵심 PDF 패킷 경험이 완성되기 전에는 범위가 너무 커진다.

## 개선된 로드맵

### v0.1 Launch MVP

- local webapp
- image inbox
- timeline editor
- metadata fields
- redaction boxes
- PDF export
- manifest JSON
- verify page
- sample marketplace dispute
- README demo GIF

### v0.2 Trust Pack

- manifest schema
- CLI verifier
- deterministic PDF tests
- redaction model docs
- integrity model docs
- 3 sample cases

### v0.3 Mobile Capture

- PWA install
- share target
- offline cache
- case import/export
- mobile-friendly redaction review

### v0.4 Smart Review

- opt-in local OCR
- sensitive info candidate detection
- evidence quality score
- missing timestamp/source warnings

### v1.0 Evidence Workflow

- optional timestamp proof
- browser extension capture
- advanced templates
- signed release artifacts
- external verifier docs

## 추천 다음 액션

바로 다음 산출물은 구현이 아니라 다음 4개가 좋다.

1. README 초안
   - 스타를 받을 메시지와 GIF 자리까지 포함

2. sample evidence packet spec
   - 어떤 더미 스크린샷과 어떤 PDF가 나와야 하는지 정의

3. manifest schema 초안
   - 기능 구현 전에도 오픈소스 철학이 선명해진다

4. v0.1 issue backlog
   - GitHub 프로젝트로 옮길 수 있는 단위 작업 목록

가장 강한 첫 구현 목표는 "샘플 중고거래 케이스를 넣으면 PDF와 manifest가 나오고, verifier에서 통과/실패가 보이는 것"이다.
