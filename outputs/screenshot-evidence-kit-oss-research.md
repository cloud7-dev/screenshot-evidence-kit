# Screenshot Evidence Kit OSS Research

작성일: 2026-06-02

## 한 줄 결론

`Screenshot Evidence Kit`은 전문 법무/OSINT 수사 도구가 아니라, 일반 사용자가 거래, 분쟁, 환불, 하자, 중고거래 증거 스크린샷을 로컬에서 시간순 PDF evidence packet으로 정리하는 오픈소스 도구로 포지셔닝하는 것이 가장 유망하다.

핵심 차별화는 "서버 업로드 없는 local-first 증거 패킷 생성", "시간순 사건 타임라인", "해시/메타데이터/개인정보 삭제를 사용자가 이해할 수 있는 방식으로 제공", "법적 효력을 과장하지 않는 투명한 무결성 모델"이다.

## 경쟁 도구

| 도구 | 유형 | 강점 | 빈틈 |
| --- | --- | --- | --- |
| [Hunchly](https://hunch.ly/) | 상용 조사/OSINT 캡처 | 방문 페이지 URL, 타임스탬프, 해시, 전체 페이지 캡처, 리포트, 감사 추적을 제공. 조사관/언론/보안 분석가 대상. | 일반 소비자 분쟁용으로는 무겁고, "거래 내역 스크린샷 여러 장을 시간순 PDF로 정리"하는 제품 언어가 아님. |
| [Page Vault](https://www.page-vault.com/) | 상용 법무 웹 캡처 | 법적 제출을 겨냥한 웹 캡처, 진술서, 메타데이터, 해싱, 비디오/소셜 확장 자동화. | 법무팀/전문가 가격대와 워크플로우. 오픈소스/로컬 개인 도구 영역은 비어 있음. |
| [Evidence Collector](https://evidencecollector.org/en) | 무료 브라우저 확장, 비공개 소스 | SHA-256, RFC 3161 타임스탬프, OpenTimestamps, 로컬 처리, PDF/영상/메타데이터를 강조. | 소스가 비공개. 일반 소비자용 케이스 정리 UX, 개인정보 마스킹, 시간순 패킷 편집 경험은 약해 보임. |
| [ArchiveWeb.page](https://github.com/webrecorder/archiveweb.page) | OSS 웹 아카이빙 | 브라우저 안에서 고충실도 웹 아카이브를 만들고 IndexedDB에 저장/재생. WARC/WACZ 생태계와 연결. | 웹 아카이빙 중심이라 증거 PDF 패킷, 환불/하자/중고거래 설명서, 마스킹 UX와는 목적이 다름. |
| [SingleFile](https://www.getsinglefile.com/) | OSS 웹페이지 저장 | 전체 웹페이지를 리소스 포함 단일 HTML로 저장, 다중 브라우저 지원, CLI 제공. | "캡처 증거 묶음"보다 오프라인 저장 도구. 해시, 사건 타임라인, PDF 제출본, 개인정보 처리 흐름은 핵심이 아님. |
| [Browsertrix](https://docs.browsertrix.com/user-guide/) | OSS/클라우드 웹아카이빙 | 크롤링, 아카이브 검수, 컬렉션, 공유, 셀프호스팅 가능. | 단일 소비자 분쟁 패킷보다 기관/아카이브 운영 쪽. 로컬 웹앱 MVP에는 과함. |
| [ShareX](https://getsharex.com/) | OSS 스크린샷/생산성 | 캡처, OCR, 해시 검사, 업로드 자동화 등 강력한 데스크톱 캡처 워크플로우. | Windows 중심 범용 캡처 도구. 증거 무결성/시간순 PDF 패킷/개인정보 보호 제품이 아님. |

## 아직 해결이 덜 된 사용자 불편함

1. 스크린샷이 여러 앱과 폴더에 흩어진다.
   카카오톡/문자/중고거래 앱/쇼핑몰/택배 추적/결제 내역 캡처가 뒤섞이고, 나중에 사건 순서를 설명하기 어렵다.

2. 상대방이나 플랫폼에 보낼 "한 파일"을 만들기 어렵다.
   사용자는 보통 이미지 여러 장을 그대로 첨부하거나, 문서에 수동으로 붙여 넣는다. 시간, 출처, 설명, 핵심 부분 강조가 일관되지 않는다.

3. 개인정보 삭제가 번거롭다.
   전화번호, 주소, 계좌번호, 주문번호, 아이 이름, 차량번호 등이 그대로 노출된다. 대부분의 캡처 도구는 blur 기능은 있어도 "제출용 사본과 원본 보존" 개념이 약하다.

4. 무결성 설명이 과하거나 부족하다.
   일반 스크린샷은 쉽게 조작 가능하다는 의심을 받지만, 포렌식 도구는 복잡하다. 사용자는 "이 PDF 안의 각 이미지가 언제 추가됐고, 지금 파일이 바뀌지 않았음을 어떻게 확인하는지" 정도의 실용적 보증이 필요하다.

5. 법적 효력에 대한 기대가 혼란스럽다.
   "법원 인정"을 보장하는 표현은 위험하다. 대신 도구가 제공하는 것은 해시, 타임라인, 원본 보존, 메타데이터 기록, 변경 탐지, 작성 로그라는 점을 명확히 해야 한다.

6. 모바일/PWA 경로가 부족하다.
   분쟁 증거는 휴대폰에서 생긴다. 초기 MVP가 로컬 웹앱이어도, 향후 PWA에서 이미지를 공유받아 사건에 추가하는 흐름이 중요하다.

## 제품 포지셔닝

추천 포지션:

> Local-first evidence packet builder for everyday disputes.

피해야 할 포지션:

- "court-admissible screenshot tool" 직접 주장
- "forensic browser" 전체 구현
- "OSINT all-in-one"
- "blockchain proof"를 기본 가치로 전면화
- 클라우드 저장/계정 기반 협업을 MVP에 포함

추천 사용자:

- 중고거래 분쟁 당사자
- 쇼핑몰 환불/하자 대응 사용자
- 임대/수리/시공 하자 기록 사용자
- 프리랜서/소상공인의 거래 증빙 정리
- 소비자 상담센터/플랫폼 문의 전 제출자료를 정리하려는 사용자

## 2주 MVP 범위

목표: 로컬 웹앱에서 이미지 스크린샷을 가져와 사건 타임라인을 만들고, 개인정보 마스킹 후, 해시와 메타데이터가 포함된 PDF evidence packet을 내보낸다.

### Week 1

- 새 케이스 생성: 제목, 사건 유형, 당사자 메모, 작성자 메모
- 이미지 업로드: PNG/JPEG/WebP, 드래그 앤 드롭, 다중 업로드
- 각 증거 항목 필드: 촬영/캡처 시각, 출처 앱/URL, 설명, 태그, 중요도
- 자동 정렬: 시간순 보기, 수동 순서 보정
- 원본 파일 해시: SHA-256 계산, 케이스 manifest JSON에 기록
- 간단한 마스킹: 사각형 redaction 박스, 원본 보존 + 제출용 렌더링 분리
- 로컬 저장: 브라우저 IndexedDB 또는 File System Access API 기반 초안 저장

### Week 2

- PDF export: 표지, 사건 요약, 타임라인, 증거 항목별 이미지/설명/해시, 부록 manifest
- 검증 파일 export: `evidence-manifest.json`, `hashes.txt`
- 개인정보 체크리스트: 전화번호/주소/계좌/주문번호/아이디/차량번호 확인 항목
- 데모 샘플 케이스 포함: 중고거래 환불 분쟁
- README, demo GIF/video, GitHub Pages 또는 정적 빌드 배포
- 보안/법적 한계 문서: "법률 자문 아님", "증거 채택 보장 아님", "로컬 장치 신뢰성 한계"

### MVP에서 제외

- 자동 웹페이지 캡처 브라우저 확장
- 법무용 진술서 생성
- RFC 3161/OpenTimestamps 기본 탑재
- OCR 기반 자동 개인정보 탐지
- 계정/동기화/클라우드 백업
- 협업, 서명 워크플로우
- 모바일 네이티브 앱

## README positioning 첫 문단 초안

`Screenshot Evidence Kit` is a local-first, privacy-first web app for turning messy dispute screenshots into a clear, chronological PDF evidence packet. Drop in screenshots from chats, marketplaces, orders, payments, repairs, or refund conversations; add short notes and timestamps; redact sensitive details; and export a self-contained PDF with hashes and a machine-readable manifest. Nothing is uploaded to a server, and the project is designed to document integrity without pretending to replace legal advice or professional forensic collection.

## 데모 시나리오

시나리오: 중고거래 그래픽카드 하자/환불 분쟁

1. 사용자가 `New case`를 만든다.
   - 제목: "중고 그래픽카드 환불 분쟁"
   - 유형: 중고거래
   - 상대방: 닉네임만 입력
   - 목표: 플랫폼 고객센터에 제출할 PDF 만들기

2. 스크린샷을 업로드한다.
   - 판매글 캡처
   - 채팅에서 "정상 작동"이라고 말한 부분
   - 송금/결제 내역
   - 택배 도착 시각
   - 제품 장착 후 오류 화면
   - 환불 요청과 거절 답변

3. 타임라인을 정리한다.
   - 각 이미지에 날짜/시간, 출처, 한 줄 설명을 붙인다.
   - 자동 정렬 후, 애매한 항목은 수동으로 순서를 조정한다.
   - 중요한 항목은 `key evidence`로 표시한다.

4. 개인정보를 가린다.
   - 주소, 전화번호, 계좌 일부, 실명, 송장번호 일부를 redaction 박스로 가린다.
   - 원본 해시는 manifest에 유지하고, PDF에는 제출용 마스킹 이미지만 포함한다.

5. PDF evidence packet을 미리 본다.
   - 표지: 사건 제목, 작성일, 증거 개수, 생성 도구 버전
   - 요약: 5줄 사건 개요
   - 타임라인: 날짜순 항목 목록
   - 증거 페이지: 이미지, 설명, 출처, 캡처 시각, SHA-256
   - 부록: manifest 요약, 한계 고지

6. 내보낸다.
   - `used-gpu-refund-evidence.pdf`
   - `used-gpu-refund-evidence-manifest.json`
   - `used-gpu-refund-hashes.txt`

7. 검증한다.
   - 사용자가 다시 앱에 PDF/manifest를 열어 해시 일치 여부를 확인한다.
   - README demo에서는 "PDF를 만들고 나서 이미지를 바꾸면 검증 실패" 장면을 보여준다.

## 추천 GitHub topics

- `evidence`
- `evidence-management`
- `screenshot`
- `pdf-export`
- `local-first`
- `privacy-first`
- `pwa`
- `forensics`
- `digital-evidence`
- `chain-of-custody`
- `redaction`
- `consumer-rights`
- `dispute-resolution`
- `webapp`
- `offline-first`

## 스타를 받을 만한 커뮤니티/런치 채널

우선순위:

1. Hacker News `Show HN`
   - 메시지: "Show HN: Local-first tool to turn dispute screenshots into a PDF evidence packet"
   - 개발자에게 먹히는 요소: local-first, no upload, manifest, hashes, reproducible PDF, clean demo

2. Reddit
   - `r/opensource`: 오픈소스 제품 소개
   - `r/selfhosted`: 서버는 없지만 local-first/privacy-first 관점으로 소개
   - `r/DataHoarder`: 개인 기록 보존/증거 패킷 관점
   - `r/OSINT`: 법적 효력 과장 없이 "consumer dispute evidence packet"으로 조심스럽게 소개
   - `r/LegalAdvice` 계열은 홍보보다 사용 맥락 질문에 조심스럽게 접근

3. Product Hunt
   - 범용 소비자/프로슈머 도구로 소개 가능
   - 오픈소스, 개인정보 보호, 환불/분쟁 실사용 데모가 있어야 반응 가능

4. GitHub social
   - `awesome-privacy`, `awesome-osint`, `awesome-selfhosted`에는 즉시 PR하지 말고, 초기 별/이슈/데모 확보 후 시도
   - `topic:local-first`, `topic:pdf-export`, `topic:evidence-management`에 맞춰 README 구조 최적화

5. 소비자/프리랜서 커뮤니티
   - 프리랜서 대금 분쟁, 중고거래, 쇼핑몰 환불, 시공 하자 기록 커뮤니티
   - 개발자만이 아니라 실제 사용자 관점에서 별을 받을 수 있는 채널

## OpenAI Codex for OSS 신청 적합성 평가

평가: 초기에는 낮음, 공개 MVP 이후에는 중간.

이유:

- OpenAI Codex for OSS는 활성 오픈소스 프로젝트의 usage, ecosystem importance, active maintenance를 본다.
- 새 프로젝트 후보 단계에서는 stars/downloads/maintainer workload가 없다.
- 하지만 이 프로젝트는 다음 조건을 만들면 신청 논리가 생긴다.
  - GitHub 이슈/PR 기반으로 PDF export, redaction, manifest 검증 기능을 유지보수
  - 보안/개인정보 이슈 triage가 중요
  - 샘플 evidence packet, 테스트 fixtures, PDF 렌더링 회귀 검증에 Codex를 활용 가능
  - "민감한 데이터를 서버에 올리지 않는 local-first OSS"라는 공익성이 있음

신청 타이밍:

- 1차 MVP 공개 후 4~8주 운영
- 목표 신호: 300+ stars, 10+ external issues, 3+ contributors, 실제 사용자 사례 3개 이상, 보안 정책/기여 가이드 존재

신청서용 짧은 논리:

> Screenshot Evidence Kit helps people document everyday digital disputes without uploading sensitive evidence to a server. Codex credits would be used for PDF rendering tests, privacy/security review, issue triage, and release automation for a local-first evidence workflow.

## 증거 무결성, 메타데이터, 개인정보 리스크

### 무결성 리스크

- 스크린샷 자체가 원본 사실을 보장하지 않는다.
- 사용자의 기기 시간이 틀렸을 수 있다.
- 업로드 전 이미지가 이미 편집됐을 수 있다.
- PDF 생성 후 PDF만 공유하면 원본 파일과 manifest가 분리될 수 있다.
- 브라우저 기반 앱은 OS 레벨의 신뢰 실행 환경이 아니다.

대응:

- "authenticity guarantee"가 아니라 "integrity after import"라고 표현한다.
- import 시점의 SHA-256, 파일명, 크기, MIME, lastModified, 입력 메모를 manifest에 기록한다.
- PDF 안에 manifest digest를 포함하고, 별도 manifest JSON을 함께 export한다.
- 검증 화면에서 PDF/manifest/hash 일치 여부를 보여준다.
- 법적 제출 보장 표현을 금지한다.

### 메타데이터 리스크

- 이미지 EXIF에 위치 정보가 있을 수 있다.
- PDF 생성 메타데이터에 사용자 이름, 로컬 경로, 앱 버전이 남을 수 있다.
- 원본 보존과 제출용 사본의 관계가 혼동될 수 있다.
- 자동 OCR/AI 분석을 넣으면 민감정보 추출/저장 범위가 커진다.

대응:

- 기본 PDF에는 원본 EXIF를 포함하지 않는다.
- 원본 해시와 제출용 렌더링 해시를 분리한다.
- manifest에 "included in PDF"와 "kept local only"를 구분한다.
- AI/OCR은 MVP 제외. 추후에도 opt-in local OCR 우선.

### 개인정보 리스크

- 증거에는 상대방 개인정보도 포함될 수 있다.
- 마스킹이 되돌릴 수 있는 blur 방식이면 위험하다.
- 사용자가 원본을 삭제했다고 오해할 수 있다.
- 브라우저 저장소에 민감 이미지가 남아 가족/공용 PC에서 노출될 수 있다.

대응:

- blur보다 불투명 redaction 박스를 기본값으로 한다.
- export 전 개인정보 체크리스트를 강제한다.
- "원본은 이 브라우저/폴더에 남아 있음"을 명확히 표시한다.
- 케이스 잠금/자동 만료/전체 삭제 기능을 초기 설계에 넣는다.
- 서버 업로드 없음 원칙을 README와 UI에 명시한다.

## 차별화 전략

1. 일반 사용자의 실제 분쟁 흐름에 맞춘다.
   Hunchly/Page Vault는 전문가와 법무 중심이다. 이 프로젝트는 "이미 찍어둔 스크린샷을 정리해 제출 가능한 PDF로 만드는 것"에 집중한다.

2. local-first를 기능이 아니라 신뢰 모델로 설명한다.
   "No account. No upload. No cloud evidence vault."를 README 상단에 둔다.

3. PDF export를 최우선 완성도로 만든다.
   별을 받는 데 가장 중요한 데모는 화려한 대시보드가 아니라, 실제로 그럴듯한 evidence packet PDF가 나오는 장면이다.

4. 법적 효력 과장을 피한다.
   이 정직함이 오히려 개발자/보안 커뮤니티에서 신뢰를 만든다.

5. 검증 가능성을 데모한다.
   해시가 들어간 PDF를 만들고, 원본 이미지를 수정한 뒤 검증 실패를 보여주는 20초 데모가 강하다.

6. 개인정보 보호 UX를 전면화한다.
   redaction, 제출용 사본, manifest 분리, 로컬 삭제가 핵심 기능이다.

## 라이선스 추천

1순위: Apache-2.0

- 이유: PDF/무결성/검증 로직이 재사용될 수 있고, 특허 grant와 명확한 기업 사용성이 장점이다.
- MIT보다 다소 길지만, 보안/포렌식 주변 도구에는 Apache-2.0이 더 방어적이다.

2순위: MIT

- 이유: 스타와 채택에 마찰이 가장 적다.
- 단점: 특허 관련 명시성이 약하다.

추천: Apache-2.0으로 시작. README에 "not legal advice, no warranty of admissibility"를 명확히 둔다.

## 소스

- Hunchly: https://hunch.ly/
- Page Vault: https://www.page-vault.com/
- Evidence Collector: https://evidencecollector.org/en
- ArchiveWeb.page: https://github.com/webrecorder/archiveweb.page
- SingleFile: https://www.getsinglefile.com/
- Browsertrix Docs: https://docs.browsertrix.com/user-guide/
- ShareX: https://getsharex.com/
- NIST Digital Evidence Preservation: https://www.nist.gov/publications/digital-evidence-preservation-considerations-evidence-handlers
- OpenAI Codex for Open Source: https://openai.com/form/codex-for-oss/
