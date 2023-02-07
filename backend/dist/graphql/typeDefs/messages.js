"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = require("graphql-tag");
const typeDefs = (0, graphql_tag_1.gql) `
	type Message {
		id: String
		sender: User
		body: String
		createdAt: Date
	}

    type Query {
        messages(conversationId: String): [Message]
    }

	type Mutation {
		sendMessage(
			id: String
			conversationId: String
			senderId: String
			body: String
		): Boolean
	}

    type Subscription {
        messageSent(conversationId: String): Message 
    }
`;
exports.default = typeDefs;
