# STUDY CAMP Back-end

프론트엔드 깃주소
[Front-end github](https://github.com/dainK/study-camp-client)<br>
배포 사이트 주소
[https://www.studycamp.site](https://www.studycamp.site/)

## Development environment

<div align=left>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white">
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
</div>

## ERD

<img src ="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FA3Gmv%2FbtsI5uq93GP%2Fvzw7T3KZu07pj0MdKffdPK%2Fimg.png"><br>

- user
- space
- space_member

## 구현 기능

### Authorization

- [x] 로그인 (로컬 로그인, 구글 로그인, 카카오 로그인)
- [x] 로그인 토큰 관리 (레디스 이용)
- [x] 로그아웃

### Guard

- [x] 토큰 유효성 검사

### User

- [x] 회원 가입
- [x] 정보 변경

### Space

- [x] 스페이스 생성 (이미지 저장소 Oracle Cloud Infrastructure(OCI))
- [x] 스페이스 목록 조회
- [x] 스페이스 패스워드 체크
- [x] 초대코드 생성 및 입장 (레디스 이용)

### Space Member

- [x] 스페이스 가입
- [x] 가입한 스페이스 목록 조회

### Web Socket

- [x] Front와의 통신 연결 (socket.io, WebRTC)
