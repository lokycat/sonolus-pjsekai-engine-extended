import { options } from '../../../../../configuration/options.mjs'
import { minSFXDistance, note } from '../../../constants.mjs'
import { layer } from '../../../layer.mjs'
import { scaledScreen } from '../../../shared.mjs'
import {
    getScheduleSFXTime,
    getZ,
    perspectiveLayout,
    scaledTimeToEarliestTime,
    timeToScaledTime,
} from '../../../utils.mjs'
import { Note } from '../../Note.mjs'
import { SlideTickNote } from '../SlideTickNote.mjs'

export abstract class VisibleSlideTickNote extends SlideTickNote {
    abstract sprites: {
        tick: SkinSprite
        fallback: SkinSprite
    }

    abstract clips: {
        tick: EffectClip
        fallback: EffectClip
    }

    abstract effect: ParticleEffect

    scheduleSFXTime = this.entityMemory(Number)

    visualTime = this.entityMemory({
        min: Number,
        max: Number,
        hidden: Number,
    })

    hasSFXScheduled = this.entityMemory(Boolean)

    spriteLayout = this.entityMemory(Quad)
    z = this.entityMemory(Number)

    y = this.entityMemory(Number)

    globalPreprocess() {
        this.life.miss = -40
    }

    preprocess() {
        super.preprocess()

        this.scheduleSFXTime = getScheduleSFXTime(this.targetTime)

        this.visualTime.max = timeToScaledTime(this.targetTime, this.data.timeScaleGroup)
        this.visualTime.min = this.visualTime.max - Note.duration

        this.spawnTime = scaledTimeToEarliestTime(
            Math.min(
                this.visualTime.min,
                timeToScaledTime(this.scheduleSFXTime, this.data.timeScaleGroup)
            ),
            this.data.timeScaleGroup
        )
    }

    initialize() {
        super.initialize()

        if (options.hidden > 0)
            this.visualTime.hidden = this.visualTime.max - Note.duration * options.hidden

        const b = 1 + note.h
        const t = 1 - note.h

        if (this.useFallbackSprite) {
            const l = this.data.lane - this.data.size
            const r = this.data.lane + this.data.size

            perspectiveLayout({ l, r, b, t }).copyTo(this.spriteLayout)
        } else {
            const w = note.h / scaledScreen.wToH

            new Rect({
                l: this.data.lane - w,
                r: this.data.lane + w,
                b,
                t,
            })
                .toQuad()
                .copyTo(this.spriteLayout)
        }

        this.z = getZ(layer.note.tick, this.targetTime, this.data.lane)
    }

    updateParallel() {
        super.updateParallel()
        if (this.despawn) return

        if (this.shouldScheduleSFX && !this.hasSFXScheduled && time.now >= this.scheduleSFXTime)
            this.scheduleSFX()

        const scaledTime = timeToScaledTime(time.now, this.data.timeScaleGroup)
        if (scaledTime < this.visualTime.min) return
        if (options.hidden > 0 && scaledTime > this.visualTime.hidden) return

        this.render()
    }

    terminate() {
        if (options.noteEffectEnabled) this.playNoteEffect()
    }

    get shouldScheduleSFX() {
        return options.sfxEnabled && options.autoSFX
    }

    get shouldPlaySFX() {
        return options.sfxEnabled && !options.autoSFX
    }

    get useFallbackSprite() {
        return !this.sprites.tick.exists
    }

    get useFallbackClip() {
        return !this.clips.tick.exists
    }

    scheduleSFX() {
        if (this.useFallbackClip) {
            this.clips.fallback.schedule(this.targetTime, minSFXDistance)
        } else {
            this.clips.tick.schedule(this.targetTime, minSFXDistance)
        }

        this.hasSFXScheduled = true
    }

    render() {
        if (!options.showNotes) return
        this.y = Note.approach(
            this.visualTime.min,
            this.visualTime.max,
            timeToScaledTime(time.now, this.data.timeScaleGroup)
        )

        if (this.useFallbackSprite) {
            this.sprites.fallback.draw(this.spriteLayout.mul(this.y), this.z, 1)
        } else {
            this.sprites.tick.draw(this.spriteLayout.mul(this.y), this.z, 1)
        }
    }

    playHitEffects() {
        if (this.shouldPlaySFX) this.playSFX()
        if (options.noteEffectEnabled) this.playNoteEffect()
    }

    playSFX() {
        if (this.useFallbackClip) {
            this.clips.fallback.play(minSFXDistance)
        } else {
            this.clips.tick.play(minSFXDistance)
        }
    }

    playNoteEffect() {
        const w = 4
        const h = w * scaledScreen.wToH

        this.effect.spawn(
            new Rect({
                l: this.data.lane - w,
                r: this.data.lane + w,
                b: 1 + h,
                t: 1 - h,
            }),
            0.6,
            false
        )
    }
}
