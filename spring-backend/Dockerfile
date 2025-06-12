FROM eclipse-temurin:17-jdk-jammy as build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/recovr-api.jar .

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "recovr-api.jar"] 