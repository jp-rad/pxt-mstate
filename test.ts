/**
 * tests go here; this will not be compiled when this package is used as an extension.
 */

// state Mode
mstate.defineStateName("Mode", function (STATE) {
    mstate.declareDo(STATE, 2000, function () {
        basic.showString("A")
        basic.showString("B")
        basic.clearScreen()
    })
    mstate.declareExit(STATE, function (next) {
        basic.showString("-->" + mstate.convName(next))
    })
    mstate.declareTransition(STATE, "On", "A")
    mstate.declareTransition(STATE, "Fast", "B")
})

// state Off
mstate.defineStateName("Off", function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        basic.clearScreen()
    })
    mstate.declareTransition(STATE, "On", "A")
})

// state On
mstate.defineStateName("On", function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        led.setBrightness(255)
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareTransition(STATE, "Slow", "A")
    mstate.declareTransition(STATE, "Off", "B")
})

// state Slow
mstate.defineStateName("Slow", function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        blinkingState = 0
    })
    mstate.declareDo(STATE, 500, function () {
        toggleLED()
    })
    mstate.declareTransition(STATE, "Fast", "A")
    mstate.declareTransition(STATE, "Off", "B")
})

// state Fast
mstate.defineStateName("Fast", function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        if ("Mode" == mstate.convName(prev)) {
            basic.showIcon(IconNames.Butterfly)
            blinkingState = 0
        }
    })
    mstate.declareDo(STATE, 100, function () {
        toggleLED()
    })
    mstate.declareTransition(STATE, "On", "A")
    mstate.declareTransition(STATE, "Off", "B")
})

input.onButtonPressed(Button.A, function () {
    mstate.fire("A")
})

input.onButtonPressed(Button.B, function () {
    mstate.fire("B")
})

function toggleLED() {
    if (0 == blinkingState) {
        blinkingState = 1
        led.setBrightness(100)
    } else {
        blinkingState = 0
        led.setBrightness(255)
    }
}

let blinkingState = 0
mstate.start("Mode")
