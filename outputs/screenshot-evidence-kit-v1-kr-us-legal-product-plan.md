# VeriPacket v1 KR/US Legal Product Plan

작성일: 2026-06-03

주의: 이 문서는 제품 기획용 법률 정보 정리다. 법률 자문, 소송 전략, 증거 채택 보장, 특정 사건의 승패 판단이 아니다. v1 제품도 "legal guidance"가 아니라 "jurisdiction-aware evidence packet builder"로 표현해야 한다.

## 한 줄 결론

v1에서 가장 완성도 높은 방향은 `대한민국 모드`와 `미국 모드`를 분리하고, 각 국가의 전자문서/증거인증/소비자분쟁/개인정보 기준에 맞는 체크리스트, PDF 문구, manifest 필드, 제출용 템플릿을 자동으로 바꿔 주는 것이다.

제품 문장:

> Build a local, privacy-first evidence packet that follows country-specific documentation checklists for Korea or the United States.

법적 효력을 직접 주장하지 말고, 다음처럼 말한다.

> The app helps organize integrity metadata, timelines, redactions, and filing-ready summaries. It does not decide admissibility or provide legal advice.

## v1 제품 구조

### 핵심 기능

1. Country mode
   - `Korea`
   - `United States`

2. Dispute type
   - 중고거래/marketplace
   - 온라인 쇼핑 환불/online shopping refund
   - 배송 지연/미배송/shipping or non-delivery
   - 하자/defective goods
   - 수리/시공/repair or workmanship defect
   - 프리랜서 대금/freelance payment

3. Evidence packet builder
   - screenshot inbox
   - chronological timeline
   - source label
   - captured/imported timestamp
   - user note
   - original SHA-256
   - redacted-render SHA-256
   - manifest digest

4. Jurisdiction-specific checklist
   - 한국 모드와 미국 모드에서 다른 질문, 문구, 경고, PDF appendix 사용

5. PDF export
   - 국가별 cover
   - 사건 요약
   - 시간순 증거표
   - 증거별 상세 페이지
   - 개인정보 마스킹 확인
   - integrity appendix
   - legal limitation appendix

6. Verifier
   - manifest와 파일 해시 검증
   - PDF embedded digest 확인
   - 원본/제출용 렌더링 구분

## 대한민국 모드

### 적용할 법률/절차 축

대한민국 모드는 "전자문서로서 효력이 부인되지 않는 자료를, 민사/소비자분쟁에서 설명 가능한 형태로 정리한다"가 핵심이다.

제품이 참조할 축:

- 전자문서 및 전자거래 기본법
- 민사소송법 및 민사소송 등에서의 전자문서 이용 등에 관한 법률
- 개인정보 보호법
- 전자상거래 등에서의 소비자보호에 관한 법률
- 소비자기본법/소비자분쟁조정 흐름
- 민법상 매매/하자담보/채무불이행 관련 일반 분쟁 흐름

### 대한민국 모드에서 직접 제품화할 수 있는 점

1. 전자문서 안내
   - 전자문서는 전자적 형태라는 이유만으로 효력이 부인되지 않는다는 전자문서법의 기본 원칙을 README와 PDF appendix에 요약한다.
   - 다만 "이 PDF가 법원에서 반드시 증거로 채택된다"는 말은 금지한다.

2. 보관/재현성 체크
   - 전자문서 보관 요건의 취지를 제품에 반영한다.
   - 원본 파일, 작성/저장/가져온 시각, 해시, 재현 가능한 PDF/manifest를 유지한다.
   - "원본 이미지 보관", "제출용 redacted image", "manifest"를 분리한다.

3. 민사/소비자분쟁용 설명 구조
   - 법적 주장을 자동 작성하지 않는다.
   - 대신 "사실관계", "시간순 경과", "요청사항", "첨부 증거" 구조로 PDF를 만든다.

4. 개인정보보호
   - 앱은 서버 업로드가 없다는 점을 명확히 한다.
   - 사용자가 상대방 개인정보를 포함한 자료를 보유/공유할 수 있으므로, PDF export 전 개인정보 체크리스트를 넣는다.
   - 주민등록번호, 계좌번호, 주소, 전화번호, 얼굴, 차량번호, 미성년자 정보는 고위험 항목으로 취급한다.

