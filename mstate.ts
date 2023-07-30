/**
 * mstate blocks
 */
//% weight=100 color="#4C97FF" icon="\uf362"
//% groups="['Action', 'Command', 'Declare', 'Design', 'Transition']"
namespace mstate {

    const CHAR_ASTERISK = "*"   // asterisk charactor "*"
    const STATE_INITIAL = -2    // "*"(INITIAL)
    const STATE_FINAL = -1      // "*"(FINAL)
    const TRIGGER_NONE = 0      // ""(completion)

    const MICROBIT_CUSTOM_ID_BASE = 32768
    const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 100
    const DEFAULT_EVENT_LOOP_INTERVAL = 100

    const DEFAULT_STATE_MACHINE_NAME = "(default)"

    /**
     * EntryAction
     */
    class EntryAction {
        _state: number
        _cb: (prev: number) => void

        /**
         * constructor
         * @param state (States) state
         * @param cb code to run
         */
        constructor(state: number, cb: (prev: number) => void) {
            this._state = state
            this._cb = cb
        }

        /**
         * (States) state
         */
        get state() { return this._state }

        /**
         * execute ENTRY
         * @param prev (States) previous state
         */
        execute(prev: number) { this._cb(prev) }
    }

    /**
     * DoAction
     */
    class DoAction {
        // declare
        _state: number
        _ms: number
        _cb: () => void

        // callback tick
        _lastTick: number
        _nextTick: number
        _forceTick: boolean

        /**
         * constructor
         * @param state (States) state
         * @param ms interval (ms)
         * @param cb code to run
         */
        constructor(state: number, ms: number, cb: () => void) {
            this._state = state
            this._ms = ms
            this._cb = cb
            this._lastTick = control.millis()
            this._nextTick = this._lastTick
            this._forceTick = true
        }

        /**
         * (States) state
         */
        get state() { return this._state }

        /**
         * execute DO
         */
        execute() {
            const tick = control.millis()
            if (this._forceTick || (tick > this._nextTick)) {
                this._cb()
                this._forceTick = false
                this._lastTick = tick
                this._nextTick = tick + this._ms
            }
        }

        /**
         * force callback, execute DO
         */
        forceTick() {
            this._forceTick = true
        }
    }

    /**
     * ExitAction
     */
    class ExitAction {
        // declare
        _state: number
        _cb: (next: number) => void

        /**
         * constructor
         * @param state (States) state
         * @param cb code to run
         */
        constructor(state: number, cb: (next: number) => void) {
            this._state = state
            this._cb = cb
        }

        /**
         * (States) state
         */
        get state() { return this._state }

        /**
         * execute EXIT
         * @param next (States) next state
         */
        execute(next: number) { this._cb(next) }
    }

    /**
     * Transition
     */
    class Transition {
        // declare
        _from: number
        _to: number
        _trigger: number

        /**
         * constructor
         * @param from (States) state, transition from
         * @param to (States) state, transition to
         * @param trigger (Triggers) trigger
         */
        constructor(from: number, to: number, trigger: number) {
            this._from = from
            this._to = to
            this._trigger = trigger
        }

        /**
         * (States) state, transition from
         */
        get from() { return this._from }

        /**
         * (States) state, transition to
         */
        get to() { return this._to }

        /**
         * (Triggers) trigger
         */
        get trigger() { return this._trigger }
    }

    enum Procs {
        Idle,
        Start,
        Into,
        Enter,
        Do,
        Exit,
        Transit,
        Panic
    }

    enum ProcNext {
        Break,
        Loop,
        Event
    }

    class StateMachine {

        // system
        _machineId: number
        _macnineName: string
        _initialized: boolean
        _updateEventId: number
        _eventLoopInterval: number
        _enabledUpdateEvent: boolean

        // declare
        _declareEntryActions: EntryAction[]
        _declareDoActions: DoAction[]
        _declareExitActions: ExitAction[]
        _declareTransitions: Transition[]

