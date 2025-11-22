FROM eclipse-temurin:17-jre

WORKDIR /app
ADD http://downloads.metabase.com/latest/metabase.jar /app/
EXPOSE 3000

CMD ["java", "-jar", "/app/metabase.jar"]
