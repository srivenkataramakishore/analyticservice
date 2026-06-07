# lambafunction

AWS Lambda function used for the AI SDLC bug fix demo.

## Intentional Bug

This function contains a deliberate `TypeError` on line 17:

```js
const order = null;
console.log(`Order ID: ${order.id}`); // TypeError: Cannot read properties of null
```

This causes the Lambda to crash on every invocation, producing `ERROR` entries in CloudWatch.

## Purpose

Used to demonstrate the full AI-driven bug fix SDLC:

1. Invoke the Lambda → crash occurs
2. Copilot Agent queries CloudWatch logs for errors
3. Claude creates Jira ticket + RCA
4. Copilot writes the fix + regression test
5. Claude opens PR + publishes RCA to Confluence
6. Copilot verifies fix by re-querying CloudWatch post-deploy

## Invocation (AWS CLI)

```powershell
# Invoke the function (will crash)
aws lambda invoke --function-name lambafunction --region us-east-1 --payload '{"key1":"val1","key2":"val2","key3":"val3"}' response.json

# Check CloudWatch for errors
$ts = [int64](([datetime]::UtcNow.AddHours(-1) - [datetime]'1970-01-01').TotalMilliseconds)
aws logs filter-log-events --log-group-name "/aws/lambda/lambafunction" --region us-east-1 --start-time $ts --filter-pattern "ERROR"
```

## Deploy (AWS CLI)

```powershell
# Zip and deploy
Compress-Archive -Path index.mjs -DestinationPath function.zip -Force
aws lambda update-function-code --function-name lambafunction --region us-east-1 --zip-file fileb://function.zip
```

## Log Group

```
arn:aws:logs:us-east-1:456102425297:log-group:/aws/lambda/lambafunction:*
```
