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
exports.messagePopulated = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const functions_1 = require("../../util/functions");
const conversation_1 = require("./conversation");
const resolvers = {
    Query: {
        messages: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma } = context;
            const { conversationId } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("not authorized");
            }
            const { user: { id: userId }, } = session;
            // verify that conversation exists use is a participant
            const conversation = yield prisma.conversation.findUnique({
                where: {
                    id: conversationId,
                },
                include: conversation_1.conversationPopulated,
            });
            if (!conversation) {
                throw new graphql_1.GraphQLError("Conversation not found");
            }
            const alllowedToView = (0, functions_1.userIsConversationParticipant)(conversation.participants, userId);
            if (!alllowedToView) {
                throw new graphql_1.GraphQLError('Not authorized');
            }
            try {
                const messages = yield prisma.message.findMany({
                    where: {
                        conversationId
                    },
                    include: exports.messagePopulated,
                    orderBy: {
                        createdAt: "desc",
                    }
                });
                return messages;
            }
            catch (error) {
                console.log('message error', error);
                throw new graphql_1.GraphQLError(error === null || error === void 0 ? void 0 : error.message);
            }
        }),
    },
    Mutation: {
        sendMessage: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma, pubsub } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("Not authorized");
            }
            const { user: { id: userId }, } = session;
            const { id: messageId, senderId, conversationId, body } = args;
            if (userId !== senderId) {
                throw new graphql_1.GraphQLError("Not authorized");
            }
            try {
                // create new message entity
                const newMessage = yield prisma.message.create({
                    data: {
                        id: messageId,
                        senderId,
                        conversationId,
                        body,
                    },
                    include: exports.messagePopulated,
                });
                // Find conversation participant entity
                const participant = yield prisma.conversationParticipant.findFirst({
                    where: {
                        userId,
                        conversationId
                    }
                });
                // should always exists
                if (!participant) {
                    throw new graphql_1.GraphQLError('Participant does not exists');
                }
                // Update conversation entity
                const conversation = yield prisma.conversation.update({
                    where: {
                        id: conversationId,
                    },
                    data: {
                        latestMessageId: newMessage.id,
                        participants: {
                            update: {
                                where: {
                                    id: participant === null || participant === void 0 ? void 0 : participant.id,
                                },
                                data: {
                                    hasSeenLatestMessage: true,
                                },
                            },
                            updateMany: {
                                where: {
                                    NOT: {
                                        userId,
                                    },
                                },
                                data: {
                                    hasSeenLatestMessage: false,
                                },
                            },
                        },
                    },
                    include: conversation_1.conversationPopulated,
                });
                pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: {
                        conversation
                    }
                });
            }
            catch (error) {
                console.log("send message error");
                throw new graphql_1.GraphQLError("Error sending message");
            }
            return true;
        }),
    },
    Subscription: {
        messageSent: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["MESSAGE_SENT"]);
            }, (payload, args, context) => {
                return (payload.messageSent.conversationId ===
                    args.conversationId);
            }),
        },
    },
};
exports.messagePopulated = client_1.Prisma.validator()({
    sender: {
        select: {
            id: true,
            username: true,
        },
    },
});
exports.default = resolvers;
