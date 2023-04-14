import { effect } from '../../../../../effect.js'
import { particle } from '../../../../../particle.js'
import { skin } from '../../../../../skin.js'
import { AttachedSlideTickNote } from './AttachedSlideTickNote.js'

export class NormalAttachedSlideTickNote extends AttachedSlideTickNote {
    sprites = {
        tick: skin.sprites.normalSlideTickNote,
        fallback: skin.sprites.normalSlideTickNoteFallback,
    }

    clip = effect.clips.normalTick

    effect = particle.effects.normalSlideTickNote
}