        // current state
        _state: number
        _entryActions: EntryAction[]
        _doActions: DoAction[]
        _exitActions: ExitAction[]
        _transitions: Transition[]
        _completionTransition: Transition

        // proc
        _defaultState: number
        _procNext: Procs

        // (Triggers[]) triggers
        _triggerQueue: number[]

        // current transition
        _transitFrom: number
        _transitTo: number

        /**
         * constructor
         * The state machine ID is used as the event value, so it must be greater than 0
         * @param id state machine ID (>0)
         * @param name state machine name
         */
        constructor(id: number, name: string) {
            this._machineId = id
            this._macnineName = name
            this._initialized = false
            this._updateEventId = DEFAULT_UPDATE_EVENT_ID
            this._eventLoopInterval = DEFAULT_EVENT_LOOP_INTERVAL
            this._enabledUpdateEvent = false
            this._declareEntryActions = []
            this._declareDoActions = []
            this._declareExitActions = []
            this._declareTransitions = []
            this._state = STATE_INITIAL    // initial
            this._entryActions = []
            this._doActions = []
            this._exitActions = []
            this._transitions = []
            this._completionTransition = undefined
            this._defaultState = STATE_FINAL
            this._procNext = Procs.Idle
            this._triggerQueue = []
            this._transitFrom = STATE_FINAL  // terminate
            this._transitTo = STATE_INITIAL    // initial
        }

        get machineId() { return this._machineId }

        get machineName() { return this._macnineName }

        declareEntry(state: number, cb: (prev: number) => void) {
            const item = new EntryAction(state, cb)
            this._declareEntryActions.push(item)
        }

        declareDo(state: number, ms: number, cb: () => void) {
            const item = new DoAction(state, ms, cb)
            this._declareDoActions.push(item)
        }

        declareExit(state: number, cb: (next: number) => void) {
            const item = new ExitAction(state, cb)
            this._declareExitActions.push(item)
        }

        declareTransition(from: number, to: number, trigger: number) {
            const item = new Transition(from, to, trigger)
            this._declareTransitions.push(item)
        }

        _procStart() {
            this._transitFrom = STATE_INITIAL
            this._transitTo = this._defaultState
        }

        _procInto() {
            const next = this._transitTo
            // current state
            this._state = next
            this._entryActions = this._declareEntryActions.filter((item) => item.state == next)
            this._doActions = this._declareDoActions.filter((item) => {
                if (item.state == next) {
                    item.forceTick()
                    return true
                } else {
                    return false
                }
            })
            this._exitActions = this._declareExitActions.filter((item) => item.state == next)
            this._transitions = this._declareTransitions.filter((item) => item.from == next)
            this._completionTransition = this._transitions.find((item) => item.trigger == TRIGGER_NONE)
        }

        _procEnter() {
            const prev = this._transitFrom
            for (const entryProc of this._entryActions) {
                entryProc.execute(prev)
            }
        }

        _procDo() {
            for (const doProc of this._doActions) {
                doProc.execute()
            }
        }

        _procExit() {
            const next = this._transitTo
            for (const exitProc of this._exitActions) {
                exitProc.execute(next)
            }
        }

        _getTransition() {
            // trigger
            while (this._triggerQueue.length > 0) {
                // transit
                const trigger = this._triggerQueue.shift()
                const transition = this._transitions.find((item) => item.trigger == trigger)
                if (transition) {
                    return transition
                }
            }
            // Completion Transition
            if (this._completionTransition) {
                return this._completionTransition
            }
            return undefined
        }

        _procTransit(): boolean {
            const transition = this._getTransition()
            if (transition) {
                this._transitFrom = transition.from
                this._transitTo = transition.to
                return true
            } else {
                return false
            }
        }

