import { LevelData, LevelDataEntity } from 'sonolus-core'
import type { archetypes as Archetypes } from '../../engine/data/archetypes'
import { analyze, NoteObject } from './analyze'

type Wrapper = {
    group: number
    time: number
    entity: LevelDataEntity
    ref?: Wrapper
}

type NoteInfo = {
    note: NoteObject
    key: string
    time: number
    isCritical: boolean
}

export function fromSus(
    sus: string,
    bgmOffset: number,
    chartOffset: number,
    archetypes: typeof Archetypes
): LevelData {
    const score = analyze(sus)
    const ticksPerBeat = score.request.ticksPerBeat
    const ticksPerHidden = ticksPerBeat / 2

    const flickMods = new Map<string, -1 | 0 | 1>()
    const criticalMods = new Set<string>()
    const tickRemoveMods = new Set<string>()
    const usedTickRemoveMods = new Set<string>()
    const easeInMods = new Set<string>()
    const easeOutMods = new Set<string>()

    const slides = new Set<string>()

    score.slides.forEach((slide) => {
        slide.forEach((note) => {
            const key = getKey(note)
            switch (note.type) {
                case 1:
                case 2:
                case 3:
                case 5:
                    slides.add(key)
                    break
            }
        })
    })
    score.directionalNotes.forEach((note) => {
        const key = getKey(note)
        switch (note.type) {
            case 1:
                flickMods.set(key, -1)
                break
            case 3:
                flickMods.set(key, 0)
                break
            case 4:
                flickMods.set(key, 1)
                break
            case 2:
                easeInMods.add(key)
                break
            case 5:
            case 6:
                easeOutMods.add(key)
                break
        }
    })
    score.tapNotes.forEach((note) => {
        const key = getKey(note)
        switch (note.type) {
            case 2:
                criticalMods.add(key)
                break
            case 3:
                tickRemoveMods.add(key)
                break
        }
    })

    const wrappers: Wrapper[] = [
        {
            group: -1,
            time: -1000,
            entity: {
                archetype: archetypes.initializationIndex,
            },
        },
        {
            group: -1,
            time: -999,
            entity: {
                archetype: archetypes.stageIndex,
            },
        },
        {
            group: -1,
            time: -998,
            entity: {
                archetype: archetypes.inputIndex,
            },
        },
    ]

    const taps = new Set<string>()
    score.tapNotes
        .filter((note) => score.request.sideLane || (note.lane > 1 && note.lane < 14))
        .forEach((note) => {
            const key = getKey(note)
            if (slides.has(key)) return

            const time = toTime(note.tick)
            switch (note.type) {
                case 1: {
                    if (taps.has(key)) break
                    taps.add(key)

                    const flickMod = flickMods.get(key)
                    wrappers.push({
                        group: 0,
                        time,
                        entity: {
                            archetype:
                                flickMod === undefined
                                    ? archetypes.tapNoteIndex
                                    : archetypes.flickNoteIndex,
                            data: {
                                index: 0,
                                values: [
                                    time,
                                    note.lane - 8 + note.width / 2 + score.request.laneOffset,
                                    note.width / 2,
                                    flickMod || 0,
                                ],
                            },
                        },
                    })
                    break
                }
                case 2: {
                    if (taps.has(key)) break
                    if (tickRemoveMods.has(key)) break
                    taps.add(key)

                    const flickMod = flickMods.get(key)
                    wrappers.push({
                        group: 0,
                        time,
                        entity: {
                            archetype:
                                flickMod === undefined
                                    ? archetypes.criticalTapNoteIndex
                                    : archetypes.criticalFlickNoteIndex,
                            data: {
                                index: 0,
                                values: [
                                    time,
                                    note.lane - 8 + note.width / 2 + score.request.laneOffset,
                                    note.width / 2,
                                    flickMod || 0,
                                ],
                            },
                        },
                    })
                    break
                }
                case 4: {
                    wrappers.push({
                        group: 0,
                        time,
                        entity: {
                            archetype: archetypes.damageNoteIndex,
                            data: {
                                index: 0,
                                values: [
                                    time,
                                    note.lane - 8 + note.width / 2 + score.request.laneOffset,
                                    note.width / 2,
                                ],
                            },
                        },
                    })
                    break
                }
            }
        })

    const slideKeys = new Set<string>()
    score.slides.forEach((slide) => {
        const key = slide.map(getKey).join('|')
        if (slideKeys.has(key)) return
        slideKeys.add(key)

        const startNote = slide.find(({ type }) => type === 1 || type === 2)
        if (!startNote) return

        const isStartCritical = criticalMods.has(getKey(startNote))
        const minHiddenTick = Math.floor(startNote.tick / ticksPerHidden + 1) * ticksPerHidden

        let head: NoteInfo | undefined
        let ref: Wrapper | undefined
        const connectedNotes: NoteInfo[] = []
        slide.forEach((note) => {
            const key = getKey(note)
            const time = toTime(note.tick)
            const isCritical = isStartCritical || criticalMods.has(key)
            const isTrace = tickRemoveMods.has(key)

            let newHead: NoteInfo | undefined
            switch (note.type) {
                case 1: {
                    wrappers.push({
                        group: 0,
                        time,
                        entity: {
                            archetype: isTrace
                                ? archetypes.traceSlideStartIndex
                                : isCritical
                                ? archetypes.criticalSlideStartIndex
                                : archetypes.slideStartIndex,
                            data: {
                                index: 0,
                                values: [
                                    time,
                                    note.lane - 8 + note.width / 2 + score.request.laneOffset,
                                    note.width / 2,
                                ],
                            },
                        },
                    })
                    ref = ref || wrappers[wrappers.length - 1]
                    newHead = {
                        note,
                        key,
                        time,
                        isCritical,
                    }
                    if (isTrace) {
                        usedTickRemoveMods.add(key)
                    }
                    break
                }
                case 2: {
                    const flickMod = flickMods.get(key)

                    wrappers.push({
                        group: 0,
                        time,
                        ref,
                        entity: {
                            archetype: isTrace
                                ? archetypes.traceNoteIndex
                                : isCritical
                                ? flickMod === undefined
                                    ? archetypes.criticalSlideEndIndex
                                    : archetypes.criticalSlideEndFlickIndex
                                : flickMod === undefined
                                ? archetypes.slideEndIndex
                                : archetypes.slideEndFlickIndex,
                            data: {
                                index: 0,
                                values: [
                                    time,
                                    note.lane - 8 + note.width / 2 + score.request.laneOffset,
                                    note.width / 2,
                                    flickMod || 0,
                                ],
                            },
                        },
                    })
                    ref = ref || wrappers[wrappers.length - 1]
                    newHead = {
                        note,
                        key,
                        time,
                        isCritical,
                    }
                    if (isTrace) {
                        usedTickRemoveMods.add(key)
                    }
                    break
                }
                case 3: {
                    if (tickRemoveMods.has(key)) {
                        connectedNotes.push({
                            note,
                            key,
                            time,
                            isCritical,
                        })
                        usedTickRemoveMods.add(key)
                        break
                    }

                    wrappers.push({
                        group: 0,
                        time,
                        entity: {
                            archetype: isCritical
                                ? archetypes.criticalSlideTickIndex
                                : archetypes.slideTickIndex,
                            data: {
                                index: 0,
                                values: [
                                    time,
                                    note.lane - 8 + note.width / 2 + score.request.laneOffset,
                                    note.width / 2,
                                ],
                            },
                        },
                    })
                    ref = ref || wrappers[wrappers.length - 1]
                    newHead = {
                        note,
                        key,
                        time,
                        isCritical,
                    }
                    break
                }
                case 5: {
                    if (tickRemoveMods.has(key)) break

                    newHead = {
                        note,
                        key,
                        time,
                        isCritical,
                    }
                }
            }

            if (!newHead) return
            if (!head) {
                head = newHead
                connectedNotes.length = 0
                return
            }

            const easeType = easeInMods.has(head.key) ? 0 : easeOutMods.has(head.key) ? 1 : -1

            const h = head
            connectedNotes.forEach((info) => {
                const y = ease((info.time - h.time) / (time - h.time), easeType)
                const lane = h.note.lane + (note.lane - h.note.lane) * y
                const width = h.note.width + (note.width - h.note.width) * y

                wrappers.push({
                    group: 0,
                    time: info.time,
                    entity: {
                        archetype: info.isCritical
                            ? archetypes.criticalSlideTickIndex
                            : archetypes.slideTickIndex,
                        data: {
                            index: 0,
                            values: [
                                info.time,
                                lane - 8 + width / 2 + score.request.laneOffset,
                                width / 2,
                            ],
                        },
                    },
                })
            })

            wrappers.push({
                group: 1,
                time,
                ref,
                entity: {
                    archetype: head.isCritical
                        ? archetypes.criticalSlideConnectorIndex
                        : archetypes.slideConnectorIndex,
                    data: {
                        index: 0,
                        values: [
                            head.time,
                            head.note.lane - 8 + head.note.width / 2 + score.request.laneOffset,
                            head.note.width / 2,
                            time,
                            note.lane - 8 + note.width / 2 + score.request.laneOffset,
                            note.width / 2,
                            easeType,
                        ],
                    },
                },
            })

            for (
                let i = Math.max(
                    Math.ceil(head.note.tick / ticksPerHidden) * ticksPerHidden,
                    minHiddenTick
                );
                i < note.tick;
                i += ticksPerHidden
            ) {
                const t = toTime(i)
                const y = ease((t - h.time) / (time - h.time), easeType)
                const lane = h.note.lane + (note.lane - h.note.lane) * y
                const width = h.note.width + (note.width - h.note.width) * y

                wrappers.push({
                    group: 1,
                    time: t,
                    entity: {
                        archetype: archetypes.slideHiddenTickIndex,
                        data: {
                            index: 0,
                            values: [t, lane - 8 + width / 2 + score.request.laneOffset, width / 2],
                        },
                    },
                })
            }

            head = newHead
            connectedNotes.length = 0
        })
    })
    score.tapNotes.forEach((note) => {
        const key = getKey(note)
        if (!tickRemoveMods.has(key) || usedTickRemoveMods.has(key)) return
        const time = toTime(note.tick)
        const flickMod = flickMods.get(key)

        wrappers.push({
            group: 0,
            time,
            entity: {
                archetype: criticalMods.has(key)
                    ? flickMod === undefined
                        ? archetypes.criticalTraceNoteIndex
                        : archetypes.criticalTraceFlickIndex
                    : flickMod === undefined
                    ? easeInMods.has(key)
                        ? archetypes.traceNdFlickIndex
                        : archetypes.traceNoteIndex
                    : archetypes.traceFlickIndex,
                data: {
                    index: 0,
                    values: [
                        time,
                        note.lane - 8 + note.width / 2 + score.request.laneOffset,
                        note.width / 2,
                        flickMod || 0,
                    ],
                },
            },
        })
    })

    wrappers.sort((a, b) => a.group - b.group || a.time - b.time)

    wrappers.forEach((wrapper) => {
        if (!wrapper.ref) return
        if (!wrapper.entity.data) return

        wrapper.entity.data.values.push(wrappers.indexOf(wrapper.ref))
    })

    return {
        bgmOffset,
        entities: wrappers.map(({ entity }) => entity),
    }

    function toTime(tick: number) {
        return score.toTime(tick) + chartOffset
    }
}

function getKey(note: NoteObject) {
    return `${note.tick}-${note.lane}`
}

function ease(x: number, type: 0 | 1 | -1) {
    switch (type) {
        case 0:
            return x * x
        case 1:
            return 1 - (1 - x) * (1 - x)
        case -1:
            return x
    }
}
