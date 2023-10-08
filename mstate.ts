enum StateMachines {
    M0 = 0,
    M1,
    M2,
    M3,
    M4,
    M5
}

/**
 * mstate blocks
 * Defining blocks: https://makecode.com/defining-blocks
 * Playground: https://makecode.com/playground
 * icon: a Unicode identifier for an icon from the Font Awesome icon set.
 *       http://fontawesome.io/icons
 */
//% weight=100 color="#4C97FF" icon="\uf362"
//% groups="['Command', 'Declare', 'Transit']"
namespace mstate {

    const MICROBIT_CUSTOM_ID_BASE = 32768
    const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 100
    const UPDATE_EVENT_VALUE_BASE = 0x100
    const DEFAULT_EVENT_LOOP_INTERVAL = 100

    /**
     * state/trigger id:name
     */
    namespace mname {
        /**
         * id:0 - INITIAL/FINAL/Completion Transition.
         */
        export const NONE_ID = 0   // id:0 - INITIAL/FINAL/Completion Transition

        /**
         * name:"" - INITIAL/FINAL/Completion Transition.
         */
        export const NONE_STR = ""

        /**
         * array of state/trigger name, index is id.
         * default: [NONE_STR,]
         */
        let nameList: string[] = [NONE_STR,]

        /**
         * get id, new if undefined
         * @param name state name or trigger name
         * @returns state/trigger id
         */
        export function getIdOrNew(name: string) {
            let idx = nameList.indexOf(name)
            if (0 > idx) {
                idx = nameList.length
                nameList.push(name)
            }
            return idx
        }

        /**
         * get name
         * @param id state/trigger id
         * @returns state/trigger name: "[<id>]" if undefined id
         */
        export function getName(id: number) {
            if (0 <= id && nameList.length > id) {
                return nameList[id]
            }
            return "[" + id + "]"
        }
    }

    /**
     * state machine
     */
    namespace mmachine {

        /**
         * transition canceled
         */
        const TRANSITION_CANCELED = -1

        /**
         * Entry/Exit Action
         */
        export class EntryExitAction {

            /**
             * execute Entry.
             */
            execute: () => void

            /**
             * constructor
             * @param cb code to run
             */
            constructor(cb: () => void) {
                this.execute = cb
            }
        }

        /**
         * Do Activity
         */
        export class DoActivity {

            // callback
            _cb: () => void
            _ms: number
            nextTick: number

            /**
             * constructor
             * @param ms interval (ms)
             * @param cb code to run
             */
            constructor(ms: number, cb: () => void) {
                this._cb = cb
                this._ms = ms
                this.nextTick = -1  // force callback
            }

            /**
             * execute DO
             * @param tick the number of milliseconds elapsed since power on, control.millis().
             */
            execute(tick: number) {
                if (tick > this.nextTick) {
                    this._cb()
                    this.nextTick = tick + this._ms
                }
            }
        }

        /**
         * Transition
         */
        export class Transition {
            /**
             * array of state id, transition to.
             */
            toList: number[]
            /**
             * trigger id.
             */
            trigger: number
            /**
             * execute Transition.
             */
            execute: () => void

            /**
             * constructor
             * @param toList array of state id, transition to
             * @param trigger trigger id
             * @param cb run to code, () => void
             */
            constructor(toList: number[], trigger: number, cb: () => void) {
                this.toList = toList
                this.trigger = trigger
                this.execute = cb
            }
        }

        class State {
            /**
             * state id.
             */
            state: number
            /**
             * array of entry action
             */
            entryActions: EntryExitAction[]
            /**
             * array of do activity
             */
            doActivities: DoActivity[]
            /**
             * array of exit action
             */
            exitActions: EntryExitAction[]
            /**
             * array of transition
             */
            transitions: Transition[]

            constructor(state: number) {
                this.state = state
                this.entryActions = []
                this.doActivities = []
                this.exitActions = []
                this.transitions = []
            }
        }

        /**
         * trigger and args
         */
        class TriggerWithArgs {
            /**
             * trigger id.
             */
            trigger: number
            /**
             * trigger args.
             */
            args: number[]

            /**
             * constructor
             * @param trigger trigger id
             * @param args trigger args
             */
            constructor(trigger: number, args: number[]) {
                this.trigger = trigger
                this.args = args
            }
        }

