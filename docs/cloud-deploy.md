# Cloud Deployment Guide

## Prerequisites

- Google Cloud account with billing enabled (free tier only)
- Google Cloud CLI installed and authenticated
- Docker installed

## Method 1: Source-based Deployment (Recommended)

```bash
# Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy directly from source
gcloud run deploy civicpulse \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NVIDIA_API_KEY=your-nvidia-api-key \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 2
```

## Method 2: Docker Deployment

```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/civicpulse .

# Push to Google Artifact Registry
docker push gcr.io/YOUR_PROJECT_ID/civicpulse

# Deploy to Cloud Run
gcloud run deploy civicpulse \
  --image gcr.io/YOUR_PROJECT_ID/civicpulse \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NVIDIA_API_KEY=your-nvidia-api-key \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 2
```

## Service Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Region | us-central1 | Free tier eligible |
| Memory | 512 Mi | Sufficient for Next.js |
| CPU | 1 vCPU | Free tier: 180K vCPU-seconds/mo |
| Max Instances | 2 | Stays within free tier |
| Concurrency | 80 | Default, efficient |

## Free Tier Limits (Cloud Run)

- **Requests:** 2 million/month
- **CPU:** 180,000 vCPU-seconds/month
- **Memory:** 360,000 GiB-seconds/month
- **Networking:** 1 GB outbound/month (North America)

This project's demo usage is well within free tier.

## Obtaining Deployment URL

After deployment, Cloud Run provides a URL like:
```
https://civicpulse-XXXXX-uc.a.run.app
```

This is your submission-ready deployment link.

## Environment Variables

Set via `--set-env-vars` flag or Google Cloud Console:

| Variable | Required | Value |
|----------|----------|-------|
| `NVIDIA_API_KEY` | Yes | Your NVIDIA NIM API key |
| `NODE_ENV` | No | `production` (set automatically) |

## CI/CD with GitHub Actions

See `.github/workflows/deploy.yml` for automated deployment on push to `main`.
