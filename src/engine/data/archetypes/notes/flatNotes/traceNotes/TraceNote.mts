import { options } from '~/engine/configuration/options.mjs'
import {
    canTraceStart,
    disallowEmpty,
    disallowTraceStart,
} from '~/engine/data/archetypes/InputManager.mjs'
import { note } from '~/engine/data/archetypes/constants.mjs'
import { scaledScreen } from '~/engine/data/archetypes/shared.mjs'
import { perspectiveLayout } from '~/engine/data/archetypes/utils.mjs'
import { SlimNote } from '../SlimNote.mjs'

export abstract class TraceNote extends SlimNote {
    leniency = 0.75
    abstract tickSprites: {
        tick: SkinSprite
        fallback: SkinSprite
    }
    tickSpriteLayout = this.entityMemory(Quad)

    setLayout({ l, r }: { l: number; r: number }): void {
        super.setLayout({ l, r })

        const b = 1 + note.h
        const t = 1 - note.h

        if (this.useFallbackTickSprite) {
            const l = this.data.lane - this.data.size
            const r = this.data.lane + this.data.size

            perspectiveLayout({ l, r, b, t }).copyTo(this.tickSpriteLayout)
        } else {
            const w = note.h / scaledScreen.wToH

            new Rect({
                l: this.data.lane - w,
                r: this.data.lane + w,
                b,
                t,
            })
                .toQuad()
                .copyTo(this.tickSpriteLayout)
        }
    }

    get useFallbackTickSprite() {
        return !this.tickSprites.tick.exists
    }
    globalPreprocess() {
        super.globalPreprocess()
        this.life.miss = -40
    }

    touch() {
        if (options.autoplay) return

        for (const touch of touches) {
            if (touch.started && time.now < this.inputTime.min) continue
            if (!touch.started && time.now < this.targetTime) continue
            if (touch.started && !canTraceStart(touch)) continue
            if (!this.hitbox.contains(touch.position)) continue

            this.complete(touch)
            return
        }
    }

    render(): void {
        super.render()

        if (this.useFallbackTickSprite) {
            this.tickSprites.fallback.draw(this.tickSpriteLayout.mul(this.y), this.z + 1, 1)
        } else {
            this.tickSprites.tick.draw(this.tickSpriteLayout.mul(this.y), this.z + 1, 1)
        }
    }

    complete(touch: Touch) {
        disallowEmpty(touch)
        disallowTraceStart(touch)
        // disallowEnd(touch, this.inputTime.max)

        this.result.judgment = Judgment.Perfect
        this.result.accuracy = 0

        this.result.bucket.index = this.bucket.index
        this.result.bucket.value = this.result.accuracy * 1000

        this.playHitEffects(touch.startTime)

        this.despawn = true
    }
}
