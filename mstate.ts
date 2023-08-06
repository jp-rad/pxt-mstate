/**
 * mstate blocks
 */
//% weight=100 color="#4C97FF" icon="\uf362"
//% groups="['Action', 'Command', 'Declare', 'Design', 'Transition']"
namespace mstate {

    const CHAR_ASTERISK = "*"       // asterisk charactor "*"
    const STATE_INITIAL_FINAL = -1  // "*"(INITIAL or FINAL)
    const TRIGGER_NONE = 0          // ""(completion)
    const NUMERIC_NAN = -1          // missing value, number

    const MICROBIT_CUSTOM_ID_BASE = 32768
    const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 100
    const DEFAULT_EVENT_LOOP_INTERVAL = 100

    const DEFAULT_STATE_MACHINE_NAME = "default"

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
     * DoActivity
     */
    class DoActivity {
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
         * @param tick the number of milliseconds elapsed since power on, control.millis().
         */
        execute(tick: number) {
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
     * Transition timeout
     */
    class TransitionTimeout {
        // declare
        _from: number
        _to: number
        _timeout: number
        _asArrow: boolean

        /**
         * constructor
         * @param from (States) state, transition from
         * @param to (States) state, transition to
         * @param timeout timeout (ms)
         * @param asArrow display as arrows in diagrams, UML
         */
        constructor(from: number, to: number, timeout: number, asArrow: boolean) {
            this._from = from
            this._to = to
            this._timeout = timeout
            this._asArrow = asArrow
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
         *  timeout (ms)
         */
        get timeout() { return this._timeout }

        /**
         * display as arrows in diagrams, UML
         */
        get asArrow() { return this._asArrow }
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

    /**
     * Selectable transition
     */
    class TransitionSelectable {
        // declare
        _from: number
        _toList: number[]
        _trigger: number
        _cb: () => void
        _guardList: string[]

        /**
         * constructor
         * @param from (States) state, transition from
         * @param toList (States) selectabale states, arrray of transition to
         * @param trigger (Triggers) trigger
         * @param cb run to code for selecting state, transition to
         */
        constructor(from: number, toList: number[], trigger: number, cb: () => void, guardList: string[]) {
            this._from = from
            this._toList = toList
            this._trigger = trigger
            this._cb = cb
            this._guardList = []
            for (let i = 0; i < toList.length; i++) {
                const guard = guardList[i]
                this._guardList.push(guard)
            }
        }

        /**
         * (States) state, transition from
         */
        get from() { return this._from }

        /**
         * (States) selectabale states, arrray of transition to
         */
        get toList() { return this._toList }

        /**
         * (Triggers) trigger
         */
        get trigger() { return this._trigger }

        /**
         * Callback to select state, transition to
         */
        cb() {
            this._cb()
        }
    }

    /**
     * Trigger and user's args
     */
    class TriggerArgs {
        // trigger and args
        _trigger: number
        _args: number[]

        /**
         * constructor
         * @param trigger trigger
         * @param args args for user
         */
        constructor(trigger: number, args: number[]) {
            this._trigger = trigger
            this._args = args
        }

        /**
         * trigger
         */
        get trigger() { return this._trigger }

        /**
         * args for user
         */
        get args() { return this._args }
    }

    class StateDescription {
        _state: number
        _description: string

        constructor(state: number, description: string) {
            this._state = state
            this._description = description
        }

        get state() { return this._state }
        get description() { return this._description }
    }

    enum ProcStatus {
        Idle,
        Start,
        Into,
        Enter,
        Do,
        Exit,
        Transit,
        Panic
    }

    enum ProcNextBehavior {
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
        _defaultState: number           // start

        // declare
        _declareEntryActions: EntryAction[]
        _declareDoActivities: DoActivity[]
        _declareExitActions: ExitAction[]
        _declareTransitions: Transition[]
        _declareTransitionSelectables: TransitionSelectable[]
        _declareTransitionTImeouts: TransitionTimeout[]         // Less than one per state, the one with the minimum timeout.

        // current
        _state: number
        _entryActions: EntryAction[]
        _doActivities: DoActivity[]
        _exitActions: ExitAction[]
        _trasitionTimeout: TransitionTimeout                        // Priority - 1: Highest (timeouted)
        _transitionSelectables: TransitionSelectable[]              // Priority - 2: High
        _transitions: Transition[]                                  // Priority - 3: Middle (High)
        _completionTransitionSelectables: TransitionSelectable[]    // Priority - 4: Middle (Low)
        _completionTransition: Transition                           // Priority - 5: Low

        // proc
        _procNext: ProcStatus

        // timeout transition
        _timeoutMillis: number

        // (Triggers[]) triggers
        _triggerQueue: TriggerArgs[]

        // current transition
        _transitFrom: number
        _transitTo: number
        _argsOfTrigger: number[]

        // selectable taransition
        _selectedToAt: number   // >=0: selected, NUMERIC_NAN: unselected
        _selectedTo: number     // TODO: deprecated

        // design
        _stateDescriptions: StateDescription[]

        /**
         * constructor
         * The state machine ID is used as the event value, so it must be greater than 0
         * @param id state machine ID (>0)
         * @param name state machine name
         */
        constructor(id: number, name: string) {
            // system
            this._machineId = id
            this._macnineName = name
            this._initialized = false
            this._updateEventId = DEFAULT_UPDATE_EVENT_ID
            this._eventLoopInterval = DEFAULT_EVENT_LOOP_INTERVAL
            this._enabledUpdateEvent = false
            this._defaultState = STATE_INITIAL_FINAL

            // declare
            this._declareEntryActions = []
            this._declareDoActivities = []
            this._declareExitActions = []
            this._declareTransitionTImeouts = []
            this._declareTransitions = []
            this._declareTransitionSelectables = []

            // current
            this._state = STATE_INITIAL_FINAL
            this._entryActions = []
            this._doActivities = []
            this._exitActions = []
            this._trasitionTimeout = undefined
            this._transitionSelectables = []
            this._transitions = []
            this._completionTransitionSelectables = []
            this._completionTransition = undefined

            // proc
            this._procNext = ProcStatus.Idle

            // timeout transition
            this._timeoutMillis = NUMERIC_NAN

            // (Triggers[]) triggers
            this._triggerQueue = []

            // current transition
            this._transitFrom = STATE_INITIAL_FINAL
            this._transitTo = STATE_INITIAL_FINAL
            this._argsOfTrigger = []

            // selectable taransition
            this._selectedToAt = NUMERIC_NAN
            this._selectedTo = NUMERIC_NAN

            // design
            this._stateDescriptions = []
        }

        get machineId() { return this._machineId }

        get machineName() { return this._macnineName }

        declareEntry(state: number, cb: (prev: number) => void) {
            if (ProcStatus.Idle == this._procNext) {
                const item = new EntryAction(state, cb)
                this._declareEntryActions.push(item)
            }
        }

        declareDo(state: number, ms: number, cb: () => void) {
            if (ProcStatus.Idle == this._procNext) {
                const item = new DoActivity(state, ms, cb)
                this._declareDoActivities.push(item)
            }
        }

        declareExit(state: number, cb: (next: number) => void) {
            if (ProcStatus.Idle == this._procNext) {
                const item = new ExitAction(state, cb)
                this._declareExitActions.push(item)
            }
        }

        declareTransitionTimeout(from: number, to: number, timeout: number, asArrow: boolean) {
            if (ProcStatus.Idle == this._procNext) {
                const found = this._declareTransitionTImeouts.find((item) => from == item.from)
                if (undefined == found) {
                    const item = new TransitionTimeout(from, to, timeout, asArrow)
                    this._declareTransitionTImeouts.push(item)
                }
            }
        }

        declareTransition(from: number, to: number, trigger: number) {
            if (ProcStatus.Idle == this._procNext) {
                const item = new Transition(from, to, trigger)
                this._declareTransitions.push(item)
            }
        }

        declareTransitionSelectable(from: number, toList: number[], trigger: number, cb: () => void, guardList: string[]) {
            if (ProcStatus.Idle == this._procNext) {
                const item = new TransitionSelectable(from, toList, trigger, cb, guardList)
                this._declareTransitionSelectables.push(item)
            }
        }

        addStateDescription(state: number, description: string) {
            if (ProcStatus.Idle == this._procNext) {
                const item = new StateDescription(state, description)
                this._stateDescriptions.push(item)
            }
        }

        _procStart() {
            this._transitFrom = STATE_INITIAL_FINAL
            this._transitTo = this._defaultState
        }

        _procInto() {
            const next = this._transitTo
            // into current
            this._state = next
            this._entryActions = this._declareEntryActions.filter((item) => next == item.state)
            this._doActivities = this._declareDoActivities.filter((item) => {
                if (next == item.state) {
                    item.forceTick()
                    return true
                } else {
                    return false
                }
            })
            this._exitActions = this._declareExitActions.filter((item) => next == item.state)
            this._trasitionTimeout = this._declareTransitionTImeouts.find((item) => next == item.from)
            // reset timeout
            if (this._trasitionTimeout) {
                this.resetTimeout(this._trasitionTimeout.timeout)
            } else {
                this.resetTimeout(NUMERIC_NAN)
            }
            this._transitions = this._declareTransitions.filter((item) => next == item.from)
            this._transitionSelectables = this._declareTransitionSelectables.filter((item) => next == item.from)
            this._completionTransitionSelectables = this._transitionSelectables.filter((item) => TRIGGER_NONE == item.trigger)
            this._completionTransition = this._transitions.find((item) => TRIGGER_NONE == item.trigger)
        }

        _procEnter() {
            const prev = this._transitFrom
            for (const entryProc of this._entryActions) {
                entryProc.execute(prev)
            }
        }

        _procDo() {
            const tick = control.millis()
            for (const doProc of this._doActivities) {
                doProc.execute(tick)
            }
        }

        _procExit() {
            const next = this._transitTo
            for (const exitProc of this._exitActions) {
                exitProc.execute(next)
            }
        }

        _doCallbackSelectable(transition: TransitionSelectable) {
            if (transition) {
                this._selectedToAt = NUMERIC_NAN    // reset
                this._selectedTo = NUMERIC_NAN      // reset
                transition.cb()                     // callback
                if (0 <= this._selectedToAt && transition.toList.length > this._selectedToAt) {
                    // selected
                    this._transitFrom = transition.from
                    this._transitTo = transition.toList[this._selectedToAt]
                    return true
                }
                if (0 <= this._selectedTo) {
                    const selectedTo = transition.toList.find((v) => v == this._selectedTo)
                    if (selectedTo) {
                        // selected
                        this._transitFrom = transition.from
                        this._transitTo = selectedTo
                        return true
                    }
                }
            }
            return false
        }

        _procTransit(): boolean {
            // Timeout Transition
            this._argsOfTrigger = undefined
            if (this._trasitionTimeout && this.timeouted()) {
                const transition = this._trasitionTimeout
                this._transitFrom = transition.from
                this._transitTo = transition.to
                return true
            }
            // triggers - Transition and/or Transition (selectable)
            while (0 < this._triggerQueue.length) {
                const trigger = this._triggerQueue.shift()
                this._argsOfTrigger = trigger.args
                // Transition (selectable)
                if (0 < this._transitionSelectables.length) {
                    const transition = this._transitionSelectables.find((item) => trigger.trigger == item.trigger)
                    if (this._doCallbackSelectable(transition)) {
                        return true
                    }
                }
                // Transition
                if (0 < this._transitions.length) {
                    const transition = this._transitions.find((item) => trigger.trigger == item.trigger)
                    if (transition) {
                        this._transitFrom = transition.from
                        this._transitTo = transition.to
                        return true
                    }
                }
            }
            // Completion Transition (selectable)
            this._argsOfTrigger = undefined
            for (const transition of this._completionTransitionSelectables) {
                if (this._doCallbackSelectable(transition)) {
                    return true
                }
            }
            // Completion Transition
            this._argsOfTrigger = undefined
            if (this._completionTransition) {
                const transition = this._completionTransition
                this._transitFrom = transition.from
                this._transitTo = transition.to
                return true
            }
            return false
        }

        _proc(): ProcNextBehavior {
            let ret = ProcNextBehavior.Loop // (default) loop
            switch (this._procNext) {
                case ProcStatus.Idle:
                    ret = ProcNextBehavior.Break    // break
                    break;
                case ProcStatus.Start:
                    this._procStart()
                    this._procNext = ProcStatus.Into
                    ret = ProcNextBehavior.Event    // event, for start() function.
                    break;
                case ProcStatus.Into:
                    this._procInto()
                    if (0 > this._state) {
                        // (INITIAL or FINAL)
                        this._procNext = ProcStatus.Idle
                    } else {
                        this._procNext = ProcStatus.Enter
                    }
                    break;
                case ProcStatus.Enter:
                    this._procEnter()
                    this._procNext = ProcStatus.Do
                    break;
                case ProcStatus.Do:
                    this._procDo()
                    this._procNext = ProcStatus.Transit
                    ret = ProcNextBehavior.Event    // event
                    break;
                case ProcStatus.Transit:
                    if (this._procTransit()) {
                        this._procNext = ProcStatus.Exit
                    } else {
                        this._procNext = ProcStatus.Do
                    }
                    break;
                case ProcStatus.Exit:
                    this._procExit()
                    this._procNext = ProcStatus.Into
                    break;
                default:
                    // panic
                    this._procNext = ProcStatus.Panic
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
            if (ProcStatus.Idle == this._procNext) {
                this._defaultState = state
                this._procNext = ProcStatus.Start
                this._update()
                return true
            } else {
                return false
            }
        }

        fire(trigger: number, args: number[]) {
            if ((ProcStatus.Idle != this._procNext) && (ProcStatus.Panic != this._procNext)) {
                // queuing
                const triggerArgs = new TriggerArgs(trigger, args)
                this._triggerQueue.push(triggerArgs)
                // update event
                this._raiseUpdateEvent(true)
            }
        }

        getArgsOfTrigger() {
            if (this._argsOfTrigger) {
                return this._argsOfTrigger
            }
            return []
        }

        selectToAt(index: number) {
            this._selectedToAt = index
            this._selectedTo = NUMERIC_NAN
        }

        selectTo(state: number) {
            this._selectedToAt = NUMERIC_NAN
            this._selectedTo = state
        }

        resetTimeout(timeout: number) {
            if (0 > timeout) {
                this._timeoutMillis = NUMERIC_NAN
            } else {
                this._timeoutMillis = control.millis() + timeout
            }
        }

        timeouted() {
            if (NUMERIC_NAN == this._timeoutMillis) {
                return false
            }
            return control.millis() >= this._timeoutMillis
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

    function getIdOrNew(name: string) {
        if (CHAR_ASTERISK == name) {
            return STATE_INITIAL_FINAL
        }
        let idName = idNameList.find((item) => name == item.name)
        if (undefined == idName) {
            idName = new IdName(idNameList.length, name)
            idNameList.push(idName)
        }
        return idName.id
    }

    function convIdToName(id: number, uml: boolean = false) {
        if (STATE_INITIAL_FINAL == id) {
            return uml ? "[" + CHAR_ASTERISK + "]" : CHAR_ASTERISK
        }
        let idName = idNameList.find((item) => item.id == id)
        if (uml) {
            return undefined == idName ? "UNDEFINED" : idName.name
        } else {
            return undefined == idName ? "[" + id + "]" : idName.name
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

    function buildUml(target: StateMachine, defaultState: string, cb: (line: string) => void) {
        let sp: string
        const machineName = target.machineName

        sp = "" // space(0)

        cb(sp + "@startuml")
        // cb(sp + "")
        // cb(sp + "' PlantUML Web server:")
        cb(sp + "' http://www.plantuml.com/plantuml/")
        cb(sp + "")
        // top state - machine name
        cb(sp + "state __" + machineName + "__ {")

        sp = "  " // space(2)

        cb(sp + "")
        // cb(sp + "'=======================")
        // cb(sp + "' description (timeout)")
        // cb(sp + "'=======================")
        for (const item of target._declareTransitionTImeouts) {
            if (!item.asArrow) {
                cb(sp + "state " + convIdToName(item.from, true) + " : [>" + item.timeout + "ms]/ to: " + convIdToName(item.to, true))
            }
        }

        cb(sp + "")
        // cb(sp + "'=============")
        // cb(sp + "' description ")
        // cb(sp + "'=============")
        for (const item of target._stateDescriptions) {
            cb(sp + "state " + convIdToName(item.state, true) + " : " + item.description)
        }

        cb(sp + "")
        // cb(sp + "'============")
        // cb(sp + "' transition ")
        // cb(sp + "'============")
        cb(sp + convIdToName(STATE_INITIAL_FINAL, true) + " --> " + convIdToName(getIdOrNew(defaultState), true) + " : (start)")
        for (const item of target._declareTransitions) {
            let triggerPart = ""
            if (TRIGGER_NONE != item.trigger) {
                triggerPart = " : " + convIdToName(item.trigger, true)
            }
            cb(sp + convIdToName(item.from, true) + " --> " + convIdToName(item.to, true) + triggerPart)
        }
        for (const item of target._declareTransitionSelectables) {
            const fromName = convIdToName(item.from, true)
            const triggerName = convIdToName(item.trigger, true)
            for (let i = 0; i < 9; i++) {
                const toName = convIdToName(item.toList[i], true)
                const guard = item._guardList[i]
                let guardPart = ""
                if (undefined === guard) {
                    guardPart = " [to " + toName + "]"
                } else if (guard) {
                    guardPart = " [" + guard + "]"
                }
                cb(sp + fromName + " --> " + toName + " : " + triggerName + guardPart)
            }

            for (const toState of item.toList) {
                const toName = convIdToName(toState, true)
                cb(sp + fromName + " --> " + toName + " : " + triggerName + " [to " + toName + "]")
            }
        }
        for (const item of target._declareTransitionTImeouts) {
            if (item.asArrow) {
                cb(sp + convIdToName(item.from, true) + " --> " + convIdToName(item.to, true) + " : [>" + item.timeout + "ms]")
            }
        }

        sp = "" // space(0)

        cb(sp + "}") // top state - machine name
        cb(sp + "@enduml")
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
    //% weight=220
    //% group="Design"
    export function defineStateName(state: string, body: (STATE: string) => void) {
        body(state)
    }

    /**
     * define state with description
     * @param state state
     * @param descriptions array of description
     * @param body code to run
     */
    //% block="define $STATE to $state description: $descriptions"
    //% state.defl="State1"
    //% draggableParameters="reporter"
    //% advanced=true
    //% weight=210
    //% group="Design"
    export function defineStateDescription(state: string, descriptions: string[], body: (STATE: string) => void) {
        const stateId = getIdOrNew(state)
        for (const s of descriptions) {
            defaultStateMachine.addStateDescription(stateId, s)
        }
        body(state)
    }

    /**
     * convert id (number) to name (string)
     * @param id state id or trigger id
     * @returns state name (string) or trigger name (string), if undeclared: "[<id>]"
     */
    //% block="name of $id"
    //% advanced=true
    //% weight=200
    //% group="Action"
    export function convName(id: number): string {
        return convIdToName(id)
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
    //% weight=190
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
    //% weight=180
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
    //% weight=170
    //% group="Action"
    export function declareExit(state: string, body: (next: number) => void) {
        defaultStateMachine.declareExit(
            getIdOrNew(state),
            body
        )
    }

    /**
     * declare transition.
     * @param from state, transition from
     * @param to state, transition to
     * @param trigger trigger
     */
    //% block="trasition to $to when $trigger : $from"
    //% from.defl="State1"
    //% to.defl="State2"
    //% trigger.defl="Trigger1"
    //% weight=160
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
     * @param from state, transition from
     * @param toOptions options of state, transition to
     * @param trigger trigger
     * @param body code to run
     */
    //% block="trasition to $toOptions when $trigger : $from"
    //% from.defl="State1"
    //% trigger.defl="Trigger1"
    //% handlerStatement
    //% advanced=true
    //% weight=150
    //% group="Transition"
    export function declareTransitionSelectable(from: string, toOptions: string[], trigger: string, body: () => void) {
        // trigger: "*" --> ""(completion)
        if (CHAR_ASTERISK == trigger) {
            trigger = ""
        }
        let toList: number[] = []
        let guardList: string[] = []
        for (const s of toOptions) {
            const idx = s.indexOf(":")
            if (0 >= idx) {
                // state only
                toList.push(getIdOrNew(s))      // "*": FINAL
                guardList.push(undefined)
            } else {
                // <state name>:<guard>
                const name = s.slice(0, idx)
                const guard = s.slice(idx)
                toList.push(getIdOrNew(name))   // "*": FINAL
                guardList.push(guard)
            }
        }
        defaultStateMachine.declareTransitionSelectable(
            getIdOrNew(from),       // "*": INITIAL
            toList,                 // "*": FINAL
            getIdOrNew(trigger),    // trigger: "*" --> ""(completion)
            body,
            guardList
        )
    }

    /**
     * declare timeout transition.
     * @param from (States) state, transition from
     * @param to (States) state, transition to
     * @param timeout timeout (ms)
     * @param asArrow display as arrows in diagrams, UML
     */
    //% block="trasition to $to when timeout $timeout ms : $from (Arrow:$asArrow)"
    //% from.defl="State1"
    //% to.defl="State2"
    //% timeout.shadow="timePicker"
    //% timeout.defl=500
    //% asArrow.shadow="toggleOnOff"
    //% asArrow.defl=true
    //% inlineInputMode=inline
    //% weight=140
    //% group="Transition"
    export function declareTransitionTimeout(from: string, to: string, timeout: number, asArrow: boolean) {
        defaultStateMachine.declareTransitionTimeout(
            getIdOrNew(from),       // "*": INITIAL
            getIdOrNew(to),         // "*": FINAL
            timeout,
            asArrow
        )
    }

    /**
     * reset timeout
     * @param timeout timeout (ms)
     */
    //% block="timeout: $timeout (ms)"
    //% timeout.shadow="timePicker"
    //% timeout.defl=500
    //% advanced=true
    //% weight=130
    //% group="Transition"
    export function resetTimeout(timeout: number) {
        defaultStateMachine.resetTimeout(timeout)
    }

    /**
     * timeouted
     */
    //% block="timeouted"
    //% advanced=true
    //% weight=125
    //% group="Transition"
    export function timeouted() {
        return defaultStateMachine.timeouted()
    }

    /**
     * get args of trigger
     */
    //% block="args of tringger"
    //% advanced=true
    //% weight=120
    //% group="Transition"
    export function getArgsOfTrigger() {
        return defaultStateMachine.getArgsOfTrigger()
    }

    /**
     * Select state transition to in declareTransitionSelectable body
     * @param index states index
     */
    //% block="select to: at $index"
    //% index.defl=0
    //% advanced=true
    //% weight=110
    //% group="Transition"
    export function selectToAt(index: number) {
        defaultStateMachine.selectToAt(index)
    }

    /**
     * Select state transition to in declareTransitionSelectable body
     * @param state state to
     */
    //% block="select to: $state"
    //% state.defl="State1"
    //% advanced=true
    //% weight=110
    //% group="Transition"
    //% deprecated=true
    export function selectTo(state: string) {
        defaultStateMachine.selectTo(getIdOrNew(state))
    }

    /**
     * fire trigger
     * @param trigger trigger
     */
    //% block="fire $trigger"
    //% trigger.defl="Trigger1"
    //% weight=105
    //% group="Command"
    export function fire(trigger: string) {
        defaultStateMachine.fire(getIdOrNew(trigger), undefined)
    }

    /**
     * fire trigger
     * @param trigger trigger
     * @param args args
     */
    //% block="fire $trigger args: $args"
    //% trigger.defl="Trigger1"
    //% advanced=true
    //% weight=100
    //% group="Command"
    export function fireWithArgs(trigger: string, args: number[]) {
        defaultStateMachine.fire(getIdOrNew(trigger), args)
    }

    /**
     * start state machine
     * @param state default state
     */
    //% block="start $state"
    //% state.defl="State1"
    //% weight=90
    //% group="Command"
    export function start(state: string) {
        defaultStateMachine.start(getIdOrNew(state))
    }

    /**
     * export UML, PlantUML
     * PlantUML Web server: http://www.plantuml.com/plantuml/
     * @param state default state
     * @param enabled
     * @param body code to run
     */
    //% block="UML $enabled $line : $state"
    //% state.defl="State1"
    //% enabled.shadow="toggleOnOff"
    //% enabled.defl=true
    //% draggableParameters="reporter"
    //% handlerStatement
    //% advanced=true
    //% weight=80
    //% group="Command"
    export function exportUml(state: string, enabled: boolean, body: (line: string) => void) {
        if (enabled) {
            buildUml(defaultStateMachine, state, body)
        }
        // if (enabled) {
        //     body("@startuml")
        //     body("' server: http://www.plantuml.com/plantuml/")
        //     body("state default {")
        //     body("  ")
        //     body("  '=============")
        //     body("  ' description ")
        //     body("  '=============")
        //     body("  state State : description")
        //     body("  ")
        //     body("  '============")
        //     body("  ' transition ")
        //     body("  '============")
        //     body("  [*] --> State: (start)")
        //     body("  State --> A: Trigger1[to A]")
        //     body("  State --> B: Trigger1[to B]")
        //     body("  State --> C: Trigger1[to C]")
        //     body("  A --> B: Trigger2")
        //     body("  A --> C: Trigger3")
        //     body("  B --> C")
        //     body("  C --> [*] ")
        //     body("  ")
        //     body("}")
        //     body("@enduml")
        // }
    }
}
