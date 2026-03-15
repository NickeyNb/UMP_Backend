import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { config } from "../src/config/env.js";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: config.region });
export const dynamodbClient = DynamoDBDocumentClient.from(client);
