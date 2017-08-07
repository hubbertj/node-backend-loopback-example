# per http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#config-settings-and-precedence

# Operation Hope AWS keys
AWS_ACCESS_KEY_ID=AKIAI6XFBXJPJCNG2PFQ
AWS_SECRET_ACCESS_KEY=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

# make sure we have a built image first.
source docker-build-image.sh

# sets docker up so that it can push to the AWS ECS repo.
aws ecr get-login --region us-west-1 | sh

docker tag operation-hope-api:latest 876961091358.dkr.ecr.us-west-1.amazonaws.com/operation-hope-api:latest

docker push 876961091358.dkr.ecr.us-west-1.amazonaws.com/operation-hope-api:latest