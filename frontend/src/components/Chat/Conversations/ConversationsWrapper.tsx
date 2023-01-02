import { useQuery } from "@apollo/client"
import { Box } from "@chakra-ui/react"
import { Session } from "next-auth"
import ConversationList from "./ConversationList"
import ConversationOperations from "../../../graphql/operations/conversation"
import { ConversationsData } from "../../../util/types"
import { ConversationPopulated } from "../../../../../backend/src/util/types"
import { useEffect } from "react"
import { useRouter } from "next/router"
import SkeletonLoader from "../../common/SkeletonLoader"

interface ConversationWraperProps {
	session: Session
}

const ConversationWraper: React.FunctionComponent<ConversationWraperProps> = ({
	session,
}) => {
	const {
		data: conversationsData,
		error: conversationsError,
		loading: conversationsLoading,
		subscribeToMore,
	} = useQuery<ConversationsData, null>(
		ConversationOperations.Queries.conversations
	)

	const router = useRouter()
	const {
		query: { conversationId },
	} = router

	const onViewConversation = async (conversationId: string) => {
		// 1. Push conversaionId to the router params
		router.push({ query: { conversationId } })

		// 2. Mark the conversation as read
	}

	const subscribeToNewConversations = () => {
		subscribeToMore({
			document: ConversationOperations.Subscription.conversationCreated,
			updateQuery: (
				prev,
				{
					subscriptionData,
				}: {
					subscriptionData: {
						data: { conversationCreated: ConversationPopulated }
					}
				}
			) => {
				if (!subscriptionData.data) return prev

				const newConversation =
					subscriptionData.data.conversationCreated

				return Object.assign({}, prev, {
					conversations: [newConversation, ...prev.conversations],
				})
			},
		})
	}

	// execute subscription on mount
	useEffect(() => {
		subscribeToNewConversations()
	}, [])

	return (
		<Box
			width={{ base: "100%", md: "400px" }}
			bg="whiteAlpha.50"
			flexDirection='column'
			gap={4}
			py={6}
			px={3}
			display={{ base: conversationId ? "none" : "flex", md: "flex" }}
		>
			{conversationsLoading ? (
				<SkeletonLoader count={7} height="80px" />
			) : (
				<ConversationList
					session={session}
					conversations={conversationsData?.conversations || []}
					onViewConversation={onViewConversation}
				/>
			)}
		</Box>
	)
}

export default ConversationWraper
