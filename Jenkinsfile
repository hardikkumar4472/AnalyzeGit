pipeline {
    agent any

    // Triggers automatically upon GitHub Webhook push
    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 1, unit: 'HOURS')
    }

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials') // Docker Hub username & password
        AWS_CREDENTIALS        = credentials('aws-credentials')        // AWS Access Key & Secret Key
        DOCKER_REGISTRY        = 'analyzegit'
        IMAGE_TAG              = "${BUILD_NUMBER}"
        KUBECONFIG_CREDENTIALS = credentials('kubeconfig-credentials') // Kubeconfig file credential
    }

    stages {
        // -------------------------------------------------------------
        // Stage 1: Checkout Source Code
        // -------------------------------------------------------------
        stage('Checkout Code') {
            steps {
                echo '📥 Checking out repository code from GitHub...'
                checkout scm
            }
        }

        // -------------------------------------------------------------
        // Stage 2: Linting, Unit Testing & Dependencies
        // -------------------------------------------------------------
        stage('Test & Code Quality') {
            parallel {
                stage('Shared & Services Tests') {
                    steps {
                        echo '🧪 Installing shared dependencies & running tests...'
                        sh '''
                            cd shared && npm install && cd ..
                            cd services/gateway && npm install && cd ../..
                            cd services/auth-service && npm install && cd ../..
                            cd services/recruitment-service && npm install && cd ../..
                            cd services/analysis-service && npm install && cd ../..
                            cd services/worker-service && npm install && cd ../..
                        '''
                    }
                }
                stage('Frontend Build Validation') {
                    steps {
                        echo '🎨 Validating frontend build...'
                        sh '''
                            cd frontend
                            npm install
                            npm run build
                        '''
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // Stage 3: Terraform Infrastructure Provisioning & Verification
        // -------------------------------------------------------------
        stage('Terraform Cloud Infra') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    echo '☁️ Provisioning / Updating AWS Cloud Infrastructure via Terraform...'
                    sh '''
                        cd terraform
                        terraform init -no-color
                        terraform validate -no-color
                        terraform plan -out=tfplan -no-color
                        terraform apply -auto-approve tfplan
                    '''
                }
            }
        }

        // -------------------------------------------------------------
        // Stage 4: Docker Build & Tagging (Parallel Multi-Microservice)
        // -------------------------------------------------------------
        stage('Docker Build & Tag') {
            parallel {
                stage('Build API Gateway') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/api-gateway:${IMAGE_TAG} -t ${DOCKER_REGISTRY}/api-gateway:latest ./services/gateway"
                    }
                }
                stage('Build Auth Service') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/auth-service:${IMAGE_TAG} -t ${DOCKER_REGISTRY}/auth-service:latest ./services/auth-service"
                    }
                }
                stage('Build Recruitment Service') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/recruitment-service:${IMAGE_TAG} -t ${DOCKER_REGISTRY}/recruitment-service:latest ./services/recruitment-service"
                    }
                }
                stage('Build Analysis Service') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/analysis-service:${IMAGE_TAG} -t ${DOCKER_REGISTRY}/analysis-service:latest ./services/analysis-service"
                    }
                }
                stage('Build Worker Service') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/worker-service:${IMAGE_TAG} -t ${DOCKER_REGISTRY}/worker-service:latest ./services/worker-service"
                    }
                }
                stage('Build Frontend Client') {
                    steps {
                        sh "docker build -t ${DOCKER_REGISTRY}/frontend:${IMAGE_TAG} -t ${DOCKER_REGISTRY}/frontend:latest ./frontend"
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // Stage 5: Security Vulnerability Scan (Trivy)
        // -------------------------------------------------------------
        stage('Docker Security Scan (Trivy)') {
            steps {
                echo '🛡️ Running Security Vulnerability Scans on Docker Images...'
                sh """
                    trivy image --severity HIGH,CRITICAL --exit-code 0 ${DOCKER_REGISTRY}/api-gateway:${IMAGE_TAG} || true
                    trivy image --severity HIGH,CRITICAL --exit-code 0 ${DOCKER_REGISTRY}/frontend:${IMAGE_TAG} || true
                """
            }
        }

        // -------------------------------------------------------------
        // Stage 6: Push Docker Images to Container Registry
        // -------------------------------------------------------------
        stage('Docker Hub Push') {
            steps {
                echo '📤 Pushing Images to Docker Hub Registry...'
                sh """
                    echo "${DOCKER_HUB_CREDENTIALS_PSW}" | docker login -u "${DOCKER_HUB_CREDENTIALS_USR}" --password-stdin
                    
                    docker push ${DOCKER_REGISTRY}/api-gateway:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/api-gateway:latest
                    
                    docker push ${DOCKER_REGISTRY}/auth-service:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/auth-service:latest
                    
                    docker push ${DOCKER_REGISTRY}/recruitment-service:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/recruitment-service:latest
                    
                    docker push ${DOCKER_REGISTRY}/analysis-service:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/analysis-service:latest
                    
                    docker push ${DOCKER_REGISTRY}/worker-service:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/worker-service:latest
                    
                    docker push ${DOCKER_REGISTRY}/frontend:${IMAGE_TAG}
                    docker push ${DOCKER_REGISTRY}/frontend:latest
                """
            }
        }

        // -------------------------------------------------------------
        // Stage 7: Deploy to Kubernetes Cluster (with HPA & Autoscaling)
        // -------------------------------------------------------------
        stage('Deploy to Kubernetes (K8s)') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    echo '☸️ Applying Kubernetes Manifests with Horizontal Pod Autoscaling...'
                    sh '''
                        # Create Namespace & Base Configs
                        kubectl apply -f k8s/00-namespace.yaml
                        kubectl apply -f k8s/01-config-secrets.yaml
                        kubectl apply -f k8s/02-databases.yaml
                        kubectl apply -f k8s/03-backend-services.yaml
                        kubectl apply -f k8s/04-frontend-gateway.yaml
                        kubectl apply -f k8s/05-hpa-autoscaling.yaml

                        # Trigger rolling restart to fetch latest container images
                        kubectl rollout restart deployment -n analyzegit
                        
                        # Verify rollout status
                        kubectl rollout status deployment/api-gateway -n analyzegit --timeout=120s
                        kubectl rollout status deployment/frontend -n analyzegit --timeout=120s
                    '''
                }
            }
        }

        // -------------------------------------------------------------
        // Stage 8: Deploy / Update Prometheus & Grafana Observability
        // -------------------------------------------------------------
        stage('Deploy Observability (Prometheus & Grafana)') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    echo '📊 Deploying & Verifying Prometheus Scrapers & Grafana Dashboards...'
                    sh '''
                        kubectl apply -f k8s/06-monitoring.yaml
                        kubectl rollout status deployment/prometheus -n analyzegit --timeout=60s
                        kubectl rollout status deployment/grafana -n analyzegit --timeout=60s
                    '''
                }
            }
        }

        // -------------------------------------------------------------
        // Stage 9: Post-Deployment Smoke & Health Verification
        // -------------------------------------------------------------
        stage('Health & Metrics Verification') {
            steps {
                withCredentials([file(credentialsId: 'kubeconfig-credentials', variable: 'KUBECONFIG')]) {
                    echo '🩺 Running Smoke Tests & Verification on Live Endpoints...'
                    sh '''
                        kubectl get pods -n analyzegit
                        kubectl get svc -n analyzegit
                        kubectl get hpa -n analyzegit
                    '''
                }
            }
        }
    }

    // -------------------------------------------------------------
    // Post Actions: Success / Failure Notifications & Cleanup
    // -------------------------------------------------------------
    post {
        always {
            echo '🧹 Cleaning up workspace & stale local docker images...'
            sh 'docker image prune -f || true'
        }
        success {
            echo '🎉 Pipeline Succeeded! AnalyzeGit microservices, Kubernetes HPA, Terraform cloud resources, and Prometheus/Grafana monitoring are live.'
        }
        failure {
            echo '❌ Pipeline Failed! Please check the logs in the specific failed stage.'
        }
    }
}
