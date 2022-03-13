import * as http from 'http';
import {Server, ServerOptions} from "socket.io";
import {User} from "./user";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";

export class IoEvents extends Server {

    constructor(srv: undefined | Partial<ServerOptions> | http.Server | number, opts?: Partial<ServerOptions>){
        super(...arguments);
        this.initialize();
    }

    private initialize(): void {

        const publicKey = fs.readFileSync(process.env.SSL_PUBLIC_CRT_PATH, {encoding:'utf8', flag:'r'});

        this.on('connection', (socket) => {
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

                    socket.on('typing', (data: {to: User, typing: number}) => {
                        if (data?.to?.username) {
                            this.to(data.to.username).emit('typing', {
                                from: user,
                                typing: data.typing ? 1 :0
                            });
                        }
                    });

                    socket.on('offer', (data: {to: User, offer: any}) => {
                        if (data?.to?.username) {
                            this.to(data.to.username).emit('offer', {
                                from: user,
                                offer: data.offer
                            });
                        }
                    });

                    socket.on('answer', (data: {to: User, answer: any}) => {
                        if (data?.to?.username) {
                            this.to(data.to.username).emit('answer', {
                                from: user,
                                answer: data.answer
                            });
                        }
                    });

                    socket.on('candidate', (data: {to: User, candidate: string}) => {
                        if (data?.to?.username) {
                            this.to(data.to.username).emit('candidate', {
                                from: user,
                                candidate: data.candidate
                            });
                        }
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
    }
}
