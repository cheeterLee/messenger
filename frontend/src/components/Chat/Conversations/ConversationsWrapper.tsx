import { useQuery } from "@apollo/client"
import { Box } from "@chakra-ui/react"
import { Session } from "next-auth"
import ConversationList from "./ConversationList"
import ConversationOperations from "../../../graphql/operations/conversation"
import { ConversationsData } from "../../../util/types"

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
	} = useQuery<ConversationsData, null>(ConversationOperations.Queries.conversations)
	console.log(
		"🚀 ~ file: ConversationsWrapper.tsx:16 ~ conversationsData",
		conversationsData
	)

	return (
		<Box
			width={{ base: "100%", md: "400px" }}
			bg="whiteAlpha.50"
			py={6}
			px={3}
		>
			{/* skeleton loader */}
			<ConversationList session={session} conversations={conversationsData?.conversations || []} />
		</Box>
	)
}

export default ConversationWraper
