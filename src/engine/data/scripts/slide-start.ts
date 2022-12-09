import { ParticleEffect } from 'sonolus-core'
import {
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
    Less,
    Multiply,
    Not,
    Or,
    Script,
    Subtract,
    Time,
    TouchId,
    TouchST,
    TouchStarted,
} from 'sonolus.js'
import { options } from '../../configuration/options'
import { buckets } from '../buckets'
import { Layer, windows } from './common/constants'
import { playNoteEffect, playNoteLaneEffect, playSlotEffect } from './common/effect'
import { onMiss, setJudgeVariable } from './common/judge'
import {
    checkNoteTimeInEarlyWindow,
    checkTouchXInNoteHitbox,
    initializeNoteSimLine,
    InputState,
    isNotHidden,
    noteBottom,
    NoteData,
    noteInputState,
    noteScale,
    NoteSharedMemory,
    noteSpawnTime,
    noteTop,
    noteVisibleTime,
    noteZ,
    preprocessNote,
    scheduleNoteAutoSFX,
    updateNoteY,
} from './common/note'
import {
    calculateNoteLayout,
    getNoteLayout,
    noteGreenSprite,
    noteYellowSprite,
} from './common/note-sprite'
import { getTapClip, playJudgmentSFX } from './common/sfx'
import { checkTouchYInHitbox } from './common/touch'
import { disallowEmpties, disallowStart } from './input'

const leniency = 1

export function slideStart(isCritical: boolean): Script {
    const bucket = isCritical ? buckets.criticalSlideStartIndex : buckets.slideStartIndex
    const window = isCritical ? windows.slideStart.critical : windows.slideStart.normal
    const noteSprite = isCritical ? noteYellowSprite : noteGreenSprite
    const circularEffect = isCritical
        ? ParticleEffect.NoteCircularTapYellow
        : ParticleEffect.NoteCircularTapGreen
    const linearEffect = isCritical
        ? ParticleEffect.NoteLinearTapYellow
        : ParticleEffect.NoteLinearTapGreen
    const slotColor = isCritical ? 4 : 2

    const noteLayout = getNoteLayout(EntityMemory.to(0))

    const preprocess = [
        preprocessNote(bucket, window.good.late, leniency, Layer.NoteBody),
        calculateNoteLayout(NoteData.center, NoteData.width, noteLayout),

        NoteSharedMemory.slideTime.set(-1000),
        NoteSharedMemory.startTime.set(noteSpawnTime),
    ]

    const spawnOrder = noteSpawnTime

    const shouldSpawn = GreaterOr(Time, noteSpawnTime)

    const initialize = initializeNoteSimLine()

    const touch = Or(
        options.isAutoplay,
        And(
            Not(bool(noteInputState)),
            checkNoteTimeInEarlyWindow(window.good.early),
            TouchStarted,
            Not(disallowStart),
            checkTouchYInHitbox(),
            checkTouchXInNoteHitbox(),
            onComplete()
        )
    )

    const updateParallel = [
        scheduleNoteAutoSFX(getTapClip(isCritical)),

        Or(
            And(options.isAutoplay, GreaterOr(Time, NoteData.time)),
            Equal(noteInputState, InputState.Terminated),
            Greater(Subtract(Time, NoteData.time, InputOffset), window.good.late),
            And(Less(Time, NoteData.time), GreaterOr(Time, noteVisibleTime), isNotHidden(), [
                updateNoteY(),

                noteSprite.draw(noteScale, noteBottom, noteTop, noteLayout, noteZ),
            ])
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
            [onMiss],
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
            disallowStart.set(true),
            disallowEmpties.add(TouchId),
            noteInputState.set(InputState.Terminated),

            InputJudgment.set(window.judge(Subtract(TouchST, InputOffset), NoteData.time)),
            InputAccuracy.set(Subtract(TouchST, InputOffset, NoteData.time)),
            InputBucket.set(bucket),
            InputBucketValue.set(Multiply(InputAccuracy, 1000)),

            playVisualEffects(),
            setJudgeVariable(),
            playJudgmentSFX(false, getTapClip),
        ]
    }

    function playVisualEffects() {
        return [
            playNoteLaneEffect(),
            playNoteEffect(circularEffect, linearEffect, 0, 'normal'),
            playSlotEffect(slotColor),
        ]
    }
}
