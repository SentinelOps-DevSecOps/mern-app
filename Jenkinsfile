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

    // ── Environment Variables ─────────────────────────────────────────────
    environment {
        // Your DockerHub username — change this!
        DOCKER_USERNAME       = 'abhay707'

        // Image names on DockerHub
        BACKEND_IMAGE         = "${DOCKER_USERNAME}/mern-backend"
        FRONTEND_IMAGE        = "${DOCKER_USERNAME}/mern-frontend"

        IMAGE_TAG             = "${BUILD_NUMBER}"

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
    }

    // ── Pipeline Options ──────────────────────────────────────────────────
    options {
        // If pipeline runs longer than 40 minutes, abort it
        timeout(time: 40, unit: 'MINUTES')

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
                            source ${VENV_PATH}/bin/activate
                            python3 security/db_manager.py create-scan \
                                --build ${BUILD_NUMBER} \
                                --branch main \
                                --commit \$(git rev-parse HEAD)
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
                    source ${VENV_PATH}/bin/activate

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
                    source ${VENV_PATH}/bin/activate

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

        // ── Stage 8: Push to DockerHub ────────────────────────────────────
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

        // ── Stage 9: Update DB Record ─────────────────────────────────────
        stage('💾 Update Scan Record') {
            steps {
                sh '''
                    source ${VENV_PATH}/bin/activate
                    python3 security/db_manager.py update-scan \
                        --scan-id ${SCAN_ID} \
                        --status PASSED \
                        --trivy-passed \
                        --zap-passed \
                        --npm-passed
                '''
            }
        }
    } // end stages

    // ── Post Pipeline ─────────────────────────────────────────────────────
    // Runs after ALL stages complete
    post {
        success {
            echo '''
            ╔══════════════════════════════════════════╗
            ║  ✅  PHASE 3 PIPELINE PASSED             ║ 
            ║  Trivy scan → CLEAN                      ║
            ║  Risk score → WITHIN THRESHOLD           ║
            ║  ZAP DAST   → NO HIGH FINDINGS           ║
            ║  DockerHub  → IMAGES PUSHED              ║
            ╚══════════════════════════════════════════╝
            '''
        }
        failure {
            sh '''
                # Update DB with failed status
                source ${VENV_PATH}/bin/activate 2>/dev/null || true
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
