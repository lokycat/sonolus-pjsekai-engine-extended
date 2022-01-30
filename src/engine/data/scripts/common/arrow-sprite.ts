import {
    Abs,
    Add,
    And,
    Clamp,
    Code,
    customSkinSprite,
    Divide,
    Draw,
    EntityMemory,
    Equal,
    HasSkinSprite,
    If,
    Lerp,
    Max,
    Min,
    Mod,
    Multiply,
    Pointer,
    Round,
    SkinSprite,
    Subtract,
    SwitchInteger,
    Time,
} from 'sonolus.js'
import { baseNote, engineId, lane, origin } from './constants'
import { getLayout, Tuple } from './utils'

export type ArrowLayout = Tuple<Code<number>, 9>
export type WritableArrowLayout = Tuple<Pointer<number>, 9>

export function getArrowLayout(pointer: Pointer) {
    return getLayout(pointer, 9)
}

export class ArrowSprite {
    public readonly base: number
    public readonly fallback: Code<number>
    public readonly animateProgress: Pointer<number>
    public readonly direction: Pointer<number>

    public constructor(isCritical: boolean) {
        this.base = isCritical ? 82 : 70
        this.animateProgress = EntityMemory.to(63)
        this.direction = EntityMemory.to(60)
        this.fallback =
            SkinSprite.DirectionalMarkerNeutral + (isCritical ? 4 : 1)
    }

    public calculateLayout(
        center: Code<number>,
        width: Code<number>,
        direction: Code<number>,
        layout: WritableArrowLayout
    ) {
        const [sprite, x1, y1, x2, y2, x3, y3, x4, y4] = layout

        const size = Clamp(Round(Multiply(width, 2)), 1, 6)
        const spriteUp = customSkinSprite(engineId, Add(this.base, size))
        const spriteSide = customSkinSprite(engineId, Add(this.base, size, 6))

        return [
            this.direction.set(direction),

            If(
                And(HasSkinSprite(spriteUp), HasSkinSprite(spriteSide)),
                [
                    sprite.set(
                        Multiply(
                            Clamp(width, 0, 3),
                            0.5,
                            SwitchInteger(direction, [1, -1], 1)
                        )
                    ),
                    x1.set(Multiply(Subtract(center, sprite), lane.w)),
                    y1.set(baseNote.t),
                    x2.set(x1),
                    y2.set(Add(baseNote.t, Multiply(Abs(sprite), 2, lane.w))),
                    x3.set(Multiply(Add(center, sprite), lane.w)),
                    y3.set(y2),
                    x4.set(x3),
                    y4.set(y1),

                    sprite.set(
                        Multiply(
                            lane.w,
                            0.25,
                            SwitchInteger(direction, [1, -1])
                        )
                    ),
                    x1.set(Subtract(x1, sprite)),
                    x2.set(Subtract(x2, sprite)),
                    x3.set(Subtract(x3, sprite)),
                    x4.set(Subtract(x4, sprite)),

                    sprite.set(
                        SwitchInteger(
                            direction,
                            [spriteSide, spriteSide],
                            spriteUp
                        )
                    ),
                ],
                [
                    sprite.set(Max(0.5, Min(1.5, Multiply(width, 0.5)))),
                    SwitchInteger(
                        direction,
                        [rotate(Math.PI / 6), rotate(-Math.PI / 6)],
                        [
                            x1.set(
                                Multiply(Subtract(center, sprite), baseNote.tw)
                            ),
                            y1.set(baseNote.t),
                            x2.set(x1),
                            y2.set(
                                Add(
                                    baseNote.t,
                                    Multiply(sprite, 2, baseNote.tw)
                                )
                            ),
                            x3.set(Multiply(Add(center, sprite), baseNote.tw)),
                            y3.set(y2),
                            x4.set(x3),
                            y4.set(y1),
                        ]
                    ),

                    sprite.set(this.fallback),
                ]
            ),
        ]

        function rotate(a: number) {
            const c1 = rotateCoefficient(-1, 0, a)
            const c2 = rotateCoefficient(-1, 2, a)
            const c3 = rotateCoefficient(1, 2, a)
            const c4 = rotateCoefficient(1, 0, a)

            return [
                x1.set(
                    Multiply(Add(center, Multiply(sprite, c1.x)), baseNote.tw)
                ),
                y1.set(Add(baseNote.t, Multiply(sprite, c1.y, baseNote.tw))),
                x2.set(
                    Multiply(Add(center, Multiply(sprite, c2.x)), baseNote.tw)
                ),
                y2.set(Add(baseNote.t, Multiply(sprite, c2.y, baseNote.tw))),
                x3.set(
                    Multiply(Add(center, Multiply(sprite, c3.x)), baseNote.tw)
                ),
                y3.set(Add(baseNote.t, Multiply(sprite, c3.y, baseNote.tw))),
                x4.set(
                    Multiply(Add(center, Multiply(sprite, c4.x)), baseNote.tw)
                ),
                y4.set(Add(baseNote.t, Multiply(sprite, c4.y, baseNote.tw))),
            ]
        }
    }

    public updateAnimation() {
        const animateDuration = 1
        const animateSeek = Divide(
            Mod(
                Add(Mod(Time, animateDuration), animateDuration),
                animateDuration
            ),
            animateDuration
        )
        return [this.animateProgress.set(animateSeek)]
    }

    public draw(scale: Code<number>, layout: ArrowLayout, z: Code<number>) {
        const [sprite, x1, y1, x2, y2, x3, y3, x4, y4] = layout
        const yShift = Multiply(this.animateProgress, scale, 0.4)
        const xShift = Multiply(
            this.animateProgress,
            scale,
            0.2,
            If(Equal(this.direction, 1), 1, If(Equal(this.direction, 0), -1, 0))
        )

        return Draw(
            sprite,
            Add(Multiply(x1, scale), xShift),
            Add(Lerp(origin, y1, scale), yShift),
            Add(Multiply(x2, scale), xShift),
            Add(Lerp(origin, y2, scale), yShift),
            Add(Multiply(x3, scale), xShift),
            Add(Lerp(origin, y3, scale), yShift),
            Add(Multiply(x4, scale), xShift),
            Add(Lerp(origin, y4, scale), yShift),
            Add(z, 1),
            Subtract(2, Clamp(Multiply(this.animateProgress, 2), 1, 2))
        )
    }
}

export const arrowRedSprite = new ArrowSprite(false)
export const arrowYellowSprite = new ArrowSprite(true)

function rotateCoefficient(x: number, y: number, a: number) {
    const aOld = Math.atan2(y, x)
    const aNew = aOld + a
    const r = Math.sqrt(x * x + y * y)
    const dY = Math.sin(Math.abs(a)) * 0.5
    return {
        x: r * Math.cos(aNew),
        y: r * Math.sin(aNew) + dY,
    }
}
