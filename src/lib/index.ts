import { EngineInfo, LevelData } from 'sonolus-core'
import { archetypes } from '../engine/data/archetypes'
import { Fannithm, fromFannithm as _fromFannithm } from './fannithm/convert'
import { Resource } from './Resource'
import { fromSus as _fromSus } from './sus/convert'

export const version = '0.2.0'

export const engineInfo = {
    name: 'pjsekai',
    version: 7,
    title: {
        en: 'Project Sekai',
        ja: 'プロセカ',
        ko: '프로젝트 세카이',
        zhs: '世界计划',
        zht: '世界計劃',
    },
    subtitle: {
        en: 'Project Sekai: Colorful Stage!',
        ja: 'プロジェクトセカイ カラフルステージ!',
        ko: '프로젝트 세카이: 컬러풀 스테이지!',
        zhs: '世界计划 彩色舞台',
        zht: '世界計畫 繽紛舞台！',
    },
    author: {
        en: 'Burrito',
    },
    description: {
        en: [
            'A recreation of Project Sekai: Colorful Stage! engine in Sonolus.',
            `Version: ${version}`,
            '',
            'GitHub Repository',
            'https://github.com/NonSpicyBurrito/sonolus-pjsekai-engine',
        ].join('\n'),
    },
} as const satisfies Partial<EngineInfo>

export const engineConfiguration = new Resource('EngineConfiguration')
export const engineData = new Resource('EngineData')
export const engineThumbnail = new Resource('thumbnail.png')

export function fromSus(sus: string, bgmOffset = 0, chartOffset = 0): LevelData {
    return _fromSus(sus, bgmOffset, chartOffset, archetypes)
}

export function fromFannithm(fannithm: Fannithm, bgmOffset = 0, chartOffset = 0): LevelData {
    return _fromFannithm(fannithm, bgmOffset, chartOffset, archetypes)
}
