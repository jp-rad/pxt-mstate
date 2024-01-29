/*
MIT License

Copyright (c) 2021-2024 jp-rad

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * To prevent `micro:bit Message Bus ID` collisions between extensions,
 * user-defined `Custom Message Bus ID`s are registered and managed
 * in this header file.
 *
 * See the following repository and the latest header file.
 * https://github.com/jp-rad/pxt-ubit-extension
 * https://github.com/jp-rad/pxt-ubit-extension/blob/master/inc/CustomMicroBit.h
 *
 */

#ifndef CUSTOMMICROBIT_H
#define CUSTOMMICROBIT_H

#include "MicroBitFiber.h"

/**
 * Status flags
 * Universal flags used as part of the status field
 */
#ifndef MICROBIT_COMPONENT_RUNNING
#define MICROBIT_COMPONENT_RUNNING 0x01
#endif
#define CUSTOM_COMPONENT_ADDED_TO_IDLE 0x02

/**
 * micro:bit Message Bus ID of listener : 1-65535
 * Custom Message Bus ID : 32768-65535
 */
enum CUSTOM_BUS_ID
{
        /**
         * S3Link UDK Event Bus ID.
         * (32768 + 1024 + 1 = 33793)
        */
        CUSTOM_EVENT_ID_S3LINK_UDK = 33793,
        // https://github.com/jp-rad/pxt-s3link-udk/

        /**
         * MState Update Event Bus ID.
         * (32768 + 1024 + 5 = 33797)
        */
        CUSTOM_EVENT_ID_MSTATE_UPDATE = 33797,
        // https://github.com/jp-rad/pxt-mstate/

        /**
         * Idle-Timer Interval Event Bus ID.
         * (32768 + 1024 + 9 = 33801)
         */
        CUSTOM_EVENT_ID_IDLETIMER_INTERVAL = 33801,
        /**
         * Idle-Timer Timeout Event Bus ID.
         * (32768 + 1024 + 10 = 33802)
         */
        CUSTOM_EVENT_ID_IDLETIMER_TIMEOUT = 33802,
        // https://github.com/jp-rad/pxt-idle-timer/
        
};

#endif // #ifndef CUSTOMMICROBIT_H
