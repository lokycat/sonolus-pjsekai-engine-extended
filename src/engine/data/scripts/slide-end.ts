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
    Multiply,
    Not,
    Or,
    Script,
    Subtract,
    Time,
    TouchEnded,
    TouchId,
    TouchT,
} from 'sonolus.js'
import { options } from '../../configuration/options'
import { buckets } from '../buckets'
import { Layer, windows } from './common/constants'
import {
    playNoteEffect,
    playNoteLaneEffect,
    playSlotEffect,
} from './common/effect'
import { onMiss, setJudgeVariable } from './common/judge'
import {
    checkNoteTimeInEarlyWindow,
    checkTouchXInNoteHitbox,
    initializeNoteSimLine,
    InputState,
    noteBottom,
    NoteData,
    noteInputState,
    noteScale,
    noteSpawnTime,
    noteTop,
    noteZ,
    preprocessNote,
    updateNoteY,
} from './common/note'
import {
    calculateNoteLayout,
    getNoteLayout,
    noteGreenSprite,
    noteYellowSprite,
} from './common/note-sprite'
import { playTapJudgmentSFX } from './common/sfx'
import { checkTouchYInHitbox } from './common/touch'
import { disallowEnds } from './input'

const leniency = 1

export function slideEnd(isCritical: boolean): Script {
    const bucket = isCritical
        ? buckets.criticalSlideEndIndex
        : buckets.slideEndIndex
    const window = isCritical
        ? windows.slideEnd.critical
        : windows.slideEnd.normal
    const noteSprite = isCritical ? noteYellowSprite : noteGreenSprite

    const noteLayout = getNoteLayout(EntityMemory.to(0))

    const preprocess = [
        preprocessNote(bucket, window.good.late, leniency, Layer.NoteBody),
        calculateNoteLayout(NoteData.center, NoteData.width, noteLayout),
    ]

    const spawnOrder = noteSpawnTime

    const shouldSpawn = GreaterOr(Time, noteSpawnTime)

    const initialize = initializeNoteSimLine()

    const touch = Or(
        options.isAutoplay,
        And(
            Not(bool(noteInputState)),
            checkNoteTimeInEarlyWindow(window.good.early),
            TouchEnded,
            Not(
                And(
                    disallowEnds.contains(TouchId),
                    GreaterOr(disallowEnds.time(TouchId), Subtract(Time, 0.083))
                )
            ),
            checkTouchYInHitbox(),
            checkTouchXInNoteHitbox(),
            onComplete()
        )
    )

    const updateParallel = Or(
        And(options.isAutoplay, GreaterOr(Time, NoteData.time)),
        Equal(noteInputState, InputState.Terminated),
        Greater(Subtract(Time, NoteData.time, InputOffset), window.good.late),
        [
            updateNoteY(),

            noteSprite.draw(noteScale, noteBottom, noteTop, noteLayout, noteZ),
        ]
    )

    const terminate = And(options.isAutoplay, playVisualEffects())

    const updateSequential = [
        // DebugLog(window.good.late),
        If(
            Or(
                GreaterOr(
                    Subtract(Time, NoteData.time, InputOffset),
                    window.good.late
                ),
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
            noteInputState.set(InputState.Terminated),

            InputJudgment.set(
                window.judge(Subtract(TouchT, InputOffset), NoteData.time)
            ),
            InputAccuracy.set(Subtract(TouchT, InputOffset, NoteData.time)),
            InputBucket.set(bucket),
            InputBucketValue.set(Multiply(InputAccuracy, 1000)),

            playVisualEffects(),
            setJudgeVariable(),
            playTapJudgmentSFX(),
        ]
    }

    function playVisualEffects() {
        return [
            playNoteLaneEffect(),
            playNoteEffect(
                isCritical
                    ? ParticleEffect.NoteCircularTapYellow
                    : ParticleEffect.NoteCircularTapGreen,
                isCritical
                    ? ParticleEffect.NoteLinearTapYellow
                    : ParticleEffect.NoteLinearTapGreen,
                0,
                'normal'
            ),
            playSlotEffect(isCritical ? 4 : 2),
        ]
    }
}