        enum ProcState {
            Idle,
            Start,
            Into,
            Enter,
            Do,
            CompletionTransit,
            Pause,
            TriggeredTransit,
            Exit
        }

        class StateMachine {

            /**
             * machine id
             */
            machine: number

            // system
            _initialized: boolean
            _updateEventId: number
            _updateEventValue: number   // non-zero values, zero is wildcard (MICROBIT_EVT_ANY).
            _eventLoopInterval: number

            /**
             * next proc
             */
            _procNext: ProcState

            /**
             * default state id for start.
             */
            _defaultState: number

            /**
             * array of state.
             */
            _states: State[]

            /**
             * current state
             */
            _state: State

            /**
             * trigger queue, array of TriggerWithArgs.
             */
            _triggerQueue: TriggerWithArgs[]

            // selectable taransition
            selectedToAt: number   // >=0: selected, = -1 (TRANSITION_CANCELED): unselected

            // current transition
            _transitTo: number

            // current trigger args
            triggerArgs: number[]

            // reset on into.
            timeoutMillis: number

            /**
             * constructor
             * The state machine ID is used as the event value, so it must be greater than 0
             * @param machine state machine ID (>0)
             */
            constructor(machine: number) {
                this.machine = machine
                // system
                this._initialized = false
                this._updateEventId = DEFAULT_UPDATE_EVENT_ID
                this._updateEventValue = machine + UPDATE_EVENT_VALUE_BASE
                this._eventLoopInterval = DEFAULT_EVENT_LOOP_INTERVAL
                this._defaultState = mname.NONE_ID

                this._states = []

                // current
                this._state = undefined

                // (Triggers[]) triggers
                this._triggerQueue = []

                // current transition
                this._transitTo = TRANSITION_CANCELED

                // current trigger args
                this.triggerArgs = []

                // selectable taransition
                this.selectedToAt = TRANSITION_CANCELED

                // proc
                this._procNext = ProcState.Idle

            }

            /**
             * get State instance, or new.
             * @param stete state id
             * @returns instance of State, undefined if NONE_ID. 
             */
            getStateOrNew(state: number) {
                if (mname.NONE_ID < state) {
                    const obj = this._states.find(item => state == item.state)
                    if (undefined !== obj) {
                        return obj
                    }
                    const newObj = new State(state)
                    this._states.push(newObj)
                    return newObj
                }
                return undefined
            }

            _doCallbackSelectable(transition: Transition, triggerArgs: number[]) {
                this.selectedToAt = TRANSITION_CANCELED    // reset
                this.triggerArgs = triggerArgs             // current trigger args
                transition.execute()                        // callback
                if (0 <= this.selectedToAt && transition.toList.length > this.selectedToAt) {
                    // selected
                    this._transitTo = transition.toList[this.selectedToAt]
                    return true
                }
                return false
            }

            // Completion Transition
            _procCompletionTransition() {
                const emptyArgs: number[] = []
                const transitions = this._state.transitions.filter(item => mname.NONE_ID == item.trigger)
                for (const transition of transitions) {
                    if (this._doCallbackSelectable(transition, emptyArgs)) {
                        return true
                    }
                }
                return false
            }

            // Triggered Transition
            _procTriggeredTransition() {
                while (0 < this._triggerQueue.length) {
                    const triggerAndArgs = this._triggerQueue.shift()
                    const transitions = this._state.transitions.filter(item => triggerAndArgs.trigger == item.trigger)
                    for (const transition of transitions) {
                        if (this._doCallbackSelectable(transition, triggerAndArgs.args)) {
                            return true
                        }
                    }
                }
                return false
            }