        _proc(): ProcNext {
            let ret = ProcNext.Loop // (default) loop
            switch (this._procNext) {
                case Procs.Idle:
                    ret = ProcNext.Break    // break
                    break;
                case Procs.Start:
                    this._procStart()
                    this._procNext = Procs.Into
                    ret = ProcNext.Event    // event, for start() function.
                    break;
                case Procs.Into:
                    this._procInto()
                    if (this._state < 0) {
                        this._procNext = Procs.Idle
                    } else {
                        this._procNext = Procs.Enter
                    }
                    break;
                case Procs.Enter:
                    this._procEnter()
                    this._procNext = Procs.Do
                    break;
                case Procs.Do:
                    this._procDo()
                    this._procNext = Procs.Transit
                    ret = ProcNext.Event    // event
                    break;
                case Procs.Transit:
                    if (this._procTransit()) {
                        this._procNext = Procs.Exit
                    } else {
                        this._procNext = Procs.Do
                    }
                    break;
                case Procs.Exit:
                    this._procExit()
                    this._procNext = Procs.Into
                    break;
                default:
                    // panic
                    this._procNext = Procs.Panic
                    ret = ProcNext.Break    // break
                    break;
            }
            return ret
        }

        _update() {
            let next: ProcNext
            do {
                next = this._proc()
            } while (next == ProcNext.Loop)
            this._enabledUpdateEvent = (next == ProcNext.Event)
        }

        _raiseUpdateEvent(force: boolean = false) {
            if (force || this._enabledUpdateEvent) {
                control.raiseEvent(this._updateEventId, this._machineId)
            }
        }

        _initialize() {
            if (!this._initialized) {
                this._initialized = true
                const inst: StateMachine = this
                // update event handler
                const updateEventId = this._updateEventId
                const machineId = this._machineId
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
            if (this._procNext == Procs.Idle) {
                this._defaultState = state
                this._procNext = Procs.Start
                this._update()
                return true
            } else {
                return false
            }
        }

        fire(trigger: number) {
            // queuing
            this._triggerQueue.push(trigger)
            // update event
            this._raiseUpdateEvent(true)
        }
    }

    // ID-Name conv
    class IdName {
        _id: number
        _name: string
        constructor(id: number, name: string) {
            this._id = id
            this._name = name
        }
        get id() { return this._id }
        get name() { return this._name }
    }

    let idNameList: IdName[] = []

    function getIdOrNew(name: string, isFrom: boolean = false) {
        if (CHAR_ASTERISK == name) {
            if (isFrom) {
                return STATE_INITIAL
            } else {
                return STATE_FINAL
            }
        }
        let obj = idNameList.find((item) => item.name == name)
        if (obj == undefined) {
            obj = new IdName(idNameList.length, name)
            idNameList.push(obj)
        }
        return obj.id
    }

    function convIdToName(id: number) {
        if (id == STATE_INITIAL) {
            return CHAR_ASTERISK
        }
        if (id == STATE_FINAL) {
            return CHAR_ASTERISK
        }
        let obj = idNameList.find((item) => item.id == id)
        if (obj) {
            return obj.name
        } else {
            return undefined
        }
    }

    // default ID { id: 0, name: "" } - const TRIGGER_NONE = 0      // ""(completion)
    getIdOrNew("")

    // state machine
    let stateMachineList: StateMachine[] = []   // {index:0, id:1}, {index:1, id:2}, ... {index:n, id:(n+1)}

    function createStateMachine(name: string) {
        const id = stateMachineList.length + 1
        const machine = new StateMachine(id, name)
        stateMachineList.push(machine)
        return id
    }

    function getStateMachine(id: number) {
        const idx = id - 1
        return stateMachineList[idx]
    }

    const defaultStateMachine: StateMachine = getStateMachine(createStateMachine(DEFAULT_STATE_MACHINE_NAME))

    /**
     * define state
     * @param state state
     * @param body code to run
     */
    //% block="define $STATE to $state"
    //% state.defl="State1"
    //% draggableParameters="reporter"
    //% weight=150
    export function defineStateName(state: string, body: (STATE: string) => void) {
        body(state)
    }

