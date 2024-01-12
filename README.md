
> Open this page at GitHub Pages: [https://jp-rad.github.io/pxt-mstate/](https://jp-rad.github.io/pxt-mstate/)

## Creating Extensions

Extensions are PXT’s dynamic/static library mechanism for extending a target, such as the pxt-micro:bit:

* [MakeCode extensions](https://makecode.com/extensions)

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
function blinkLED () {
    led.setBrightness(blink * 155 + 100)
    blink += 1
    blink = blink % 2
}
input.onButtonPressed(Button.A, function () {
    mstate.start(StateMachines.M1, "State1")
})
mstate.defineState(StateMachines.M1, "State1", function () {
    mstate.descriptionUml("Blink Heart Icon")
    mstate.declareEntry(function () {
        blink = 0
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareDo(500, function () {
        blinkLED()
    })
    mstate.declareExit(function () {
        led.setBrightness(255)
        basic.showIcon(IconNames.Happy)
    })
    mstate.declareSimpleTransition("Trigger1", "")
})
input.onButtonPressed(Button.B, function () {
    mstate.sendTrigger(StateMachines.M1, "Trigger1")
})
let blink = 0
mstate.exportUml(StateMachines.M1, "State1")

```

#### Metadata (used for search, rendering)

* for PXT/microbit
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
