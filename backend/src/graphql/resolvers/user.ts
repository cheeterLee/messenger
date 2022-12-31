import { CreateUsernameResponse, GraphQLContext } from "../../util/types"
import { ApolloError } from 'apollo-server-core'
import { User } from "@prisma/client"

const resolvers = {
	Query: {
		searchUsers: async (
            _: any,
			args: { username: string },
			context: GraphQLContext
        ): Promise<Array<User>> => {
            const { username: searchedUsername } = args
            const { session, prisma } = context

            if (!session?.user) {
                throw new ApolloError('Not authorized')
            }

            const { user: { username: myUsername } } = session

            try {
                const users = await prisma.user.findMany({
                    where: {
                        username: {
                            contains: searchedUsername,
                            not: myUsername,
                            mode: 'insensitive'
                        }
                    }
                })

                return users

            } catch (error: any) {
                console.log('searchUsers error', error)
                throw new ApolloError(error?.message)
            }
        },
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
