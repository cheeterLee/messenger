import { CreateUsernameResponse, GraphQLContext } from "../../util/types"

const resolvers = {
	Query: {
		searchUsers: () => {},
	},
	Mutation: {
		createUsername: async (
			_: any,
			args: { username: string },
			context: GraphQLContext
		): Promise<CreateUsernameResponse> => {
			const { username } = args
			const { session, prisma } = context

			if (!session?.user) {
				return {
					error: "Not authorized",
				}
			}

            const { id: userId } = session.user

            try {
                // Check username is not taken
                const existingUser = await prisma.user.findUnique({
                    where: {
                        username,
                    }
                })

                if (existingUser) {
                    return {
                        error: "username already taken, try another"
                    }
                }

                // Update user
                await prisma.user.update({
                    where: {
                        id: userId
                    },
                    data: {
                        username
                    }
                })

                return { success: true }
            } catch (error: any) {
                console.log('create username error', error)
                return {
                    error: error?.message
                }
            }
		},
	},
}

export default resolvers
