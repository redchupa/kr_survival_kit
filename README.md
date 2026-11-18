# KR Survival Kit

생수·식품·생활용품의 비축량과 기한을 Home Assistant에서 관리하고, 상황별 첫 행동과 인쇄용 안내를 열 수 있습니다.

[프로젝트 후원하기](#후원)

## 설치

Home Assistant 2026.11 이상에서 관리자 계정으로 설치합니다.

1. GitHub에서 **Code → Download ZIP**으로 저장소를 받습니다.
2. 압축을 풀고 `custom_components/kr_survival_kit` 폴더 전체를 HA 설정 폴더의 `custom_components/` 아래에 복사합니다. 폴더 안의 `content`, `translations`, `www`도 함께 복사합니다.
3. Home Assistant를 재시작한 뒤 **설정 → 기기 및 서비스 → 통합 추가 → KR Survival Kit**를 선택합니다.
4. 가구 인원과 기본 재고 점검 주기를 설정합니다. 기본값은 4명과 30일입니다. 설정을 마치면 왼쪽 사이드바에 **KR Survival Kit**가 표시됩니다.

Marketplace를 사용한다면 **설정 → Marketplace → 링크로 추가**에서 `redchupa/kr_survival_kit`을 입력하고 **통합**으로 설치한 후 3~4단계를 따르세요. [Home Assistant Marketplace 사용법](https://www.home-assistant.io/integrations/marketplace/#custom-repositories)

## 비축 관리

- **품목 그림**을 누르면 수정 창이 열립니다. 생수는 병 용량과 병 수를 입력하면 총 L가 계산됩니다. 예를 들어 2 L 병 12개는 24 L입니다.
- **입고일**을 비우면 오늘로 기록하고, 저장한 날이 마지막 실사일이 됩니다. 기한을 관리하는 품목은 포장에 적힌 날짜를 입력하세요. 비워 두면 **포장 기한 확인일**이 생기며, 실제 포장 기한을 확인하기 전에는 해당 수량이 비축 점수에 반영되지 않습니다.
- **목표량**은 품목별로 조정할 수 있습니다. **점검 및 관리 설정**의 재고 점검 주기는 실제 수량과 상태를 다시 확인할 간격입니다. 7일로 설정하면 매주 확인할 물품을 찾는 데 쓸 수 있습니다.
- **부족·확인 필요·기한 임박** 버튼으로 선반을 걸러 볼 수 있습니다. **선택 물품**에서 필요한 물품을 펼쳐 설정하세요. **비축 등급**과 **기록 미션**을 누르면 점수 기준과 목표가 열립니다.
- 상단에서 **블랙·화이트·블루·아이보리** 테마를 바꿀 수 있습니다. 선택은 현재 브라우저에 저장됩니다.

## 상황 안내와 인쇄

**상황 안내** 탭에서 상황을 선택하면 첫 행동과 이후 점검 항목을 볼 수 있습니다. 실제 상황에서는 공식 경보와 현장 지시를 따르세요. 안내는 공개 프리뷰입니다.

- **A4 행동 카드 열기**에서 PDF를 열어 A4 한 면으로 인쇄하거나 저장합니다.
- **오프라인 안내 열기**에서 브라우저의 **다른 이름으로 저장**으로 HTML 파일을 보관합니다. 저장한 파일은 인터넷 없이 열 수 있습니다.
- **상황 판단 연습**을 펼쳐 문제를 풉니다. 퀴즈와 비축 점수는 별도로 표시됩니다.

HA 없이 쓸 때는 GitHub에서 파일을 내려받을 수 있습니다. [A4 PDF](custom_components/kr_survival_kit/www/kr-survival-kit-a4.pdf?raw=1) · [오프라인 HTML](custom_components/kr_survival_kit/www/kr-survival-kit-offline.html?raw=1)

## MQTT 센서 연결

**설정 → 기기 및 서비스 → KR Survival Kit → 구성**에서 선택적으로 켤 수 있습니다. HA의 MQTT 통합과 브로커가 연결되어 있어야 합니다. MQTT로는 부족·확인 필요·기한 임박 건수만 발행합니다. 카드의 재고 조회와 수정은 MQTT 연결 없이 사용할 수 있습니다.

## 업데이트와 문제 해결

- **업데이트**는 기존 통합 폴더를 새 버전으로 교체한 뒤 HA를 재시작합니다. 이미 등록한 통합은 다시 추가할 필요가 없습니다.
- **설치 파일 누락** 오류가 나면 `content/`를 포함한 통합 폴더 전체를 다시 복사하고 재시작하세요.
- **사이드바에 메뉴가 없다면** 관리자 계정인지, 통합이 정상 로드됐는지 확인하세요. `kr-survival-kit` 주소에 직접 만든 대시보드가 있다면 그 대시보드가 우선합니다. 자동 화면을 쓰려면 기존 대시보드 주소를 바꾸고 통합을 다시 로드하세요.
- 설치·사용 문제나 안내 문구 정정은 [GitHub 이슈](https://github.com/redchupa/kr_survival_kit/issues)에 남길 수 있습니다. 주소, 연락처, 실제 재고는 올리지 마세요.

## 후원

KR Survival Kit가 도움이 되셨다면 후원으로 개발과 유지보수를 응원해 주세요.

- [GitHub Sponsors](https://github.com/sponsors/redchupa)
- [PayPal](https://www.paypal.com/ncp/payment/HG9KNC262PLAC)
- 토스 앱에서 아래 QR을 스캔해 후원할 수 있습니다.

<img src="https://raw.githubusercontent.com/redchupa/kr_ledger_kit/main/images/toss-donation.png" alt="토스 후원 QR 코드" width="160">
