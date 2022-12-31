import { Box } from "@chakra-ui/react"
import { Session } from "next-auth"
import ConversationList from "./ConversationList"

interface ConversationWraperProps {
	session: Session
}

const ConversationWraper: React.FunctionComponent<ConversationWraperProps> = ({
	session,
}) => {
	return (
		<Box width={{ base: "100%", md: "400px" }} bg="whiteAlpha.50" py={6} px={3}>
			{/* skeleton loader */}
			<ConversationList session={session} />
		</Box>
	)
}

export default ConversationWraper
