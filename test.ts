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
// State Off
// entry/
// - LED off
mstate.defineState(StateMachines.M0, "Off", function () {
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
    mstate.sendTrigger(StateMachines.M0, "A")
})
// State Fast
// entry/
// - reset blinkCount
// do/ (200ms)
// - LED blink
// [Auto Mode] 15times
mstate.defineState(StateMachines.M0, "Fast", function () {
    mstate.declareEntry(function () {
        times = 0
    })
    mstate.descriptionUml("LED blink (200ms)")
    mstate.declareDoActivity(200, function (counter) {
        if (1 == auto && 15 < counter) {
            times = 15
        } else if (25 < counter) {
            times = 25
        } else {
            blinkLED()
        }
    })
    mstate.descriptionsUml(["auto && 15times", ">5s"])
    mstate.declareStateTransition("", ["Slow", "On"], function () {
        if (15 == times) {
            mstate.traverse(StateMachines.M0, 0)
        } else if (25 == times) {
            mstate.traverse(StateMachines.M0, 1)
        }
    })
    mstate.declareSimpleTransition("A", "On")
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition("B", "Off")
})
// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M0, "On", function () {
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
    mstate.declareStateTransition("A+B", ["Slow"], function () {
        // effect
        auto = 1
        mstate.traverse(StateMachines.M0, 0)
    })
})
// State Slow
// entry/
// - reset blinkCount
// do/ (500ms)
// - LED blink
// [Auto Mode] 6times
mstate.defineState(StateMachines.M0, "Slow", function () {
    mstate.declareEntry(function () {
        times = 0
    })
    mstate.descriptionUml("LED blink (500ms)")
    mstate.declareDoActivity(500, function (counter) {
        if (1 == auto && 6 <= counter) {
            times = 6
        } else {
            blinkLED()
        }
    })
    mstate.descriptionUml("auto && 6times")
    mstate.declareStateTransition("", ["Fast"], function () {
        if (6 == times) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
    mstate.descriptionUml("/auto=OFF")
    mstate.declareStateTransition("A", ["Fast"], function () {
        // effect
        auto = 0
        mstate.traverse(StateMachines.M0, 0)
    })
    mstate.descriptionUml(":")
    mstate.declareSimpleTransition("B", "Off")
})
input.onButtonPressed(Button.AB, function () {
    mstate.sendTrigger(StateMachines.M0, "A+B")
})
input.onButtonPressed(Button.B, function () {
    mstate.sendTrigger(StateMachines.M0, "B")
})
let auto = 0
let times = 0
let blinkNext = 0
mstate.start(StateMachines.M0, "Off")
mstate.exportUml(StateMachines.M0, "Off")
