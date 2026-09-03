<template>
  <button
    class="user-guide-launcher"
    aria-haspopup="dialog"
    @click="openManual"
  >
    <span class="user-guide-content">
      <span class="user-guide-icon-wrap" aria-hidden="true">
        <svg class="user-guide-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.78 26.35">
          <path fill="currentColor" d="M16.16,0H4.22C2.58,0,1.24,1.34,1.24,2.98v2.43h-.16c-.6,0-1.08.48-1.08,1.08v.33c0,.6.48,1.08,1.08,1.08h.16v4.12h-.16c-.6,0-1.08.48-1.08,1.08v.33c0,.6.48,1.08,1.08,1.08h.16v4.01h-.16c-.6,0-1.08.48-1.08,1.08v.33c0,.6.48,1.08,1.08,1.08h.16v2.37c0,1.64,1.34,2.98,2.98,2.98h14.58c1.64,0,2.98-1.34,2.98-2.98V6.2L16.16,0ZM20.48,23.37c0,.93-.75,1.68-1.68,1.68H4.22c-.93,0-1.68-.75-1.68-1.68v-2.37h1.05c.6,0,1.08-.48,1.08-1.08v-.33c0-.6-.48-1.08-1.08-1.08h-1.05v-4.01h1.05c.6,0,1.08-.48,1.08-1.08v-.33c0-.6-.48-1.08-1.08-1.08h-1.05v-4.12h1.05c.6,0,1.08-.48,1.08-1.08v-.33c0-.6-.48-1.08-1.08-1.08h-1.05v-2.43c0-.93.75-1.68,1.68-1.68h11.36l4.9,5.4v16.67Z"/>
          <path fill="currentColor" d="M16.47,6.73c-.85,0-1.54-.69-1.54-1.54v-2.86H6.66c-.62,0-1.13.5-1.13,1.13v19.45c0,.62.5,1.13,1.13,1.13h11.42c.62,0,1.13-.5,1.13-1.13V6.73h-2.73ZM12.74,18.57c-2.89,0-5.24-2.35-5.24-5.24s2.35-5.24,5.24-5.24,5.24,2.35,5.24,5.24-2.35,5.24-5.24,5.24Z"/>
          <path fill="currentColor" d="M12.74,9.38c-2.17,0-3.94,1.77-3.94,3.94s1.77,3.94,3.94,3.94,3.94-1.77,3.94-3.94-1.77-3.94-3.94-3.94Zm-.45,1.44c.23-.25.68-.25.91,0,.07.06.11.13.15.21.03.08.04.16.04.25,0,.08,0,.16-.04.24-.04.08-.08.16-.15.22-.12.12-.28.19-.45.19-.09,0-.17-.02-.25-.05-.08-.04-.16-.08-.21-.14-.12-.13-.19-.3-.19-.46,0-.17.07-.34.19-.46Zm1.1,4.54c0,.36-.29.65-.65.65s-.65-.29-.65-.65v-2.15c0-.36.29-.65.65-.65s.65.29.65.65v2.15Z"/>
        </svg>
      </span>
      <span class="user-guide-title">USER GUIDE</span>
      <span class="user-guide-action">•••</span>
      <span class="user-guide-indicator" aria-hidden="true">+</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useManual } from '../composables/useManual'

const { openManual } = useManual()
</script>

<style scoped>
.user-guide-launcher {
  width: 100%;
  min-height: 44px;
  padding: 0.25rem 1rem;
  margin-bottom: 6px;
  background: var(--outlined-bg);
  border: 1px solid var(--outlined-border);
  border-radius: var(--kb1-radius-lg);
  color: var(--color-text);
  font-family: 'Roboto Mono';
  font-size: 0.8125rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.user-guide-content {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-guide-icon-wrap {
  position: relative;
  width: 24px;
  height: 28px;
  flex-shrink: 0;
  margin-left: -0.3rem;
  margin-right: -0.1rem;
  color: #eaeaea;
}

.user-guide-icon {
  width: 22px;
  height: 26px;
  opacity: 0.3;
}

.user-guide-title {
  flex: 1;
  min-width: 0;
  color: #848484;
  text-align: left;
}

.user-guide-launcher:hover {
  background: var(--outlined-bg-hover);
  border-color: var(--outlined-border-hover);
}

.user-guide-launcher:active {
  background: var(--outlined-bg-active);
  border-color: var(--outlined-border-active);
}

.user-guide-launcher:focus {
  outline: none;
}

.user-guide-action {
  color: var(--ui-highlight);
  white-space: nowrap;
}

.user-guide-indicator {
  margin-right: 8px;
  color: #848484;
  font-size: var(--kb1-font-input);
  text-align: right;
}
</style>