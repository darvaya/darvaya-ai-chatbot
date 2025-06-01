#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_NAME=${IMAGE_NAME:-"chatbot"}
IMAGE_TAG=${IMAGE_TAG:-$(git rev-parse --short HEAD)}

# Build Docker image
echo "Building Docker image..."
docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} .
docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest

# Push to registry
echo "Pushing to registry..."
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest

# Update Kubernetes deployment
echo "Updating Kubernetes deployment..."
kubectl set image deployment/chatbot-app chatbot=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# Wait for rollout
echo "Waiting for rollout to complete..."
kubectl rollout status deployment/chatbot-app

echo "Deployment completed successfully!" 