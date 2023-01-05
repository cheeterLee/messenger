"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = require("graphql-tag");
const typeDefs = (0, graphql_tag_1.gql) `
    type User {
        id: String
        name: String
        username: String
        email: String
        emailVerified: Boolean
        image: String
    }

    type SearchedUser {
        id: String
        username: String
    }

    type Query {
        searchUsers(username: String): [SearchedUser]
    }

    type Mutation {
        createUsername(username: String): CreateUsernameResponse
    }

    type CreateUsernameResponse {
        success: Boolean
        error: String
    }
`;
exports.default = typeDefs;
