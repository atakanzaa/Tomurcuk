# syntax=docker/dockerfile:1
# Image bir kez build edilir, git sha ile etiketlenir; önizleme, staging ve prod aynı image'ı
# çalıştırır. Ortam farkları yalnızca profil ve ortam değişkenlerindedir (deploy/).

FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
# Bağımlılıklar ayrı katmanda: pom.xml değişmedikçe CI'da önbellekten gelir.
RUN ./mvnw -B -q dependency:go-offline
COPY src src
# Testler CI'da image'dan önce çalışır (mvnw verify).
RUN ./mvnw -B -q package -DskipTests \
 && java -Djarmode=tools -jar target/tomurcuk-api-*.jar extract --layers --launcher --destination /app

FROM eclipse-temurin:21-jre
RUN groupadd --system tomurcuk && useradd --system --gid tomurcuk --no-create-home tomurcuk
WORKDIR /app
# Değişme sıklığına göre katmanlar: bağımlılıklar en altta, uygulama kodu en üstte.
COPY --from=build /app/dependencies/ ./
COPY --from=build /app/spring-boot-loader/ ./
COPY --from=build /app/snapshot-dependencies/ ./
COPY --from=build /app/application/ ./
USER tomurcuk
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
