import { Box, Button, Text } from "@chakra-ui/react"
import { Session } from "next-auth"
import { useRouter } from "next/router"
import { useState } from "react"
import { ConversationPopulated } from "../../../../../backend/src/util/types"
import ConversationItem from "./ConversationItem"
import ConversationModal from "./Modal/Modal"
import ConversationOperations from "../../../graphql/operations/conversation"
import { toast } from "react-hot-toast"
import { useMutation } from "@apollo/client"
import { signOut } from "next-auth/react"

interface IConversationListProps {
	session: Session
	conversations: Array<ConversationPopulated>
	onViewConversation: (
		conversationId: string,
		hasSeenLatestMessage: boolean | undefined
	) => void
}

const ConversationList: React.FunctionComponent<IConversationListProps> = ({
	session,
	conversations,
	onViewConversation,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [deleteConversation] = useMutation<{
		deleteConversation: boolean
		conversationId: string
	}>(ConversationOperations.Mutations.deleteConversation)

	const onOpen = () => setIsOpen(true)
	const onClose = () => setIsOpen(false)

	const router = useRouter()
	const {
		user: { id: userId },
	} = session

	const onDeleteConversation = async (conversationId: string) => {
		try {
			toast.promise(
				deleteConversation({
					variables: {
						conversationId,
					},
					update: () => {
						router.replace(
							typeof process.env.NEXT_PUBLIC_BASE_URL === "string"
								? process.env.NEXT_PUBLIC_BASE_URL
								: ""
						)
					},
				}),
				{
					loading: "Deleting conversation",
					success: "Conversation deleted",
					error: "Failed to delete conversation",
				}
			)
		} catch (error) {
			console.log("onDeleteConversation error", error)
		}
	}

	const sortedConversations = [...conversations].sort(
		(a, b) => b.updatedAt.valueOf() - a.updatedAt.valueOf()
	)

	return (
		<Box width="100%" position="relative" height="100%" overflow="hidden">
			<Box
				py={2}
				px={4}
				mb={4}
				bg="blackAlpha.300"
				borderRadius={4}
				cursor="pointer"
				onClick={onOpen}
			>
				<Text
					textAlign="center"
					color="whiteAlpha.800"
					fontWeight={500}
				>
					Find or start a conversation
				</Text>
			</Box>
			<ConversationModal
				session={session}
				isOpen={isOpen}
				onClose={onClose}
			/>
			{sortedConversations.map((conversation) => {
				const participant = conversation.participants.find(
					(p) => p.user.id === userId
				)

				return (
					<ConversationItem
						key={conversation.id}
						userId={userId}
						conversation={conversation}
						onClick={() =>
							onViewConversation(
								conversation.id,
								participant?.hasSeenLatestMessage
							)
						}
						onDeleteConversation={onDeleteConversation}
						hasSeenLatestMessage={participant?.hasSeenLatestMessage}
						isSelected={
							conversation.id === router.query.conversaionId
						}
					/>
				)
			})}
			<Box
				position="absolute"
				bottom={0}
				left={0}
				width="100%"
				// border="1px solid red"
				px={8}
				// py={6}
			>
				<Button width="100%" onClick={() => signOut()}>
					Logout
				</Button>
			</Box>
		</Box>
	)
}

export default ConversationList
