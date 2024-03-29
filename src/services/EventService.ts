import { Db } from "../Db";
import { GameEvent } from "../models/GameEvent";

class EventService {

    db: Db<Record<string, GameEvent[]>>

    constructor() {
        this.db = new Db('events', {})
        this.store = this.store.bind(this)
        this.getEvents = this.getEvents.bind(this)
        this.getCachedEvents = this.getCachedEvents.bind(this)
        this.isDuplicateEvent = this.isDuplicateEvent.bind(this)
    }
 
    store(game_uuid: string, event: GameEvent): Promise<Record<string, GameEvent[]>> {
        return this.db.read().then(events => {
            const gameEvents = events[game_uuid] ?? []
            gameEvents.push(event)
            events[game_uuid] = gameEvents
            return this.db.write(events)
        })
    }

    getEvents(game_uuid: string): Promise<GameEvent[]> {
        return this.db.read().then(events => events[game_uuid] ?? [])
    }

    isDuplicateEvent(event: GameEvent): boolean {
        const previousEvents = this.getCachedEvents(event.info.game_uuid)
        const duplicateEvent = previousEvents.find(e => e.id == event.id)
        return duplicateEvent != undefined
    }

    getCachedEvents(game_uuid: string): GameEvent[] {
        return this.db.readCached()[game_uuid] ?? []
    }
}

export {
    EventService,
}