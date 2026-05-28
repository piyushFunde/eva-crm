# ==============================================================================
# STAGE 1: BUILD
# ==============================================================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build jar
COPY src ./src
RUN mvn package -DskipTests -B

# ==============================================================================
# STAGE 2: RUNTIME
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy packaged jar from builder
COPY --from=builder /app/target/crm-0.0.1-SNAPSHOT.jar app.jar

# Set active profile environment variable
ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
