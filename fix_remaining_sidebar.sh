#!/bin/bash

# List of files that still have sidebar references
files=(
  "/workspace/src/app/contracts/page.tsx"
  "/workspace/src/app/partners/page.tsx"
  "/workspace/src/app/system/page.tsx"
  "/workspace/src/app/treasury/page.tsx"
  "/workspace/src/app/partners/[id]/page.tsx"
  "/workspace/src/app/installments/page.tsx"
  "/workspace/src/app/profile/page.tsx"
)

# Function to fix a file
fix_file() {
  local file="$1"
  echo "Fixing $file..."
  
  # Add Layout import if not present
  if ! grep -q "import Layout from" "$file"; then
    sed -i '/import.*from.*$/a import Layout from '\''@/components/Layout'\''' "$file"
  fi
  
  # Replace the main return structure with Layout component
  # This is a more complex replacement that needs to be done carefully
  echo "File $file needs manual fixing - complex structure"
}

# Fix each file
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    fix_file "$file"
  else
    echo "File $file not found"
  fi
done

echo "All files processed!"