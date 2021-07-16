import * as dotEnv from "dotenv";
import { RedisClient } from "redis";
import * as socketIo from "socket.io";
import * as socketIoRedis from "socket.io-redis";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import {User} from "./user";

dotEnv.config();

const publicKey = fs.readFileSync('../rsa/public.crt', {encoding:'utf8', flag:'r'});

const pubClient = new RedisClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT as any
});
const subClient = pubClient.duplicate();

const io = new socketIo.Server(process.env.PORT as any,{
    cors: {},
    adapter: socketIoRedis.createAdapter({ pubClient, subClient })
});
var i = 0;
//bug sürekli  login oluyor bakılacak
io.on('connection', (socket) => {
    // socket re login after 30 minutes
    const timeoutId = setTimeout(() => {
        socket.disconnect();
        console.log("**********Run setTimeout**********");
    }, 30 * 60 * 1000);

    socket.on('login', (data: any) => {
        try {
            // @ts-ignore
            const payload: {user: User, exp: number} = jwt.verify(data.token, publicKey, { algorithms: ['RS256'] });
            const user = payload.user;
            socket.join(user.username);

            console.log("==========" +(i++)+"===========")
            console.log(user);

            socket.on('typing', (data: {to: User, typing: number}) => {
                if (data?.to?.username) {
                    io.to(data.to.username).emit('typing', {
                        from: user,
                        typing: data.typing ? 1 :0
                    });
                }

                console.log("typing",data);
            });

        } catch(err) {
            // err
            console.log(err);
            socket.disconnect();
        }
    });

    socket.on('disconnect', (reason: any) => {
        clearTimeout(timeoutId);
        console.log("----run disconnect------");
        console.log(reason);
    });
});
