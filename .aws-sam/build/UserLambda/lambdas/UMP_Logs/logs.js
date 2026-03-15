import { responseData } from "../../src/utils/methodUtils.js";
export const handler = async (event) => {
    let body;
    if (event.body && typeof event.body === "string") {
        body = JSON.parse(event.body);
    }
    else {
        body = event;
    }
    if (!body)
        responseData(400, "Invalid JSON body");
    console.log("Event:", event);
};
//# sourceMappingURL=logs.js.map