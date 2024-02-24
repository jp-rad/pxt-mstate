// MIT License
// 
// Copyright (c) 2023-2024 jp-rad
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

namespace mmachine {
    export type GetElapsedMillisCallback = () => number

    let _cbGetElapsedMillis: GetElapsedMillisCallback

    export function initGetElapsedMillis(cb: GetElapsedMillisCallback) {
        if (cb) {
            _cbGetElapsedMillis = cb
        } else {
            _cbGetElapsedMillis = () => 0
        }
    }

    export type QueueRunToCompletionCallback = (machineId: number) => void

    let _cbQueueRunToCompletion: QueueRunToCompletionCallback

    export function initQueueRunToCompletion(cb: QueueRunToCompletionCallback) {
        if (cb) {
            _cbQueueRunToCompletion = cb
        } else {
            _cbQueueRunToCompletion = (machineId: number) => { }
        }
    }

    export namespace namestore {
        export const SYS_START_TRIGGER_ID = -1  // StarterTransition
        export const NONE_ID = 0    //  0 - INITIAL/FINAL/Completion Transition
        export const NONE_STR = ""  // "" - INITIAL/FINAL/Completion Transition
        export let storeNameId: any = {}
        storeNameId[NONE_STR] = NONE_ID
        export function getNameIdOrNew(name: string): number {
            let id = storeNameId[name]
            if (undefined === id) {
                id = Object.keys(storeNameId).length
                storeNameId[name] = id
            }
            return id
        }
    }

    export type BodyCallback = () => void

    export class BodyAction {
        execute: BodyCallback
        constructor(cb: BodyCallback) {
            this.execute = cb
        }
    }

    export type DoActivityCallback = (counter: number) => void

    export class DoActivityAction {
        _cb: DoActivityCallback
        interval_ms: number
        counterIfPositive: number   // (<0): reseted, 0: reserved, (>0): to executie
        constructor(ms: number, cb: DoActivityCallback) {
            this._cb = cb
            this.interval_ms = ms
            this.counterIfPositive = -1  // reset
        }
        executeZero() {
            this._cb(0) // counter = 0
        }
        executeIf(): boolean {
            const counter = this.counterIfPositive
            this.counterIfPositive = -1  // reset
            if (0 < counter) {
                this._cb(counter)
                return true
            }
            return false
        }
    }

    export class StateTransition {
        triggerId: number
        targetIdList: number[]
        execute: BodyCallback
        constructor(triggerId: number, targetIdList: number[], cb: BodyCallback) {
            this.triggerId = triggerId
            this.targetIdList = targetIdList
            this.execute = cb
        }
    }
    export class State {
        stateId: number
        entryActionList: BodyAction[]
        doActivityList: DoActivityAction[]
        exitActionList: BodyAction[]
        stateTransitionList: StateTransition[]
        constructor(stateId: number) {
            this.stateId = stateId
            this.entryActionList = []
            this.doActivityList = []
            this.exitActionList = []
            this.stateTransitionList = []
        }
    }

    class TriggerIdArgs {
        triggerId: number
        triggerArgs: number[]
        constructor(triggerId: number, triggerArgs?: number[]) {
            this.triggerId = triggerId
            this.triggerArgs = triggerArgs || []
        }
    }

    enum RunToCompletionStep {
        WaitPoint,
        EvalTrigger,
        EvalCompletion,
        Reached,
    }

    export class StateMachine {
        static readonly TRAVERSE_AT_UNSELECTED = -1 // (default) unselected

        machineId: number
        _stateList: State[]
        _triggerEventPool: TriggerIdArgs[]
        triggerArgs: number[]
        traverseAt: number   // >=0: selected, <0: unselected
        _traversingTargetId: number
        _currentState: State
        _isDelayed: boolean

        constructor(machineId: number) {
            this._stateList = []
            this._triggerEventPool = []
            this.triggerArgs = []
            this.traverseAt = StateMachine.TRAVERSE_AT_UNSELECTED
            this._traversingTargetId = namestore.NONE_ID
            this._isDelayed = false

            this.machineId = machineId

            const finalState = this.getStateOrNew(namestore.NONE_ID)
            this._currentState = finalState
        }

        getStateOrNew(stateId: number) {
            const obj = this._stateList.find(item => stateId == item.stateId)
            if (obj) {
                return obj
            }
            const newObj = new State(stateId)
            this._stateList.push(newObj)
            return newObj
        }

        _procDoActivityZero() {
            for (const doActivity of this._currentState.doActivityList) {
                doActivity.executeZero()
            }
        }

        _procEvalDoCounter() {
            let executed = false
            for (const doActivity of this._currentState.doActivityList) {
                if (doActivity.executeIf()) {
                    executed = true
                }
            }
            return executed
        }

        _evaluateStateTransition(props: TriggerIdArgs) {
            // StarterTransition
            if (namestore.NONE_ID == this._currentState.stateId) {
                if (namestore.SYS_START_TRIGGER_ID == props.triggerId) {
                    this._traversingTargetId = props.triggerArgs[0] || namestore.NONE_ID    // default state id, `start` function
                    return true
                }
                return false
            }
            // StateTransition
            const stateTransitionList = this._currentState.stateTransitionList.filter(item => props.triggerId == item.triggerId)
            for (const stateTransition of stateTransitionList) {
                this.traverseAt = StateMachine.TRAVERSE_AT_UNSELECTED   // reset
                this.triggerArgs = props.triggerArgs                    // current trigger args
                stateTransition.execute()                               // callback body(), evaluating
                if (0 <= this.traverseAt && stateTransition.targetIdList.length > this.traverseAt) {
                    this._traversingTargetId = stateTransition.targetIdList[this.traverseAt]
                    return true
                }
            }
            return false
        }

