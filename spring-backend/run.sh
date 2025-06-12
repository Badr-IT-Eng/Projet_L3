#!/bin/bash

echo "Building RECOVR API..."
./gradlew build

if [ $? -eq 0 ]; then
    echo "Build successful! Starting the application..."
    java -jar build/libs/recovr-api-0.0.1-SNAPSHOT.jar
else
    echo "Build failed. Please check the error messages above."
    exit 1
fi 