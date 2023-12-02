import { effect } from '../../../effect.mjs'
import { particle } from '../../../particle.mjs'
import { skin } from '../../../skin.mjs'
import { archetypes } from '../../index.mjs'
import { ActiveSlideConnector } from './ActiveSlideConnector.mjs'

export class CriticalActiveSlideConnector extends ActiveSlideConnector {
    sprites = {
        normal: skin.sprites.criticalActiveSlideConnectorNormal,
        active: skin.sprites.criticalActiveSlideConnectorActive,
        fallback: skin.sprites.criticalActiveSlideConnectorFallback,
        slide: {
            left: skin.sprites.criticalNoteLeft,
            middle: skin.sprites.criticalNoteMiddle,
            right: skin.sprites.criticalNoteRight,
            fallback: skin.sprites.criticalNoteFallback,
        },

        traceSlide: {
            left: skin.sprites.criticalTraceNoteLeft,
            middle: skin.sprites.criticalTraceNoteMiddle,
            right: skin.sprites.criticalTraceNoteRight,
            fallback: skin.sprites.criticalTraceNoteFallback,
        },
        traceSlideTick: {
            tick: skin.sprites.criticalSlideTickNote,
            fallback: skin.sprites.criticalSlideTickNoteFallback,
        },
    }

    clips = {
        hold: effect.clips.criticalHold,
        fallback: effect.clips.normalHold,
    }

    effects = {
        circular: particle.effects.criticalSlideConnectorCircular,
        linear: particle.effects.criticalSlideConnectorLinear,
    }

    get slideStartNote() {
        return archetypes.CriticalSlideStartNote
    }
}
