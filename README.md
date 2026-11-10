# KR Survival Kit

평소 쓰는 물품으로 준비하고, 정전이 나면 미리 저장하거나 인쇄한 안내를 꺼내 쓰는 한국 가정 비상 대비 프로젝트입니다.

**인쇄해서 쓰기** · `output/pdf/kr-survival-kit-a4.pdf`는 A4 단면 한 장입니다. 전화·인터넷 두절, 경보별 첫 행동, 4인 가구 3일 준비량 요약, 대피 후 점검과 가족 기록칸을 같은 면에 배치했습니다. 상세 타임라인·상황별 전환표·품목별 준비량과 근거는 `output/offline.html` 파일을 저장해 인터넷 없이 읽을 수 있습니다.

**Home Assistant로 시작하기** · `output/dashboard.yaml`은 대피 우선과 평시 준비를 구분하고, 첫 화면에 4인 가구 3일 준비량을 보여 주는 Sections 대시보드입니다. PDF·HTML 버튼은 파일을 여는 동작이며 열린 브라우저의 인쇄·다운로드·저장 기능으로 기기에 보관합니다. 로컬 재고와 집계 센서, 선택형 MQTT Discovery를 사용할 수 있습니다.

현재 자료는 **공개 전 검토용**입니다. 공습·평시 준비, 경계·화생방·핵경보, 정전·단수 안내를 담았습니다. 현재 발령된 재난문자·방송과 현장 지시를 먼저 따르세요. 전화·인터넷이 끊긴 경우를 첫 화면과 인쇄물 상단에 따로 안내합니다. 가족 연락처와 실제 대피소 정보는 인쇄한 공란에 손으로 적어 개인 보관하세요.

## 로컬에서 만들기

Python 3.11 이상에서 저장소 루트 기준으로 실행합니다. HTML과 HA Markdown 빌드에는 Python 표준 라이브러리만 필요합니다.

```text
python scripts/build_guides.py
python -m unittest discover -s tests -p test_guides.py -v
python tests/test_household.py
```

PDF와 브라우저 검증에는 개발 의존성, Chromium, 시스템 한글 글꼴이 필요합니다. Windows에서는 맑은 고딕을 사용할 수 있습니다. Linux에서는 Noto Sans CJK KR을 설치한 뒤 실행하세요.

```text
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python scripts/build_guides.py --pdf
python tests/verify_artifacts.py
```

이미 설치한 Chrome을 쓰려면 마지막 두 명령에 `--browser "<Chrome 실행 파일의 절대 경로>"`를 붙이세요. 출력물은 Git에서 제외하며 릴리스 단계에서 별도 아티팩트로 배포합니다. Markdown 카드에서 읽을 때는 생성된 Markdown 내용을 붙여넣고, 오프라인 파일은 비상 전에 기기에 저장해 두세요.

## 콘텐츠와 공개 검토

- `custom_components/kr_survival_kit/content/guide.ko.json`은 통신 두절과 상황별 안내의 단일 원본입니다. 각 상황에 안정 ID, 첫 행동, 상세 행동, 종이용 요약, 출처 ID, 검토 상태와 검토일이 있습니다. 출처에는 기관, 제목, URL, 확인한 문단, 확인일이 있습니다. [상황별 근거와 예외 검토표](docs/content-review.md)에서 인쇄 문구의 근거를 확인할 수 있습니다.
- `catalog.ko.json`은 브랜드와 구매 링크가 없는 13개 품목의 시작 목록입니다. 우선순위는 평소 소비(`rotation`), 보유 장비 점검(`owned`), 해당 가구 준비(`household`), 선택 추가(`optional`) 순입니다. 수량 단위는 `ml` 또는 `개`, 날짜 유형은 표시 기한(`expiry`) 또는 점검(`inspection`)입니다. 품목별 목표량은 가구가 정합니다.
- 실제 사람·주소·연락처·동선을 자료나 제보에 포함하지 마세요. `tests/fixtures/stock.json`의 값은 검증용 가상 수량입니다.
- 출처나 행동 문구를 바꾸면 문구를 `draft`로 돌리고 `reviewed_on`을 비웁니다. 공개 전 검토자가 출처와 문장을 대조한 뒤 `reviewed`와 검토일을 기록하고 안내 버전을 올립니다. `python scripts/build_guides.py --release --pdf`는 미검토 문구 또는 초안 버전에서 실패합니다.

## P2 로컬 재고와 Home Assistant

