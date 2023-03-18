import { ParticleEffect } from 'sonolus-core'
import {
    Add,
    And,
    bool,
    EntityMemory,
    Equal,
    Greater,
    GreaterOr,
    If,
    InputAccuracy,
    InputBucket,
    InputBucketValue,
    InputJudgment,
    InputOffset,
    Multiply,
    Not,
    NotEqual,
    Or,
    Script,
    Subtract,
    Time,
    TouchDX,
    TouchDY,
    TouchEnded,
    TouchT,
    TouchVR,
    TouchX,
    TouchY,
} from 'sonolus.js'
import { options } from '../../configuration/options'
import { buckets } from '../buckets'
import { arrowRedSprite, arrowYellowSprite, getArrowLayout } from './common/arrow-sprite'
import { Layer, minFlickVR, windows } from './common/constants'
import { playNoteEffect, playNoteLaneEffect, playSlotEffect } from './common/effect'
import { levelHasHispeed } from './common/hispeed'
import { onMiss } from './common/judge'
import {
    applyMirrorDirections,
    checkNoteTimeInEarlyWindow,
    checkTouchXInNoteHitbox,
    getZ,
    initializeNoteSimLine,
    InputState,
    isNotHidden,
    noteBottom,
    NoteData,
    noteInputState,
    noteScale,
    noteSpawnTime,
    noteTop,
    noteVisibleTime,
    noteZ,
    preprocessNote,
    scheduleNoteAutoSFX,
    shouldSpawn,
    updateNoteY,
} from './common/note'
import {
    calculateNoteLayout,
    getNoteLayout,
    noteRedSprite,
    noteYellowSprite,
} from './common/note-sprite'
import { getFlickClip, playJudgmentSFX } from './common/sfx'
import { checkDirection, checkTouchXInHitbox, checkTouchYInHitbox } from './common/touch'
import { rotateAngle } from './input'

const leniency = 1

export function slideEndFlick(isCritical: boolean): Script {
    const bucket = isCritical ? buckets.criticalSlideEndFlickIndex : buckets.slideEndFlickIndex
    const window = isCritical ? windows.slideEndFlick.critical : windows.slideEndFlick.normal
    const noteSprite = isCritical ? noteYellowSprite : noteRedSprite
    const arrowSprite = isCritical ? arrowYellowSprite : arrowRedSprite
    const circularEffect = isCritical
        ? ParticleEffect.NoteCircularTapYellow
        : ParticleEffect.NoteCircularTapRed
    const linearEffect = isCritical
        ? ParticleEffect.NoteLinearTapYellow
        : ParticleEffect.NoteLinearTapRed
    const alternativeEffect = isCritical
        ? ParticleEffect.NoteLinearAlternativeYellow
        : ParticleEffect.NoteLinearAlternativeRed
    const slotColor = isCritical ? 4 : 1

    const noteLayout = getNoteLayout(EntityMemory.to(0))
    const arrowLayout = getArrowLayout(EntityMemory.to(8))
    const arrowZ = EntityMemory.to<number>(18)

    const preprocess = [
        preprocessNote(bucket, window.good.late, leniency, Layer.NoteBody),
        applyMirrorDirections(NoteData.direction),
        calculateNoteLayout(NoteData.center, NoteData.width, noteLayout),
        arrowSprite.calculateLayout(
            NoteData.center,
            NoteData.width,
            NoteData.direction,
            arrowLayout
        ),
        arrowZ.set(getZ(Layer.NoteArrow)),
    ]

    const spawnOrder = noteSpawnTime

    const initialize = initializeNoteSimLine()

    const touch = Or(
        options.isAutoplay,
        And(
            Not(bool(noteInputState)),
            checkNoteTimeInEarlyWindow(window.good.early),
            GreaterOr(TouchVR, minFlickVR),
            checkTouchYInHitbox(Subtract(TouchY, TouchDY)),
            If(
                checkNoteTimeInEarlyWindow(0),
                checkTouchXInNoteHitbox(Subtract(TouchX, TouchDX)),
                And(
                    checkTouchXInHitbox(
                        NoteData.headSharedMemory.slideHitboxL,
                        NoteData.headSharedMemory.slideHitboxR,
                        Subtract(TouchX, TouchDX)
                    ),
                    Or(
                        TouchEnded,
                        Not(checkTouchYInHitbox()),
                        Not(
                            checkTouchXInHitbox(
                                NoteData.headSharedMemory.slideHitboxL,
                                NoteData.headSharedMemory.slideHitboxR
                            )
                        )
                    )
                )
            ),
            [onComplete(), rotateAngle.set(Add(rotateAngle.get(), Multiply(NoteData.center, -2)))]
        )
    )

    const updateParallel = [
        scheduleNoteAutoSFX(getFlickClip(isCritical)),

        Or(
            And(options.isAutoplay, GreaterOr(Time, NoteData.time)),
            Equal(noteInputState, InputState.Terminated),
            Greater(Subtract(Time, NoteData.time, InputOffset), window.good.late),
            And(
                Or(levelHasHispeed, GreaterOr(Time, noteVisibleTime)),

                isNotHidden(),
                [
                    updateNoteY(),

                    noteSprite.draw(noteScale, noteBottom, noteTop, noteLayout, noteZ),
                    arrowSprite.draw(noteScale, arrowLayout, arrowZ),
                ]
            )
        ),
    ]

    const terminate = And(options.isAutoplay, playVisualEffects())
    const updateSequential = [
        // DebugLog(window.good.late),
        If(
            Or(
                GreaterOr(Subtract(Time, NoteData.time, InputOffset), window.good.late),
                And(options.isAutoplay, GreaterOr(Time, NoteData.time))
            ),
            [
                onMiss,
                And(
                    options.isAutoplay,
                    rotateAngle.set(Add(rotateAngle.get(), Multiply(NoteData.center, -2)))
                ),
            ],
            []
        ),
    ]

    return {
        preprocess,
        spawnOrder,
        shouldSpawn,
        initialize,
        touch,
        updateParallel,
        updateSequential,
        terminate,
    }

    function onComplete() {
        return [
            noteInputState.set(InputState.Terminated),

            InputJudgment.set(window.judge(Subtract(TouchT, InputOffset), NoteData.time)),
            InputAccuracy.set(Subtract(TouchT, InputOffset, NoteData.time)),
            Or(NotEqual(InputJudgment, 1), checkDirection(TouchDX, TouchDY, NoteData.direction), [
                InputJudgment.set(2),
                InputAccuracy.set(window.perfect.late),
            ]),
            InputBucket.set(bucket),
            InputBucketValue.set(Multiply(InputAccuracy, 1000)),

            playVisualEffects(),
            playJudgmentSFX(isCritical, getFlickClip),
        ]
    }

    function playVisualEffects() {
        return [
            playNoteLaneEffect(),
            playNoteEffect(circularEffect, linearEffect, alternativeEffect, 'flick'),
            playSlotEffect(slotColor),
        ]
    }
}
