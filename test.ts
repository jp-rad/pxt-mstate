/**
 * tests go here; this will not be compiled when this package is used as an extension.
 */

function blinkLED () {
    if (0 == blinkNext) {
        blinkNext = 1
        led.setBrightness(100)
    } else {
        blinkNext = 0
        led.setBrightness(255)
    }
}
mstate.defineStateDescription("Off", ["entry/", "- LED off"], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        basic.clearScreen()
    })
    mstate.declareExit(STATE, function (next) {
        mode = 0
    })
    mstate.declareTransition(STATE, "On", "A")
})
mstate.defineStateDescription("On", ["entry/\\n - Initialize On/Blink\\n - LED Heart"], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        led.setBrightness(255)
        blinkNext = 0
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareTransition(STATE, "Slow", "A")
    mstate.declareTransition(STATE, "Slow", "Auto")
    mstate.declareTransition(STATE, "Off", "B")
})
mstate.defineStateDescription("Slow", ["entry/\\n - reset blinkCount", "do/ (500ms)\\n - LED blink\\n [Auto Mode] 6times"], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        blinkCount = 0
    })
    mstate.declareDo(STATE, 500, function () {
        blinkCount += 1
        if (1 == mode && 6 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.declareTransition(STATE, "Fast", "A")
    mstate.declareTransitionSelectable(STATE, ["Fast"], "", function () {
        if (0 > blinkCount) {
            mstate.selectTo("Fast")
        }
    })
    mstate.declareTransition(STATE, "Off", "B")
})
mstate.defineStateDescription("Fast", ["entry/\\n - reset blinkCount", "do/ (200ms)\\n - LED blink\\n [Auto Mode] 16times"], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        blinkCount = 0
    })
    mstate.declareDo(STATE, 200, function () {
        blinkCount += 1
        if (1 == mode && 15 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.declareTransition(STATE, "On", "A")
    mstate.declareTransitionSelectable(STATE, ["Slow"], "", function () {
        if (0 > blinkCount) {
            mstate.selectTo("Slow")
        }
    })
    mstate.declareTransition(STATE, "Off", "B")
})
input.onButtonPressed(Button.A, function () {
    mstate.fire("A")
})
input.onButtonPressed(Button.B, function () {
    mstate.fire("B")
})
input.onButtonPressed(Button.AB, function () {
    mstate.fire("Auto")
    mode = 1
})
let mode = 0
let blinkCount = 0
let blinkNext = 0
mstate.exportUml("Off", true, function (line) {
    console.log(line)
})
mstate.start("Off")