        _procEvalCompletion() {
            const trigger = new TriggerIdArgs(namestore.NONE_ID) // trigger for Completion Transition
            return this._evaluateStateTransition(trigger)
        }

        _procEvalTrigger() {
            while (0 < this._triggerEventPool.length) {
                const trigger = this._triggerEventPool.shift()  // trigger from event pool
                if (this._evaluateStateTransition(trigger)) {
                    return true
                }
            }
            return false
        }

        runToCompletion() {
            let nextStep: RunToCompletionStep
            if (this._isDelayed) {
                this._isDelayed = false
                nextStep = RunToCompletionStep.EvalCompletion
            } else {
                nextStep = RunToCompletionStep.EvalTrigger
            }
            while (RunToCompletionStep.WaitPoint != nextStep) {
                switch (nextStep) {
                    case RunToCompletionStep.EvalTrigger:
                        if (this._procEvalTrigger()) {
                            nextStep = RunToCompletionStep.Reached
                        } else if (this._procEvalDoCounter()) {
                            nextStep = RunToCompletionStep.EvalCompletion
                        } else {
                            nextStep = RunToCompletionStep.WaitPoint
                        }
                        break;
                    case RunToCompletionStep.EvalCompletion:
                        if (this._procEvalCompletion()) {
                            nextStep = RunToCompletionStep.Reached
                        } else {
                            nextStep = RunToCompletionStep.EvalTrigger
                        }
                        break;
                    case RunToCompletionStep.Reached:
                        for (const v of this._currentState.exitActionList) {
                            v.execute()
                        }
                        this._currentState = this.getStateOrNew(this._traversingTargetId)
                        const intervalList: number[] = []
                        for (const v of this._currentState.doActivityList) {
                            v.counterIfPositive = -1  // clear
                            intervalList.push(v.interval_ms)
                        }
                        resetDoCounterSchedules(this.machineId, intervalList)
                        for (const v of this._currentState.entryActionList) {
                            v.execute()
                        }
                        this._procDoActivityZero()
                        nextStep = RunToCompletionStep.WaitPoint
                        this._isDelayed = true
                        _cbQueueRunToCompletion(this.machineId)
                        break;
                    default:    // WaitPoint
                        break;
                }
            }
        }

        start(stateId: number) {
            this.send(namestore.SYS_START_TRIGGER_ID, [stateId])    // StarterTransition
        }

        setDoCounter(doActivityIndex: number, counter: number) {
            const doActivity = this._currentState.doActivityList[doActivityIndex]
            if (doActivity) {
                doActivity.counterIfPositive = counter
                _cbQueueRunToCompletion(this.machineId)
            }
        }

        send(triggerId: number, triggerArgs: number[]) {
            this._triggerEventPool.push(new TriggerIdArgs(triggerId, triggerArgs))
            _cbQueueRunToCompletion(this.machineId)
        }
    }

    let _defineMachineState: [boolean, StateMachines, number] = [false, undefined, undefined]

    export function defineState(machineId: number, stateId: number, body: () => void) {
        _defineMachineState = [true, machineId, stateId]
        body()
        _defineMachineState = [false, undefined, undefined]
    }

    export function getDefineMachineState() {
        return _defineMachineState
    }

    const _stateMachineList: mmachine.StateMachine[] = []

    export function getStateMachine(machineId: number) {
        const obj = _stateMachineList.find(item => machineId == item.machineId)
        if (obj) {
            return obj
        }
        const newObj = new mmachine.StateMachine(machineId)
        _stateMachineList.push(newObj)
        return newObj
    }

    export function getState(machineId: number, stateId: number): mmachine.State {
        return getStateMachine(machineId).getStateOrNew(stateId)
    }

    export function runToCompletion(machineId: number) {
        getStateMachine(machineId).runToCompletion()
    }

    class DoCounterSchedule {
        machineId: number
        doActivityIndex: number
        interval: number
        nextTimestamp: number
        counter: number
    }

    let _doCounterScheduleList: DoCounterSchedule[] = []

    function resetDoCounterSchedules(machineId: number, intervalList: number[]) {
        const currentTimestamp = _cbGetElapsedMillis()
        _doCounterScheduleList = _doCounterScheduleList.filter(item => machineId != item.machineId)
        intervalList.forEach((value, index) => {
            if (0 < value) {
                const schedule = new DoCounterSchedule()
                _doCounterScheduleList.push(schedule)
                schedule.machineId = machineId
                schedule.doActivityIndex = index
                schedule.interval = value
                schedule.nextTimestamp = currentTimestamp + schedule.interval
                schedule.counter = 0
            }
        })
    }

    export function idleTick() {
        const currentTimestamp = _cbGetElapsedMillis()
        // do-counter scheduler
        for (const schedule of _doCounterScheduleList) {
            if (currentTimestamp >= schedule.nextTimestamp) {
                while (currentTimestamp >= schedule.nextTimestamp) {
                    schedule.nextTimestamp = schedule.nextTimestamp + schedule.interval
                    schedule.counter = schedule.counter + 1
                }
                getStateMachine(schedule.machineId).setDoCounter(schedule.doActivityIndex, schedule.counter)
            }
        }
    }
}
