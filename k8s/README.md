# Kubernetes Deployment Guide for AnalyzeGit

This directory contains production-ready Kubernetes manifests with **Horizontal Pod Autoscaling (HPA)** for dynamic scaling based on CPU and Memory traffic load.

---

## 📁 Manifests Structure

```
k8s/
├── 00-namespace.yaml          # Creates isolated 'analyzegit' namespace
├── 01-config-secrets.yaml     # ConfigMap and Secrets for microservices
├── 02-databases.yaml          # MongoDB (with Persistent Volume) and Redis
├── 03-backend-services.yaml   # Auth, Recruitment, Analysis, and Worker services
├── 04-frontend-gateway.yaml   # API Gateway, Frontend & Ingress routing
├── 05-hpa-autoscaling.yaml    # Autoscalers (HPA) for CPU/Memory metrics
└── 06-monitoring.yaml         # Prometheus scraper & Grafana Observability
```

---

## 🚀 Step 1: Build Docker Images

Build and tag your microservices images:

```bash
# 1. API Gateway
docker build -t analyzegit/api-gateway:latest ./services/gateway

# 2. Auth Service
docker build -t analyzegit/auth-service:latest ./services/auth-service

# 3. Recruitment Service
docker build -t analyzegit/recruitment-service:latest ./services/recruitment-service

# 4. Analysis Service
docker build -t analyzegit/analysis-service:latest ./services/analysis-service

# 5. Worker Service
docker build -t analyzegit/worker-service:latest ./services/worker-service

# 6. Frontend Client
docker build -t analyzegit/frontend:latest ./frontend
```

---

## ⚙️ Step 2: Deploy to Kubernetes Cluster

Make sure `kubectl` is connected to your cluster (e.g., Docker Desktop Kubernetes, Minikube, EKS, GKE, or AKS):

```bash
# 1. Apply namespace
kubectl apply -f k8s/00-namespace.yaml

# 2. Apply ConfigMap & Secrets (Update secret values in 01-config-secrets.yaml first!)
kubectl apply -f k8s/01-config-secrets.yaml

# 3. Deploy Databases (MongoDB + Redis)
kubectl apply -f k8s/02-databases.yaml

# 4. Deploy Backend Microservices
kubectl apply -f k8s/03-backend-services.yaml

# 5. Deploy Frontend and API Gateway
kubectl apply -f k8s/04-frontend-gateway.yaml

# 6. Enable Autoscaling (HPA)
kubectl apply -f k8s/05-hpa-autoscaling.yaml
```

*Or deploy everything at once:*
```bash
kubectl apply -f k8s/
```

---

## 📊 Step 3: Autoscaling (HPA) Rules Configured

| Service | Min Replicas | Max Replicas | Auto-scale Triggers |
| :--- | :---: | :---: | :--- |
| **API Gateway** | 2 | 10 | CPU > 70% or Memory > 80% |
| **Analysis Service** | 2 | 8 | CPU > 70% or Memory > 75% |
| **Worker Service** | 2 | 12 | CPU > 65% or Memory > 80% |
| **Recruitment Service** | 2 | 6 | CPU > 75% |
| **Auth Service** | 2 | 6 | CPU > 75% |
| **Frontend** | 2 | 8 | CPU > 70% |

> [!NOTE]
> Ensure the **Metrics Server** is enabled in your Kubernetes cluster for HPA to read resource consumption:
> - For Minikube: `minikube addons enable metrics-server`
> - For Docker Desktop / Cloud: Install the Kubernetes standard metrics-server.

---

## 🔍 Useful Inspection Commands

```bash
# Check all resources in the namespace
kubectl get all -n analyzegit

# Check autoscaling status and current CPU/Memory %
kubectl get hpa -n analyzegit

# Stream logs of a service
kubectl logs -f deployment/api-gateway -n analyzegit
kubectl logs -f deployment/worker-service -n analyzegit
```
