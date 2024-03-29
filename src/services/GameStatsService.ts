import { Db } from "../Db";
import { Game } from "../models/Game";
import { GameStats, GameStatsIf } from "../models/GameStats";
import { SHL } from "../ShlClient";

class GameStatsService {
    client: SHL
    db: Db<Record<string, GameStatsIf>>

    constructor(client: SHL) {
        this.client = client
        this.db = new Db<Record<string, GameStatsIf>>('game_stats', {})

        this.updateGame = this.updateGame.bind(this)
        this.getFromCache = this.getFromCache.bind(this)
    }

    getFromCache(game_uuid: string): GameStats | undefined {
        const cached = this.db.readCached()[game_uuid]
        if (!cached) {
            return undefined
        }
        return new GameStats(cached)
    }

    updateGame(game_uuid: string, game_id: number): Promise<GameStats | undefined> {
        return this.client.getGameStats(game_uuid, game_id).then(stats => {
            if (!stats || stats.recaps?.gameRecap == undefined || stats.recaps?.[0] == undefined) {
                // incomplete stats, do not store, return existing
                console.log(`[GAME_STATS_SERVICE] incomplete stats received ${game_uuid}`)
                return Promise.resolve(this.getFromCache(game_uuid))
            }
            return this.db.read().then(old => {
                const toWrite = old || {}
                toWrite[game_uuid] = stats

                return this.db.write(toWrite).then(e => stats)
            })
        }).catch(e => {
            console.error('[SERVICE] GameStats Error:', e)
            return Promise.resolve(this.getFromCache(game_uuid))
        })
    }
}

export {
    GameStatsService
}