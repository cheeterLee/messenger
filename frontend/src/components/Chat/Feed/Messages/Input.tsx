import { useMutation } from "@apollo/client"
import { Box, Input } from "@chakra-ui/react"
import { Session } from "next-auth"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { ObjectID } from "bson"
import { SendMessageArguments } from "../../../../../../backend/src/util/types"
import MessageOperations from "../../../../graphql/operations/message"
import { MessagesData } from "../../../../util/types"

interface IMessageInputProps {
	session: Session
	conversationId: string
}

const MessageInput: React.FunctionComponent<IMessageInputProps> = ({
	session,
	conversationId,
}) => {
	const [messageBody, setMessageBody] = useState("")
	const [sendMessage] = useMutation<
		{ sendMessage: boolean },
		SendMessageArguments
	>(MessageOperations.Mutation.sendMessage)

	const onSendMessage = async (event: React.FormEvent) => {
		event.preventDefault()

		try {
			// call sendMessage mutation
			const { id: senderId } = session.user
			const messageId = new ObjectID().toString()
			const newMessage: SendMessageArguments = {
				id: messageId,
				senderId,
				conversationId,
				body: messageBody,
			}

			// clear input
			setMessageBody('')

			const { data, errors } = await sendMessage({
				variables: {
					...newMessage,
				},
				optimisticResponse: {
					sendMessage: true,
				},
				update: (cache) => {
					const existing = cache.readQuery<MessagesData>({
						query: MessageOperations.Query.messages,
						variables: { conversationId },
					}) as MessagesData
					cache.writeQuery<MessagesData, { conversationId: string }>({
						query: MessageOperations.Query.messages,
						variables: { conversationId },
						data: {
							...existing,
							messages: [
								{
									id: messageId,
									body: messageBody,
									senderId: session.user.id,
									conversationId,
									sender: {
										id: session.user.id,
										username: session.user.username
									},
									createdAt: new Date(Date.now()),
									updatedAt: new Date(Date.now()),
								},
								...existing.messages,
							],
						},
					})
				},
			})

			if (!data?.sendMessage || errors) {
				throw new Error("failed to send message")
			}
		} catch (error: any) {
			console.log("on send message error", error)
			toast.error(error?.message)
		}
	}

	return (
		<Box px={4} py={6} width="100%">
			<form onSubmit={onSendMessage}>
				<Input
					value={messageBody}
					size="md"
					placeholder="New Message"
					resize="none"
					onChange={(event) => setMessageBody(event.target.value)}
					_focus={{
						boxShadow: "none",
						border: "1px solid",
						borderColor: "whiteAlpha.300",
					}}
				/>
			</form>
		</Box>
	)
}

export default MessageInput