5. 전자상거래/환불 케이스
   - 통신판매/전자상거래에서 청약철회, 환급, 배송, 불만처리 관련 증거를 정리할 수 있도록 질문지를 제공한다.
   - 예: 주문일, 결제일, 배송예정일, 실제 배송일, 하자 발견일, 교환/환불 요청일, 판매자 답변일.

### 대한민국 모드 PDF 구조

1. 표지
   - 사건명
   - 작성일
   - 작성자 별칭
   - 상대방 별칭
   - 사건 유형
   - 증거 개수
   - manifest digest

2. 사실관계 요약
   - 거래/계약 개요
   - 약속된 조건
   - 문제가 된 사실
   - 요청사항

3. 시간순 경과표
   - 순번
   - 일시
   - 사건
   - 증거번호
   - 출처

4. 증거 상세
   - 제출용 이미지
   - 설명
   - 원본 파일명
   - 원본 SHA-256
   - 제출용 렌더링 SHA-256
   - redaction 내역

5. 개인정보 확인
   - 전화번호
   - 주소
   - 계좌번호
   - 주민등록번호/고유식별정보
   - 주문번호/송장번호
   - 얼굴/차량번호
   - 미성년자 정보

6. 무결성 부록
   - 앱 버전
   - 생성 시각
   - manifest digest
   - verifier 사용법

7. 한계 고지
   - 법률 자문 아님
   - 증거 채택 보장 아님
   - 스크린샷 원본 사실 자체의 진실성 보장 아님
   - 기기 시간/촬영 전 편집 가능성은 사용자가 설명해야 함

### 대한민국 모드 체크리스트

#### 공통

- 원본 스크린샷을 삭제하지 않았는가?
- 각 이미지의 출처를 적었는가?
- 각 이미지의 날짜/시간을 적었는가?
- 핵심 증거에 설명을 붙였는가?
- 제출용 PDF와 별도로 manifest를 보관하는가?

#### 중고거래

- 판매글 내용이 있는가?
- 상품 상태 설명이 있는가?
- 가격/결제 증거가 있는가?
- 배송/수령 증거가 있는가?
- 하자 발견 시점 증거가 있는가?
- 환불/교환 요청과 상대방 답변이 있는가?

#### 온라인 쇼핑/전자상거래

- 주문 내역이 있는가?
- 결제 내역이 있는가?
- 상품 상세/광고 문구가 있는가?
- 배송 예정/실제 배송 자료가 있는가?
- 하자 사진 또는 오류 화면이 있는가?
- 교환/환불 요청 내역이 있는가?
- 사업자 답변 또는 미답변 경과가 있는가?

## 미국 모드

### 적용할 법률/절차 축

미국 모드는 "Federal baseline + state caution"으로 설계해야 한다. 미국은 증거법과 소비자보호가 연방/주로 갈라지고, 소액재판 절차도 주마다 다르다.

제품이 참조할 축:

- Federal Rules of Evidence 901: authentication
- Federal Rules of Evidence 902(13), 902(14): electronic process/system and copied data self-authentication 절차
- Federal Rules of Evidence 1001-1003: writings, recordings, photographs, originals, duplicates
- Federal Rules of Evidence 801/802: hearsay risk
- FTC Mail, Internet, or Telephone Order Merchandise Rule
- FTC online shopping consumer guidance
- E-SIGN Act, 15 U.S.C. 7001
- State law variation: small claims, consumer protection, privacy, recording, marketplace rules

### 미국 모드에서 직접 제품화할 수 있는 점

1. Authentication packet
   - FRE 901 관점에서 "이 스크린샷이 무엇이라고 주장하는지"를 설명할 수 있는 필드를 둔다.
   - `What is this evidence?`, `Where did it come from?`, `Who captured it?`, `When was it captured/imported?`, `Why is it relevant?`

2. Electronic evidence certification helper
   - FRE 902(13)/(14)는 모든 사용자에게 자동 적용되는 마법이 아니다.
   - 하지만 v1은 "qualified person certification"을 대체하지 않고, 해시/프로세스 설명/manifest를 제공해 인증 설명을 돕는다.
   - PDF appendix에 "technical process summary"를 넣는다.

