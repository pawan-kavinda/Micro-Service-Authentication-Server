pipeline {
    agent any

    environment {
        // Docker Hub credentials stored in Jenkins
        DOCKERHUB_CRED = credentials('dockerhub-username-password')
        
        // Docker Hub repository
        IMAGE_NAME = "pawankavinda/authentication-service"
        IMAGE_TAG = "${env.BUILD_NUMBER}"

        // EC2 server details
        EC2_USER = 'ec2-user'
        EC2_HOST = '54.197.222.190' 
        CONTAINER_NAME = 'auth-service'
        APP_PORT = 4001 // Port exposed in Dockerfile
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/pawan-kavinda/Micro-Service-Authentication-Server'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    dockerImage = docker.build("${IMAGE_NAME}:${IMAGE_TAG}")
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                sh """
                echo "${DOCKERHUB_CRED_PSW}" | docker login -u "${DOCKERHUB_CRED_USR}" --password-stdin
                """
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                script {
                    dockerImage.push()
                    dockerImage.push('latest')
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec']) { // 'ec' is your EC2 private key in Jenkins
                    sh """
                    echo "Connecting to EC2 instance..."
                    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 ${EC2_USER}@${EC2_HOST} '
                        echo "Pulling latest Docker image..."
                        echo "${DOCKERHUB_CRED_PSW}" | docker login -u "${DOCKERHUB_CRED_USR}" --password-stdin
                        docker pull ${IMAGE_NAME}:latest
                        
                        echo "Stopping old container..."
                        docker stop ${CONTAINER_NAME} || true
                        docker rm ${CONTAINER_NAME} || true
                        
                        echo "Starting new container..."
                        docker run -d --name ${CONTAINER_NAME} -p ${APP_PORT}:${APP_PORT} ${IMAGE_NAME}:latest
                        
                        echo "Deployment verification..."
                        docker ps | grep ${CONTAINER_NAME}
                    '
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
            cleanWs()
        }
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}
