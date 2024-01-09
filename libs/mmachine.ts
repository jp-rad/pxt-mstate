/**
 * state machine
 */
namespace mmachine {

    /**
     * callback of block body
     */
    export type BodyCallback = () => void

    /**
     * callback of idle update
     */
    export type IdleUpdateCallback = () => void

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
        execute: BodyCallback

        /**
         * constructor
         * @param cb code to run, body()
         */
        constructor(cb: BodyCallback) {
            this.execute = cb
        }
    }

    /**
     * Do Activity
     */
    export class DoActivity {

        _cb: BodyCallback
        _ms: number

        /**
         * The next tick to be callbacked.
         */
        nextTick: number

        /**
         * constructor
         * @param ms interval (ms)
         * @param cb code to run, body()
         */
        constructor(ms: number, cb: BodyCallback) {
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
                this.nextTick = tick + this._ms // next
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
        toStateIdList: number[]
        /**
         * trigger id.
         */
        triggerId: number
        /**
         * execute Transition.
         */
        execute: BodyCallback

        /**
         * constructor
         * @param toStateIdList array of state id, transition to
         * @param triggerId trigger id
         * @param cb run to code, body()
         */
        constructor(toStateIdList: number[], triggerId: number, cb: BodyCallback) {
            this.toStateIdList = toStateIdList
            this.triggerId = triggerId
            this.execute = cb
        }
    }

    export class State {
        /**
         * state id.
         */
        stateId: number
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

        constructor(stateId: number) {
            this.stateId = stateId
            this.entryActions = []
            this.doActivities = []
            this.exitActions = []
            this.transitions = []
        }
    }

    /**
     * trigger id and trigger args
     */
    class TriggerMessage {
        /**
         * trigger id.
         */
        triggerId: number
        /**
         * trigger args.
         */
        triggerArgs: number[]

        /**
         * constructor
         * @param triggerId trigger id
         * @param triggerArgs trigger args
         */
        constructor(triggerId: number, triggerArgs: number[]) {
            this.triggerId = triggerId
            this.triggerArgs = triggerArgs
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

    export class StateMachine {

        /**
         * machine id
         */
        machineId: number

        /**
         * idle update callback.
         */
        _idleUpdateCallback: IdleUpdateCallback

        /**
         * next proc
         */
        _nextProc: ProcState

        /**
         * default state id for start.
         */
        _defaultStateId: number

        /**
         * array of state.
         */
        _states: State[]

        /**
         * current state
         */
        _currentState: State

        /**
         * trigger queues, array of TriggerMessage.
         */
        _triggerMessageQueues: TriggerMessage[]

        // selectable taransition
        selectedToAt: number   // >=0: selected, = -1 (TRANSITION_CANCELED): unselected

        // current transition
        _transitTo: number

        // current trigger args
        triggerArgs: number[]

        // for timeout millis, reset on into.
        tickOnInto: number

        /**
         * constructor
         * @param machineId machine ID
         * @param cbIdleUpdate idle update callback
         */
        constructor(machineId: number, cbIdleUpdate: IdleUpdateCallback) {
            this.machineId = machineId
            this._idleUpdateCallback = cbIdleUpdate
            this._defaultStateId = mname.NONE_ID

            this._states = []

            // current
            this._currentState = undefined

            // trigger queues
            this._triggerMessageQueues = []

            // current transition
            this._transitTo = TRANSITION_CANCELED

            // current trigger args
            this.triggerArgs = []

            // selectable taransition
            this.selectedToAt = TRANSITION_CANCELED

            // proc
            this._nextProc = ProcState.Idle

        }

        /**
         * get State instance, or new.
         * @param stateId state id
         * @returns instance of State, undefined if mname.NONE_ID (INITIAL/FINAL state)
         */
        getStateOrNew(stateId: number) {
            if (mname.NONE_ID == stateId) {
                return undefined    // INITIAL/FINAL state
            }
            const obj = this._states.find(item => stateId == item.stateId)
            if (undefined !== obj) {
                return obj
            }
            const newObj = new State(stateId)
            this._states.push(newObj)
            return newObj
        }

        _doCallbackSelectable(transition: Transition, triggerArgs: number[]) {
            this.selectedToAt = TRANSITION_CANCELED    // reset
            this.triggerArgs = triggerArgs             // current trigger args
            transition.execute()                       // callback
            if (0 <= this.selectedToAt && transition.toStateIdList.length > this.selectedToAt) {
                // selected
                this._transitTo = transition.toStateIdList[this.selectedToAt]
                return true
            }
            return false
        }

        // Completion Transition
        _procCompletionTransition() {
            const emptyArgs: number[] = []
            // mname.NONE_ID: Completion Transition
            const transitions = this._currentState.transitions.filter(item => mname.NONE_ID == item.triggerId)
            for (const transition of transitions) {
                if (this._doCallbackSelectable(transition, emptyArgs)) {
                    return true
                }
            }
            return false
        }

        // Triggered Transition
        _procTriggeredTransition() {
            while (0 < this._triggerMessageQueues.length) {
                const queue = this._triggerMessageQueues.shift()
                const transitions = this._currentState.transitions.filter(item => queue.triggerId == item.triggerId)
                for (const transition of transitions) {
                    if (this._doCallbackSelectable(transition, queue.triggerArgs)) {
                        return true
                    }
                }
            }
            return false
        }

        update() {
            let updating = true
            do {
                switch (this._nextProc) {
                    case ProcState.Start:
                        this._transitTo = this._defaultStateId
                        this._nextProc = ProcState.Into
                        break;
                    case ProcState.Into:
                        this._currentState = this.getStateOrNew(this._transitTo)
                        this.tickOnInto = control.millis()
                        if (undefined !== this._currentState) {
                            for (const v of this._currentState.doActivities) {
                                v.nextTick = -1
                            }
                            this._nextProc = ProcState.Enter
                        } else {
                            // (INITIAL or FINAL)
                            while (0 < this._triggerMessageQueues.length) {
                                this._triggerMessageQueues.shift()
                            }
                            this._nextProc = ProcState.Idle
                        }
                        break;
                    case ProcState.Enter:
                        for (const v of this._currentState.entryActions) {
                            v.execute()
                        }
                        this._nextProc = ProcState.Do
                        break;
                    case ProcState.Do:
                        const tick = control.millis()
                        for (const v of this._currentState.doActivities) {
                            v.execute(tick)
                        }
                        this._nextProc = ProcState.CompletionTransit
                        break;
                    case ProcState.CompletionTransit:
                        if (this._procCompletionTransition()) {
                            this._nextProc = ProcState.Exit
                        } else {
                            this._nextProc = ProcState.Pause
                            updating = false    // break
                        }
                        break;
                    case ProcState.Pause:
                        this._nextProc = ProcState.TriggeredTransit
                        break;
                    case ProcState.TriggeredTransit:
                        if (this._procTriggeredTransition()) {
                            this._nextProc = ProcState.Exit
                        } else {
                            this._nextProc = ProcState.Do
                        }
                        break;
                    case ProcState.Exit:
                        for (const v of this._currentState.exitActions) {
                            v.execute()
                        }
                        this._nextProc = ProcState.Into
                        break;
                    case ProcState.Idle:
                    default:
                        updating = false    // break
                        break;
                }
            } while (updating)
        }

        start(stateId: number): boolean {
            if (ProcState.Idle == this._nextProc) {
                this._defaultStateId = stateId
                this._nextProc = ProcState.Start
                this._idleUpdateCallback()
                return true
            } else {
                return false
            }
        }

        send(triggerId: number, triggerArgs: number[]) {
            if (ProcState.Idle != this._nextProc) {
                // queuing
                const queue = new TriggerMessage(triggerId, triggerArgs)
                this._triggerMessageQueues.push(queue)
                this._idleUpdateCallback()
            }
        }
    }

}
