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

// simple transition
function transition(machine: number, state: number, triggerName: string, stateNameTo: string) {
    mstate.declareTransition(machine, state, triggerName, [stateNameTo], function (args) {
        mstate.transitTo(machine, 0)
        mode = 0
    })
}

// State Off
// entry/
// - LED off
mstate.defineState(StateMachines.M0, "Off", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        basic.clearScreen()
    })
    transition(machine, state, "A", "On")
})

// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M0, "On", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        led.setBrightness(255)
        blinkNext = 0
        basic.showIcon(IconNames.Heart)
    })
    transition(machine, state, "A", "Slow")
    transition(machine, state, "B", "Off")
    transition(machine, state, "Auto", "Slow")
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
    mstate.declareTransition(machine, state, "", ["Fast"], function (args) {
        if (0 > blinkCount) {
            mstate.transitTo(machine, 0)
        }
    })
    transition(machine, state, "A", "Fast")
    transition(machine, state, "B", "Off")
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
    mstate.declareTransition(machine, state, "", ["Slow"], function (args) {
        if (0 > blinkCount) {
            mstate.transitTo(machine, 0)
        }
    })
    transition(machine, state, "A", "On")
    transition(machine, state, "B", "Off")
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
