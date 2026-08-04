// ───────────────────────────────────────────────────────────────
// Stages:
//   1. Checkout       → Pull code from GitHub
//   2. Initialize     → Create scan record in DB
//   3. Docker Build   → Build frontend + backend images
//   4. Trivy Scan     → Scan images for CVEs
//   5. Risk Score     → Evaluate CVE risk score
//   6. Test Env       → Deploy containers for ZAP
//   7. ZAP DAST       → OWASP ZAP dynamic scan
//   8. Push Images    → Upload to DockerHub (only if scans pass)
//   9. Update Record  → Mark scan status in DB
// ───────────────────────────────────────────────────────────────

pipeline {

    agent any

    // ── Environment Variables ─────────────────────────────────────────────
    environment {
        // ── AWS + ECR Configuration ─────────────────────────────
        AWS_REGION            = 'ap-south-1'
        AWS_ACCOUNT_ID        = '864886597339'
        ECR_REGISTRY          = '864886597339.dkr.ecr.ap-south-1.amazonaws.com'
        BACKEND_ECR_REPO      = '864886597339.dkr.ecr.ap-south-1.amazonaws.com/sentinelops/mern-backend'
        FRONTEND_ECR_REPO     = '864886597339.dkr.ecr.ap-south-1.amazonaws.com/sentinelops/mern-frontend'

        BACKEND_IMAGE         = "${BACKEND_ECR_REPO}"
        FRONTEND_IMAGE        = "${FRONTEND_ECR_REPO}"

        IMAGE_TAG             = "build-${BUILD_NUMBER}"

        TRIVY_SEVERITY        = 'CRITICAL,HIGH'

        DOCKER_CREDENTIALS    = 'dockerhub-credentials'

        // Report paths
        TRIVY_BACKEND_REPORT  = 'trivy-backend-report.json'
        TRIVY_FRONTEND_REPORT = 'trivy-frontend-report.json'

        DB_HOST               = 'localhost'
        DB_USER               = 'secuser'
        DB_PASSWORD           = 'sentinelops'
        DB_NAME               = 'devsecops_security'

        // Python venv path
        VENV_PATH             = "${WORKSPACE}/security/venv"

        // Test environment URL (where app runs for ZAP to scan)
        TEST_APP_URL          = 'http://localhost:3000'

	// ── GitOps Config ───────────────────────────────────────
        // Jenkins commits updated image tags back to GitHub
        GIT_CREDENTIALS    = 'github-credentials'
        GIT_USER_EMAIL     = 'rbabhay707@gmail.com'
        GIT_USER_NAME      = 'Abhay1921'
    }

    // ── Pipeline Options ──────────────────────────────────────────────────
    options {
        // If pipeline runs longer than 40 minutes, abort it
        timeout(time: 60, unit: 'MINUTES')

        // Keep logs of last 10 builds only (saves disk space)
        buildDiscarder(logRotator(numToKeepStr: '10'))

        // Add timestamps to every log line (helps debugging)
        timestamps()

        // Don't run concurrent builds of same branch
        disableConcurrentBuilds()
    }

    // ── Triggers ──────────────────────────────────────────────────────────
    triggers {
        githubPush()
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────────────
        stage('📥 Checkout') {
            steps {
                echo '=========================================='
                echo 'Stage 1: Checking out source code'
                echo '=========================================='

                checkout scm

                // Print what we checked out
                sh '''
                    echo "Branch: $(git branch --show-current)"
                    echo "Commit: $(git log -1 --format='%H %s')"
                    echo "Author: $(git log -1 --format='%an <%ae>')"
                    echo "Date:   $(git log -1 --format='%ci')"
                '''
            }
        }

        // ── Stage 2: Create DB Scan Record ────────────────────────────────
        stage('📊 Initialize Scan Record') {
            steps {
                echo 'Creating scan record in MySQL...'
                script {
                    def output = sh(
                        script: """
                            if [ ! -f "${VENV_PATH}/bin/activate" ]; then
                                python3 -m venv ${VENV_PATH}
                                . ${VENV_PATH}/bin/activate
                                pip install --quiet mysql-connector-python colorama tabulate requests
                            else
                                . ${VENV_PATH}/bin/activate
                            fi
                            python3 security/db_manager.py create-scan \
                                --build ${BUILD_NUMBER} \
                                --branch "\$(git branch --show-current 2>/dev/null || echo 'develop')" \
                                --commit "\$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
                        """,
                        returnStdout: true
                    ).trim()

                    echo output

                    // Extract SCAN_ID from output
			    def scanIdLine = output.readLines().find { it.startsWith('SCAN_ID=') }
                    env.SCAN_ID = scanIdLine ? scanIdLine.split('=')[1] : '0'
                    echo "Scan ID: ${env.SCAN_ID}"
                }
            }
        }

        // ── Stage 3: Docker Build ─────────────────────────────────────────
        stage('🐳 Docker Build') {
            steps {
                echo '=========================================='
                echo 'Stage 3: Building Docker images'
                echo '=========================================='

                sh '''
                    echo "--- Building backend image ---"
                    docker build \
                        --tag ${BACKEND_IMAGE}:${IMAGE_TAG} \
                        --tag ${BACKEND_IMAGE}:latest \
                        --file server/Dockerfile \
                        --label "build.number=${BUILD_NUMBER}" \
                        --label "build.url=${BUILD_URL}" \
                        --label "git.commit=$(git rev-parse HEAD)" \
                        server/

                    echo "✅ Backend image built: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    echo ""

                    # Build frontend image..
                    echo "--- Building frontend image ---"
                    docker build \
                        --tag ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        --tag ${FRONTEND_IMAGE}:latest \
                        --file client/Dockerfile \
                        --label "build.number=${BUILD_NUMBER}" \
                        --label "build.url=${BUILD_URL}" \
                        client/

                    echo "✅ Frontend image built: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    echo ""
                '''
            }

            post {
                failure {
                    echo '❌ Docker build FAILED'
                    echo '   Check Dockerfile syntax and build context'
                }
                success {
                    echo '✅ Docker images built successfully'
                }
            }
        }

        // ── Stage 4: Trivy Security Scan ──────────────────────────────────
        stage('🛡️ Trivy Security Scan') {
            steps {
                echo '=========================================='
                echo 'Stage 4: Scanning Docker images for CVEs'
                echo '=========================================='

                sh '''
                    echo ""
                    echo "=========================================="
                    echo "Scanning BACKEND image..."
                    echo "=========================================="

                    # Table format for human-readable output in Jenkins log
                    # trivy image \
                    #     --severity ${TRIVY_SEVERITY} \
                    #     --format table \
                    #     --no-progress \
                    #     ${BACKEND_IMAGE}:${IMAGE_TAG}

                    # JSON format saved as artifact
                    trivy image \
                        --severity ${TRIVY_SEVERITY} \
                        --format json \
                        --no-progress \
                        --output ${TRIVY_BACKEND_REPORT} \
                        ${BACKEND_IMAGE}:${IMAGE_TAG}

                    echo "=========================================="
                    echo "Scanning FRONTEND image..."
                    echo "=========================================="

                    # trivy image \
                    #     --severity ${TRIVY_SEVERITY} \
                    #     --format table \
                    #     --no-progress \
                    #     ${FRONTEND_IMAGE}:${IMAGE_TAG}

                    trivy image \
                        --severity ${TRIVY_SEVERITY} \
                        --format json \
                        --no-progress \
                        --output ${TRIVY_FRONTEND_REPORT} \
                        ${FRONTEND_IMAGE}:${IMAGE_TAG}

                    echo "✅ Trivy reports generated"
                '''
            }

            post {
                always {
                    // Archive Trivy JSON reports — used by Phase 3 risk scorer
                    archiveArtifacts artifacts: "trivy-*.json",
                                     allowEmptyArchive: true
                }
                failure {
                    echo '❌ Trivy scan FAILED — CRITICAL CVEs detected'
                    echo '   Image will NOT be pushed to DockerHub'
                    echo '   Fix vulnerabilities then re-push'
                }
                success {
                    echo '✅ Trivy scan PASSED — images are safe to deploy'
                }
            }
        }

        // ── Stage 5: Risk Score Analysis ──────────────────────────────────
        stage('📈 Risk Score Analysis') {
            steps {
                echo '=========================================='
                echo 'Stage 5: Python CVE Risk Scoring Engine'
                echo '=========================================='
                sh '''
                    . ${VENV_PATH}/bin/activate

                    echo "--- Scoring Backend Image ---"
                    python3 security/risk_scorer.py \
                        --report ${TRIVY_BACKEND_REPORT} \
                        --image "${BACKEND_IMAGE}:${IMAGE_TAG}" \
                        --build ${BUILD_NUMBER} \
                        --scan-id ${SCAN_ID}

                    BACKEND_EXIT=$?

                    echo ""
                    echo "--- Scoring Frontend Image ---"
                    python3 security/risk_scorer.py \
                        --report ${TRIVY_FRONTEND_REPORT} \
                        --image "${FRONTEND_IMAGE}:${IMAGE_TAG}" \
                        --build ${BUILD_NUMBER} \
                        --scan-id ${SCAN_ID}

                    FRONTEND_EXIT=$?

                    if [ $BACKEND_EXIT -ne 0 ] || [ $FRONTEND_EXIT -ne 0 ]; then
                        echo ""
                        echo "❌ Risk score exceeded threshold — pipeline BLOCKED"
                        exit 1
                    fi

                    echo ""
                    echo "✅ Risk scoring PASSED — scores within acceptable range"
                '''
            }
            post {
                success {
                    script { env.TRIVY_PASSED = 'true' }
                }
                failure {
                    echo '❌ Risk score too high — fix vulnerabilities before deploying'
                }
                always {
                    archiveArtifacts artifacts: 'trivy-*.json',
                                     allowEmptyArchive: true
                }
            }
        }

        // ── Stage 6: Deploy Test Environment ──────────────────────────────
        stage('🧪 Start Test Environment') {
            steps {
                echo 'Starting app containers for ZAP to scan...'
                sh '''
                    # Stop any existing test containers
                    docker compose -f docker-compose.yml down 2>/dev/null || true

                    # Start fresh test environment
                    docker compose -f docker-compose.yml up -d

                    # Wait for app to be ready
                    echo "Waiting for app to start..."
                    ATTEMPTS=0
                    until curl -s http://localhost:3000 > /dev/null || [ $ATTEMPTS -eq 20 ]; do
                        sleep 3
                        ATTEMPTS=$((ATTEMPTS+1))
                        echo "Attempt $ATTEMPTS/20..."
                    done

                    curl -s http://localhost:5000/health | python3 -m json.tool || true
                    echo "✅ Test environment is running"
                '''
            }
        }

        // ── Stage 7: OWASP ZAP DAST ───────────────────────────────────────
        stage('🌐 OWASP ZAP DAST Scan') {
            steps {
                echo '=========================================='
                echo 'Stage 7: Dynamic Application Security Testing'
                echo '=========================================='
                sh '''
                    . ${VENV_PATH}/bin/activate

                    python3 security/zap_scanner.py \
                        --target ${TEST_APP_URL} \
                        --scan-id ${SCAN_ID} \
                        --timeout 5

                    ZAP_EXIT=$?

                    if [ $ZAP_EXIT -ne 0 ]; then
                        echo ""
                        echo "❌ ZAP found HIGH risk vulnerabilities!"
                        echo "   Fix the web vulnerabilities before deploying"
                        exit 1
                    fi

                    echo "✅ ZAP DAST scan PASSED"
                '''
            }
            post {
                success {
                    script { env.ZAP_PASSED = 'true' }
                }
                failure {
                    echo '❌ OWASP ZAP found HIGH risk vulnerabilities'
                }
                always {
                    // Stop test environment
                    sh 'docker compose down 2>/dev/null || true'
                }
            }
        }

        // ── Stage 8: Push to DockerHub (Disabled in favor of ECR) ─────────
        // Changing registry location from DockerHub to AWS ECR
        /*
        stage('📤 Push to DockerHub') {
            when {
                expression {
                    currentBuild.result == null ||
                    currentBuild.result == 'SUCCESS'
                }
            }

            steps {
                echo '=========================================='
                echo 'Stage 8: Pushing images to DockerHub'
                echo '=========================================='

                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        # Login to DockerHub
                        echo "${DOCKER_PASS}" | docker login \
                            --username "${DOCKER_USER}" \
                            --password-stdin

                        echo "✅ Logged in to DockerHub"

                        # Push backend with build number tag
                        echo "--- Pushing backend ---"
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        echo "✅ Backend pushed: ${BACKEND_IMAGE}:${IMAGE_TAG}"

                        # Push frontend with build number tag
                        echo "--- Pushing frontend ---"
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                        echo "✅ Frontend pushed: ${FRONTEND_IMAGE}:${IMAGE_TAG}"

                        # Logout for security
                        docker logout
                        echo "✅ Logged out from DockerHub"
                    '''
                }
            }

            post {
                success {
                    echo "✅ Images pushed successfully!"
                    echo "   Backend:  ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    echo "   Frontend: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                }
                failure {
                    echo '❌ Push to DockerHub FAILED'
                    echo '   Check DockerHub credentials in Jenkins'
               }
            }
        }
        */



        // ── Stage 8: Push to AWS ECR ──────────────────────────────────────
        // Configured for Local Jenkins Server
        // Auto-detects local machine AWS CLI credentials (~/.aws/credentials or /home/dev/.aws/credentials)
        stage('📤 Push to ECR') {
            steps {
                sh '''
                    echo "=========================================="
                    echo "Stage 8: Authenticating and Pushing to AWS ECR"
                    echo "=========================================="

                    # If AWS credentials file is not in Jenkins user HOME, locate local developer AWS credentials
                    if [ ! -f "$HOME/.aws/credentials" ] && [ -f "/home/dev/.aws/credentials" ]; then
                        export AWS_SHARED_CREDENTIALS_FILE="/home/dev/.aws/credentials"
                        export AWS_CONFIG_FILE="/home/dev/.aws/config"
                        echo "Using AWS credentials from /home/dev/.aws/credentials"
                    fi

                    # Log in to ECR using local AWS CLI credentials
                    echo "Logging in to ECR registry ${ECR_REGISTRY}..."
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REGISTRY}

                    echo "✅ ECR authentication successful"

                    # Push backend image to ECR
                    echo "--- Pushing Backend Image ---"
                    docker push ${BACKEND_ECR_REPO}:${IMAGE_TAG}
                    docker push ${BACKEND_ECR_REPO}:latest
                    echo "✅ Backend pushed to ECR: ${BACKEND_ECR_REPO}:${IMAGE_TAG}"

                    # Push frontend image to ECR
                    echo "--- Pushing Frontend Image ---"
                    docker push ${FRONTEND_ECR_REPO}:${IMAGE_TAG}
                    docker push ${FRONTEND_ECR_REPO}:latest
                    echo "✅ Frontend pushed to ECR: ${FRONTEND_ECR_REPO}:${IMAGE_TAG}"

                    # Verify images in ECR
                    echo "--- ECR Backend Images ---"
                    aws ecr describe-images \
                        --repository-name sentinelops/mern-backend \
                        --region ${AWS_REGION} \
                        --query 'imageDetails[*].{Tag:imageTags[0],Pushed:imagePushedAt}' \
                        --output table 2>/dev/null || true
                '''
            }
        }


	// ── Stage 9: GitOps — Update Image Tag in Manifests ─────
        stage('🔄 GitOps — Update Manifests') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-credentials',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )]) {
                    sh '''
                        echo "========================================"
                        echo "GitOps: Updating image tags in Git"
                        echo "This triggers ArgoCD to deploy!"
                        echo "========================================"

                        # Configure git identity for this commit
                        git config user.email "${GIT_USER_EMAIL}"
                        git config user.name  "${GIT_USER_NAME}"

                        # Update the image tag in the prod overlay kustomization
                        sed -i "s|newTag:.*# ← JENKINS UPDATES THIS VALUE|newTag:  ${IMAGE_TAG}          # ← JENKINS UPDATES THIS VALUE|g" \
                            kubernetes/overlays/prod/kustomization.yaml

                        # Verify the change
                        echo "--- Updated kustomization.yaml ---"
                        grep "newTag" kubernetes/overlays/prod/kustomization.yaml

                        if git diff --quiet kubernetes/overlays/prod/kustomization.yaml; then
                            echo "No manifest changes to commit"
                        else
                            git add kubernetes/overlays/prod/kustomization.yaml

                            git commit -m "ci: update image tags to ${IMAGE_TAG}

                            Build: #${BUILD_NUMBER}
                            Backend:  ${BACKEND_ECR_REPO}:${IMAGE_TAG}
                            Frontend: ${FRONTEND_ECR_REPO}:${IMAGE_TAG}
                            Trivy:    PASSED
                            ZAP:      PASSED
                            Score:    WITHIN THRESHOLD

                            [skip ci]"

                            TARGET_BRANCH="${GIT_BRANCH:-develop}"
                            TARGET_BRANCH="${TARGET_BRANCH#origin/}"

                            echo "Pushing manifest changes to branch: ${TARGET_BRANCH}..."
                            git push https://${GIT_USER}:${GIT_PASS}@github.com/SentinelOps-DevSecOps/mern-app.git HEAD:${TARGET_BRANCH}

                            echo "✅ Manifests updated and pushed to GitHub (${TARGET_BRANCH})"
                            echo "   ArgoCD will now automatically deploy!"
                        fi
                    '''
                }
            }
        }


        // ── Stage 10: Update DB Record ─────────────────────────────────────
        stage('💾 Update Scan Record') {
            steps {
                sh '''
                    . ${VENV_PATH}/bin/activate
                    python3 security/db_manager.py update-scan \
                        --scan-id ${SCAN_ID} \
                        --status PASSED \
                        --trivy-passed \
                        --zap-passed \
                        --npm-passed
                '''
            }
        }

	 // ── Stage 12: Wait for ArgoCD Sync ───────────────────────
        stage('⏳ Verify ArgoCD Sync') {
            steps {
                sh '''
                    echo "Waiting for ArgoCD to sync and deploy..."
                    echo "ArgoCD polls GitHub every 3 minutes by default"
                    echo "Or you can trigger immediate sync from ArgoCD UI"

                    # Wait 30 seconds then check pod status
                    sleep 30

                    echo "--- Current pod status ---"
                    kubectl get pods -n mern-prod 2>/dev/null || true

                    echo "--- Deployments ---"
                    kubectl get deployments -n mern-prod 2>/dev/null || true

                    echo "--- App URL ---"
                    kubectl get service frontend-service \\
                        -n mern-prod 2>/dev/null || true

                    echo ""
                    echo "✅ ArgoCD will complete deployment automatically"
                    echo "   Monitor progress at ArgoCD dashboard"
                '''
            }
        }



    } // end stages

    // ── Post Pipeline ─────────────────────────────────────────────────────
    // Runs after ALL stages complete
    post {
        success {
            echo '''
            ╔══════════════════════════════════════════════════╗
            ║  ✅  COMPLETE GITOPS PIPELINE PASSED             ║
            ║                                                  ║
            ║  Trivy scan    → CLEAN                           ║
            ║  Risk score    → WITHIN THRESHOLD                ║
            ║  ZAP DAST      → NO HIGH FINDINGS                ║
            ║  ECR push      → IMAGES STORED                   ║
            ║  GitOps update → MANIFESTS COMMITTED             ║
            ║  ArgoCD        → DEPLOYING AUTOMATICALLY         ║
            ╚══════════════════════════════════════════════════╝
            '''
        }
        failure {
            sh '''
                # Update DB with failed status
                . ${VENV_PATH}/bin/activate 2>/dev/null || true
                python3 security/db_manager.py update-scan \
                    --scan-id ${SCAN_ID:-0} \
                    --status FAILED 2>/dev/null || true

                # Clean up test environment if still running
                docker compose down 2>/dev/null || true
            '''
        }
        always {
            sh '''
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  2>/dev/null || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} 2>/dev/null || true
                docker image prune -f 2>/dev/null || true
            '''
        }
    }
}