    /**
     * convert id (number) to name (string)
     * @param id state id or trigger id
     * @returns state name (string) or trigger name (string), if undeclared: "[<id>]"
     */
    //% block="name of $id"
    //% weight=140
    export function convName(id: number): string {
        const name = convIdToName(id)
        return name == undefined ? "[" + id + "]" : name
    }

    /**
     * declare ENTRY action.
     * prev is a previous state (id).
     * @param state state
     * @param body code to run
     */
    //% block="on entry from $prev : $state"
    //% state.defl="State1"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=130
    //% group="Action"
    export function declareEntry(state: string, body: (prev: number) => void) {
        defaultStateMachine.declareEntry(
            getIdOrNew(state),
            body
        )
    }

    /**
     * declare DO action.
     * @param state state
     * @param ms interval time (milliseconds)
     * @param body code to run
     */
    //% block="on do every $ms ms : $state"
    //% state.defl="State1"
    //% ms.shadow="timePicker"
    //% handlerStatement
    //% weight=120
    //% group="Action"
    export function declareDo(state: string, ms: number, body: () => void) {
        defaultStateMachine.declareDo(
            getIdOrNew(state),
            ms,
            body
        )
    }

    /**
     * declare EXIT action.
     * next is a next state (id).
     * @param state state
     * @param body code to run
     */
    //% block="on exit to $next : $state"
    //% state.defl="State1"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=110
    //% group="Action"
    export function declareExit(state: string, body: (next: number) => void) {
        defaultStateMachine.declareExit(
            getIdOrNew(state),
            body
        )
    }

    /**
     * declare transition.
     * @param from state from
     * @param to state to
     * @param trigger trigger
     */
    //% block="trasition to $to when $trigger : $from"
    //% from.defl="State1"
    //% to.defl="State2"
    //% trigger.defl="Trigger1"
    //% weight=100
    //% group="Transition"
    export function declareTransition(from: string, to: string, trigger: string) {
        // trigger: "*" --> ""(completion)
        if (CHAR_ASTERISK == trigger) {
            trigger = ""
        }
        defaultStateMachine.declareTransition(
            getIdOrNew(from),       // "*": INITIAL
            getIdOrNew(to),         // "*": FINAL
            getIdOrNew(trigger)     // trigger: "*" --> ""(completion)
        )
    }

    /**
     * declare selectable transition.
     * @param from state from
     * @param toList array of state to
     * @param trigger trigger
     * @param body code to run
     */
    //% block="trasition to $toList when $trigger : $from"
    //% from.defl="State1"
    //% trigger.defl="Trigger1"
    //% handlerStatement
    //% weight=90
    //% group="Transition"
    export function declareTransitionSelectable(from: string, toList: string[], trigger: string, body: () => void) {
        // trigger: "*" --> ""(completion)
        if (CHAR_ASTERISK == trigger) {
            trigger = ""
        }
        // defaultStateMachine.declareTransition(
        //     getIdOrNew(from),       // "*": INITIAL
        //     getIdOrNew(to),         // "*": FINAL
        //     getIdOrNew(trigger)     // trigger: "*" --> ""(completion)
        // )
    }

    /**
     * 
     * @param state state to
     */
    //% block="select to: $state"
    //% state.defl="State1"
    //% weight=80
    //% group="Transition"
    export function selectTo(state: string) {

    }

    /**
     * fire trigger
     * @param trigger trigger
     */
    //% block="fire $trigger"
    //% trigger.defl="Trigger1"
    //% weight=70
    //% group="Command"
    export function fire(trigger: string) {
        defaultStateMachine.fire(getIdOrNew(trigger))
    }

    /**
     * start state machine
     * @param state default state
     */
    //% block="start $state"
    //% state.defl="State1"
    //% weight=60
    //% group="Command"
    export function start(state: string) {
        defaultStateMachine.start(getIdOrNew(state))
    }
    
    /**
     * about state
     * @param state state
     * @param description state description 
     */
    //% block="about : $state|description: $description"
    //% state.defl="State1"
    //% inlineInputMode=external
    //% weight=50
    //% group="Design"
    export function aboutState(state: string, description: string) {
        
    }
}
