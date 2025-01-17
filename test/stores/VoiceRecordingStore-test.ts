
/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { MatrixClient } from "matrix-js-sdk";

import "../skinned-sdk"; // Must be first for skinning to work
import { VoiceRecording } from '../../src/audio/VoiceRecording';
import { VoiceRecordingStore } from '../../src/stores/VoiceRecordingStore';
import { MatrixClientPeg } from "../../src/MatrixClientPeg";
import { flushPromises } from "../test-utils";

const stubClient = {} as undefined as MatrixClient;
jest.spyOn(MatrixClientPeg, 'get').mockReturnValue(stubClient);

describe('VoiceRecordingStore', () => {
    const room1Id = '!room1:server.org';
    const room2Id = '!room2:server.org';
    const room3Id = '!room3:server.org';
    const room1Recording = { destroy: jest.fn() } as unknown as VoiceRecording;
    const room2Recording = { destroy: jest.fn() } as unknown as VoiceRecording;

    const state = {
        [room1Id]: room1Recording,
        [room2Id]: room2Recording,
        [room3Id]: undefined,
    };

    describe('startRecording()', () => {
        it('throws when roomId is falsy', () => {
            const store = new VoiceRecordingStore();
            expect(() => store.startRecording(undefined)).toThrow("Recording must be associated with a room");
        });

        it('throws when room already has a recording', () => {
            const store = new VoiceRecordingStore();
            // @ts-ignore
            store.storeState = state;
            expect(() => store.startRecording(room2Id)).toThrow("A recording is already in progress");
        });

        it('creates and adds recording to state', async () => {
            const store = new VoiceRecordingStore();
            const result = store.startRecording(room2Id);

            await flushPromises();

            expect(result).toBeInstanceOf(VoiceRecording);
            expect(store.getActiveRecording(room2Id)).toEqual(result);
        });
    });

    describe('disposeRecording()', () => {
        it('destroys recording for a room if it exists in state', async () => {
            const store = new VoiceRecordingStore();
            // @ts-ignore
            store.storeState = state;

            await store.disposeRecording(room1Id);

            expect(room1Recording.destroy).toHaveBeenCalled();
        });

        it('removes room from state when it has a recording', async () => {
            const store = new VoiceRecordingStore();
            // @ts-ignore
            store.storeState = state;

            await store.disposeRecording(room2Id);

            expect(store.getActiveRecording(room2Id)).toBeFalsy();
        });

        it('removes room from state when it has a falsy recording', async () => {
            const store = new VoiceRecordingStore();
            // @ts-ignore
            store.storeState = state;

            await store.disposeRecording(room3Id);

            expect(store.getActiveRecording(room1Id)).toEqual(room1Recording);
            expect(store.getActiveRecording(room2Id)).toEqual(room2Recording);
            expect(store.getActiveRecording(room3Id)).toBeFalsy();
        });
    });
});
