
> Open this page at GitHub Pages: [https://jp-rad.github.io/pxt-mstate/](https://jp-rad.github.io/pxt-mstate/)

## Preface

The pxt-mstate extension is a user-defined extension for micro:bit that enables state machine-based coding.

A state machine is a model that represents transitions from one state to another and can represent complex behavior in a simple way.
Usually, state machines are drawn as state diagrams using tools such as UML, from which source code is generated.
However, the pxt-mstate extension provides the ability to automatically generate state diagrams from coding.

The pxt-mstate extension allows you to directly define states and transitions using block coding, and to traverse states in response to triggers.
You can also visualize them in a state diagram to understand the behavior of your state machine.

Get the pxt-mstate extension into your projects and enjoy programming with state machines! 😊.

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/jp-rad/pxt-mstate** and import

## Edit this project ![Build status badge](https://github.com/jp-rad/pxt-mstate/workflows/MakeCode/badge.svg)

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/jp-rad/pxt-mstate** and click import

## Blocks preview

<!--
This image shows the blocks code from the last commit in master.
This image may take a few minutes to refresh.

![A rendered view of the blocks](https://github.com/jp-rad/pxt-mstate/raw/master/.github/makecode/blocks.png)
-->
![A rendered view of the blocks](https://github.com/jp-rad/pxt-mstate/raw/master/.github/statics/blocks.png)


**Example**

```javascript
mstate.defineState(StateMachines.M0, "State1", function () {
    mstate.descriptionUml("Blink Heart Icon")
    mstate.onState(500, function (tickcount) {
        if (0 == tickcount) {
            blinkLED(false)
            basic.showIcon(IconNames.Heart, 20)
        } else {
            blinkLED(true)
        }
    })
    mstate.onExit(function () {
        blinkLED(false)
        basic.showIcon(IconNames.Happy)
    })
    mstate.onTrigger("Trigger1", [""], function () {
        mstate.traverse(StateMachines.M0, 0)
    })
})
function blinkLED(enabled: boolean) {
    if (!(enabled)) {
        blink = 1
    }
    led.setBrightness(blink * 155 + 100)
    blink += 1
    blink = blink % 2
}
input.onButtonPressed(Button.A, function () {
    mstate.start(StateMachines.M0, "State1")
})
input.onButtonPressed(Button.B, function () {
    mstate.send(StateMachines.M0, "Trigger1")
})
let blink = 0
mstate.exportUml(StateMachines.M0, "State1")
basic.showString("M")

```

**UML**

![A rendered view of UML](https://github.com/jp-rad/pxt-mstate/raw/master/.github/statics/uml.png)


#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
