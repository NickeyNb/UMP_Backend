export const config = {
  region: process.env.AWS_REGION,
  userTable: process.env.USER_TABLE_NAME,
  logsTable: process.env.LOGS_TABLE_NAME,
  userTopicArn: process.env.USER_EVENTS_TOPIC_ARN,
};
