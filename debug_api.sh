#!/bin/bash
# Login
echo "Logging in..."
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.pt", "password":"admin123"}'

echo "\n\nFetching Project 1..."
# Get Project
curl -b cookies.txt http://localhost:5000/api/projects/1
echo "\n"
