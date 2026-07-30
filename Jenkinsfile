// ───────────────────────────────────────────────────────────────
// Stages:
//   1. Checkout       → Pull code from GitHub
//   2. Docker Build   → Build frontend + backend images
//   3. Trivy Scan     → Scan images for CVEs
//   4. Push Images    → Upload to DockerHub (only if scans pass)
// ─────────────────────────────────────────────────────────────────────────

pipeline {

    // "agent any" means: run this pipeline on any available Jenkins node
    agent any

    // ── Environment Variables ─────────────────────────────────────────────
    // These are available to ALL stages below
    environment {
        // Your DockerHub username — change this!
        DOCKER_USERNAME    = 'abhay707'

        // Image names on DockerHub
        BACKEND_IMAGE      = "${DOCKER_USERNAME}/mern-backend"
        FRONTEND_IMAGE     = "${DOCKER_USERNAME}/mern-frontend"

        IMAGE_TAG          = "${BUILD_NUMBER}"

        // Trivy severity threshold — pipeline fails if these found
        TRIVY_SEVERITY     = 'CRITICAL,HIGH'

        // DockerHub credentials ID (must match what you created in Step 6)
        DOCKER_CREDENTIALS = 'dockerhub-credentials'

        // Report paths
        TRIVY_BACKEND_REPORT  = 'trivy-backend-report.json'
        TRIVY_FRONTEND_REPORT = 'trivy-frontend-report.json'
    }

    // ── Pipeline Options ──────────────────────────────────────────────────
    options {
        // If pipeline runs longer than 30 minutes, abort it
        timeout(time: 30, unit: 'MINUTES')

        // Keep logs of last 10 builds only (saves disk space)
        buildDiscarder(logRotator(numToKeepStr: '10'))

        // Add timestamps to every log line (helps debugging)
        timestamps()

        // Don't run concurrent builds of same branch
        disableConcurrentBuilds()
    }

    // ── Triggers ──────────────────────────────────────────────────────────
    triggers {
        // GitHub webhook trigger — runs pipeline on every push
        githubPush()
    }

    // ══════════════════════════════════════════════════════════════════════
    //  STAGES
    // ══════════════════════════════════════════════════════════════════════
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

        

        // ── Stage 2: Docker Build ─────────────────────────────────────────
        stage('🐳 Docker Build') {
            steps {
                echo '=========================================='
                echo 'Stage 3: Building Docker images'
                echo '=========================================='

                sh '''
                    echo "Build number: ${IMAGE_TAG}"
                    echo ""

                    # Build backend image
                    echo "--- Building backend image ---"
                    docker build \
                        --tag ${BACKEND_IMAGE}:${IMAGE_TAG} \
                        --tag ${BACKEND_IMAGE}:latest \
                        --file backend/Dockerfile \
                        --label "build.number=${BUILD_NUMBER}" \
                        --label "build.url=${BUILD_URL}" \
                        --label "git.commit=$(git rev-parse HEAD)" \
                        backend/

                    echo "✅ Backend image built: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                    echo ""

                    # Build frontend image
                    echo "--- Building frontend image ---"
                    docker build \
                        --tag ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        --tag ${FRONTEND_IMAGE}:latest \
                        --file frontend/Dockerfile \
                        --label "build.number=${BUILD_NUMBER}" \
                        --label "build.url=${BUILD_URL}" \
                        frontend/

                    echo "✅ Frontend image built: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                    echo ""

                    # Show image sizes
                    echo "--- Image sizes ---"
                    docker images | grep -E "${DOCKER_USERNAME}|REPOSITORY"
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

        // ── Stage 3: Trivy Security Scan ──────────────────────────────────
        stage('🛡️ Trivy Security Scan') {
            steps {
                echo '=========================================='
                echo 'Stage 4: Scanning Docker images for CVEs'
                echo '=========================================='

                sh '''
                    echo "Trivy version: $(trivy --version)"
                    echo "Scanning for: ${TRIVY_SEVERITY} vulnerabilities"
                    echo ""

                    # ── Scan Backend Image ────────────────────────────────
                    echo "=========================================="
                    echo "Scanning BACKEND image..."
                    echo "=========================================="

                    # Table format for human-readable output in Jenkins log
                    trivy image \
                        --severity ${TRIVY_SEVERITY} \
                        --format table \
                        --no-progress \
                        ${BACKEND_IMAGE}:${IMAGE_TAG}

                    # JSON format saved as artifact (for risk scorer in Phase 3)
                    trivy image \
                        --severity ${TRIVY_SEVERITY} \
                        --format json \
                        --no-progress \
                        --output ${TRIVY_BACKEND_REPORT} \
                        ${BACKEND_IMAGE}:${IMAGE_TAG}

                    # --exit-code 1 means: if vulnerabilities found → non-zero exit
                    # This FAILS the pipeline stage automatically
                    trivy image \
                        --severity CRITICAL \
                        --exit-code 1 \
                        --no-progress \
                        ${BACKEND_IMAGE}:${IMAGE_TAG} || {
                            echo ""
                            echo "❌ CRITICAL CVEs found in backend image!"
                            echo "   The pipeline is BLOCKED"
                            echo "   Fix: Update base image or vulnerable packages"
                            exit 1
                        }

                    echo "✅ Backend image: No CRITICAL vulnerabilities"
                    echo ""

                    # ── Scan Frontend Image ───────────────────────────────
                    echo "=========================================="
                    echo "Scanning FRONTEND image..."
                    echo "=========================================="

                    trivy image \
                        --severity ${TRIVY_SEVERITY} \
                        --format table \
                        --no-progress \
                        ${FRONTEND_IMAGE}:${IMAGE_TAG}

                    trivy image \
                        --severity ${TRIVY_SEVERITY} \
                        --format json \
                        --no-progress \
                        --output ${TRIVY_FRONTEND_REPORT} \
                        ${FRONTEND_IMAGE}:${IMAGE_TAG}

                    trivy image \
                        --severity CRITICAL \
                        --exit-code 1 \
                        --no-progress \
                        ${FRONTEND_IMAGE}:${IMAGE_TAG} || {
                            echo ""
                            echo "❌ CRITICAL CVEs found in frontend image!"
                            exit 1
                        }

                    echo "✅ Frontend image: No CRITICAL vulnerabilities"
                    echo ""
                    echo "✅ ALL TRIVY SCANS PASSED"
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

        // ── Stage 4: Push to DockerHub ────────────────────────────────────
        stage('📤 Push to DockerHub') {
            // This stage only runs if ALL previous stages passed
            // If Trivy found CRITICAL CVEs, this stage never runs
            when {
                expression {
                    currentBuild.result == null ||
                    currentBuild.result == 'SUCCESS'
                }
            }

            steps {
                echo '=========================================='
                echo 'Stage 5: Pushing images to DockerHub'
                echo '=========================================='

                // withCredentials block safely injects DockerHub credentials
                // They are masked in logs — you'll see **** instead of password
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

    } // end stages

    // ── Post Pipeline ─────────────────────────────────────────────────────
    // Runs after ALL stages complete
    post {

        success {
            echo '''
            ╔══════════════════════════════════════════╗
            ║  ✅  PIPELINE PASSED                     ║
            ║                                          ║
            ║  Code scanned  → CLEAN                   ║
            ║  Image scanned → CLEAN                   ║
            ║  Pushed to DockerHub → DONE              ║
            ║                                          ║
            ║  Ready for Phase 3: Kubernetes Deploy    ║
            ╚══════════════════════════════════════════╝
            '''
        }

        failure {
            echo '''
            ╔══════════════════════════════════════════╗
            ║  ❌  PIPELINE FAILED                     ║
            ║                                          ║
            ║  Check the failed stage above            ║
            ║  Fix the issue and push again            ║
            ╚══════════════════════════════════════════╝
            '''
        }

        always {
            // Clean up local Docker images after pipeline
            // Prevents disk from filling up over many builds
            sh '''
                echo "--- Cleaning up local Docker images ---"
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  2>/dev/null || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} 2>/dev/null || true
                docker image prune -f 2>/dev/null || true
                echo "--- Cleanup complete ---"
            '''
        }
    }

}
