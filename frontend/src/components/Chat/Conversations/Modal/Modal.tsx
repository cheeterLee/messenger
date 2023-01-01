import { useLazyQuery, useMutation, useQuery } from "@apollo/client"
import {
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	Text,
	Modal,
	Stack,
	Input,
	Button,
} from "@chakra-ui/react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import UserOperations from "../../../../graphql/operations/user"
import ConversionOperations from "../../../../graphql/operations/conversation"
import {
	CreateConversationData,
	CreateConversationInput,
	SearchedUser,
	SearchUsersData,
	SearchUsersInout,
} from "../../../../util/types"
import Participants from "./Participants"
import UserSearchList from "./UserSearchList"
import { Session } from "next-auth"
import { useRouter } from "next/router"

interface IModalProps {
	session: Session
	isOpen: boolean
	onClose: () => void
}

const ConversationModal: React.FunctionComponent<IModalProps> = ({
	session,
	isOpen,
	onClose,
}) => {
	const {
		user: { id: userId },
	} = session

	const router = useRouter()

	const [username, setUsername] = useState("")
	const [participants, setParticipants] = useState<Array<SearchedUser>>([])
	const [searchUsers, { data, error, loading }] = useLazyQuery<
		SearchUsersData,
		SearchUsersInout
	>(UserOperations.Queries.searchUsers)

	const [createConversation, { loading: createConversationLoading }] =
		useMutation<CreateConversationData, CreateConversationInput>(
			ConversionOperations.Mutations.createConversation
		)

	const onCreateConversation = async () => {
		const participantIds = [userId, ...participants.map((p) => p.id)]
		try {
			const { data } = await createConversation({
				variables: {
					participantIds,
				},
			})

			if (!data?.createConversation) {
				throw new Error("failed to create conversation")
			}

			const {
				createConversation: { conversationId },
			} = data

			router.push({ query: { conversationId } })

			// clear state and close modal on successful creation
			setParticipants([])
			setUsername('')
			onClose()
		} catch (error: any) {
			console.log("oncreateconversation error", error)
			toast.error(error?.message)
		}
	}

	const onSearch = async (event: React.FormEvent) => {
		event.preventDefault()
		searchUsers({ variables: { username } })
	}

	const addParticipant = (user: SearchedUser) => {
		setParticipants((prev) => [...prev, user])
		setUsername("")
	}

	const removeParticipant = (userId: string) => {
		setParticipants((prev) => prev.filter((p) => p.id !== userId))
	}

	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent bg="#2d2d2d" pb={4}>
					<ModalHeader>Create a Conversation</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<form onSubmit={onSearch}>
							<Stack spacing={4}>
								<Input
									placeholder="Enter a username"
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
								/>
								<Button
									type="submit"
									disabled={!username}
									isLoading={loading}
								>
									Search
								</Button>
							</Stack>
						</form>
						{data?.searchUsers && (
							<UserSearchList
								users={data.searchUsers}
								addParticipant={addParticipant}
							/>
						)}
						{participants.length !== 0 && (
							<>
								<Participants
									participants={participants}
									removeParticipant={removeParticipant}
								/>
								<Button
									bg="brand.100"
									width="100%"
									mt={6}
									_hover={{ bg: "brand.100" }}
									onClick={onCreateConversation}
									isLoading={createConversationLoading}
								>
									Create Conversation
								</Button>
							</>
						)}
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	)
}

export default ConversationModal
