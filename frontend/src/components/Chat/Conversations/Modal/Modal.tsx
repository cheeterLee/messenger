import { useLazyQuery, useQuery } from "@apollo/client"
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
import UserOperations from "../../../../graphql/operations/user"
import { SearchUsersData, SearchUsersInout } from "../../../../util/types"

interface IModalProps {
	isOpen: boolean
	onClose: () => void
}

const ConversationModal: React.FunctionComponent<IModalProps> = ({
	isOpen,
	onClose,
}) => {
	const [username, setUsername] = useState("")
	const [searchUsers, { data, error, loading }] = useLazyQuery<
		SearchUsersData,
		SearchUsersInout
	>(UserOperations.Queries.searchUsers)

    console.log('here is search data', data)
    

	const onSearch = async (event: React.FormEvent) => {
		event.preventDefault()
		searchUsers({ variables: { username } })
	}

	return (
		<>
			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />
				<ModalContent bg="#2d2d2d" pb={4}>
					<ModalHeader>Modal Title</ModalHeader>
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
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	)
}

export default ConversationModal
