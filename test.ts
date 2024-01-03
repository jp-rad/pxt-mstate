/**
 * tests go here; this will not be compiled when this package is used as an extension.
 */
// blink
function blinkLED () {
    if (0 == blinkNext) {
        blinkNext = 1
        led.setBrightness(100)
    } else {
        blinkNext = 0
        led.setBrightness(255)
    }
}
// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M1, "On", function (mstateId) {
    mstate.descriptionsUml(["auto=OFF", "Heart icon"])
    mstate.declareEntry(mstateId, function () {
        auto = 0
        led.setBrightness(255)
        blinkNext = 0
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareSimpleTransition(mstateId, "A", "Slow")
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition(mstateId, "B", "Off")
    mstate.descriptionUml("/auto=ON")
    mstate.declareCustomTransition(mstateId, "A+B", ["Slow"], function () {
        mstate.transitTo(mstateId, 0)
        // effect
        auto = 1
    })
})
// State Off
// entry/
// - LED off
mstate.defineState(StateMachines.M1, "Off", function (mstateId) {
    mstate.descriptionUml("LED off")
    mstate.declareEntry(mstateId, function () {
        basic.clearScreen()
    })
    mstate.declareExit(mstateId, function () {
        led.setBrightness(255)
        basic.showString("On!")
    })
    mstate.declareSimpleTransition(mstateId, "A", "On")
})
input.onButtonPressed(Button.A, function () {
    mstate.send(StateMachines.M1, "A")
})
input.onButtonPressed(Button.AB, function () {
    mstate.send(StateMachines.M1, "A+B")
})
input.onButtonPressed(Button.B, function () {
    mstate.send(StateMachines.M1, "B")
})
// State Slow
// entry/
// - reset blinkCount
// do/ (500ms)
// - LED blink
// [Auto Mode] 6times
mstate.defineState(StateMachines.M1, "Slow", function (mstateId) {
    mstate.declareEntry(mstateId, function () {
        blinkCount = 0
    })
    mstate.descriptionUml("LED blink (500ms)")
    mstate.declareDo(mstateId, 500, function () {
        blinkCount += 1
        if (1 == auto && 6 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.descriptionUml("auto && 6times")
    mstate.declareCustomTransition(mstateId, "", ["Fast"], function () {
        if (0 > blinkCount) {
            mstate.transitTo(mstateId, 0)
        }
    })
    mstate.descriptionUml("/auto=OFF")
    mstate.declareCustomTransition(mstateId, "A", ["Fast"], function () {
        mstate.transitTo(mstateId, 0)
        // effect
        auto = 0
    })
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition(mstateId, "B", "Off")
})
// State Fast
// entry/
// - reset blinkCount
// do/ (200ms)
// - LED blink
// [Auto Mode] 15times
mstate.defineState(StateMachines.M1, "Fast", function (mstateId) {
    mstate.declareEntry(mstateId, function () {
        blinkCount = 0
    })
    mstate.descriptionUml("LED blink (200ms)")
    mstate.declareDo(mstateId, 200, function () {
        blinkCount += 1
        if (1 == auto && 15 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.descriptionUml("auto && 15times")
    mstate.declareCustomTransition(mstateId, "", ["Slow"], function () {
        if (0 > blinkCount) {
            mstate.transitTo(mstateId, 0)
        }
    })
    mstate.declareSimpleTransition(mstateId, "A", "On")
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition(mstateId, "B", "Off")
    mstate.descriptionUml(">5s")
    mstate.declareTimeoutedTransition(mstateId, 5000, "On")
})
let blinkCount = 0
let auto = 0
let blinkNext = 0
mstate.start(StateMachines.M1, "Off")
mstate.exportUml(StateMachines.M1, "Off")
