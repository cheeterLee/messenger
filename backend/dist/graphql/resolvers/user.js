"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const resolvers = {
    Query: {
        searchUsers: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { username: searchedUsername } = args;
            const { session, prisma } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError('Not authorized');
            }
            const { user: { username: myUsername } } = session;
            try {
                const users = yield prisma.user.findMany({
                    where: {
                        username: {
                            contains: searchedUsername,
                            not: myUsername,
                            mode: 'insensitive'
                        }
                    }
                });
                return users;
            }
            catch (error) {
                console.log('searchUsers error', error);
                throw new graphql_1.GraphQLError(error === null || error === void 0 ? void 0 : error.message);
            }
        }),
    },
    Mutation: {
        createUsername: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { username } = args;
            const { session, prisma } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                return {
                    error: "Not authorized",
                };
            }
            const { id: userId } = session.user;
            try {
                // Check username is not taken
                const existingUser = yield prisma.user.findUnique({
                    where: {
                        username,
                    }
                });
                if (existingUser) {
                    return {
                        error: "username already taken, try another"
                    };
                }
                // Update user
                yield prisma.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        username
                    }
                });
                return { success: true };
            }
            catch (error) {
                console.log('create username error', error);
                return {
                    error: error === null || error === void 0 ? void 0 : error.message
                };
            }
        }),
    },
};
exports.default = resolvers;
