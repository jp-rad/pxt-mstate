
const MICROBIT_CUSTOM_ID_BASE = 32768
const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 100
const UPDATE_EVENT_VALUE_BASE = 0x100
const DEFAULT_EVENT_LOOP_INTERVAL = 100

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
         * machine id (>0)
         * The state machine ID is used as the event value, so it must be greater than 0
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
            transition.execute()                       // callback
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

    /**
     * get or create StateMachine
     * @param machine machine ID (>0)
     * @returns instance of StateMachine
     */
    export function getStateMachine(machine: number) {
        if (0 >= machine) {
            return undefined
        }
        const obj = stateMachineList.find(item => machine == item.machine)
        if (obj) {
            return obj
        }
        const newObj = new StateMachine(machine)
        stateMachineList.push(newObj)
        return newObj
    }
}
