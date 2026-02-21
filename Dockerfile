# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copy the fat jar from the build stage
COPY --from=build /app/target/*-fat.jar app.jar

# Render injects the PORT environment variable
EXPOSE ${PORT}

# Run the jar file
CMD ["java", "-jar", "app.jar"]