            _update() {
                let loop = true
                do {
                    switch (this._procNext) {
                        case ProcState.Start:
                            this._transitTo = this._defaultState
                            this._procNext = ProcState.Into
                            break;
                        case ProcState.Into:
                            this._state = this.getStateOrNew(this._transitTo)
                            this.timeoutMillis = control.millis()
                            if (undefined !== this._state) {
                                for (const v of this._state.doActivities) {
                                    v.nextTick = -1
                                }
                                this._procNext = ProcState.Enter
                            } else {
                                // (INITIAL or FINAL)
                                while (0 < this._triggerQueue.length) {
                                    this._triggerQueue.shift()
                                }
                                this._procNext = ProcState.Idle
                            }
                            break;
                        case ProcState.Enter:
                            for (const v of this._state.entryActions) {
                                v.execute()
                            }
                            this._procNext = ProcState.Do
                            break;
                        case ProcState.Do:
                            const tick = control.millis()
                            for (const v of this._state.doActivities) {
                                v.execute(tick)
                            }
                            this._procNext = ProcState.CompletionTransit
                            break;
                        case ProcState.CompletionTransit:
                            if (this._procCompletionTransition()) {
                                this._procNext = ProcState.Exit
                            } else {
                                this._procNext = ProcState.Pause
                                loop = false    // break
                            }
                            break;
                        case ProcState.Pause:
                            this._procNext = ProcState.TriggeredTransit
                            break;
                        case ProcState.TriggeredTransit:
                            if (this._procTriggeredTransition()) {
                                this._procNext = ProcState.Exit
                            } else {
                                this._procNext = ProcState.Do
                            }
                            break;
                        case ProcState.Exit:
                            for (const v of this._state.exitActions) {
                                v.execute()
                            }
                            this._procNext = ProcState.Into
                            break;
                        case ProcState.Idle:
                        default:
                            loop = false    // break
                            break;
                    }
                } while (loop)
            }

            start(state: number): boolean {
                if (!this._initialized) {
                    this._initialized = true
                    const that: StateMachine = this
                    // update event handler
                    control.onEvent(that._updateEventId, that._updateEventValue, function () {
                        that._update()
                    })
                    // update event loop
                    loops.everyInterval(that._eventLoopInterval, function () {
                        if (ProcState.Idle != this._procNext) {
                            control.raiseEvent(that._updateEventId, that._updateEventValue)
                        }
                    })
                }
                if (ProcState.Idle == this._procNext) {
                    this._defaultState = state
                    this._procNext = ProcState.Start
                    // update event
                    control.raiseEvent(this._updateEventId, this._updateEventValue)
                    return true
                } else {
                    return false
                }
            }

            send(trigger: number, args: number[]) {
                if (ProcState.Idle != this._procNext) {
                    // queuing
                    const triggerWithArgs = new TriggerWithArgs(trigger, args)
                    this._triggerQueue.push(triggerWithArgs)
                    // update event
                    control.raiseEvent(this._updateEventId, this._updateEventValue)
                }
            }
        }

        // state machine
        let stateMachineList: StateMachine[] = []

        export function getStateMachine(machine: StateMachines) {
            const obj = stateMachineList.find(item => machine == item.machine)
            if (obj) {
                return obj
            }
            const newObj = new StateMachine(machine)
            stateMachineList.push(newObj)
            return newObj
        }
    }

    /**
     * convert state/trigger name (string) to id (number): new id if undefined
     * @param name state name (string) or trigger name (string)
     * @returns state id or trigger id
     */
    //% block="id of $name"
    //% name.defl="a"
    //% weight=210
    //% advanced=true
    export function convId(name: string): number {
        return mname.getIdOrNew(name.split(":", 1)[0])
    }

    /**
     * convert id (number) to state/trigger name (string)
     * @param id state id or trigger id
     * @returns state name (string) or trigger name (string): "[<id>]" if undefined
     */
    //% block="name of $id"
    //% weight=200
    //% advanced=true
    export function convName(id: number): string {
        return mname.getName(id)
    }

    /**
     * Internal event settings
     * @param aStateMachine StateMachines
     * @param eventId Event ID (default: 32868 = 32768 + 100)
     * @param ms Event loop interval (default: 100ms)
     */
    //% block="settings [$aStateMachine] event ID: $eventId every: $ms ms"
    //% aStateMachine.defl=StateMachines.M0
    //% eventId.defl=32768
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    export function settingsMachineEvent(aStateMachine: StateMachines, eventId: number, ms: number) {
        const machine = mmachine.getStateMachine(aStateMachine)
        if (!machine._initialized) {
            machine._updateEventId = eventId
            machine._eventLoopInterval = ms
        }
    }

