# v4 품목 대조표 (공개용 추상화)

원본 통합문서의 **품목 관련 행번호**만 사용한다. 개인 상황, 장소, 이동 경로, 보유량, 브랜드, 확률과 액수는 옮기지 않았다. `기존`은 이미 카탈로그에 있던 ID, `신규`는 이번에 추가한 선택 ID다. `통합`은 동의어 또는 같은 물품의 용도별 표기를 한 ID에 모은 경우다. 수량은 행정안전부 2026 책자의 명시값을 제외하면 검증 전 개인 계획으로 취급하고 공개 권장량으로 승격하지 않았다.

| 원본 위치 | 공개 품목 대조 | 처리·이유 | 용량·규격·수량 처리 |
|---|---|---|---|
| 시트 6, 2행 | `basic-documents` | 신규. 개인별 여행서류는 일반적인 신분·중요서류 사본 점검으로 축약 | 권수·유효기간은 개인별 확인 |
| 시트 6, 3행 | `basic-documents` | 통합. 증명서 종류는 목적별 확인 | 사본 부수는 개인별 확인 |
| 시트 6, 4–5행 | `emergency-payment-check` | 신규. 비상 결제수단 **준비 여부만** 선택 점검 | 현금액·통화·계좌·잔액은 입력하지 않고 개인별 비공개 확인 |
| 시트 6, 6행 | `charging-cables`, `portable-power-station` | 통합. 전자기기 전원 준비로 축약 | 기기 호환 규격 확인 |
| 시트 6, 7행 | `water-container`, `water-sanitation-kit` | 기존+신규. 식수와 생활용수를 구분 | 원래 대형 용량은 생활용수 계획이며 음용 목표가 아님 |
| 시트 6, 8행 | `water-container` | 기존. 식품용 급수 용기 | 용기 개수와 저장 가능 L를 별도로 확인; 원래 개수 고정 안 함 |
| 시트 6, 9행 | `storage-bin` | 신규. 보관 상자 | 용량·개수는 공간에 맞춤 |
| 시트 6, 10행 | `portable-water-filter` | 신규. 정수 도구를 브랜드 없이 기록 | 제거 가능한 오염 종류·제품 지침 확인; 정제 수량 미전용 |
| 시트 6, 11행 | `cooler-ice-pack` | 신규. 냉매·아이스박스 통합 | 용량·개수는 사용 제품별; 냉장 안전 시간을 임의 연장하지 않음 |
| 시트 6, 12–13행 | 해당 없음 | 제외. 특정 식품의 가정 내 가공·건조 방식은 공식 식품 안전 검증이 필요 | 원래 질량·개수 미전용 |
| 시트 6, 14행 | `shelf-stable-meal`, `self-heating-ration` | 기존 상온 간편식에 통합했으나 후속 요청으로 민수용 발열식량을 별도 선택 품목으로 복구 | 제품별 소비기한·보관 조건·인분을 구매 단위별로 확인; 원본 20개는 공개 권장량으로 전용하지 않음 |
| 시트 6, 15행 | `canned-food`, `long-storage-snacks` | 기존+신규. 통조림과 간식으로 분리 | 평소 먹는 스팸·참치·번데기 등 예시; 제품별 표시기한·인분 확인, 최장 보관 단정 안 함 |
| 시트 6, 16행 | `long-storage-snacks` | 통합. 개인 선호의 상온 식품 | 제품별 표시기한 확인 |
| 시트 6, 17행 | `infant-supplies`, `infant-formula` | 기존+신규. 해당 아동의 수유 방식에 따른 선택 | 원래 연령·개월 수·캔 수·거점별 수량 전용 안 함 |
| 시트 6, 18행 | `ready-to-feed-formula`, `infant-feeding-supplies` | 신규. 해당 시 액상분유와 수유 도구 | 개봉 후 사용·소비량은 제품별 확인 |
| 시트 6, 19행 | `infant-supplies`, `infant-feeding-supplies` | 통합. 발달단계에 맞는 식사 | 원래 제품 종류·중량·파우치 수 전용 안 함 |
| 시트 6, 20행 | `child-comfort-kit` | 신규. 아이 안정용 놀이·편의 물품 | 실제 선호·연령별 선택 |
| 시트 6, 21–22행 | `portable-power-station` | 신규. 보조 전원으로 통합 | 특정 모델·Wh를 권장치로 전용하지 않음 |
| 시트 6, 23행 | `portable-solar-panel` | 신규. 휴대용 태양광 패널 | 패널·충전기 호환성 확인; 정격 W가 실제 출력 보장 아님 |
| 시트 6, 24행 | `flashlight`, `candles` | 기존+신규. 조명과 화기를 분리 | 램프·양초 개수는 선택 예시; 손전등 우선 |
| 시트 6, 25행 | `blanket`, `thermal-mat`, `hot-water-bag`, `warm-clothes` | 기존+신규. 방한 구성으로 분리 | 크기·온도·가족 구성에 맞춤; 전열 기기 모델 전용 안 함 |
| 시트 6, 26행 | `large-plastic-bags`, `sealing-tape`, `sanitation-bags`, `water-sanitation-kit` | 신규. 위생·밀폐 물품으로 분리 | 사용량과 용도를 확인; 원래 회분 고정 안 함 |
| 시트 6, 27행 | `masks`, `protective-goggles`, `raincoat`, `rubber-gloves`, `rubber-boots` | 신규. 일반 마스크·보안경·장갑 등 일반 보호용품은 복구 | 일반용품이 화학·생물·방사선 위협을 막는다는 뜻이 아님. 특수 방호장비·방사선 측정기·요오드화칼륨은 적합성/의료 판단이 필요한 별도 영역이라 제외 |
| 시트 6, 28행 | `door-window-locks`, `door-alarm` | 신규. 일반 잠금·개폐 알림으로 축약 | 창호 구조에 따라 수량 확인; 공격·대응 방법은 제외 |
| 시트 6, 29–30행 | 해당 없음 | 제외. 무기·공격용 물품 및 사용 지침은 일반 가정 비상물자 권장 목록에 포함하지 않음 | 사거리·출력·개수 미전용 |
| 시트 6, 31행 | `radio`, `batteries` | 기존. 수신 라디오와 호환 건전지 | 밴드·규격·기기당 낱개 수 확인; 브랜드 제외 |
| 시트 6, 32행 | `portable-radio-communication` | 신규. 해당 시 별도 근거리 통신기 | 주파수·허가 요건 확인; 대수 고정 안 함 |
| 시트 6, 33행 | `family-photo`, `emergency-contact-card`, `child-id-card` | 신규. 실물 연락 수단 | 실명·연락처·사진은 공개 데이터/재고 입력 금지 |
| 시트 6, 34행 | `transport-cart`, `child-carrier` | 신규. 일반 이동 보조도구 | 차량·가족별 이동 수단·장소·수량 미공개 |
| 시트 6, 35행 | 해당 없음 | 제외. 특정 지역의 어로·재배 계획은 일반 비상물자 범위 및 법·안전 확인 밖 | 장비·종자 수량 미전용 |
| 시트 6, 36행 | `emergency-payment-check` | 통합. 결제수단의 준비 여부만 점검하고 거래·물물교환용 물품의 세부 목록은 제외 | 액수·개수 미공개·미전용 |

