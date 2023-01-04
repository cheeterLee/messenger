import { Flex } from "@chakra-ui/react"
import { Session } from "next-auth"
import { useRouter } from "next/router"
import MessageHeader from './Messages/Header'
import MessageInput from "./Messages/Input"
import Messages from "./Messages/Messages"
import NoConversationSelected from "./NoConversationSelected"

interface FeedWrapperProps {
	session: Session
}

const FeedWrapper: React.FunctionComponent<FeedWrapperProps> = ({
	session,
}) => {
	const router = useRouter()

	const { conversationId } = router.query
	const { user: { id: userId } } = session

	return (
		<Flex
			display={{ base: conversationId ? "flex" : "none", md: "flex" }}
			width="100%"
			direction="column"
		>
			{conversationId && typeof conversationId === 'string' ? (
				<>
					<Flex
						direction='column'
						justify='space-between'
						overflow='hidden'
						flexGrow={1}
					>
						<MessageHeader userId={userId} conversationId={conversationId} />
						<Messages userId={userId} conversationId={conversationId} />
					</Flex>
					<MessageInput session={session} conversationId={conversationId} />
				</>
			) : (
				<NoConversationSelected />
			)}
		</Flex>
	)
}

export default FeedWrapper
