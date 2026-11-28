# 기여 가이드 (Contributing)

**KR Survival Kit**의 개선에 참여해 주셔서 감사합니다!  
이 저장소는 **Pull Request(PR) 리뷰 및 승인(Merge)** 절차를 통해 코드를 안전하게 반영합니다.

---

## 1. 불편 신고 및 아이디어 제안 (이슈 등록)

사용 중 불편한 점이나 새로운 품목/기능 아이디어가 있다면 [GitHub Issues](https://github.com/redchupa/kr_survival_kit/issues/new/choose)에서 알맞은 양식을 선택해 등록해 주세요.

- **버그 신고**: 오류 현상, 재현 방법, 사용 중인 버전을 남겨주세요.
- **기능/품목 제안**: 추가하고 싶은 비상 물품이나 개선 아이디어를 자유롭게 제안해 주세요.
- **문구 정정**: 행동요령이나 출처 수정이 필요한 경우 공식 출처 링크와 함께 제보해 주세요.
- **주의**: 집 주소, 전화번호, 가족 정보, 실제 보유 재고 내역 등 개인정보는 절대 올리지 마세요.

> **저장소 관리자 팁 (이슈·PR 메일 알림 받기)**  
> GitHub 저장소 상단의 **Watch → All Activity** (또는 **Custom → Issues, Pull requests**)를 켜두시면, 사용자가 새 이슈나 PR을 등록할 때마다 연결된 GitHub 메일로 즉시 알림을 받을 수 있습니다.

---

## 2. 개발자 코드 기여 방법 (PR 승인 워크플로우)

1. 이 저장소를 본인 GitHub 계정으로 **Fork**합니다.
2. 새 브랜치를 만듭니다:
   ```bash
   git checkout -b feat/my-improvement
   ```
3. 코드를 수정한 뒤 로컬 검증 스크립트를 실행합니다:
   ```bash
   node --check custom_components/kr_survival_kit/www/kr-survival-kit-card.js
   node --check custom_components/kr_survival_kit/www/kr-warehouse-3d.js
   node tests/test_warehouse_card.cjs
   python tests/test_household.py
   python -m unittest discover -s tests -p "test_guides.py" -q
   python tests/check_package.py
   python scripts/audit_public.py
   ```
4. 변경 사항을 커밋·푸시한 뒤 `main` 브랜치를 대상으로 **Pull Request(PR)**를 생성합니다.
5. 저장소 관리자가 변경 내용과 CI 검증 결과를 검토한 뒤 **Approve & Merge**를 승인하면 정식 코드에 반영됩니다.

---

## 3. Home Assistant Marketplace / HACS 등록 준비

이 저장소는 `hacs.json`과 `custom_components/kr_survival_kit/manifest.json` 규칙을 준수합니다.
- **HACS 기본 목록 등록 완료**: 2026-11-18 `hacs/default`에 등록되어, HACS/Marketplace에서 `KR Survival Kit`을 검색만 하면 바로 설치할 수 있습니다.
- **새 버전 배포**: GitHub에서 정식 Release를 발행하면 HACS 사용자에게 업데이트로 표시됩니다.
