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
mstate.defineState(StateMachines.M0, "Off", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        mode = 0
        basic.clearScreen()
    })
    mstate.declareExit(machine, state, function () {
        led.setBrightness(255)
        basic.showString("Power!")
    })
    mstate.declareSimpleTransition(machine, state, "A", "On")
})

// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M0, "On", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        mode = 0
        led.setBrightness(255)
        blinkNext = 0
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareSimpleTransition(machine, state, "A", "Slow")
    mstate.declareSimpleTransition(machine, state, "B", "Off")
    mstate.declareSimpleTransition(machine, state, "Auto", "Slow")
})

// State Slow
// entry/
// - reset blinkCount
// do/ (500ms)
// - LED blink
// [Auto Mode] 6times
mstate.defineState(StateMachines.M0, "Slow", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        blinkCount = 0
    })
    mstate.declareDo(machine, state, 500, function () {
        blinkCount += 1
        if (1 == mode && 6 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.declareCustomTransition(machine, state, "", ["Fast"], function (args) {
        if (0 > blinkCount) {
            mstate.transitTo(machine, 0)
        }
    })
    mstate.declareSimpleTransition(machine, state, "A", "Fast")
    mstate.declareSimpleTransition(machine, state, "B", "Off")
})

// State Fast
// entry/
// - reset blinkCount
// do/ (200ms)
// - LED blink
// [Auto Mode] 16times
mstate.defineState(StateMachines.M0, "Fast", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        blinkCount = 0
    })
    mstate.declareDo(machine, state, 200, function () {
        blinkCount += 1
        if (1 == mode && 15 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.declareCustomTransition(machine, state, "", ["Slow"], function (args) {
        if (0 > blinkCount) {
            mstate.transitTo(machine, 0)
        }
    })
    mstate.declareSimpleTransition(machine, state, "A", "On")
    mstate.declareSimpleTransition(machine, state, "B", "Off")
    mstate.declareTimeoutedTransition(machine, state, 5000, "On")
})

input.onButtonPressed(Button.A, function () {
    mstate.fire(StateMachines.M0, "A", [])
})
input.onButtonPressed(Button.AB, function () {
    mstate.fire(StateMachines.M0, "Auto", [])
    mode = 1
})
input.onButtonPressed(Button.B, function () {
    mstate.fire(StateMachines.M0, "B", [])
})
let blinkCount = 0
let mode = 0
let blinkNext = 0
mstate.start(StateMachines.M0, "Off")
