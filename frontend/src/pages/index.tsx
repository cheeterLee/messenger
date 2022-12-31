import type { NextPage, NextPageContext } from "next"
import { getSession, signIn, signOut, useSession } from "next-auth/react"
import { Box } from "@chakra-ui/react"
import Chat from "../components/Chat/Chat"
import Auth from "../components/Auth/Auth"

const Home: NextPage = () => {
	const { data: session } = useSession()
	console.log("🚀 ~ file: index.tsx:6 ~ data", session)

	const reloadSession = () => {
		const event = new Event("visibilitychange")
		document.dispatchEvent(event)
	}

	return (
		<Box>
      {session?.user.username}
			{session && session?.user?.username ? (
				<Chat />
			) : (
				<Auth session={session} reloadSession={reloadSession} />
			)}
		</Box>
	)
}

export async function getServerSideProps(context: NextPageContext) {
	const session = await getSession(context)

	return {
		props: {
			session,
		},
	}
}

export default Home
