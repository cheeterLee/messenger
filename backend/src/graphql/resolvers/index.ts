import merge from "lodash.merge"
import userResolvers from "./user"
import conversationResolvers from "./conversation"
import messageResolvers from "./message"
// import scalarResolvers from "./scalars";

const resolvers = merge(
	{},
	userResolvers,
	conversationResolvers,
	messageResolvers
)

export default resolvers
