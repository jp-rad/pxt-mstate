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
         * Entry Action
         */
        class EntryAction {
            /**
             * state id.
             */
            state: number

            /**
             * execute Entry.
             */
            execute: () => void

            /**
             * constructor
             * @param state state id
             * @param cb code to run
             */
            constructor(state: number, cb: () => void) {
                this.state = state
                this.execute = cb
            }
        }

        /**
         * Do Activity
         */
        class DoActivity {
            /**
             * state id.
             */
            state: number

            // callback
            _cb: () => void
            _ms: number
            _nextTick: number

            /**
             * constructor
             * @param state (States) state
             * @param ms interval (ms)
             * @param cb code to run
             */
            constructor(state: number, ms: number, cb: () => void) {
                this.state = state
                this._cb = cb
                this._ms = ms
                this._nextTick = -1
            }

            /**
             * force callback, execute DO
             */
            forceTick() {
                this._nextTick = -1
            }

            /**
             * execute DO
             * @param tick the number of milliseconds elapsed since power on, control.millis().
             */
            execute(tick: number) {
                if (tick > this._nextTick) {
                    this._cb()
                    this._nextTick = tick + this._ms
                }
            }
        }

        /**
         * Transition
         */
        class Transition {
            /**
             * state id, transition from.
             */
            state: number
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
             * @param triggerArgs trigger args. 
             */
            execute: (triggerArgs: number[]) => void

            /**
             * constructor
             * @param state state id, transition from
             * @param toList array of state id, transition to
             * @param trigger trigger id
             * @param cb run to code, (triggerArgs: number[]) => void
             */
            constructor(state: number, toList: number[], trigger: number, cb: (triggerArgs: number[]) => void) {
                this.state = state
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
            entryActions: EntryAction[]
            /**
             * array of do activity
             */
            doActivities: DoActivity[]
            /**
             * array of transition
             */
            transitions: Transition[]

            constructor(state: number) {
                this.state = state
                this.entryActions = []
                this.doActivities = []
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
            Panic,
            Idle,
            Start,
            Into,
            Enter,
            Do,
            Transit,
            Pause
        }

        enum ProcNextBehavior {
            Break,
            Loop,
            Event
        }

        class StateMachine {

            /**
             * machine id
             */
            machine: number

            // system
            _initialized: boolean
            _updateEventId: number
            _eventLoopInterval: number
            _enabledUpdateEvent: boolean

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
            _selectedToAt: number   // >=0: selected, TRANSITION_CANCELED: unselected

            // current transition
            _transitTo: number

            // reset on into.
            _timeoutMillis: number

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
                this._eventLoopInterval = DEFAULT_EVENT_LOOP_INTERVAL
                this._enabledUpdateEvent = false
                this._defaultState = mname.NONE_ID

                this._states = []
                
                // current
                this._state = undefined

                // (Triggers[]) triggers
                this._triggerQueue = []

                // current transition
                this._transitTo = TRANSITION_CANCELED

                // selectable taransition
                this._selectedToAt = TRANSITION_CANCELED

                // proc
                this._procNext = ProcState.Idle

            }

            /**
             * get State instance, or new.
             * @param stete state id
             * @returns instance of State, undefined if NONE_ID. 
             */
            _getStateOrNew(state: number) {
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

            declareEntry(state: number, cb: () => void) {
                if (ProcState.Idle == this._procNext) {
                    const objState = this._getStateOrNew(state)
                    objState.entryActions.push(new EntryAction(state, cb))
                }
            }

            declareDo(state: number, ms: number, cb: () => void) {
                if (ProcState.Idle == this._procNext) {
                    const objState = this._getStateOrNew(state)
                    objState.doActivities.push(new DoActivity(state, ms, cb))
                }
            }

            declareTransition(state: number, trigger: number, toList: number[], cb: (triggerArgs: number[]) => void) {
                if (ProcState.Idle == this._procNext) {
                    const objState = this._getStateOrNew(state)
                    objState.transitions.push(new Transition(state, toList, trigger, cb))
                }
            }

            _procStart() {
                this._transitTo = this._defaultState
            }

            _procInto() {
                this._state = this._getStateOrNew(this._transitTo)
                this._timeoutMillis = control.millis()
            }

            _procEnter() {
                for (const v of this._state.entryActions) {
                    v.execute()
                }
            }

            _procDo() {
                const tick = control.millis()
                for (const v of this._state.doActivities) {
                    v.execute(tick)
                }
            }

            _doCallbackSelectable(transition: Transition, triggerArgs: number[]) {
                this._selectedToAt = TRANSITION_CANCELED    // reset
                transition.execute(triggerArgs)             // callback
                if (0 <= this._selectedToAt && transition.toList.length > this._selectedToAt) {
                    // selected
                    this._transitTo = transition.toList[this._selectedToAt]
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

            _proc(): ProcNextBehavior {
                let ret = ProcNextBehavior.Loop // (default) loop
                switch (this._procNext) {
                    case ProcState.Idle:
                        ret = ProcNextBehavior.Break    // break
                        break;
                    case ProcState.Start:
                        this._procStart()
                        this._procNext = ProcState.Into
                        ret = ProcNextBehavior.Event    // event, for start() function.
                        break;
                    case ProcState.Into:
                        this._procInto()
                        if (this._state) {
                            this._procNext = ProcState.Enter
                        } else {
                            // (INITIAL or FINAL)
                            this._procNext = ProcState.Idle
                        }
                        break;
                    case ProcState.Enter:
                        this._procEnter()
                        this._procNext = ProcState.Do
                        break;
                    case ProcState.Do:
                        this._procDo()
                        this._procNext = ProcState.Transit
                        ret = ProcNextBehavior.Event    // event
                        break;
                    case ProcState.Transit:
                        if (this._procCompletionTransition()) {
                            this._procNext = ProcState.Into
                        } else if (this._procTriggeredTransition()) {
                            this._procNext = ProcState.Into
                        } else {
                            this._procNext = ProcState.Do
                        }
                        break;
                    default:
                        // panic
                        this._procNext = ProcState.Panic
                        ret = ProcNextBehavior.Break    // break
                        break;
                }
                return ret
            }

            _update() {
                let next: ProcNextBehavior
                do {
                    next = this._proc()
                } while (ProcNextBehavior.Loop == next)
                this._enabledUpdateEvent = (ProcNextBehavior.Event == next)
            }

            _raiseUpdateEvent(force: boolean = false) {
                if (force || this._enabledUpdateEvent) {
                    control.raiseEvent(this._updateEventId, this.machine)
                }
            }

            _initialize() {
                if (!this._initialized) {
                    this._initialized = true
                    const inst: StateMachine = this
                    // update event handler
                    const updateEventId = this._updateEventId
                    const machineId = this.machine
                    control.onEvent(updateEventId, machineId, function () {
                        inst._update()
                    })
                    // update event loop
                    const eventLoopInterval = this._eventLoopInterval
                    loops.everyInterval(eventLoopInterval, function () {
                        inst._raiseUpdateEvent()
                    })
                }
            }

            start(state: number): boolean {
                this._initialize()
                if (ProcState.Idle == this._procNext) {
                    this._defaultState = state
                    this._procNext = ProcState.Start
                    this._update()
                    return true
                } else {
                    return false
                }
            }

            fire(trigger: number, args: number[]) {
                if ((ProcState.Idle != this._procNext) && (ProcState.Panic != this._procNext)) {
                    // queuing
                    const triggerArgs = new TriggerWithArgs(trigger, args)
                    this._triggerQueue.push(triggerArgs)
                    // update event
                    this._raiseUpdateEvent(true)
                }
            }

            selectToAt(index: number) {
                this._selectedToAt = index
            }

            timeouted(ms: number) {
                return control.millis() > this._timeoutMillis + ms
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
    export function convId(name: string): number {
        return mname.getIdOrNew(name)
    }

    /**
     * convert id (number) to state/trigger name (string)
     * @param id state id or trigger id
     * @returns state name (string) or trigger name (string): "[<id>]" if undefined
     */
    //% block="name of $id"
    //% weight=200
    export function convName(id: number): string {
        return mname.getName(id)
    }

    /**
     * define state
     * @param aStateMachine StateMachines
     * @param aStateName state name
     * @param body code to run, (machine: machine ID, state: state ID)
     */
    //% block="define [$machine,$state] to $aStateMachine $aStateName"
    //% aStateMachine.defl=Machines.M0
    //% aStateName.defl="a"
    //% draggableParameters="reporter"
    //% weight=140
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string,
        body: (machine: number, state: number) => void
    ) {
        body(aStateMachine, convId(aStateName))
    }

    /**
     * declare ENTRY action.
     * prev is a previous state.
     * @param aMachine machine ID
     * @param aState state ID
     * @param body code to run
     */
    //% block="on entry [$aMachine,$aState]"
    //% aMachine.defl=0
    //% aState.defl=0
    //% handlerStatement
    //% weight=130
    //% group="Declare"
    export function declareEntry(aMachine: number, aState: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).declareEntry(aState, body)
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
    //% weight=120
    //% group="Declare"
    export function declareDo(aMachine: number, aState: number, aEvery: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).declareDo(aState, aEvery, body)
    }

    /**
     * declare selectable transition.
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
    //% weight=150
    //% group="Transition"
    export function declareTransition(aMachine: number, aState: number, aTriggerName: string, aTransList: string[],
        body: (args: number[]) => void
    ) {
        const trigger = convId(aTriggerName)
        let toList: number[] = []
        for (const s of aTransList) {
            toList.push(convId(s))
        }
        mmachine.getStateMachine(aMachine).declareTransition(aState, trigger, toList, body)
    }

    /**
     * is timeouted.
     * @param aMachine machine ID
     * @param aMs timeout (milliseconds)
     */
    //% block="timeouted [$aMachine] $aMs"
    //% aMachine.defl=0
    //% aMs.shadow="timePicker"
    //% weight=125
    //% group="Transition"
    export function isTimeouted(aMachine: number, aMs: number): boolean {
        return mmachine.getStateMachine(aMachine).timeouted(aMs)
    }

    /**
     * transit to.
     * @param aMachine machine ID
     * @param index states index]
     */
    //% block="transit [$aMachine] at $index"
    //% aMachine.defl=0
    //% index.defl=0
    //% weight=110
    //% group="Transition"
    export function transitTo(aMachine: number, index: number) {
        mmachine.getStateMachine(aMachine).selectToAt(index)
    }

    /**
     * fire trigger
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     * @param aTriggerArgs args
     */
    //% block="fire $aStateMachine $aTriggerName $aTriggerArgs"
    //% aStateMachine.defl=Machines.M0
    //% aTriggerName.defl="e"
    //% weight=100
    //% group="Command"
    export function fire(aStateMachine: StateMachines, aTriggerName: string, aTriggerArgs: number[]) {
        mmachine.getStateMachine(aStateMachine).fire(convId(aTriggerName), aTriggerArgs)
    }

    /**
     * start state machine
     * @param aStateMachine StateMachines
     * @param aStateName default state name
     */
    //% block="start $aStateMachine $aStateName"
    //% aStateMachine.defl=Machines.M0
    //% aStateName.defl="a"
    //% weight=90
    //% group="Command"
    export function start(aStateMachine: StateMachines, aStateName: string) {
        mmachine.getStateMachine(aStateMachine).start(convId(aStateName))
    }

}
