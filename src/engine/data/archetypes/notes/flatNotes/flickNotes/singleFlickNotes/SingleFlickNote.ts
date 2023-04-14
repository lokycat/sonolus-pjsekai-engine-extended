import { options } from '../../../../../../configuration/options.js'
import { canStart, disallowEmpty, disallowEnd, disallowStart } from '../../../../InputManager.js'
import { minFlickVR } from '../../../../constants.js'
import { FlickNote } from '../FlickNote.js'

export abstract class SingleFlickNote extends FlickNote {
    activated = this.entityMemory(Boolean)

    touch() {
        if (options.autoplay) return

        if (time.now < this.inputTime.min) return

        if (!this.activated) {
            for (const touch of touches) {
                if (!touch.started) continue
                if (!this.hitbox.contains(touch.position)) continue
                if (!canStart(touch)) continue

                disallowEmpty(touch)
                disallowStart(touch)
                disallowEnd(touch, this.inputTime.max)

                this.activated = true
                break
            }
        }

        if (this.activated) {
            for (const touch of touches) {
                if (touch.vr < minFlickVR) continue
                if (!this.hitbox.contains(touch.lastPosition)) continue

                this.complete(touch)
                return
            }
        }
    }
}
