pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO = '211125300512.dkr.ecr.us-east-1.amazonaws.com/authentication-service'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
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
                    dockerImage = docker.build("${ECR_REPO}:${IMAGE_TAG}")
                }
            }
        }

        stage('Login to AWS ECR') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-credentials'
                    ]
                ]) {
                    sh '''
                        aws --version
                        aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
                    '''
                }
            }
        }

        stage('Push Docker Image to ECR') {
            steps {
                script {
                    dockerImage.push()
                    dockerImage.push('latest')
                }
            }
        }

        stage('Register ECS Task Definition and Update Service') {
            steps {
                withCredentials([
                    [
                        $class: 'AmazonWebServicesCredentialsBinding',
                        credentialsId: 'aws-credentials'
                    ]
                ]) {
                    script {
                        sh '''
                            # Replace image tag in task-def.json
                            sed -i 's|"image": *".*"|"image": "'${ECR_REPO}:${IMAGE_TAG}'"|' task-def.json

                            # Register new task definition
                            aws ecs register-task-definition --cli-input-json file://task-def.json > task-def-result.json

                            # Extract new task definition ARN
                            TASK_DEF_ARN=$(jq -r '.taskDefinition.taskDefinitionArn' task-def-result.json)
                            echo "Registered new task definition: $TASK_DEF_ARN"

                            # Update ECS service with new task definition
                            aws ecs update-service --cluster auth-service-cluster --service auth-service --task-definition $TASK_DEF_ARN --force-new-deployment --region $AWS_REGION
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
