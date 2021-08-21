import * as dotEnv from "dotenv";
import { RedisClient } from "redis";
import * as socketIoRedis from "socket.io-redis";
import {IoEvents} from "./io.events";

dotEnv.config();

const pubClient = new RedisClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT as any
});
const subClient = pubClient.duplicate();


new IoEvents(process.env.PORT as any,{
    cors: {},
    adapter: socketIoRedis.createAdapter({ pubClient, subClient })
});
