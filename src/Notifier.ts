import { Config } from './models/Config'
import { GameEvent } from './models/GameEvent'
import { User } from './models/User'
var apn = require('apn')


interface ApnResponse {
    failed: [],
}

class Notifier {
    topic: string
    apnConnection: ({ send: (note: Object, token: string) => Promise<ApnResponse> })

    constructor(config: Config) {
        var options = {
            token: {
                key: config.apn_key_path,
                keyId: config.apn_key_id,
                teamId: config.apn_team_id,
            },
            production: config.production,
        }
        this.topic = config.apn_topic
        this.apnConnection = new apn.Provider(options)
    }
    /**
     * For each event, get a list of users to send notification to.
     */
    notify(events: GameEvent[], users: User[]) {
        events.forEach(e => {
            users
                .filter(u => this.userHasSubscribed(u, e.game.home_team_code, e.game.away_team_code))
                .forEach(u => this.sendNotification(u, e))
        })
    }


    sendNotification(user: User, event: GameEvent) {
        const ht = event.game.home_team_code
        const hg = event.game.home_team_result
        const at = event.game.away_team_code
        const ag = event.game.away_team_result
        /**
         * FBK 0 - 5 LHF
         * Mål!
         */
        const msg = `${ht} ${hg} - ${ag} ${at}\n${event.getDescription()}`
        this.sendNotificationMsg(user, msg)
    }

    userHasSubscribed(user: User, team1: string, team2: string) {
        return user.teams.includes(team1) || user.teams.includes(team2)
    }

    sendNotificationMsg(user: User, msg: string) {
        if (user.apn_token == undefined) {
            return
        }

        var note = new apn.Notification()

        note.expiry = Math.floor(Date.now() / 1000) + 3600
        note.sound = "ping.aiff"
        note.alert = msg
        note.payload = {}
        note.topic = this.topic
 
        return this.apnConnection.send(note, user.apn_token).then((result: ApnResponse) => {
            if (result.failed.length > 0) {
                console.error('[NOTIFIER] Failed to push notification ', JSON.stringify(result.failed))
            } else {
                console.log(`[NOTIFIER] Sent ${msg} to ${user.id}`)
            }
            return Promise.resolve()
        })   
    }
}


export {
    Notifier,
}