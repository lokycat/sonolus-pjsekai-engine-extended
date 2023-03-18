import {
    Add,
    And,
    ArchetypeLife,
    ConsecutiveGreatScore,
    createEntityData,
    GoodMultiplier,
    GreatMultiplier,
    HasSkinSprite,
    HorizontalAlign,
    If,
    Multiply,
    Or,
    PerfectMultiplier,
    Pointer,
    Script,
    Subtract,
    UIComboConfiguration,
    UIComboText,
    UIComboValue,
    UIJudgment,
    UIJudgmentConfiguration,
    UIMenu,
    UIMenuConfiguration,
    UIPrimaryMetricBar,
    UIPrimaryMetricConfiguration,
    UIPrimaryMetricValue,
    UISecondaryMetricBar,
    UISecondaryMetricConfiguration,
    UISecondaryMetricValue,
} from 'sonolus.js'
import { options } from '../../configuration/options'
import { archetypes } from '../archetypes'
import { buckets } from '../buckets'
import { JudgmentMissSprite, screen, stage, windows } from './common/constants'
import { firstHispeedIndex, levelHasHispeed } from './common/hispeed'

export class InitDataPointer extends Pointer {
    public get hasHispeed() {
        return this.to<boolean>(0)
    }

    public get firstHispeedIndex() {
        return this.to<number>(1)
    }
}

const InitData = createEntityData(InitDataPointer)

