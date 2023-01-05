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
exports.conversationPopulated = exports.participantPopulated = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const functions_1 = require("../../util/functions");
const resolvers = {
    Query: {
        conversations: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("not authorized");
            }
            const { user: { id: userId }, } = session;
            try {
                const conversations = yield prisma.conversation.findMany({
                    include: exports.conversationPopulated,
                });
                return conversations.filter((conversation) => !!conversation.participants.find((p) => p.userId === userId));
            }
            catch (error) {
                console.log("conversation error", error);
                throw new graphql_1.GraphQLError(error === null || error === void 0 ? void 0 : error.message);
            }
        }),
    },
    Mutation: {
        createConversation: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma, pubsub } = context;
            const { participantIds } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("Not authorized");
            }
            const { user: { id: userId }, } = session;
            try {
                const conversation = yield prisma.conversation.create({
                    data: {
                        participants: {
                            createMany: {
                                data: participantIds.map((id) => ({
                                    userId: id,
                                    hasSeenLatestMessage: id === userId,
                                })),
                            },
                        },
                    },
                    include: exports.conversationPopulated,
                });
                // emit a CONVERSATION_CREATED event using pubsub
                pubsub.publish("CONVERSATION_CREATED", {
                    conversationCreated: conversation,
                });
                return {
                    conversationId: conversation.id,
                };
            }
            catch (error) {
                console.log("create conversation error", error);
                throw new graphql_1.GraphQLError("Error creating conversation");
            }
        }),
        markConversationAsRead: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma } = context;
            const { userId, conversationId } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("Not authorized");
            }
            try {
                const participant = yield prisma.conversationParticipant.findFirst({
                    where: {
                        userId,
                        conversationId,
                    },
                });
                if (!participant) {
                    throw new graphql_1.GraphQLError("Participant entity not found");
                }
                yield prisma.conversationParticipant.update({
                    where: {
                        id: participant.id,
                    },
                    data: {
                        hasSeenLatestMessage: true,
                    },
                });
                return true;
            }
            catch (error) {
                console.log("markConversationAsRead error", error);
                throw new graphql_1.GraphQLError(error === null || error === void 0 ? void 0 : error.message);
            }
        }),
        deleteConversation: function (_, args, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const { session, prisma, pubsub } = context;
                const { conversationId } = args;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                try {
                    /**
                     * Delete conversation and all related entities
                     */
                    const [deletedConversation] = yield prisma.$transaction([
                        prisma.conversation.delete({
                            where: {
                                id: conversationId,
                            },
                            include: exports.conversationPopulated,
                        }),
                        prisma.conversationParticipant.deleteMany({
                            where: {
                                conversationId,
                            },
                        }),
                        prisma.message.deleteMany({
                            where: {
                                conversationId,
                            },
                        }),
                    ]);
                    pubsub.publish("CONVERSATION_DELETED", {
                        conversationDeleted: deletedConversation,
                    });
                }
                catch (error) {
                    console.log("deleteConversation error", error);
                    throw new graphql_1.GraphQLError("Failed to delete conversation");
                }
                return true;
            });
        },
    },
    Subscription: {
        conversationCreated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
            }, (payload, _, context) => {
                const { session } = context;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                const { id: userId } = session.user;
                const { conversationCreated: { participants }, } = payload;
                const userIsParticipant = (0, functions_1.userIsConversationParticipant)(participants, session.user.id);
                return userIsParticipant;
            }),
        },
        conversationUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_UPDATED"]);
            }, (payload, _, context) => {
                const { session } = context;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                const { id: userId } = session.user;
                const { conversationUpdated: { conversation: { participants }, }, } = payload;
                return (0, functions_1.userIsConversationParticipant)(participants, userId);
            }),
        },
        conversationDeleted: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_DELETED"]);
            }, (payload, _, context) => {
                const { session } = context;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                const { id: userId } = session.user;
                const { conversationDeleted: { participants }, } = payload;
                return (0, functions_1.userIsConversationParticipant)(participants, userId);
            }),
        },
    },
};
exports.participantPopulated = client_1.Prisma.validator()({
    user: {
        select: {
            id: true,
            username: true,
        },
    },
});
exports.conversationPopulated = client_1.Prisma.validator()({
    participants: {
        include: exports.participantPopulated,
    },
    latestMessage: {
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    },
});
exports.default = resolvers;
