# 제때약 | 김명현의 백엔드 포트폴리오

이 저장소는 **팀 프로젝트의 개인 포트폴리오용 포크**입니다. 팀 원본의 Git 이력과 구성원 기여를 보존하고, 김명현이 담당한 기능을 중심으로 소개합니다. 전체 코드를 혼자 개발한 개인 프로젝트가 아닙니다.

- 팀 원본: [https://github.com/jws909/Jette-Yak](https://github.com/jws909/Jette-Yak)
- 개인 GitHub: [SudalSudal01](https://github.com/SudalSudal01)

- 팀 개발 기간: 2026.09.15 ~ 2026.10.14
- 팀 인원: 5명
- 본인 담당: **AI 상담 챗봇 · 커뮤니티 · 내 약 관리 · 결과 발표**
- 기술: Java 21, Spring MVC, MyBatis, Oracle, React, Gemini API

## 담당 기능의 코드 안내

| 기능 | 주요 코드 | 설명 |
| --- | --- | --- |
| AI 상담 챗봇 | [MedicationChatService](backend/src/main/java/com/app/chatbot/service/MedicationChatService.java) · [ChatController](backend/src/main/java/com/app/chatbot/controller/ChatController.java) | 질문 조건과 사용자 범위를 검증하고 조회 근거를 응답으로 연결합니다. |
| 내 약 관리 | [MedicationManagementService](backend/src/main/java/com/app/guide/service/MedicationManagementService.java) | 등록 이력과 복용 상태를 구분하고 본인 소유 데이터만 변경합니다. |
| 커뮤니티 | [CommunityService](backend/src/main/java/com/app/community/service/CommunityService.java) | 작성자 권한과 게시글·댓글·신고의 연결 관계를 관리합니다. |

## 검증 범위

팀 저장소의 2026.10.07 점검 기록에는 백엔드 11개 Check / 408 assertions, 프론트 74개 테스트, 실제 서버 HTTP 32개 검사 통과가 기록되어 있습니다. 이는 당시 팀 점검 기록이며, 개인 포크 생성 때 전체 서비스를 재실행한 결과는 아닙니다. 의료 진단이나 안전한 복용을 보장하는 서비스로 소개하지 않습니다.

## 실행과 원본 문서

기존 팀 README는 [README.team.md](README.team.md)에 그대로 보존했습니다. 설치·실행 방법 및 팀 서비스 전체 소개는 해당 문서를 참고해 주세요. 실제 환경설정·API 키·개인 데이터는 별도로 준비해야 하며 새로 커밋하지 않습니다. 이 포크의 개인화 작업은 소개 문서 정리이며 원본의 실행 코드 변경이나 새 기능 구현을 의미하지 않습니다.

원본에 포함된 문서와 코드의 저작권·출처는 기존 팀과 각 기여자에게 유지됩니다. 이 포크에서 별도 라이선스를 임의로 추가하지 않습니다.
