/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/
import { ref, readonly } from 'vue';

type ToastType = 'success' | 'error' | 'info';

const isVisible = ref(false);
const message = ref('');
const type = ref<ToastType>('info');

let timeoutId: NodeJS.Timeout | undefined;

const showToast = (
  toastMessage: string,
  toastType: ToastType = 'info',
  duration = 10000
) => {
  message.value = toastMessage;
  type.value = toastType;
  isVisible.value = true;

  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  timeoutId = setTimeout(() => {
    hideToast();
  }, duration);
};

const hideToast = () => {
  isVisible.value = false;
  message.value = '';
  type.value = 'info';
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
};

export function useToast() {
  return {
    isVisible: readonly(isVisible),
    message: readonly(message),
    type: readonly(type),
    showToast,
    hideToast,
  };
}
