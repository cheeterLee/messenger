import { Flex } from "@chakra-ui/react"
import { Session } from "next-auth"
import { useRouter } from "next/router"
import MessageHeader from './Messages/Header'
import MessageInput from "./Messages/Input"

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
						border='1px solid red'
					>
						<MessageHeader userId={userId} conversationId={conversationId} />
						{/* <Messages /> */}
					</Flex>
					<MessageInput session={session} conversationId={conversationId} />
				</>
			) : ( 
				<div>no conversation selected</div>
			)}
		</Flex>
	)
}

export default FeedWrapper
