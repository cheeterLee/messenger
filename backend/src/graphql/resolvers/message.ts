import { Prisma } from "@prisma/client"
import { GraphQLError } from "graphql"
import { withFilter } from "graphql-subscriptions"
import {
	GraphQLContext,
	MessagePopulated,
	MessageSentSubscriptionPayload,
	SendMessageArguments,
} from "../../util/types"
import { userIsConversationParticipant } from "../../util/functions"
import { conversationPopulated } from "./conversation"

const resolvers = {
	Query: {
		messages: async (
			_: any,
			args: { conversationId: string },
			context: GraphQLContext
		): Promise<Array<MessagePopulated>> => {
			const { session, prisma } = context
			const { conversationId } = args

			if (!session?.user) {
				throw new GraphQLError("not authorized")
			}

			const {
				user: { id: userId },
			} = session

			// verify that conversation exists use is a participant
			const conversation = await prisma.conversation.findUnique({
				where: {
					id: conversationId,
				},
				include: conversationPopulated,
			})

			if (!conversation) {
				throw new GraphQLError("Conversation not found")
			}

			const alllowedToView = userIsConversationParticipant(
				conversation.participants,
				userId
			)

            if (!alllowedToView) {
                throw new GraphQLError('Not authorized')
            }

            try {
                const messages = await prisma.message.findMany({
                    where: {
                        conversationId
                    },
                    include: messagePopulated,
                    orderBy: {
                        createdAt: "desc",
                    }
                })

                return messages


            } catch (error: any) {
                console.log('message error', error)
                throw new GraphQLError(error?.message)
            }
		},
	},
	Mutation: {
		sendMessage: async (
			_: any,
			args: SendMessageArguments,
			context: GraphQLContext
		): Promise<boolean> => {
			const { session, prisma, pubsub } = context

			if (!session?.user) {
				throw new GraphQLError("Not authorized")
			}

			const {
				user: { id: userId },
			} = session
			const { id: messageId, senderId, conversationId, body } = args

			if (userId !== senderId) {
				throw new GraphQLError("Not authorized")
			}

			try {
				// create new message entity
				const newMessage = await prisma.message.create({
					data: {
						id: messageId,
						senderId,
						conversationId,
						body,
					},
					include: messagePopulated,
				})

                // Find conversation participant entity
                const participant = await prisma.conversationParticipant.findFirst({
                    where: {
                        userId,
                        conversationId
                    }
                })

                // should always exists
                if (!participant) {
                    throw new GraphQLError('Participant does not exists')
                }

				// Update conversation entity
				const conversation = await prisma.conversation.update({
					where: {
						id: conversationId,
					},
					data: {
						latestMessageId: newMessage.id,
						participants: {
							update: {
								where: {
									id: participant?.id,
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
                    include: conversationPopulated,
				})

				pubsub.publish("MESSAGE_SENT", { messageSent: newMessage })
				// pubsub.publish("CONVERSATION_UPDATED", {
				//     conversationUpdated: {
				//         conversation
				//     }
				// })
			} catch (error) {
				console.log("send message error")
				throw new GraphQLError("Error sending message")
			}

			return true
		},
	},
	Subscription: {
		messageSent: {
			subscribe: withFilter(
				(_: any, __: any, context: GraphQLContext) => {
					const { pubsub } = context
					return pubsub.asyncIterator(["MESSAGE_SENT"])
				},
				(
					payload: MessageSentSubscriptionPayload,
					args: { conversationId: string },
					context: GraphQLContext
				) => {
					return (
						payload.messageSent.conversationId ===
						args.conversationId
					)
				}
			),
		},
	},
}

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
	sender: {
		select: {
			id: true,
			username: true,
		},
	},
})

export default resolvers