3. Duplicate/original explanation
   - FRE 1001-1003의 원본/복제본 개념에 맞춰, 원본 screenshot file과 redacted PDF rendering을 구분한다.
   - `Original imported file`, `Redacted duplicate for submission`, `Manifest record`를 명확히 표시한다.

4. Hearsay warning
   - 채팅 스크린샷 안의 문장은 별도 hearsay 문제가 될 수 있다.
   - 제품은 판단하지 않고 "This screenshot contains statements by another person. A court or platform may require additional context or testimony." 경고를 제공한다.

5. FTC refund/shipping template
   - 온라인 주문/미배송/배송 지연/잘못된 상품/하자 상품 케이스에서 FTC consumer guidance에 맞춘 질문지를 제공한다.
   - 결제일, promised shipping date, delay notice, refund request, seller response를 수집한다.

6. State selection
   - v1에서는 모든 주 법률을 풀로 구현하지 않는다.
   - 대신 `State: optional` 선택값을 두고, PDF cover에 "State-specific rules may apply"를 표시한다.
   - v1.1 이후 CA/NY/TX/FL 같은 주별 small claims checklist를 추가할 수 있다.

### 미국 모드 PDF 구조

1. Cover
   - case title
   - jurisdiction: United States
   - optional state
   - dispute type
   - generated at
   - evidence item count
   - manifest digest

2. Claim-neutral summary
   - transaction summary
   - requested outcome
   - timeline summary
   - evidence list

3. Evidence timeline
   - date/time
   - event
   - source
   - evidence number
   - relevance note

4. Evidence detail pages
   - redacted screenshot
   - authentication prompts
   - source
   - captured/imported timestamp
   - original SHA-256
   - redacted SHA-256
   - hearsay/context warning if chat statements exist

5. Technical process appendix
   - how files were imported
   - hashing algorithm
   - redaction rendering
   - manifest digest
   - verifier instructions

6. Limitations appendix
   - not legal advice
   - admissibility not guaranteed
   - federal/state/local rules may differ
   - user must preserve original files
   - statements in screenshots may raise hearsay/context issues

### 미국 모드 체크리스트

#### 공통 authentication

- Can you explain what each screenshot is?
- Can you identify the source app, website, or device?
- Can you explain when and how it was captured?
- Did you preserve the original file?
- Did you avoid editing the original before import?
- Does the manifest hash match?

#### Online shopping/refund

- What was ordered?
- What did the seller promise?
- What was the promised shipping or delivery date?
- Was there a delay notice?
- Did the seller offer cancellation or refund?
- Was the item wrong, defective, or never received?
- What payment method was used?
- Was a chargeback or platform dispute opened?

#### Marketplace/peer-to-peer

- What did the listing say?
- What did the seller represent about condition?
- What payment or delivery evidence exists?
- When was the problem discovered?
- What did the seller say after notice?
- What outcome is requested?

## 국가별 차이를 제품에 반영하는 방식

| 영역 | 대한민국 모드 | 미국 모드 |
| --- | --- | --- |
| 기본 언어 | 한국어 우선, 영어 선택 | 영어 우선, 한국어 선택 |
| 법률 축 | 전자문서법, 전자소송, 개인정보보호법, 전자상거래법 | FRE, FTC, E-SIGN, state caution |
| PDF 문구 | 사실관계/요청사항/첨부 증거 | claim-neutral summary/authentication prompts |
| 개인정보 | 주민등록번호/계좌/주소/전화/송장/얼굴 고위험 | SSN/phone/address/payment/face/license plate high risk |
| 증거 설명 | 사건 경과표 중심 | authentication/relevance/context 중심 |
| 리스크 문구 | 법원 증거 채택 보장 아님 | admissibility/hearsay/state-law caution |
| 소비자분쟁 | 전자상거래법/소비자분쟁조정 흐름 | FTC shipping/refund + chargeback/platform dispute |
| 무결성 | 전자문서 보관/재현성 취지 | hash, duplicate/original, technical process summary |

## v1 Legal Mode 데이터 모델

