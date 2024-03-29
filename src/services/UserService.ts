import { Errors } from "apns2";
import { Db } from "../Db";
import { User } from "../models/User";

class UserService {
    db: Db<User[]>

    constructor() {
        this.db = new Db<User[]>('users', [])
        this.addUser = this.addUser.bind(this)
        this.read = this.read.bind(this)
        this.readCached = this.readCached.bind(this)
    }

    addUser(user: User): Promise<User[]> {
        return this.db.read().then(us => {
            const updated = (us || []).filter(e => e.id != user.id)
            if (user.teams.length > 0 && user.apn_token != undefined) {
                // if apn_token is null or teams is empty we dont want to push notifications to that user
                // we can remove it from the db until both has been set
                updated.push(user)
            }
            return this.db.write(updated)
        })
    }

    read(user_id: string): Promise<User | undefined> {
        return this.db.read().then(us => us.find(e => e.id == user_id))
    }

    readCached(user_id: string): User | undefined {
        return this.db.readCached().find(e => e.id == user_id)
    }
}

export {
    UserService,
}