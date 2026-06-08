# 증거정리함 Korean Brand And Next Development Direction

## Decision

한국어 사용자-facing 프로그램명은 **증거정리함**으로 둔다.

영어 OSS/기술 코어명은 **VeriPacket**으로 유지한다.

- 사용자 화면: `증거정리함`
- GitHub/CLI/schema/manifest 기술명: `VeriPacket`
- 공개 포맷명: `Open Evidence Packet Format`
- 저장소 slug: `screenshot-evidence-kit` 유지

## Why This Name

`VeriPacket`은 개발자에게는 "verifiable packet" 의미가 있지만, 일반 사용자가 처음 봤을 때 증거 정리 앱이라는 사실이 바로 전달되지 않는다.

`증거정리함`은 다음 장점이 있다.

- 기능이 바로 보인다: 증거를 정리하는 곳
- 법적 효력 보장처럼 들리지 않는다
- 로컬 보관, 개인정보 보호, 파일 묶음 이미지를 준다
- 중고거래, 환불, 하자, 분쟁 스크린샷 사용자에게 친숙하다
- 향후 `증거정리함 KR`, `증거정리함 US`처럼 국가 모드 확장도 자연스럽다

## Naming Boundary

금지할 표현:

- 법적증거보장
- 소송승리팩
- 법원증거인증
- 블록체인법정증거
- 변호사대체

사용할 표현:

- 스크린샷 증거 정리
- 시간순 PDF 패킷
- 로컬 무결성 검증
- 서버 업로드 없음
- 법률 자문 아님
- 증거 채택 보장 아님

## Product Direction

다음 개발은 한글-first UX를 우선한다. 현재 앱은 기능은 갖췄지만 버튼/필드/설명 대부분이 영어라 한국 사용자에게 아직 도구의 목적이 바로 들어오지 않는다.

### v0.5 Korean-First UX

- 주요 UI 라벨 한국어화
- README 상단 한국어 quick start 추가
- KR sample case 추가: 중고거래 환불/하자 사례
- PDF cover의 한국어 출력 개선 방안 검토
- Smart Review 문구 한국어 모드 지원

### v0.6 Evidence Packet Templates

- 중고거래 환불 템플릿
- 온라인 쇼핑 환불 템플릿
- 하자/수리비 청구 템플릿
- 프리랜서 미지급 템플릿
- 각 템플릿별 필수 증거 체크리스트

### v0.7 Mobile/PWA Capture

- PWA install
- share target
- 오프라인 캐시
- 휴대폰에서 저장한 캡처를 바로 사건에 추가
- 모바일 redaction review

### v0.8 Local OCR Privacy Review

- opt-in local OCR
- 전화번호, 계좌, 주소, 이메일 후보 표시
- OCR 결과는 기본적으로 저장하지 않음
- OCR은 "개인정보 후보 탐지"로만 표현

## README Positioning Draft

`증거정리함`은 중고거래, 환불, 하자, 수리, 결제 분쟁에서 흩어진 스크린샷을 시간순 PDF 증거 패킷으로 정리하는 로컬 우선 웹앱입니다. 이미지는 서버로 업로드되지 않으며, 각 파일의 SHA-256 해시, 리닥션 내역, Smart Review 결과, manifest digest를 함께 기록해 나중에 패킷이 바뀌었는지 확인할 수 있습니다. 이 프로젝트는 법률 자문이나 증거 채택 보장을 제공하지 않습니다.

## Implementation Note

PDF 생성기는 아직 한글 폰트 임베딩을 지원하지 않는다. 그래서 앱 화면과 README는 `증거정리함`을 전면에 두되, PDF 내부 기술 표지와 manifest의 `generatedBy.appName`은 당분간 ASCII 호환 `VeriPacket` 또는 `Jeunggeo Jeongriham (VeriPacket)` 표기를 병행한다.