export function initialization(): Script {
    const preprocess = [setupUI(), setupBuckets(), setupScore(), setupLife(), setupHispeed()]

    const spawnOrder = -1000

    const updateSequential = true

    return {
        preprocess,
        spawnOrder,
        updateSequential,
    }

    function setupHispeed() {
        return [
            levelHasHispeed.set(InitData.hasHispeed),
            firstHispeedIndex.set(InitData.firstHispeedIndex),
        ]
    }

    function setupUI() {
        return [
            If(
                Or(options.isCustomPauseButtonEnabled, options.hideUI),
                UIMenu.set(
                    Subtract(screen.r, 0.05),
                    0.95,
                    1,
                    1,
                    0.25,
                    0.25,
                    0,
                    0,
                    HorizontalAlign.Center,
                    true
                ),
                UIMenu.set(
                    Subtract(screen.r, 0.05),
                    0.95,
                    1,
                    1,
                    Multiply(0.15, UIMenuConfiguration.scale),
                    Multiply(0.15, UIMenuConfiguration.scale),
                    0,
                    UIMenuConfiguration.alpha,
                    HorizontalAlign.Center,
                    true
                )
            ),

            UIPrimaryMetricBar.set(
                Add(screen.l, 0.05),
                0.95,
                0,
                1,
                Multiply(0.75, UIPrimaryMetricConfiguration.scale),
                Multiply(0.15, UIPrimaryMetricConfiguration.scale),
                0,
                If(options.hideUI, 0, UIPrimaryMetricConfiguration.alpha),
                HorizontalAlign.Left,
                true
            ),
            UIPrimaryMetricValue.set(
                Add(screen.l, 0.05, Multiply(0.715, UIPrimaryMetricConfiguration.scale)),
                Subtract(0.95, Multiply(0.035, UIPrimaryMetricConfiguration.scale)),
                1,
                1,
                0,
                Multiply(0.08, UIPrimaryMetricConfiguration.scale),
                0,
                If(options.hideUI, 0, UIPrimaryMetricConfiguration.alpha),
                HorizontalAlign.Right,
                false
            ),

            UISecondaryMetricBar.set(
                Subtract(screen.r, 0.1, Multiply(0.15, UIMenuConfiguration.scale)),
                0.95,
                1,
                1,
                Multiply(0.55, UISecondaryMetricConfiguration.scale),
                Multiply(0.15, UISecondaryMetricConfiguration.scale),
                0,
                If(options.hideUI, 0, UISecondaryMetricConfiguration.alpha),
                HorizontalAlign.Left,
                true
            ),
            UISecondaryMetricValue.set(
                Subtract(
                    screen.r,
                    0.1,
                    Multiply(0.15, UIMenuConfiguration.scale),
                    Multiply(0.035, UISecondaryMetricConfiguration.scale)
                ),
                Subtract(0.95, Multiply(0.035, UISecondaryMetricConfiguration.scale)),
                1,
                1,
                0,
                Multiply(0.08, UISecondaryMetricConfiguration.scale),
                0,
                If(options.hideUI, 0, UISecondaryMetricConfiguration.alpha),
                HorizontalAlign.Right,
                false
            ),

            UIComboValue.set(
                Multiply(stage.w, 0.355),
                Multiply(stage.h, 0.0875),
                0.5,
                0.5,
                0,
                Multiply(stage.h, 0.14, UIComboConfiguration.scale),
                0,
                If(options.hideUI, 0, UIComboConfiguration.alpha),
                HorizontalAlign.Center,
                false
            ),
            UIComboText.set(
                Multiply(stage.w, 0.355),
                Multiply(stage.h, 0.0875),
                0.5,
                -2.25,
                0,
                Multiply(stage.h, 0.14, 0.25, UIComboConfiguration.scale),
                0,
                If(options.hideUI, 0, UIComboConfiguration.alpha),
                HorizontalAlign.Center,
                false
            ),

            UIJudgment.set(
                0,
                Multiply(stage.h, -0.115),
                0.5,
                0.5,
                0,
                Multiply(stage.h, 0.0475),
                0,
                If(
                    Or(
                        And(options.isCustomJudgementEnabled, HasSkinSprite(JudgmentMissSprite)),
                        options.hideUI
                    ),
                    0,
                    UIJudgmentConfiguration.alpha
                ),
                HorizontalAlign.Center,
                false
            ),
        ]
    }

    function setupBuckets() {
        return [
            windows.tapNote.normal.setBucket(buckets.tapNoteIndex),
            windows.flickNote.normal.setBucket(buckets.flickNoteIndex),
            windows.slideStart.normal.setBucket(buckets.slideStartIndex),
            windows.slideEnd.normal.setBucket(buckets.slideEndIndex),
            windows.slideEndFlick.normal.setBucket(buckets.slideEndFlickIndex),

            windows.tapNote.critical.setBucket(buckets.criticalTapNoteIndex),
            windows.flickNote.critical.setBucket(buckets.criticalFlickNoteIndex),
            windows.slideStart.critical.setBucket(buckets.criticalSlideStartIndex),
            windows.slideEnd.critical.setBucket(buckets.criticalSlideEndIndex),
            windows.slideEndFlick.critical.setBucket(buckets.criticalSlideEndFlickIndex),
        ]
    }

    function setupScore() {
        return [
            PerfectMultiplier.set(1),
            GreatMultiplier.set(0.7),
            GoodMultiplier.set(0.5),

            ConsecutiveGreatScore.set(0.01, 100, 1000),
        ]
    }

    function setupLife() {
        return [
            [
                archetypes.tapNoteIndex,
                archetypes.flickNoteIndex,
                archetypes.slideStartIndex,
                archetypes.slideEndIndex,
                archetypes.slideEndFlickIndex,
                archetypes.criticalTapNoteIndex,
                archetypes.criticalFlickNoteIndex,
                archetypes.criticalSlideStartIndex,
                archetypes.criticalSlideEndIndex,
                archetypes.criticalSlideEndFlickIndex,
            ].map((archetype) => ArchetypeLife.of(archetype).missLifeIncrement.set(-80)),
            [
                archetypes.slideTickIndex,
                archetypes.criticalSlideTickIndex,
                archetypes.slideHiddenTickIndex,
                archetypes.traceNoteIndex,
                archetypes.traceFlickIndex,
                archetypes.criticalTraceNoteIndex,
                archetypes.criticalTraceFlickIndex,
                archetypes.traceNdFlickIndex,
                archetypes.damageNoteIndex,
            ].map((archetype) => ArchetypeLife.of(archetype).missLifeIncrement.set(-40)),
        ]
    }
}
