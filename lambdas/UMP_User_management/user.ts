import { hashSync } from "bcryptjs";
import { dynamodbClient } from "../../services/dynamodb.js";

import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { config } from "../../src/config/env.js";
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import type { CreateUserInterface } from "../../src/types/interface.js";
import { responseData } from "../../src/utils/methodUtils.js";
import { sns } from "../../services/sns.js";
import { PublishCommand } from "@aws-sdk/client-sns";

export const createUser = async (
  body: CreateUserInterface,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) return responseData(400, "Invalid JSON body");

    const { username, email, password, age } = body;
    if (!username || !email || !password || !age)
      return responseData(400, "Invalid credentials");

    // 16 rounds is expensive from lambda
    const hashedPassword = hashSync(password, 10);
    const newUser = {
      email,
      username,
      age,
      password: hashedPassword,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log("new user:", newUser);
    await dynamodbClient.send(
      new PutCommand({
        TableName: config.userTable,
        Item: newUser,
        ConditionExpression: "attribute_not_exists(email)",
      }),
    );

    await sns.send(
      new PublishCommand({
        TopicArn: config.userTopicArn,
        Message: JSON.stringify({
          eventType: "USER_CREATED",
          service: "user-service",
          timestamp: new Date().toISOString(),
          payload: {
            userId: email,
          },
        }),
      }),
    );
    return responseData(201, "User created successfully !");
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException")
      return responseData(409, "User exists with this email");

    console.error("Error while creating the user: ", error);
    return responseData(500, "Error while creating the user");
  }
};

export const getAllUsers = async (): Promise<APIGatewayProxyResult> => {
  try {
    const users = await dynamodbClient.send(
      new ScanCommand({
        TableName: config.userTable,
      }),
    );

    const sanitizedUsers = users.Items?.map(({ password, ...rest }) => rest);

    console.log("Users items", users);
    return responseData(200, "Users fetched successfully", sanitizedUsers);
  } catch (error) {
    console.error("Error while fetching all the users", error);
    return responseData(500, "Error while fetching all the users");
  }
};

export const getUser = async (
  email: string,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!email) return responseData(400, "Invalid credential");

    const user = await dynamodbClient.send(
      new GetCommand({
        TableName: config.userTable,
        Key: { email },
      }),
    );

    if (!user.Item)
      return responseData(404, "User does not exist with this email");

    const { password, ...sanitizedUser } = user.Item;

    return responseData(200, "User fetched successfully", sanitizedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return responseData(500, "Error fetching user");
  }
};

export const updateUser = async ({
  email,
  username,
  age,
  role,
}: {
  email: string;
  username?: string;
  age?: number;
  role?: string;
}): Promise<APIGatewayProxyResult> => {
  try {
    if (!email) return responseData(400, "Invalid credential");

    console.log(email, username, age);

    const res = await dynamodbClient.send(
      new UpdateCommand({
        TableName: config.userTable,
        Key: { email },
        UpdateExpression:
          "SET #username=:username, #age=:age, #updatedAt=:updatedAt, #role=:role",
        ExpressionAttributeNames: {
          "#username": "username",
          "#age": "age",
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":username": username,
          ":age": age,
          ":updatedAt": new Date().toISOString(),
          ":role": role,
        },
        ConditionExpression: "attribute_exists(email)",
        ReturnValues: "ALL_NEW",
      }),
    );

    console.log("res update", res);

    const updatedUser = res.Attributes;

    if (!updatedUser)
      return responseData(500, "Failed to retrieve updated user");

    const { password, ...sanitizedUser } = updatedUser;

    console.log("sanitizedUser", sanitizedUser);

    return responseData(200, "User updated successfully", sanitizedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return responseData(404, "User does not exist");
    }

    return responseData(500, "Error updating user");
  }
};

export const deleteUser = async (
  email: string,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!email) return responseData(400, "Invalid credential");

    const res = await dynamodbClient.send(
      new DeleteCommand({
        TableName: config.userTable,
        Key: { email },
        ConditionExpression: "attribute_exists(email)",
      }),
    );
    console.log("res delete", res);
    return responseData(200, "User deleted successfully");
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return responseData(404, "User not exist with this email");
    }
    console.error("Error while deleting user", error);
    return responseData(500, "Error while deleting user");
  }
};

export const handler = async (
  // event: APIGatewayProxyEvent, // this is for rest api we are using http in api gateway
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResult> => {
  let body;
  if (event.body && typeof event.body === "string") {
    body = JSON.parse(event.body);
  } else {
    body = event;
  }

  if (!body) return responseData(400, "Invalid JSON body");

  const { action } = body;
  console.log("event:", event);
  const method = event.requestContext.http.method;

  switch (method) {
    case "POST":
      return createUser(body);
    case "GET":
      if (action === "getAllUsers") {
        return getAllUsers();
      } else if (action === "getUser") {
        return getUser(body.email);
      } else {
        return responseData(400, "Invalid action for GET method");
      }
    case "PUT":
      return updateUser(body);
    case "DELETE":
      return deleteUser(body.email);
    default:
      return responseData(400, "No action specified");
  }
};
