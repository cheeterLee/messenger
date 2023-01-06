"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@apollo/server");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const express4_1 = require("@apollo/server/express4");
const schema_1 = require("@graphql-tools/schema");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const typeDefs_1 = __importDefault(require("./graphql/typeDefs"));
const resolvers_1 = __importDefault(require("./graphql/resolvers"));
const dotenv = __importStar(require("dotenv"));
const react_1 = require("next-auth/react");
const client_1 = require("@prisma/client");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const ws_1 = require("graphql-ws/lib/use/ws");
const ws_2 = require("ws");
const cors_1 = __importDefault(require("cors"));
// import json from "body-parser"
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        dotenv.config();
        const app = (0, express_1.default)();
        const httpServer = http_1.default.createServer(app);
        // Create our WebSocket server using the HTTP server we just set up.
        const wsServer = new ws_2.WebSocketServer({
            server: httpServer,
            path: "/graphql/subscriptions",
        });
        const schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: typeDefs_1.default,
            resolvers: resolvers_1.default,
        });
        // context parameters
        const prisma = new client_1.PrismaClient();
        const pubsub = new graphql_subscriptions_1.PubSub();
        const serverCleanup = (0, ws_1.useServer)({
            schema,
            context: (ctx) => __awaiter(this, void 0, void 0, function* () {
                if (ctx.connectionParams && ctx.connectionParams.session) {
                    const { session } = ctx.connectionParams;
                    return { session, prisma, pubsub };
                }
                return { session: null, prisma, pubsub };
            }),
        }, wsServer);
        const server = new server_1.ApolloServer({
            schema,
            csrfPrevention: true,
            plugins: [
                // Proper shutdown for the HTTP server.
                (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
                // Proper shutdown for the WebSocket server.
                {
                    serverWillStart() {
                        return __awaiter(this, void 0, void 0, function* () {
                            return {
                                drainServer() {
                                    return __awaiter(this, void 0, void 0, function* () {
                                        yield serverCleanup.dispose();
                                    });
                                },
                            };
                        });
                    },
                },
            ],
        });
        yield server.start();
        const corsOptions = {
            origin: process.env.CLIENT_ORIGIN,
            // origin: true,
            credentials: true,
        };
        app.use(express_1.default.urlencoded({ extended: true }));
        app.use("/graphql", (0, cors_1.default)(corsOptions), express_1.default.json(), (0, express4_1.expressMiddleware)(server, {
            context: ({ req }) => __awaiter(this, void 0, void 0, function* () {
                const session = yield (0, react_1.getSession)({ req });
                return { session: session, prisma, pubsub };
            })
        }));
        yield new Promise((resolve) => httpServer.listen({ port: process.env.PORT || 4000 }, resolve));
        console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/graphql`);
    });
}
main().catch((err) => console.log(err));
