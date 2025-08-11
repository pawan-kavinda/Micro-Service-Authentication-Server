pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        ECR_REPO = '211125300512.dkr.ecr.us-east-1.amazonaws.com/authentication-service'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        CLUSTER_NAME = 'auth-service-cluster'
        SERVICE_NAME = 'auth-service'
        TASK_DEFINITION_FAMILY = 'auth-service-task'
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

        stage('Deploy to ECS') {
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

                            # Check if service exists
                            SERVICE_EXISTS=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION --query 'services[0].status' --output text 2>/dev/null || echo "MISSING")
                            
                            if [ "$SERVICE_EXISTS" = "MISSING" ] || [ "$SERVICE_EXISTS" = "None" ]; then
                                echo "Service does not exist. Creating new service..."
                                aws ecs create-service \
                                    --cluster $CLUSTER_NAME \
                                    --service-name $SERVICE_NAME \
                                    --task-definition $TASK_DEF_ARN \
                                    --desired-count 1 \
                                    --launch-type FARGATE \
                                    --network-configuration "awsvpcConfiguration={subnets=[subnet-0c6df529c92674c41],securityGroups=[sg-0f72f8d6d9aceedbe],assignPublicIp=ENABLED}" \
                                    --region $AWS_REGION
                            else
                                echo "Service exists. Updating service..."
                                aws ecs update-service \
                                    --cluster $CLUSTER_NAME \
                                    --service $SERVICE_NAME \
                                    --task-definition $TASK_DEF_ARN \
                                    --force-new-deployment \
                                    --region $AWS_REGION
                            fi

                            # Wait for service to be stable
                            echo "Waiting for service to be stable..."
                            aws ecs wait services-stable --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION
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
        success {
            echo 'Deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed!'
        }
    }
}