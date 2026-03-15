import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from "aws-lambda";
import type { CreateUserInterface } from "../../src/types/interface.js";
export declare const createUser: (body: CreateUserInterface) => Promise<APIGatewayProxyResult>;
export declare const getAllUsers: () => Promise<APIGatewayProxyResult>;
export declare const getUser: (email: string) => Promise<APIGatewayProxyResult>;
export declare const updateUser: ({ email, username, age, role, }: {
    email: string;
    username?: string;
    age?: number;
    role?: string;
}) => Promise<APIGatewayProxyResult>;
export declare const deleteUser: (email: string) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=user.d.ts.map