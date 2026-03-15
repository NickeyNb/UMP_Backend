import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { responseData } from "../utils/methodUtils.js";

export const logsHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<void> => {
  let body;
  if (event.body && typeof event.body === "string") {
    body = JSON.parse(event.body);
  } else {
    body = event;
  }
  if (!body) responseData(400, "Invalid JSON body");

  console.log("Event:", event);
};