| 다른 시트 품목 관련 행 | 공개 대조 | 처리 |
|---|---|---|
| 시트 2, 2–4행 | `water-container`, `insulated-bottle`, `cooler-ice-pack` | 시트 6과 중복·동의어 통합. 물·식품은 안전한 사용과 실제 온도로 판단 |
| 시트 2, 6–9행 | `door-window-locks`, `door-alarm`, `large-plastic-bags`, `sealing-tape`, `thermal-mat`, `child-comfort-kit`, `child-id-card` | 같은 물품을 통합. 행동 절차·개인정보·검증되지 않은 안전 주장은 이 목록에 옮기지 않음 |
| 시트 2, 10–11행 | 해당 없음 | 행동·대응 지침이며 물품 아님. 공격용 품목 제외 |
| 시트 3, 2–5행 | `shelf-stable-meal`, `canned-food`, `cooler-ice-pack` | 신선식품은 평시 재고/식품안전 판단 대상으로, 비상식량 권장 품목으로 전용 안 함 |
| 시트 3, 6–11행 | `radio`, `batteries`, `flashlight`, `candles`, `portable-power-station`, `thermal-mat` | 시트 6과 중복·동의어 통합. 특정 W·Wh와 운용 시간은 미검증 개인 예시로 미전용 |
| 시트 4, 2–7행 | `basic-documents`, `charging-cables` | 서류·전원 물품만 통합. 비자·국가·출국 신호·금액은 변동성이 커 이 품목 목록에서 제외 |
| 시트 5, 2–3행 | `infant-supplies`, `infant-formula`, `infant-feeding-supplies` | 시트 6과 통합. 발달/수유 단정과 개인 수량 제외 |
| 시트 5, 4–6행 | 해당 없음 | 특정 지역 어로·재배 장비와 기법은 일반 선택품목에서 제외 |
| 시트 5, 7–8행 | `portable-solar-panel`, `portable-power-station`, `charging-cables` | 전원 물품만 시트 6과 통합. 직업·근무 계획과 지리 정보 제외 |
| 시트 1, 2–7행; 시트 7, 2–5행 | 해당 없음 | 시나리오/공개범위 설명으로 독립 물품 행이 없음 |
| 이번 사용자 추가 요청 | `hand-warmers`, `solid-fuel`, `manual-can-opener`, `child-id-card` 등 | 원본에 별도 행이 없거나 묶음 속에 있던 선택 품목도 별도 ID로 표시. 화기·아동 개인정보 주의사항을 함께 둠 |

## 원칙과 공식 근거

- 신규 42개는 모두 `optional`이다. 사용자가 해당 여부와 목표를 저장하기 전에는 `해당 없음`으로 표시된다.
- [행정안전부 2026 비상시 국민행동요령](https://mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000327&nttId=128720)은 대피용 2~3일분과 가정 비상물자(식량·식수 30일분), 장기 가정용 부탄캔 15개 이상을 구분한다. 이 값들을 개별 사용자의 목표로 자동 저장하지 않는다.
- [CDC 식품 안전](https://www.cdc.gov/food-safety/foods/keep-food-safe-after-emergency.html)은 정전 시 냉장·냉동 식품의 경과 시간과 온도 확인을 안내한다. 원래 표의 식품 처리 시간표를 안전 보장으로 사용하지 않는다.
- [CDC 일산화탄소 안내](https://www.cdc.gov/carbon-monoxide/about/index.html)와 [NFPA 양초 안전](https://content.nfpa.org/-/media/project/storefront/catalog/files/safety-tip-sheets/candlesafetytips.pdf)에 따라 연소기기는 밀폐 공간에서 사용하지 않으며 정전 조명은 손전등을 우선한다.
