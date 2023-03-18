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
    TouchId,
    TouchStarted,
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
import { onMiss, setJudgeVariable } from './common/judge'
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
import { checkDirection, checkTouchYInHitbox } from './common/touch'
import { disallowEmpties, disallowEnds, disallowStart, rotateAngle } from './input'

const leniency = 1

export function flickNote(isCritical: boolean): Script {
    const bucket = isCritical ? buckets.criticalFlickNoteIndex : buckets.flickNoteIndex
    const window = isCritical ? windows.flickNote.critical : windows.flickNote.normal
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

    const touch = Or(options.isAutoplay, [
        And(
            Not(bool(noteInputState)),
            checkNoteTimeInEarlyWindow(window.good.early),
            TouchStarted,
            Not(disallowStart),
            checkTouchYInHitbox(),
            checkTouchXInNoteHitbox(),
            onActivate()
        ),
        And(
            Equal(noteInputState, InputState.Activated),
            GreaterOr(TouchVR, minFlickVR),
            checkTouchYInHitbox(Subtract(TouchY, TouchDY)),
            checkTouchXInNoteHitbox(Subtract(TouchX, TouchDX)),
            [onComplete(), rotateAngle.set(Add(rotateAngle.get(), Multiply(NoteData.center, -2)))]
        ),
    ])

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

    function onActivate() {
        return [
            disallowStart.set(true),
            disallowEmpties.add(TouchId),
            disallowEnds.add(TouchId, Add(NoteData.time, window.good.late)),
            noteInputState.set(InputState.Activated),
        ]
    }

    function onComplete() {
        return [
            noteInputState.set(InputState.Terminated),

            InputJudgment.set(window.judge(Subtract(Time, InputOffset), NoteData.time)),
            InputAccuracy.set(Subtract(Time, InputOffset, NoteData.time)),
            Or(NotEqual(InputJudgment, 1), checkDirection(TouchDX, TouchDY, NoteData.direction), [
                InputJudgment.set(2),
                InputAccuracy.set(window.perfect.late),
            ]),
            InputBucket.set(bucket),
            InputBucketValue.set(Multiply(InputAccuracy, 1000)),

            playVisualEffects(),
            setJudgeVariable(),
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
