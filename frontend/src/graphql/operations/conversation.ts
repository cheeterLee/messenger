import { gql } from "@apollo/client";
import { MessageFields } from "./message";

const ConversationFields = `
    id
    participants {
        user {
            id
            username
        }
        hasSeenLatestMessage
    }
    latestMessage {
        ${MessageFields}
    }
    updatedAt
`

export default {
    Queries: {
        conversations: gql`
            query Conversations {
                conversations {
                    ${ConversationFields}
                }
            }
        `
    },
    Mutations: {
        createConversation: gql`
            mutation CreateConversation($participantIds: [String]!) {
                createConversation(participantIds: $participantIds) {
                    conversationId
                }
            }
        `,
        markConversationAsRead: gql`
            mutation MarkConversationAsRead($userId: String!, $conversationId: String!) {
                markConversationAsRead(userId: $userId, conversationId: $conversationId)
            }
        `
    },
    Subscriptions: {
        conversationCreated: gql`
            subscription conversationCreated {
                conversationCreated {
                    ${ConversationFields}
                }
            }
        `,
        conversationUpdated: gql`
            subscription ConversationUpdated {
                conversationUpdated {
                    conversation {
                        ${ConversationFields}
                    }
                }
            }
        `
    },
}