`custom_components/kr_survival_kit/`를 HA 설정 폴더의 `custom_components/`에 복사하고 HA를 재시작한 뒤 **설정 → 기기 및 서비스 → 통합 추가 → KR Survival Kit**를 선택합니다. 한 인스턴스에 한 가구만 등록합니다. 점검 주기(기본 30일)를 정하면 로컬 `Store`에 버전 1 스냅샷을 저장합니다. 브로커나 외부 계정은 필요하지 않습니다. 운영 설치 결과는 아래 [NRGNC 운영 검증](#nrgnc-운영-검증-2026-11-10)에 기록했습니다.

관리자는 개발자 도구의 action 또는 대시보드 재고 카드에서 `kr_survival_kit.get_inventory`를 호출해 `revision`, 품목별 `state`와 합계를 읽을 수 있습니다. `kr_survival_kit.set_item`은 **현재 revision**과 카탈로그 `item_id`, `applicable`, `target`, `lots`, `confirm`을 요구합니다. `lots`의 각 원소는 `lot_id`, 비음수 정수 `quantity`, ISO 날짜 또는 `null`인 `expires_on`을 가집니다. `kr_survival_kit.delete_item`은 `item_id`와 현재 revision을 요구합니다. 성공한 쓰기는 새 revision을 반환하며, 다른 편집이 먼저 저장되면 다시 조회한 뒤 절대 수량으로 재입력해야 합니다. 이 action들은 HA 관리자만 호출할 수 있습니다. `entry_id`는 단일 가구에서 생략할 수 있습니다.

예시: 첫 `get_inventory`가 `revision: 0`을 반환했다면 아래처럼 **실제로 확인한 뒤에만** `confirm: true`로 저장합니다. `target`과 `quantity`의 단위는 카탈로그 품목 단위(`ml` 또는 `개`)입니다.

```yaml
action: kr_survival_kit.set_item
data:
  item_id: drinking-water
  revision: 0
  applicable: true
  target: 5000
  lots:
    - lot_id: bottles-1
      quantity: 2000
      expires_on: "2027-02-01"
  confirm: true
```

확인한 0개는 `부족`, 미기록·목표 미설정·실사 경과·확인하지 않은 수정은 `확인 필요`입니다. 해당 없음과 목표 0은 집계에서 제외합니다. 표시 기한이 지난 수량은 사용 가능 수량에서 제외하고 날짜 미상 수량은 확정 수량에 포함하지 않습니다. 기한 임박은 오늘부터 30일 이내에 표시 기한이 있는 품목 수이며 부족 여부와 독립적입니다. 표시 기한 당일은 집계하고 다음 날 제외합니다. 식품의 실제 사용 가능성은 포장과 보관 상태를 별도로 확인해야 합니다. 센서의 엔터티 ID는 HA가 정하므로 `unique_id`의 끝인 `shortage_count`, `needs_check_count`, `expiring_count`로 확인하세요. 현지 날짜가 바뀌면 센서를 다시 계산합니다.

### P2 검증 결과 (2026-11-09)

- Windows Python 3.14에서 `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`과 `pytest_asyncio.plugin`을 사용한 순수 재고 테스트: **6개 통과**. 확인한 0개와 미기록, 기한 경과·미상, 자정, 실사 경과, 해당 없음, 삭제, 비확인 수정, 동시 revision 충돌, 저장 실패 후 스냅샷·알림 유지, 저장본 재로드, 지원하지 않는 스키마의 쓰기 방지를 검사했습니다. 기존 P0–P1 `unittest` 8개도 통과했습니다.
- 격리된 WSL Ubuntu 24.04, Python 3.14.10, **Home Assistant Core 2026.11.0**에서 `tests/ha_smoke.py` 통과. 실제 HA 설정 흐름으로 통합을 추가하고 브로커 없이 집계 센서 3개를 생성했습니다. 관리자 action으로 저장 후 센서가 갱신되었고, 오래된 revision·비관리자 조회·강제 저장 실패는 거부되었습니다. HA 인스턴스를 중지하고 같은 설정 디렉터리에서 새 인스턴스를 시작해 revision, 목표량, 부족 센서 값이 복원됨을 확인했습니다. 테스트 HA의 선택적 FFmpeg/터보JPEG 의존성 경고는 이 통합 검증의 실패가 아니었습니다.
- 재현 명령(저장소 `public/`에서): Windows PowerShell은 `$env:PYTEST_DISABLE_PLUGIN_AUTOLOAD='1'; py -3.14 -m pytest -q tests/test_inventory.py -p pytest_asyncio.plugin`; Linux/WSL의 격리 Python 환경(`homeassistant==2026.11.0`)은 `python tests/ha_smoke.py`입니다. Windows의 HA 테스트 플러그인은 `fcntl`을 요구하므로 실제 HA 검증은 WSL에서 실행했습니다.

## P3 선택형 MQTT 센서

**설정 → 기기 및 서비스 → KR Survival Kit → 구성**에서 MQTT 센서 발행을 켤 수 있습니다. 기존 HA MQTT 통합이 브로커에 연결되어 있어야 합니다. 이 옵션의 기본값은 꺼짐입니다. HA MQTT 통합에서 설정한 Discovery prefix를 사용하며, birth 메시지 설정은 그대로 둡니다. 연결 상태 알림으로 재연결을 감지합니다.

세 센서는 `shortage_count`, `needs_check_count`, `expiring_count`의 숫자만 전송합니다. Discovery 설정은 retained QoS 1, 상태는 non-retained QoS 1입니다. 연결·재연결 때 최신 스냅샷을 보내고, 이후 재고 변경 직후와 60초 간격으로 전송합니다. 상태 메시지가 180초 동안 없으면 MQTT 센서는 unavailable이 됩니다. 센서 상태는 비상 경보나 대피 판단에 사용하지 마세요.

발행을 끄면 retained Discovery 설정 3개를 빈 메시지로 지웁니다. 브로커가 끊겼다면 `mqtt_cleanup_pending` 옵션이 남고 연결 복구 후 다시 정리합니다. 통합을 제거할 때 브로커가 끊겨 정리에 실패했다면 브로커 관리자에서 아래 패턴의 retained 토픽 3개를 삭제하세요. `<prefix>`는 HA MQTT 통합의 Discovery prefix이고 `<entry_id>`는 이 통합의 config entry ID입니다.

```text
<prefix>/sensor/kr_survival_kit_<entry_id>/shortage_count/config
<prefix>/sensor/kr_survival_kit_<entry_id>/needs_check_count/config
<prefix>/sensor/kr_survival_kit_<entry_id>/expiring_count/config
```

### P3 검증 결과 (2026-11-10)

- 격리된 WSL Ubuntu 24.04의 **HA Core 2026.11.0**과 실제 **Mosquitto 2.0.18**에서 `tests/ha_mqtt_smoke.py` 통과. MQTT 통합의 UI 설정 흐름을 사용해 브로커를 연결하고, KR Survival Kit 옵션 흐름으로 발행을 켰습니다. 새 구독자에게 retained Discovery 3개가 전달되고 상태 메시지는 보존되지 않는 것을 확인했습니다.
- 실제 MQTT 센서 3개가 생성되었고, 테스트에서 만료 시간을 3초로 낮춰 unavailable 전환과 새 상태 발행 후 숫자 복구를 확인했습니다. 상태를 중복 발행해도 metric별 엔터티는 하나씩 유지됐습니다. 제품 설정은 180초 만료·60초 재발행입니다.
- 브로커 종료 중 관리자 action으로 재고를 저장했습니다. 브로커 재시작 뒤 최신 부족 건수 1이 발행됐고, HA 인스턴스 재시작 후에도 재고 revision과 발행이 복원됐습니다. 브로커를 다시 중단한 상태에서 발행을 끄자 정리 대기가 기록됐으며, 재연결 후 빈 retained Discovery 메시지 3개가 발행되고 정리 대기가 해제됐습니다. 새 구독자는 삭제된 Discovery를 받지 않았습니다. 브로커 단절 직후 HA MQTT 자체의 birth 발행 실패 로그가 발생했으나 이후 복구됐습니다.
- 재현은 Linux/WSL의 격리 Python에 `homeassistant==2026.11.0`과 HA MQTT 통합 요구사항인 `paho-mqtt==2.1.0`, 실행 파일 `mosquitto`가 필요합니다. `public/`에서 `python tests/ha_mqtt_smoke.py`를 실행합니다. 테스트는 임시 HA 설정과 별도 포트 18885의 브로커를 생성하고 종료합니다. P2 회귀 테스트 6개와 기존 안내 테스트 8개도 통과했습니다.

## P4 Home Assistant 대시보드 설치

`public/`에서 안내와 대시보드를 생성합니다. PDF 생성에는 앞 절의 Playwright와 Chromium이 필요합니다.

```text
python scripts/build_guides.py --pdf
python scripts/build_dashboard.py
```

HA의 설정 폴더에 통합 폴더를 `custom_components/kr_survival_kit/`로 복사한 뒤 HA를 재시작하고 **설정 → 기기 및 서비스 → 통합 추가 → KR Survival Kit**로 설정합니다. 아래 세 공개 파일만 HA 설정 폴더의 `www/`에 복사합니다. HA의 `/local` 경로는 인증 없이 열리므로 가구 재고나 연락처를 이 폴더에 넣지 마세요.

| 원본 | HA 설정 폴더의 목적지 |
| --- | --- |
| `custom_components/kr_survival_kit/www/kr-survival-kit-card.js` | `www/kr-survival-kit-card.js` |
| `output/pdf/kr-survival-kit-a4.pdf` | `www/kr-survival-kit-a4.pdf` |
| `output/offline.html` | `www/kr-survival-kit-offline.html` |

**설정 → 대시보드**에서 `KR Survival Kit` 대시보드를 만들고 URL을 `kr-survival-kit`으로 지정합니다. 리소스 `/local/kr-survival-kit-card.js`를 JavaScript 모듈로 등록하고, 대시보드의 원시 설정 편집기에 `output/dashboard.yaml` 내용을 붙여 넣습니다. 첫 보기의 **경보별 행동 보기**는 두 번째 보기로 연결됩니다. 다른 대시보드 URL을 쓴다면 `output/dashboard.yaml`의 `/kr-survival-kit/guide`도 맞춰 수정하세요. 새 HA에서 집계 센서의 entity ID는 생성된 예시와 같았지만 기존 HA에서는 달라질 수 있습니다. Tile 3개의 `entity`를 실제 부족·확인 필요·기한 임박 센서 ID와 대조해 수정하세요. **A4 인쇄 카드 열기**와 **오프라인 안내 열기**는 `/local/kr-survival-kit-a4.pdf`, `/local/kr-survival-kit-offline.html`을 엽니다. PDF는 열린 화면에서 인쇄하거나 다운로드하고, HTML은 브라우저의 다른 이름으로 저장을 사용해 비상 전에 기기에 보관하세요.

재고 카드는 관리자 action의 `get_inventory`, `set_item`, `delete_item`을 호출합니다. 목표량은 품목 단위인 `ml` 또는 `개`의 정수이며, 구매 단위마다 수량과 표시 기한을 입력합니다. 실사 체크박스를 직접 선택했을 때만 오늘 날짜를 마지막 실사일로 기록합니다. 동시 수정 오류가 나면 새 revision을 불러오면서 입력을 유지하고 재확인을 요청합니다. 저장 실패도 입력을 유지합니다. 카드와 기본 집계 센서는 MQTT 옵션이 꺼져 있어도 로컬 재고를 표시합니다.

### P4 검증 결과 (2026-11-10)

- 격리된 HA Core 2026.11.0의 실제 대시보드에서 Markdown 안내, Tile 집계, 사용자 정의 재고 카드가 렌더링됐습니다. 375px 화면에서 안내와 인쇄 링크를 찾고, **상황별 행동요령 열기**에서 별도 보기로 이동해 행동요령 본문을 확인했습니다. 관리자 계정으로 생수 목표량·구매 단위 수량·표시 기한을 저장해 화면에 반영되는 것을 확인했습니다. PDF와 오프라인 HTML은 HA의 `/local`에서 각각 HTTP 200으로 열렸습니다.
- 200% 확대에서 Tile 텍스트가 잘리는 문제를 발견해 Tile을 한 줄 너비로 바꾼 뒤 다시 확인했습니다. Tab과 Enter로 재고 편집과 구매 단위 추가가 가능했습니다. 밝은 테마와 어두운 테마를 화면으로 확인했습니다. 어두운 테마의 상태 색상 대비를 조정했습니다.
- 카드가 편집 중일 때 다른 관리자 action으로 revision을 먼저 변경한 시험에서 충돌 안내와 입력 보존을 확인했습니다. 저장 실패를 흉내 낸 카드 시험에서도 입력이 유지됐고 이후 다시 저장할 수 있었습니다. 격리 HA에는 MQTT 통합을 설정하지 않았으며 재고 조회와 수정이 작동했습니다. 실제 휴대전화와 실물 프린터 검증은 P5에서 수행해야 합니다.

### P4에서 P5로 넘긴 항목

P4에서 넘긴 깨끗한 HA 설치·업데이트·삭제는 P5의 격리 HA에서 확인했습니다. 운영 HA 적용 결과는 아래에 기록했습니다. 실제 휴대전화와 프린터로 5분 탁상훈련을 진행하고, 공개 전에는 가족 원본이나 개인 재고가 Git 히스토리·릴리스 파일·화면 캡처에 없는지 검사해야 합니다. 공습·정전 등 행동 문구의 출처와 `draft` 상태도 다른 사람이 다시 검토해야 합니다. GitHub 게시는 이 검증 이후에 진행합니다.

## P5 공개 프리뷰 후보 (2026-11-10)

격리 HA에서 새 설치·P4 설치본 업데이트·삭제를 확인했습니다. 실제 브로커를 끊은 대시보드에서 가상 생수 재고의 조회와 수정도 통과했습니다. 재현 명령과 검증 범위는 [P5 검증 기록](docs/p5-validation.md)에 있습니다.

HACS용 `hacs.json`, MIT `LICENSE`, [변경 이력](CHANGELOG.md), [보안·안내 정정 제보 경로](SECURITY.md), [릴리스 초안](docs/release-draft.md)을 준비했습니다. `public/`이 Git 저장소 루트이며, HACS가 설치하는 코드는 `custom_components/kr_survival_kit/`에 있습니다. PDF·오프라인 HTML·대시보드 생성물은 릴리스 자산으로 따로 제공할 예정입니다. `python scripts/audit_public.py`는 Git 전체 이력과 공개 후보의 개인정보 형식을 검사합니다.

`python scripts/build_candidate.py`는 현재 초안 PDF·HTML·대시보드·카드와 SHA256 목록을 `output/release-candidate/`에 모읍니다. 이 폴더에는 공개 보류 표기가 있으며 검토 후 다시 생성해야 합니다. GitHub CI는 안내 단위 테스트, 생성기, `python tests/check_package.py` 및 개인정보 형식 검사를 실행합니다. 일치 항목을 발견하면 검사 단계가 실패합니다. 재고 테스트와 HA 통합 테스트의 실행 방법은 P2와 P5 검증 기록에 있습니다.

**공개 차단** · 행동 문구를 공식 원문과 1차 대조했습니다. 독립 검토와 `draft` 해제, 실물 휴대전화·흑백 A4 탁상훈련, 최종 릴리스 자산 및 화면 캡처의 개인정보 재검사가 남았습니다. 현재 원격 Git 저장소가 없어 HACS 사용자 지정 저장소 설치와 Home Assistant Brands 등록도 확인하지 못했습니다. [문구 대조표](docs/content-review.md) · [P5 검증 기록](docs/p5-validation.md)

## NRGNC 운영 검증 (2026-11-10)

Home Assistant OS의 **Core 2026.11.1**에서 `custom_components/kr_survival_kit/`와 공개 정적 파일 3개를 설치하고, 관리자 전용 `kr-survival-kit` 대시보드의 `home`·`guide` 보기를 갱신했습니다. 통합 manifest 버전은 `0.1.0`이고 안내 콘텐츠와 PDF·HTML 버전은 **`0.1.0-draft.7`**입니다. 기존 집계 센서 3개의 entity ID, 다른 대시보드와 카드 리소스는 유지했습니다. MQTT 발행 설정과 브로커는 변경하지 않았습니다.

- 배포 전 통합·정적 파일·전용 대시보드·리소스를 백업했습니다. HA 설정 검사는 `valid`였고 재시작 후 통합은 `loaded`입니다. 관리자 `get_inventory` 응답에 4인·3일 권장량 `household`가 들어 있으며, 기존 개인 재고 스냅샷·목표·revision은 배포 전후 동일했습니다. 실제 재고는 시험용으로 수정하지 않았습니다. 통합의 동기 파일 읽기 경고는 재시작 후 시스템 로그에서 재발하지 않았습니다.
- 서버의 별도 staging에서 안내 `unittest` **10개**, 가구 권장량 검사 **1개**, 격리 venv의 순수 재고 회귀 테스트 **6개**가 통과했습니다. 이 테스트들은 운영 HA의 저장소나 실제 재고를 사용하지 않았습니다.
- `/local/kr-survival-kit-card.js`, `/local/kr-survival-kit-a4.pdf`, `/local/kr-survival-kit-offline.html`을 실제 HTTP GET으로 확인했습니다. 세 응답은 HTTP 200이고 SHA256은 배포 후보와 일치합니다. PDF는 A4 한 쪽이며 PDF·HTML 모두 `0.1.0-draft.7`과 4인 예시의 음용수 24 L, 전체 안전수 약 46 L, 식품 합계 36인분을 담고 있습니다. HTML에는 7일·14일 확장량도 있습니다.
- 대시보드 설정을 다시 읽어 첫 화면에서 초안 버전과 반복 외부 출처를 표시하지 않는 것, 내장 버튼 2개의 PDF·HTML URL, 4인 요약과 단위, 관리자 카드와 집계 센서 3개, 안내 보기의 출처 카드 1개 및 중복 없는 외부 URL을 확인했습니다. **인증된 실제 브라우저에서 버튼 클릭·375px 렌더링은 검증하지 못했습니다.** 실물 휴대전화와 프린터의 탁상훈련도 남아 있습니다.
