import * as dotEnv from "dotenv";
import { RedisClient } from "redis";
import * as cluster from 'cluster';
import * as http from 'http';
import { cpus } from 'os';
import * as process from 'process';
import * as socketIoRedis from "socket.io-redis";
// @ts-ignore
import * as socketSticky from "@socket.io/sticky";
import {IoEvents} from "./io.events";

dotEnv.config();

const pubClient = new RedisClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT as any
});
const subClient = pubClient.duplicate();


const numCPUs = cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    const httpServer = http.createServer();
    socketSticky.setupMaster(httpServer, {
        loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
    });

    httpServer.listen(process.env.PORT);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    console.log(`Worker ${process.pid} started`);

    const httpServer = http.createServer();
    const io = new IoEvents(httpServer,{
        cors: {},
        adapter: socketIoRedis.createAdapter({ pubClient, subClient })
    });

    socketSticky.setupWorker(io);

}
