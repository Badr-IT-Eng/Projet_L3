#!/bin/bash

# Create output file
OUTPUT_FILE="essential_code.txt"
echo "Essential Code Files" > "$OUTPUT_FILE"
echo "==================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to process a file
process_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Check if it's a text file and not a binary
        if file "$file" | grep -q "text"; then
            echo "File: $file" >> "$OUTPUT_FILE"
            echo "==================" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            cat "$file" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            echo "----------------------------------------" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
        fi
    fi
}

# Essential files to include
ESSENTIAL_FILES=(
    "detection-service/object_detector.py"
    "detection-service/run_detection.py"
    "detection-service/start_detection.py"
    "detection-service/test_integration.py"
    "detection-service/requirements.txt"
    "spring-backend/src/main/java/com/lostfound/controller/ItemController.java"
    "spring-backend/src/main/java/com/lostfound/model/Item.java"
    "spring-backend/src/main/java/com/lostfound/repository/ItemRepository.java"
    "spring-backend/src/main/resources/application.properties"
    "spring-backend/pom.xml"
)

# Process essential files
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file" >&2
        process_file "$file"
    else
        echo "Warning: File not found: $file" >&2
    fi
done

echo "Essential code combination complete. Output saved to $OUTPUT_FILE" 