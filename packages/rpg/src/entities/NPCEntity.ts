import { RPGEntity } from './RPGEntity'
import type { World, NPCDefinition, Vector3, Component } from '../types'

// Define NPCComponent locally to avoid import issues
interface NPCComponent extends Component {
  type: 'npc'
  npcId: number
  name: string
  behavior: string
  faction: string
  level: number
  combatLevel: number
  maxHitpoints: number
  currentHitpoints: number
  aggressionLevel: number
  aggressionRange: number
  wanderRadius: number
  respawnTime: number
  lastPosition: Vector3
  homePosition: Vector3
  spawnPoint: Vector3
  state: string
  isAlive: boolean
  lastCombatTime: number
  currentTarget: string | null
  aggroList: string[]
  definition: NPCDefinition
}

/**
 * NPC Entity class for all non-player characters
 */
export class NPCEntity extends RPGEntity {
  // NPC-specific properties
  npcType!: string
  spawnerId?: string
  lastInteraction: number = 0
  position: Vector3

  // Properties required by NPCEntity interface
  spawnPoint: Vector3
  currentTarget: string | null = null
  deathTime: number = 0
  aiState: 'idle' | 'wandering' | 'chasing' | 'attacking' | 'fleeing' | 'returning' = 'idle'
  stateTimer: number = 0

  constructor(
    world: World,
    id: string,
    data: {
      position: Vector3
      definition: NPCDefinition
    }
  ) {
    super(world, 'npc', {
      id,
      position: data.position,
      definition: data.definition,
    })

    this.position = { ...data.position }
    this.spawnPoint = { ...data.position }
  }

  /**
   * Get the NPC component
   */
  getNPCComponent(): NPCComponent | null {
    return this.getComponent<NPCComponent>('npc')
  }

  /**
   * Update position
   */
  setPosition(position: Vector3): void {
    this.position = { ...position }

    // Update movement component if exists
    const movement = this.getComponent<any>('movement')
    if (movement) {
      movement.position = { ...position }
    }

    // Update world position
    this.data.position = position
  }

  /**
   * Check if NPC is alive
   */
  isAlive(): boolean {
    const npc = this.getNPCComponent()
    return npc ? npc.currentHitpoints > 0 : false
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): void {
    const npc = this.getNPCComponent()
    if (!npc) {
      return
    }

    npc.currentHitpoints = Math.max(0, npc.currentHitpoints - damage)

    if (npc.currentHitpoints <= 0) {
      this.die()
    }
  }

  /**
   * Handle death
   */
  die(): void {
    const npc = this.getNPCComponent()
    if (!npc) {
      return
    }

    // Update state
    npc.state = 'dead' as any // NPCState.DEAD

    // Emit death event
    this.world.events.emit('entity:death', {
      entityId: this.id,
      entityType: 'npc',
      position: this.position,
    })
  }

  /**
   * Respawn the NPC
   */
  respawn(): void {
    const npc = this.getNPCComponent()
    if (!npc) {
      return
    }

    // Reset health
    npc.currentHitpoints = npc.maxHitpoints
    npc.state = 'idle' as any // NPCState.IDLE

    // Reset position to spawn point
    if (npc.spawnPoint) {
      this.setPosition(npc.spawnPoint)
    }

    // Clear target
    npc.currentTarget = null
  }

  /**
   * Check if player is in interaction range
   */
  isInInteractionRange(playerPosition: Vector3, range: number = 3): boolean {
    const dx = this.position.x - playerPosition.x
    const dy = this.position.y - playerPosition.y
    const dz = this.position.z - playerPosition.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    return distance <= range
  }
}
