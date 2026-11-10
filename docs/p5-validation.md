# P5 공개 후보 검증 기록 · 2026-11-10

## 격리 HA

- WSL Ubuntu 24.04, HA Core 2026.11.0의 임시 설정 폴더에서 `python tests/ha_lifecycle_smoke.py` 통과. 후보 통합을 새 설치하고, 가상 생수 목표를 저장하고, 재시작 후 revision·센서 3개를 확인하고, config entry 삭제 후 서비스와 entry가 제거됨을 확인했습니다.
- 별도 프로세스에서 `python tests/ha_lifecycle_smoke.py --from-p4` 통과. Git 커밋 `4d622b6`의 통합을 설치해 저장한 후 후보 파일로 덮어쓰고 재시작했습니다. revision 1과 생수 목표 1000 ml가 유지됐고 삭제도 통과했습니다. 현재 후보의 Python 통합 본문은 P4와 같으므로 이 시험은 배포 파일 교체와 상태 유지의 검증입니다.
- `python tests/serve_ha_ui.py --broker-down`으로 격리 HA와 실제 Mosquitto 2.0.18을 시작했습니다. HA MQTT 통합을 연결하고 이 프로젝트의 MQTT 발행 옵션을 켠 뒤 브로커를 종료했습니다. 실제 대시보드 카드에서 가상 생수 목표 3000 ml, 구매 단위 2000 ml, 표시 기한 2027-03-01을 저장하고 ‘생수 기록을 저장했습니다’와 2000/3000 ml, 실사일을 확인했습니다. HA MQTT의 연결 상실 및 birth 발행 오류가 로그에 남았습니다. 로컬 재고 action은 계속 동작했습니다. 테스트 데이터는 임시 HA 폴더와 브라우저에만 있었습니다.
- 기존 P2 재고 테스트 6개, 안내 `unittest` 8개와 HTML·A4 자동 검증을 다시 실행했습니다. 실제 프린터 출력과 휴대전화 조작은 이 환경에서 수행하지 못했습니다.

## 배포 구조

- 저장소 루트는 `public/`입니다. `hacs.json`, `README.md`, 단일 `custom_components/kr_survival_kit/`를 확인했습니다. manifest의 domain·name·version·documentation·issue_tracker·codeowners가 있습니다. `hacs.json`의 최소 HA 2026.11.0은 실제로 검증한 버전입니다.
- HACS의 기본 목록 신청에는 공개 GitHub 저장소와 Home Assistant Brands 등록이 필요합니다. 현재 원격 Git 저장소와 Brands 등록이 없으므로 기본 목록 설치 시험은 대기 상태입니다. 사용자 지정 저장소 설치와 GitHub Release 다운로드도 게시 후 별도 검증이 필요합니다.
- `LICENSE`, `CHANGELOG.md`, `SECURITY.md`, 릴리스 초안을 준비했습니다. GitHub의 비공개 보안 제보 기능을 실제로 켠 결과는 공개 후 확인해야 합니다.

## 안전 문구 출처 대조

- 국민안전24 현재 비상대비·민방공경보 페이지에서 경계·공습·화생방·핵 경보 분류와 대피·정부 방송 안내의 큰 흐름을 확인했습니다. 현재 콘텐츠의 통신 두절, 침수 위험 지하시설 예외, 핵 폭발 전후, 단수 음용 조건은 원문이 그대로 보증하는 한 문장으로 취급하지 않고 독립 검토 대상에 남깁니다.
- 행정안전부 2026년 홍보책자를 기준으로 경보별 첫 행동과 적용 조건을 1차 대조하고 `0.1.0-draft.5`에 반영했습니다. 책자에 인쇄된 쪽수와 프로젝트 자체 판단 기준을 [문구 대조표](content-review.md)에 기록했습니다. 별도 검토자의 확인과 실물 훈련은 대기 중입니다. [행정안전부 공식 원문](https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000327&nttId=128720)
- PDF·HTML·대시보드의 현재 문구는 `draft`로 유지합니다. 독립 검토자가 출처의 페이지·문장·적용 조건을 확인하고 `reviewed_on`을 기록한 뒤 콘텐츠 버전을 올려야 합니다. `build_guides.py --release --pdf`의 게이트를 통과해야 공개용 인쇄물을 생성할 수 있습니다.
- `0.1.0-draft.5` 후보는 A4 7쪽의 한글 글꼴 내장, 인쇄 여백, 시간대별 문구를 확인했습니다. 흑백으로 렌더링한 첫 장을 검토했습니다. HTML·대시보드의 버전과 통신 두절 문구가 일치하고 후보 파일의 SHA256이 목록과 일치했습니다. 공개 빌드는 독립 검토 대기 상태에서 차단되는 것을 확인했습니다.
- `0.1.0-draft.6`에서는 A4 단면 한 장에 경보별 첫 행동, 대피 후 점검, 대피소·집결지 등 여섯 기록칸이 들어가는 것을 확인했습니다. 흑백 렌더링에서 잘림과 여백을 확인했고, 브라우저 인쇄 모드에서도 상세 안내가 출력되지 않는 것을 검증했습니다. 실제 프린터 시험은 대기 중입니다.

