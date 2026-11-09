# KR Survival Kit

평소 쓰는 물품으로 준비하고, 정전이 나면 미리 저장하거나 인쇄한 안내를 꺼내 쓰는 한국 가정 비상 대비 프로젝트입니다.

**인쇄해서 쓰기** · 로컬 빌드에서 `output/pdf/kr-survival-kit-a4.pdf`를 열면 흑백 A4 행동 안내와 가족 기록지를 받을 수 있습니다. `output/offline.html`은 파일 하나를 복사해 인터넷 없이 읽을 수 있습니다.

**Home Assistant로 시작하기** · `output/ha-guide.md`는 내장 Markdown 카드의 내용으로 사용할 수 있습니다. 로컬 재고와 집계 센서가 있으며, P3에서 선택형 MQTT Discovery를 추가했습니다. 재고 편집 화면은 P4 작업입니다.

현재 자료는 **공개 전 검토용**입니다. 공습·평시 준비, 경계·화생방·핵경보, 정전·단수 안내를 담았습니다. 현재 발령된 재난문자·방송과 현장 지시를 먼저 따르세요. 전화·인터넷이 끊긴 경우를 첫 화면과 인쇄물 상단에 따로 안내합니다. 가족 연락처와 실제 대피소 정보는 인쇄한 공란에 손으로 적어 개인 보관하세요.

## 로컬에서 만들기

Python 3.11 이상에서 저장소 루트 기준으로 실행합니다. HTML과 HA Markdown 빌드에는 Python 표준 라이브러리만 필요합니다.

```text
python scripts/build_guides.py
python -m unittest discover -s tests -v
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

`custom_components/kr_survival_kit/`를 테스트 HA의 `config/custom_components/`에 복사하고 HA를 재시작한 뒤 **설정 → 기기 및 서비스 → 통합 추가 → KR Survival Kit**를 선택합니다. 한 인스턴스에 한 가구만 등록합니다. 점검 주기(기본 30일)를 정하면 로컬 `Store`에 버전 1 스냅샷을 저장합니다. 브로커나 외부 계정은 필요하지 않습니다. 운영 HA에 설치한 결과는 아직 없습니다.

관리자는 개발자 도구의 action 또는 향후 P4 카드에서 `kr_survival_kit.get_inventory`를 호출해 `revision`, 품목별 `state`와 합계를 읽을 수 있습니다. `kr_survival_kit.set_item`은 **현재 revision**과 카탈로그 `item_id`, `applicable`, `target`, `lots`, `confirm`을 요구합니다. `lots`의 각 원소는 `lot_id`, 비음수 정수 `quantity`, ISO 날짜 또는 `null`인 `expires_on`을 가집니다. `kr_survival_kit.delete_item`은 `item_id`와 현재 revision을 요구합니다. 성공한 쓰기는 새 revision을 반환하며, 다른 편집이 먼저 저장되면 다시 조회한 뒤 절대 수량으로 재입력해야 합니다. 이 action들은 HA 관리자만 호출할 수 있습니다. `entry_id`는 단일 가구에서 생략할 수 있습니다.

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

### P4 인계

내장 Sections·Markdown·Tile로 상황 안내와 인쇄판 접근을 먼저 배치하고, 전용 카드는 `get_inventory` 응답의 `catalog`, `items`, `summary`, `revision`으로 목표·lot·표시 기한·마지막 실사일을 보여주세요. 수정은 관리자 action의 `set_item`/`delete_item`을 사용하고 revision 충돌이나 저장 실패를 사용자에게 표시하세요. MQTT 옵션과 센서가 unavailable이어도 로컬 재고 화면은 계속 작동해야 합니다. 휴대전화 375px, 200% 확대, 키보드, 밝은/어두운 테마에서 검증하세요.
