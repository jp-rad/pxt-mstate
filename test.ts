/**
 * tests go here; this will not be compiled when this package is used as an extension.
 */

// blink
function blinkLED() {
    if (0 == blinkNext) {
        blinkNext = 1
        led.setBrightness(100)
    } else {
        blinkNext = 0
        led.setBrightness(255)
    }
}

// State Off
// entry/
// - LED off
mstate.defineState(StateMachines.M0, "Off:LED off", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        basic.clearScreen()
    })
    mstate.declareExit(machine, state, function () {
        led.setBrightness(255)
        basic.showString("On!")
    })
    mstate.declareSimpleTransition(machine, state, "A", "On")
})

// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M0, "On:auto=OFF\\nHeart icon", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        auto = 0
        led.setBrightness(255)
        blinkNext = 0
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareSimpleTransition(machine, state, "A", "Slow")
    mstate.declareSimpleTransition(machine, state, "B", "Off::")
    mstate.declareCustomTransition(machine, state, "A+B", ["Slow:/auto=ON"], function () {
        mstate.transitTo(machine, 0)
        // effect
        auto = 1
    })
})

// State Slow
// entry/
// - reset blinkCount
// do/ (500ms)
// - LED blink
// [Auto Mode] 6times
mstate.defineState(StateMachines.M0, "Slow:LED blink (500ms)", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        blinkCount = 0
    })
    mstate.declareDo(machine, state, 500, function () {
        blinkCount += 1
        if (1 == auto && 6 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.declareCustomTransition(machine, state, "", ["Fast:auto && 6times"], function () {
        if (0 > blinkCount) {
            mstate.transitTo(machine, 0)
        }
    })
    mstate.declareCustomTransition(machine, state, "A", ["Fast:/auto=OFF"], function () {
        mstate.transitTo(machine, 0)
        // effect
        auto = 0
    })
    mstate.declareSimpleTransition(machine, state, "B", "Off::")
})

// State Fast
// entry/
// - reset blinkCount
// do/ (200ms)
// - LED blink
// [Auto Mode] 15times
mstate.defineState(StateMachines.M0, "Fast:LED blink (200ms)", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        blinkCount = 0
    })
    mstate.declareDo(machine, state, 200, function () {
        blinkCount += 1
        if (1 == auto && 15 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.declareCustomTransition(machine, state, "", ["Slow:auto && 15times"], function () {
        if (0 > blinkCount) {
            mstate.transitTo(machine, 0)
        }
    })
    mstate.declareSimpleTransition(machine, state, "A", "On")
    mstate.declareSimpleTransition(machine, state, "B", "Off::")
    mstate.declareTimeoutedTransition(machine, state, 5000, "On:>5s")
})

input.onButtonPressed(Button.A, function () {
    mstate.send(StateMachines.M0, "A")
})
input.onButtonPressed(Button.AB, function () {
    mstate.send(StateMachines.M0, "A+B")
})
input.onButtonPressed(Button.B, function () {
    mstate.send(StateMachines.M0, "B")
})
let auto = 0
let blinkCount = 0
let blinkNext = 0
mstate.start(StateMachines.M0, "Off")
mstate.exportUml(StateMachines.M0, "Off")