    /**
     * define state
     * @param aStateMachine StateMachines
     * @param aStateName state name
     * @param body code to run, (machine: machine ID, state: state ID)
     */
    //% block="define [$machine,$state] to $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% draggableParameters="reporter"
    //% weight=180
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string,
        body: (machine: number, state: number) => void
    ) {
        body(aStateMachine, convId(aStateName))
        // uml
        _simuStateUml(aStateMachine, aStateName)
    }

    /**
     * declare ENTRY action.
     * @param aMachine machine ID
     * @param aState state ID
     * @param body code to run
     */
    //% block="on entry [$aMachine,$aState]"
    //% aMachine.defl=0
    //% aState.defl=0
    //% handlerStatement
    //% weight=170
    //% group="Declare"
    export function declareEntry(aMachine: number, aState: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).entryActions.push(new mmachine.EntryExitAction(body))
    }

    /**
     * declare DO activity.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aEvery interval time (milliseconds)
     * @param body code to run
     */
    //% block="on do [$aMachine,$aState] every $aEvery ms"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aEvery.shadow="timePicker"
    //% handlerStatement
    //% weight=160
    //% group="Declare"
    export function declareDo(aMachine: number, aState: number, aEvery: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).doActivities.push(new mmachine.DoActivity(aEvery, body))
    }

    /**
     * declare EXIT action.
     * @param aMachine machine ID
     * @param aState state ID
     * @param body code to run
     */
    //% block="on exit [$aMachine,$aState]"
    //% aMachine.defl=0
    //% aState.defl=0
    //% handlerStatement
    //% weight=150
    //% group="Declare"
    export function declareExit(aMachine: number, aState: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).exitActions.push(new mmachine.EntryExitAction(body))
    }

    /**
     * declare simple transition.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTriggerName trigger name
     * @param aToName next state nam
     */
    //% block="trasition [$aMachine,$aState] when $aTriggerName to $aToName"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aTriggerName.defl="e"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=140
    //% group="Transition"
    export function declareSimpleTransition(aMachine: number, aState: number, aTriggerName: string, aToName: string) {
        declareCustomTransition(aMachine, aState, aTriggerName, [aToName], function () {
            mstate.transitTo(aMachine, 0)
        })
    }

    /**
     * declare timeouted transition.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aMs timeout (ms)
     * @param aToName next state name
     */
    //% block="trasition [$aMachine,$aState] timeouted $aMs to $aToName"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aMs.shadow="timePicker"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=130
    //% group="Transition"
    export function declareTimeoutedTransition(aMachine: number, aState: number, aMs: number, aToName: string) {
        declareCustomTransition(aMachine, aState, "", [aToName], function () {
            if (mstate.isTimeouted(aMachine, aMs)) {
                mstate.transitTo(aMachine, 0)
            }
        })
    }

    /**
     * declare custom transition.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTriggerName trigger name
     * @param aTransList array of next state name 
     * @param body code to run
     */
    //% block="trasition [$aMachine,$aState] when $aTriggerName $args to $aTransList"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aTriggerName.defl="e"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=120
    //% group="Transition"
    export function declareCustomTransition(aMachine: number, aState: number, aTriggerName: string, aTransList: string[],
        body: () => void
    ) {
        const trigger = convId(aTriggerName)
        const toList: number[] = []
        for (const s of aTransList) {
            toList.push(convId(s))
        }
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).transitions.push(new mmachine.Transition(toList, trigger, body))
        // uml
        _simuTransitionUml(aMachine, aState, aTransList)
    }

    /**
     * is timeouted.
     * @param aMachine machine ID
     * @param aMs timeout (milliseconds)
     */
    //% block="timeouted [$aMachine] $aMs"
    //% aMachine.defl=0
    //% aMs.shadow="timePicker"
    //% weight=110
    //% group="Transition"
    export function isTimeouted(aMachine: number, aMs: number): boolean {
        return control.millis() > mmachine.getStateMachine(aMachine).timeoutMillis + aMs
    }

    /**
     * trigger args.
     * @param aMachine machine ID
     * @returns trigger args
     */
    //% block="trigger args [$aMachine]"
    //% aMachine.defl=0
    //% weight=105
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aMachine: number): number[] {
        return mmachine.getStateMachine(aMachine).triggerArgs
    }

    /**
     * transit to.
     * @param aMachine machine ID
     * @param index states index]
     */
    //% block="transit [$aMachine] at $index"
    //% aMachine.defl=0
    //% index.defl=0
    //% weight=100
    //% group="Transition"
    export function transitTo(aMachine: number, index: number) {
        mmachine.getStateMachine(aMachine).selectedToAt = index
    }

    /**
     * send trigger
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     */
    //% block="send $aStateMachine $aTriggerName"
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=95
    //% group="Command"
    export function send(aStateMachine: StateMachines, aTriggerName: string) {
        sendWith(aStateMachine, aTriggerName, [])
    }

    /**
     * send trigger with args
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     * @param aTriggerArgs args
     */
    //% block="send $aStateMachine $aTriggerName $aTriggerArgs"
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=90
    //% group="Command"
    //% advanced=true
    export function sendWith(aStateMachine: StateMachines, aTriggerName: string, aTriggerArgs: number[]) {
        mmachine.getStateMachine(aStateMachine).send(convId(aTriggerName), aTriggerArgs)
    }

    /**
     * start state machine
     * @param aStateMachine StateMachines
     * @param aStateName default state name
     */
    //% block="start $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% weight=80
    //% group="Command"
    export function start(aStateMachine: StateMachines, aStateName: string) {
        mmachine.getStateMachine(aStateMachine).start(convId(aStateName))
    }

    /**
     * export UML, PlantUML
     * PlantUML Web server: http://www.plantuml.com/plantuml/
     * @param aStateMachine
     * @param aStateName default state
     */
    //% block="UML $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% weight=70
    //% group="Command"
    //% shim=mstate::simu_export_uml
    //% advanced=true
    export function exportUml(aStateMachine: StateMachines, aStateName: string) {
        // for the simulator
        const cb = console.log
        cb("@startuml")
        //cb("' PlantUML Web server:")
        cb("' http://www.plantuml.com/plantuml/")
        // top state - machine name
        cb("state __M" + aStateMachine + "__ {")

        // start
        cb("[*] --> " + aStateName)

        // target machine
        const target = mmachine.getStateMachine(aStateMachine)
        for (const state of target._states) {
            // state
            const descStatePart = (state as any)["descState"] ? " : " + (state as any)["descState"] : ""
            cb("state " + mstate.convName(state.state) + descStatePart)
            for (const trans of state.transitions) {
                // transition
                const trigger = mstate.convName(trans.trigger)
                for (const descTo of ((trans as any)["descToList"] as string[])) {
                    let arrow = true
                    let toName: string
                    let desc: string
                    const pos = descTo.indexOf(":")
                    if (0 <= pos) {
                        toName = descTo.slice(0, pos)
                        desc = descTo.slice(pos + 1)
                    } else {
                        toName = descTo
                        desc = undefined
                    }
                    if (toName == "") {
                        toName = "[*]"
                    }
                    let triggerPart = ""
                    if (trigger) {
                        triggerPart = triggerPart + trigger
                    }
                    if (desc) {
                        if (":" == desc.charAt(0)) {
                            arrow = false
                            desc = desc.slice(1)
                        }
                        const a = desc.split("/", 2)
                        if (a[0]) {
                            triggerPart = triggerPart + " [" + a[0] + "]"
                        }
                        if (a[1]) {
                            triggerPart = triggerPart + " / " + a[1]
                        }
                    }
                    if (triggerPart) {
                        triggerPart = " : " + triggerPart
                    }
                    if (arrow) {
                        cb(mstate.convName(state.state) + " --> " + toName + triggerPart)
                    } else {
                        cb("state " + mstate.convName(state.state) + ": --> " + toName + triggerPart)
                    }
                }
            }
        }

        cb("}") // top state - machine name
        cb("@enduml")
    }

    /**
     * UML state
     * @param aMachine  machine ID
     * @param aStateName state name
     */
    //% block
    //% shim=mstate::simu_state_uml
    //% blockHidden=true
    //% advanced=true
    export function _simuStateUml(aMachine: number, aStateName: string) {
        // for the simulator
        const pos = aStateName.indexOf(":")
        if (0 <= pos) {
            const name = aStateName.slice(0, pos)
            const state: any = mmachine.getStateMachine(aMachine).getStateOrNew(convId(name))
            state["descState"] = aStateName.slice(pos + 1)
        }
    }

    /**
     * UML transition
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTransList array of next state name
     */
    //% block
    //% shim=mstate::simu_transition_uml
    //% blockHidden=true
    //% advanced=true
    export function _simuTransitionUml(aMachine: number, aState: number, aTransList: string[]) {
        // for the simulator
        const state = mmachine.getStateMachine(aMachine).getStateOrNew(aState)
        const lastTrans: any = state.transitions[(state.transitions.length - 1)]
        lastTrans["descToList"] = aTransList
    }

}
