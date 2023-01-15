import { defineArchetypes } from 'sonolus.js'
import { scripts } from './scripts'

export const archetypes = defineArchetypes({
    initialization: scripts.initializationIndex,
    stage: scripts.stageIndex,
    input: scripts.inputIndex,

    tapNote: {
        script: scripts.tapNoteIndex,
        input: true,
    },
    flickNote: {
        script: scripts.flickNoteIndex,
        input: true,
    },
    slideStart: {
        script: scripts.slideStartIndex,
        input: true,
    },
    slideTick: {
        script: scripts.slideTickIndex,
        input: true,
    },
    slideEnd: {
        script: scripts.slideEndIndex,
        input: true,
    },
    slideEndFlick: {
        script: scripts.slideEndFlickIndex,
        input: true,
    },
    slideConnector: scripts.slideConnectorIndex,

    criticalTapNote: {
        script: scripts.criticalTapNoteIndex,
        input: true,
    },
    criticalFlickNote: {
        script: scripts.criticalFlickNoteIndex,
        input: true,
    },
    criticalSlideStart: {
        script: scripts.criticalSlideStartIndex,
        input: true,
    },
    criticalSlideTick: {
        script: scripts.criticalSlideTickIndex,
        input: true,
    },
    criticalSlideEnd: {
        script: scripts.criticalSlideEndIndex,
        input: true,
    },
    criticalSlideEndFlick: {
        script: scripts.criticalSlideEndFlickIndex,
        input: true,
    },
    criticalSlideConnector: scripts.criticalSlideConnectorIndex,

    slideHiddenTick: {
        script: scripts.slideHiddenTickIndex,
        input: true,
    },

    traceNote: {
        script: scripts.traceNoteIndex,
        input: true,
    },
    traceFlick: {
        script: scripts.traceFlickIndex,
        input: true,
    },
    criticalTraceNote: {
        script: scripts.criticalTraceNoteIndex,
        input: true,
    },
    criticalTraceFlick: {
        script: scripts.criticalTraceFlickIndex,
        input: true,
    },

    traceNdFlick: {
        script: scripts.traceNdFlickIndex,
        input: true,
    },

    judgeRenderer: {
        script: scripts.judgeRendererIndex,
    },
    longSfx: {
        script: scripts.longSfxIndex,
    },

    damageNote: {
        script: scripts.damageNoteIndex,
        input: true,
    },
})
