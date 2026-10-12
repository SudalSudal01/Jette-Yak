# Multi-stage build for Spring 5.3 WAR
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /build

# 종속성 및 소스 복사 후 WAR 빌드
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# Tomcat 9 + JDK 21 런타임
FROM tomcat:9.0-jdk21-temurin
WORKDIR /usr/local/tomcat

# 기본 Tomcat 웹앱 제거 및 ROOT.war로 배포 (루트 컨텍스트 매핑)
RUN rm -rf webapps/*
COPY --from=builder /build/target/*.war webapps/ROOT.war

ENV TZ=Asia/Seoul
EXPOSE 8080
CMD ["catalina.sh", "run"]
