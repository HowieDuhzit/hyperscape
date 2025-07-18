import { AccessToken, TrackSource } from 'livekit-server-sdk'

import { System } from './System'
import { uuid } from '../utils'

export class ServerLiveKit extends System {
  private roomId: string
  private wsUrl: string | undefined
  private apiKey: string | undefined
  private apiSecret: string | undefined
  private enabled: boolean
  
  constructor(world: any) {
    super(world)
    this.roomId = uuid()
    this.wsUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_WS_URL
    this.apiKey = process.env.LIVEKIT_API_KEY
    this.apiSecret = process.env.LIVEKIT_API_SECRET
    this.enabled = !!(this.wsUrl && this.apiKey && this.apiSecret)
  }

  async getPlayerOpts(playerId: string) {
    if (!this.enabled || !this.apiKey || !this.apiSecret || !this.wsUrl) return null
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: playerId,
    })
    const videoGrant = {
      room: this.roomId,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      canPublishSources: [TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO],
      canUpdateOwnMetadata: true,
    }
    at.addGrant(videoGrant)
    const token = await at.toJwt()
    return {
      wsUrl: this.wsUrl,
      token,
    }
  }
}