```json
{
  "jurisdiction": {
    "country": "KR",
    "stateOrProvince": null,
    "language": "ko-KR",
    "legalPackVersion": "kr-2026-06"
  },
  "case": {
    "title": "중고 그래픽카드 환불 분쟁",
    "disputeType": "marketplace_refund",
    "requestedOutcome": "환불 또는 수리비 보상",
    "summary": []
  },
  "evidenceItems": [
    {
      "id": "E-001",
      "sourceLabel": "중고거래 채팅",
      "capturedAt": "2026-05-30T20:12:00+09:00",
      "importedAt": "2026-06-03T10:00:00+09:00",
      "originalFilename": "chat-001.png",
      "originalSha256": "...",
      "renderedSha256": "...",
      "note": "판매자가 정상 작동을 설명한 대화",
      "legalPrompts": {
        "kr": {
          "factDescription": "정상 작동 고지",
          "privacyReviewed": true
        },
        "us": {
          "whatIsThis": "Chat screenshot",
          "whereFrom": "Marketplace chat",
          "whyRelevant": "Seller represented the item as working",
          "hearsayContext": true
        }
      },
      "redactions": []
    }
  ],
  "integrity": {
    "hashAlgorithm": "SHA-256",
    "manifestDigest": "...",
    "appVersion": "1.0.0"
  }
}
```

## v1 Legal Pack 파일 구조

```text
legal-packs/
  kr/
    pack.json
    checklists/
      common.json
      marketplace_refund.json
      ecommerce_refund.json
      defect_repair.json
    pdf/
      cover.ko.md
      limitations.ko.md
      integrity-appendix.ko.md
    docs/
      legal-information.ko.md
  us/
    pack.json
    checklists/
      common.json
      online_shopping_refund.json
      marketplace_refund.json
      defective_goods.json
    pdf/
      cover.en.md
      limitations.en.md
      technical-process.en.md
    docs/
      legal-information.en.md
```

## v1에 추가해야 할 기능

### P0

- country mode 선택
- 한국/미국별 PDF 문구 분기
- 한국/미국별 checklist 분기
- jurisdiction-aware manifest field
- 개인정보 고위험 항목 국가별 분기
- legal limitation appendix
- technical process appendix

### P1

- 미국 authentication prompt
- 한국 사실관계/요청사항 prompt
- FTC shipping/refund questionnaire
- 한국 전자상거래 환불 questionnaire
- hearsay/context warning
- 원본/제출용 사본 구분 UI

### P2

- CA/NY/TX/FL state checklist overlays
- 대한민국 소비자분쟁조정 신청용 요약 템플릿
- small claims packet template
- optional external timestamp proof
- lawyer-review export mode

## README 포지셔닝 보강

추천 첫 문단:

`VeriPacket` is a local-first evidence packet builder for everyday disputes, with separate Korea and United States modes. It helps you turn screenshots from chats, orders, payments, deliveries, refunds, and defects into a chronological PDF packet with redactions, hashes, a machine-readable manifest, and jurisdiction-aware documentation checklists. It does not upload your evidence, does not give legal advice, and does not guarantee admissibility.

추천 배지:

- `Local-first`
- `No uploads`
- `KR/US legal modes`
- `PDF export`
- `SHA-256 manifest`
- `Privacy redaction`
- `Not legal advice`

## 런치 메시지 보강

Hacker News:

> Show HN: Local-first screenshot evidence packets with Korea/US legal checklists

GitHub README subtitle:

> A privacy-first tool for turning dispute screenshots into chronological, verifiable PDF packets.

한국 커뮤니티:

> 중고거래/환불/하자 분쟁 스크린샷을 시간순 PDF 증거 패킷으로 정리하는 로컬 우선 오픈소스 도구

미국 커뮤니티:

> Organize marketplace, refund, and defective-goods screenshots into a clean packet with hashes, redactions, and authentication prompts.

## 리스크와 방어 전략

### 무허가 법률 자문 리스크

위험:

- "이 증거는 인정됩니다"
- "이 법에 따라 환불받을 수 있습니다"
- "이 문장을 보내면 승소합니다"

방어:

- 법률 정보와 체크리스트만 제공
- claim-neutral wording 사용
- 변호사 검토 권장 문구
- 법률 자문 아님 고지
- 법률 pack은 오픈소스 문서로 공개하고 검토 가능하게 유지

