/**
 * tests go here; this will not be compiled when this package is used as an extension.
 */
// blink
function resetLED () {
    controlLED(true)
}
// blink
function blinkLED () {
    controlLED(false)
}
// blink
function controlLED (reset: boolean) {
    if (reset || 0 == blinkNext) {
        blinkNext = 1
        led.setBrightness(255)
    } else {
        blinkNext = 0
        led.setBrightness(100)
    }
}
// State Off
// entry/
// - LED off
mstate.defineState(StateMachines.M0, "Off", function () {
    mstate.descriptionUml("LED off")
    mstate.onState(0, function (tickcount) {
        basic.clearScreen()
    })
    mstate.onExit(function () {
        resetLED()
        basic.showString("On!")
    })
    mstate.onTrigger("A", ["On"], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
})
input.onButtonPressed(Button.A, function () {
    mstate.send(StateMachines.M0, "A")
})
// Stete On
// entry/
// - Initialize On/Blink
// - LED Heart
mstate.defineState(StateMachines.M0, "On", function () {
    mstate.descriptionUml("auto=OFF")
    mstate.descriptionUml("Heart icon")
    mstate.onState(0, function (tickcount) {
        auto = 0
        resetLED()
        basic.showIcon(IconNames.Heart)
    })
    mstate.onTrigger("A", ["Slow"], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
    mstate.descriptionUml(":")
    mstate.onTrigger("B", ["Off"], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
    mstate.descriptionUml("/auto=ON")
    mstate.onTrigger("A+B", ["Slow"], function () {
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
    mstate.descriptionUml("LED blink (500ms)")
    mstate.onState(500, function (tickcount) {
        if (0 == tickcount) {
            times = 0
            blinkLED()
        } else {
            if (1 == auto && 6 <= tickcount) {
                times = 6
            } else {
                blinkLED()
            }
        }
    })
    mstate.descriptionUml("auto && 6times")
    mstate.onTrigger("", ["Fast"], function () {
        if (6 == times) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
    mstate.descriptionUml("/auto=OFF")
    mstate.onTrigger("A", ["Fast"], function () {
        // effect
        auto = 0
        mstate.traverse(StateMachines.M0, 0)
    })
    mstate.descriptionUml(":")
    mstate.onTrigger("B", ["Off"], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
})
input.onButtonPressed(Button.AB, function () {
    mstate.send(StateMachines.M0, "A+B")
})
input.onButtonPressed(Button.B, function () {
    mstate.send(StateMachines.M0, "B")
})
// State Fast
// entry/
// - reset blinkCount
// do/ (200ms)
// - LED blink
// [Auto Mode] 15times
mstate.defineState(StateMachines.M0, "Fast", function () {
    mstate.descriptionUml("LED blink (200ms)")
    mstate.onState(200, function (tickcount) {
        if (0 == tickcount) {
            times = 0
            blinkLED()
        } else {
            if (1 == auto && 15 < tickcount) {
                times = 15
            } else if (25 < tickcount) {
                times = 25
            } else {
                blinkLED()
            }
        }
    })
    mstate.descriptionUml("auto && 15times")
    mstate.descriptionUml(">5s")
    mstate.onTrigger("", ["Slow", "On"], function () {
        if (15 == times) {
            mstate.traverse(StateMachines.M0, 0)
        } else if (25 == times) {
            mstate.traverse(StateMachines.M0, 1)
        }
    })
    mstate.onTrigger("A", ["On"], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
    mstate.descriptionUml(":")
    mstate.onTrigger("B", ["Off"], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
})
let auto = 0
let times = 0
let blinkNext = 0
mstate.start(StateMachines.M0, "Off")
mstate.exportUml(StateMachines.M0, "Off")