## 개인정보 검사와 한계

- Git의 세 커밋에서 추적 파일 이름을 열람했습니다. 가족 원본 경로, 실제 재고 저장본, PDF·이미지·스크린샷은 추적 목록에 없었습니다. 현재 트리의 `tests/fixtures/stock.json`은 가상 재고입니다.
- `python scripts/audit_public.py`로 이메일·휴대전화·주민등록번호·로컬 사용자 경로 형식을 전체 Git 이력과 후보 텍스트·PDF 추출 문구에 검사했고 일치 항목이 없었습니다. 정규식 검사는 주소나 민감 정보를 모두 발견한다는 보증이 아니므로 게시 전 사람이 압축 파일과 화면 캡처를 다시 확인해야 합니다. Git 커밋 작성자 메타데이터도 공개 전에 계정 소유자가 확인해야 합니다.
- `python scripts/build_candidate.py`로 `output/release-candidate/`에 **DRAFT REVIEW ONLY** 표시를 넣은 PDF·HTML·대시보드·카드와 SHA256 목록을 만들었습니다. 이것은 공개용 릴리스 자산이 아닙니다. 검토 완료 후 다시 생성하고 해시를 릴리스 노트에 기록해야 합니다.

## 5분 탁상훈련 절차

1. A4 행동 카드 한 장을 실제 프린터로 흑백 단면 출력하고, 휴대전화에는 독립 HTML을 미리 저장합니다. Wi-Fi와 모바일 데이터를 끕니다. 더 긴 대응 훈련에는 HTML의 시간대별 상세 안내를 사용합니다.
2. 참가자에게 ‘통신 두절과 공습경보’ 상황을 읽어 주고 60초 안에 첫 행동과 공식 안내를 확인할 방법을 종이에서 찾도록 합니다. 전화를 걸거나 앱 접속을 가정하지 않습니다.
3. 가족 기록지에서 미리 확인한 대피소 두 곳, 집결 장소와 이동 조건을 찾도록 합니다. 실제 개인정보는 이 종이에만 손으로 기록하고 공개 사진에는 넣지 않습니다.
4. 전원을 끈 상태에서 종이만 보고 같은 질문을 반복합니다. 남은 시간에 단수·정전 첫 행동과 표시된 안내 버전을 찾습니다.
5. 5분 안에 찾지 못한 항목, 읽기 어려운 글씨, 잘린 줄, 필기 공간 부족을 기록합니다. 다른 사람 한 명이 인쇄판과 휴대전화의 문구가 같은 버전인지 확인합니다.

## 공개 차단 항목

1. [문구 대조표](content-review.md)와 공식 원문을 바탕으로 독립 검토자가 모든 행동 문구를 확인하고 `draft` 해제와 버전 갱신.
2. 실물 휴대전화와 흑백 A4 출력물로 5분 탁상훈련 및 잘림·필기 공간 확인.
3. 생성된 릴리스 자산과 실제 GitHub 공개 저장소의 이력·작성자 메타데이터·화면 캡처 개인정보 재검사.
4. HACS 사용자 지정 저장소 설치와 버전 업데이트, Home Assistant Brands 등록 및 목록 신청은 공개 저장소가 있어야 검증할 수 있습니다.

## 확인한 공식 페이지

- [국민안전24 비상대비](https://www.safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=stateOfEmergency&menuSn=4)
- [국민안전24 민방공경보](https://safekorea.go.kr/safekorea-kor/acts/nacts/action-guide.do?category=civlAirDefenseWarning&menuSn=4)
- [행정안전부 2026 비상시 국민행동요령 게시](https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000327&nttId=128720)
- [HACS 통합 저장소 요건](https://www.hacs.dev/docs/publish/integration/)
- [HACS 일반 배포 설정](https://www.hacs.dev/docs/publish/start/)
