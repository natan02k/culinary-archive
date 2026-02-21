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

# Wir kopieren einfach ALLE gebauten JAR-Dateien in den aktuellen Ordner
COPY --from=build /app/target/*.jar ./

# Render injects the PORT environment variable (Fallback auf 8888)
EXPOSE ${PORT:-8888}

# Trick: Sucht die größte JAR-Datei im Ordner und startet diese
CMD ["sh", "-c", "java -jar $(ls -S *.jar | head -n 1)"]