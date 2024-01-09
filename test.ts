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
// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M1, "On", function () {
    mstate.descriptionsUml(["auto=OFF", "Heart icon"])
    mstate.declareEntry(function () {
        auto = 0
        led.setBrightness(255)
        blinkNext = 0
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareSimpleTransition("A", "Slow")
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition("B", "Off")
    mstate.descriptionUml("/auto=ON")
    mstate.declareCustomTransition("A+B", ["Slow"], function () {
        mstate.transitTo(StateMachines.M1, 0)
        // effect
        auto = 1
    })
})
// State Off
// entry/
// - LED off
mstate.defineState(StateMachines.M1, "Off", function () {
    mstate.descriptionUml("LED off")
    mstate.declareEntry(function () {
        basic.clearScreen()
    })
    mstate.declareExit(function () {
        led.setBrightness(255)
        basic.showString("On!")
    })
    mstate.declareSimpleTransition("A", "On")
})
input.onButtonPressed(Button.A, function () {
    mstate.sendTrigger(StateMachines.M1, "A")
})
input.onButtonPressed(Button.AB, function () {
    mstate.sendTrigger(StateMachines.M1, "A+B")
})
input.onButtonPressed(Button.B, function () {
    mstate.sendTrigger(StateMachines.M1, "B")
})
// State Slow
// entry/
// - reset blinkCount
// do/ (500ms)
// - LED blink
// [Auto Mode] 6times
mstate.defineState(StateMachines.M1, "Slow", function () {
    mstate.declareEntry(function () {
        blinkCount = 0
    })
    mstate.descriptionUml("LED blink (500ms)")
    mstate.declareDo(500, function () {
        blinkCount += 1
        if (1 == auto && 6 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.descriptionUml("auto && 6times")
    mstate.declareCustomTransition("", ["Fast"], function () {
        if (0 > blinkCount) {
            mstate.transitTo(StateMachines.M1, 0)
        }
    })
    mstate.descriptionUml("/auto=OFF")
    mstate.declareCustomTransition("A", ["Fast"], function () {
        mstate.transitTo(StateMachines.M1, 0)
        // effect
        auto = 0
    })
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition("B", "Off")
})
// State Fast
// entry/
// - reset blinkCount
// do/ (200ms)
// - LED blink
// [Auto Mode] 15times
mstate.defineState(StateMachines.M1, "Fast", function () {
    mstate.declareEntry(function () {
        blinkCount = 0
    })
    mstate.descriptionUml("LED blink (200ms)")
    mstate.declareDo(200, function () {
        blinkCount += 1
        if (1 == auto && 15 < blinkCount) {
            blinkCount = -1
        } else {
            blinkLED()
        }
    })
    mstate.descriptionUml("auto && 15times")
    mstate.declareCustomTransition("", ["Slow"], function () {
        if (0 > blinkCount) {
            mstate.transitTo(StateMachines.M1, 0)
        }
    })
    mstate.declareSimpleTransition("A", "On")
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition("B", "Off")
    mstate.descriptionUml(">5s")
    mstate.declareTimeoutedTransition(5000, "On")
})
let blinkCount = 0
let auto = 0
let blinkNext = 0
mstate.start(StateMachines.M1, "Off")
mstate.exportUml(StateMachines.M1, "Off")
