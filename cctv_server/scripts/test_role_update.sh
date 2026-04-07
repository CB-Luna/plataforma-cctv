#!/bin/bash

# Base URL
BASE_URL="http://localhost:8080/api/v1"

echo "1. Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo.com", "password": "admin1234"}')

# Simple token extraction using grep/sed (avoiding jq dependency if not installed)
TOKEN=$(echo $LOGIN_RESPONSE | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo "✅ Login successful"

echo "2. Fetching Roles..."
ROLES_RESPONSE=$(curl -s -X GET "$BASE_URL/roles" \
  -H "Authorization: Bearer $TOKEN")

# Extract the first role ID
ROLE_ID=$(echo $ROLES_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -n 1)

if [ -z "$ROLE_ID" ]; then
    echo "❌ No roles found"
    echo "Response: $ROLES_RESPONSE"
    exit 1
fi
echo "✅ Found Role ID: $ROLE_ID"

echo "3. Updating Role..."
UPDATE_PAYLOAD='{"name": "Rol Test Update", "description": "Updated by script"}'
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/roles/$ROLE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PAYLOAD")

echo "Response Body:"
echo $UPDATE_RESPONSE

if [[ $UPDATE_RESPONSE == *"Rol Test Update"* ]]; then
    echo "✅ Role updated successfully!"
else
    echo "❌ Role update failed"
fi
