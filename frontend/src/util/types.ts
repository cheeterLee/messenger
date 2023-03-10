import { Prisma } from "@prisma/client"
// import {
// 	ConversationPopulated,
// 	MessagePopulated,
// } from "../../../backend/src/util/types"

// Users
export interface CreateUsernameData {
	createUsername: {
		success: boolean
		error: string
	}
}

export interface CreateUsernameVariables {
	username: string
}

export interface SearchUsersInout {
	username: string
}

export interface SearchUsersData {
	searchUsers: Array<SearchedUser>
}

export interface SearchedUser {
	id: string
	username: string
}

// Conversations
export interface ConversationsData {
	conversations: Array<ConversationPopulated>
}

export interface CreateConversationData {
	createConversation: {
		conversationId: string
	}
}

export interface CreateConversationInput {
	participantIds: Array<string>
}

export interface ConversationUpdatedData {
	conversationUpdated: {
		conversation: ConversationPopulated
	}
}

export interface ConversationDeletedData {
	conversationDeleted: {
		id: string
	}
}

// Messages
export interface MessagesData {
	messages: Array<MessagePopulated>
}

export interface MessagesVariables {
	conversationId: string
}

export interface MessageSubscriptionData {
	subscriptionData: {
		data: {
			messageSent: MessagePopulated
		}
	}
}

// migrate backend
export const participantPopulated =
	Prisma.validator<Prisma.ConversationParticipantInclude>()({
		user: {
			select: {
				id: true,
				username: true,
			},
		},
	})

export const conversationPopulated =
	Prisma.validator<Prisma.ConversationInclude>()({
		participants: {
			include: participantPopulated,
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
	})

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
	sender: {
		select: {
			id: true,
			username: true,
		},
	},
})

export type ParticipantPopulated = Prisma.ConversationParticipantGetPayload<{
	include: typeof participantPopulated
}>

export type ConversationPopulated = Prisma.ConversationGetPayload<{
	include: typeof conversationPopulated
}>

export type MessagePopulated = Prisma.MessageGetPayload<{
	include: typeof messagePopulated
}>

export interface SendMessageArguments {
	id: string
	conversationId: string
	senderId: string
	body: string
}