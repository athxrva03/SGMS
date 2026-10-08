FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY backend/mvnw backend/mvnw
COPY backend/.mvn backend/.mvn
COPY backend/pom.xml backend/pom.xml

WORKDIR /app/backend

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline

COPY backend/src backend/src

RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["sh", "-c", "java -jar target/*.jar"]