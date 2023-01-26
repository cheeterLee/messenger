import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { expressMiddleware } from '@apollo/server/express4'

import { makeExecutableSchema } from "@graphql-tools/schema"
import express from "express"
import http from "http"
import typeDefs from "./graphql/typeDefs"
import resolvers from "./graphql/resolvers"
import * as dotenv from "dotenv"
import { getSession } from "next-auth/react"
import { GraphQLContext, Session, SubscriptionContext } from "./util/types"
import { PrismaClient } from "@prisma/client"
import { PubSub } from 'graphql-subscriptions'
import { useServer } from "graphql-ws/lib/use/ws"
import { WebSocketServer } from "ws"
import cors from 'cors'
// import json from "body-parser"

async function main() {
	dotenv.config()
	const app = express()
	const httpServer = http.createServer(app)

	// Create our WebSocket server using the HTTP server just set up.
	const wsServer = new WebSocketServer({
		server: httpServer,
		path: "/graphql/subscriptions",
	})

	const schema = makeExecutableSchema({
		typeDefs,
		resolvers,
	})
	// context parameters
	const prisma = new PrismaClient()
	const pubsub = new PubSub()

	const serverCleanup = useServer(
		{
			schema,
			context: async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
				if (ctx.connectionParams && ctx.connectionParams.session) {
					const { session } = ctx.connectionParams
					return { session, prisma, pubsub }
				}

				return { session: null, prisma, pubsub }
			},
		},
		wsServer
	)

	


	const server = new ApolloServer({
		schema,
		csrfPrevention: true,
		plugins: [
			// Proper shutdown for the HTTP server.
			ApolloServerPluginDrainHttpServer({ httpServer }),

			// Proper shutdown for the WebSocket server.
			{
				async serverWillStart() {
					return {
						async drainServer() {
							await serverCleanup.dispose()
						},
					}
				},
			},
		],
	})

	await server.start()

	const corsOptions = {
		origin: process.env.CLIENT_ORIGIN,
		// origin: true,
		credentials: true,
	}
	
	app.use(express.urlencoded({extended: true}))

	app.use(
		"/graphql",
		cors<cors.CorsRequest>(corsOptions),
		express.json(),
		expressMiddleware(server, {
			context: async ({ req }): Promise<GraphQLContext> => {
				const session = await getSession({ req })
				return { session: session as Session, prisma, pubsub }
			}
		})
	)

	await new Promise<void>((resolve) =>
		httpServer.listen({ port: process.env.PORT || 4000 }, resolve)
	)

	console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/graphql`)
}

main().catch((err) => console.log(err))