### 국가/주별 법률 변경 리스크

위험:

- 한국 법령 개정
- 미국 주별 소비자보호/소액재판 절차 차이
- 연방 증거규칙 개정

방어:

- `legalPackVersion` 필드
- source URL과 last reviewed date 포함
- outdated pack warning
- GitHub issue template: legal pack update

### 개인정보 리스크

위험:

- 상대방 개인정보가 포함된 PDF 공유
- 고유식별정보 노출
- 아이/얼굴/주소/차량번호 노출

방어:

- 국가별 고위험 개인정보 체크리스트
- 불투명 redaction 기본값
- PDF export 전 privacy review gate
- 원본/제출용 사본 분리

### 증거 조작 오해 리스크

위험:

- redaction이 편집으로 보일 수 있음
- 원본 해시와 PDF 이미지가 달라 혼동

방어:

- `originalSha256`와 `renderedSha256`를 모두 표시
- redaction list를 appendix에 표시
- verifier로 원본/manifest 확인
- "redacted for privacy" 라벨 명확화

## v1 성공 기준

1. 한국 모드에서 중고거래 환불 샘플 PDF가 자연스럽게 나온다.
2. 미국 모드에서 online shopping refund 샘플 PDF가 자연스럽게 나온다.
3. 두 PDF의 checklist, 문구, appendix가 서로 다르다.
4. 둘 다 manifest/verify가 작동한다.
5. README에서 "법률 적용"이 아니라 "국가별 문서화 체크리스트"임이 명확하다.
6. 오픈소스 기여자가 legal pack을 업데이트할 수 있다.

## 추천 다음 산출물

1. `legal-packs/kr/pack.json` 초안
2. `legal-packs/us/pack.json` 초안
3. 한국 모드 샘플 PDF 스펙
4. 미국 모드 샘플 PDF 스펙
5. README의 legal disclaimer 섹션
6. `docs/integrity-model.md`
7. `docs/legal-information-not-advice.md`

## 공식/주요 참고 자료

- 대한민국 전자문서 및 전자거래 기본법: https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=161102
- 전자문서법 제4조 조문정보: https://www.law.go.kr/LSW/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1007934995
- 전자문서법 제5조 조문정보: https://www.law.go.kr/lsLawLinkInfo.do?chrClsCd=010202&lsJoLnkSeq=900036260
- 대한민국 민사소송법: https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=&chrClsCd=010202&efYd=20250301&lsiSeq=258669&urlMode=lsInfoP
- 민사소송 등에서의 전자문서 이용 등에 관한 법률: https://www.law.go.kr/LSW/LsiJoLinkP.do?docType=JO&joNo=001300000&languageType=KO&lsNm=%EB%AF%BC%EC%82%AC%EC%86%8C%EC%86%A1+%EB%93%B1%EC%97%90%EC%84%9C%EC%9D%98+%EC%A0%84%EC%9E%90%EB%AC%B8%EC%84%9C+%EC%9D%B4%EC%9A%A9+%EB%93%B1%EC%97%90+%EA%B4%80%ED%95%9C+%EB%B2%95%EB%A5%A0&paras=1
- 대한민국 개인정보 보호법: https://law.go.kr/LSW/lsInfoP.do?lsiSeq=248613
- 대한민국 전자상거래 등에서의 소비자보호에 관한 법률: https://www.law.go.kr/LSW/lsInfoP.do?efYd=20240213&lsiSeq=260399
- 대한민국 소비자기본법: https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=103834
- Federal Rules of Evidence, Rule 901: https://www.law.cornell.edu/rules/fre/rule_901
- Federal Rules of Evidence, Rule 902: https://www.law.cornell.edu/rules/fre/rule_902
- Federal Rules of Evidence, full rules: https://www.law.cornell.edu/rules/fre
- FTC Mail, Internet, or Telephone Order Merchandise Rule: https://www.ftc.gov/legal-library/browse/rules/mail-internet-or-telephone-order-merchandise-rule
- FTC Online Shopping consumer guidance: https://consumer.ftc.gov/articles/online-shopping
- E-SIGN Act, 15 U.S.C. 7001: https://www.govinfo.gov/link/uscode/15/7001
