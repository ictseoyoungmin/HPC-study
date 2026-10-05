# Project documentation

이 폴더는 학습자용 README와 분리된 개발·운영 문서를 관리합니다.

- `ARCHITECTURE.md` — 코드 책임, 확장 규칙, visualization 구조
- `CONTENT-QUALITY.md` — 교재 본문·용어·실습·시각화의 품질 기준
- `ROADMAP.md` — 진행 중인 작업과 다음 우선순위
- `CHANGELOG.md` — 완료된 구현의 짧은 요약
- `logs/` — 큰 작업 단위의 상세 구현 로그와 검수 메모

`CHANGELOG.md`는 release-note 성격의 요약만 유지하고, 긴 작업 기록·설계 판단·남은 QA 항목은 `logs/YYYY-MM-DD-<topic>.md`에 둡니다. 이렇게 하면 루트 README와 CHANGELOG가 작업 일지로 비대해지는 것을 막을 수 있습니다.

라이선스와 외부 reference 정책은 사용자·기여자 모두가 쉽게 찾을 수 있도록 `docs/` 바로 아래에 둡니다.

- `../LICENSING.md` — 콘텐츠/코드/third-party 라이선스 경계와 재사용 원칙
- `../SOURCES.md` — 주요 공식 문서, 확인된 라이선스/terms, HPC Study의 사용 방식

사용자에게 직접 필요한 내용은 루트 `README.md`에 두고, 작업 계획·내부 구조·구현 로그·editorial 기준은 이 폴더에서 관리합니다.
