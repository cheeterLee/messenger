import { Box, Input } from "@chakra-ui/react"
import { Session } from "next-auth"
import { useState } from "react"
import { toast } from "react-hot-toast"

interface IMessageInputProps {
	session: Session
	conversationId: string
}

const MessageInput: React.FunctionComponent<IMessageInputProps> = ({
	session,
	conversationId,
}) => {
    const [messageBody, setMessageBody] = useState('')

    const onSendMessage = async (event: React.FormEvent) => {
        event.preventDefault()

        try {
            // call sendMessage mutation
        } catch (error: any) {
            console.log('on send message error', error)
            toast.error(error?.message)
        }
    }

	return (
		<Box px={4} py={6} width="100%">
			<form onSubmit={() => {}}>
                <Input 
                    value={messageBody}
                    size='md'
                    placeholder="New Message"
                    resize='none'
                    onChange={(event) => setMessageBody(event.target.value)}
                    _focus={{
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'whiteAlpha.300',
                    }}
                />
            </form>
		</Box>
	)
}

export default MessageInput
