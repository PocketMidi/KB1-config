<template>
  <div class="mobile-tab-nav-wrapper">
    <nav class="mobile-tab-nav">
      <!-- Tab buttons -->
      <div class="tab-buttons">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: modelValue === tab.id }"
          @click="$emit('update:modelValue', tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <!-- Bluetooth status section -->
      <div 
        class="bluetooth-status" 
        :class="{ connected: isConnected, hoverable: !isConnected }"
        @click="!isConnected && $emit('connect')"
        @touchstart="!isConnected && (isHovering = true)"
        @touchend="isHovering = false"
        @mouseenter="!isConnected && (isHovering = true)"
        @mouseleave="isHovering = false"
      >
        <div class="separator"></div>
        <span class="status-text">
          {{ isConnected ? 'CONNECTED' : (isHovering ? 'CONNECT' : 'DISCONNECTED') }}
        </span>
        <svg class="bluetooth-icon" viewBox="0 0 23 26" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.63159 4.90753L17.1295 19.1835L11.2655 25V1L17.0505 6.73819L3.63159 20.9374" stroke="#47708E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M1.65541 14.1527C2.56966 14.1527 3.31081 13.4116 3.31081 12.4974C3.31081 11.5832 2.56966 10.842 1.65541 10.842C0.741151 10.842 0 11.5832 0 12.4974C0 13.4116 0.741151 14.1527 1.65541 14.1527Z" fill="#47708E"/>
          <path d="M20.7212 14.1527C21.6355 14.1527 22.3766 13.4116 22.3766 12.4974C22.3766 11.5832 21.6355 10.842 20.7212 10.842C19.8069 10.842 19.0658 11.5832 19.0658 12.4974C19.0658 13.4116 19.8069 14.1527 20.7212 14.1527Z" fill="#47708E"/>
        </svg>
      </div>
    </nav>
    <!-- Horizontal divider -->
    <div class="nav-divider"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface Tab {
  id: string;
  label: string;
}

defineProps<{
  tabs: Tab[];
  modelValue: string;
  isConnected: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  connect: [];
}>();

const isHovering = ref(false);
</script>

<style scoped>
.mobile-tab-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 200;
  background-color: #0F0F0F;
}

.mobile-tab-nav {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  background-color: #0F0F0F;
  border-bottom: none;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-buttons {
  display: flex;
  flex: 1;
}

.tab-button {
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0;
  color: #EAEAEA;
  font-family: var(--kb1-font-family-mono);
  font-weight: var(--kb1-font-weight-normal);
  font-size: var(--kb1-font-input); /* 13px */
  text-transform: var(--kb1-text-transform-uppercase);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  opacity: 0.32;
  transition: all 0.2s;
  white-space: nowrap;
  min-height: 44px;
  position: relative;
}

.tab-button:hover {
  opacity: 0.6;
  background: transparent;
}

.tab-button.active {
  color: #EAEAEA;
  opacity: 1;
  background: transparent;
  font-weight: var(--kb1-font-weight-bold);
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #EAEAEA;
  border-radius: 1px;
}

/* Inactive tab underline */
.tab-button:not(.active)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #EAEAEA;
  opacity: 0.32;
  border-radius: 1px;
}

.tab-button:active {
  transform: scale(0.98);
}

/* Bluetooth status section */
.bluetooth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  white-space: nowrap;
}

.bluetooth-status.hoverable {
  cursor: pointer;
}

.separator {
  width: 2px;
  height: 1.25rem;
  background: rgba(234, 234, 234, 0.3);
  align-self: center;
  flex-shrink: 0;
}

.status-text {
  font-family: var(--kb1-font-family-mono);
  font-weight: var(--kb1-font-weight-normal);
  font-size: var(--kb1-font-input); /* 13px */
  color: #47708E;
  opacity: 0.5;
  transition: color 0.5s ease-in-out, opacity 0.5s ease-in-out, transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), font-weight 0.5s ease-in-out;
  transform-origin: center;
}

.bluetooth-status.hoverable:hover .status-text,
.bluetooth-status.hoverable:active .status-text {
  color: var(--bluetooth-status-active);
  opacity: 1;
  transform: scale(1.1);
  font-weight: var(--kb1-font-weight-bold);
}

.bluetooth-status.connected .status-text {
  opacity: 1;
  animation: breathe 3s ease-in-out infinite;
}

.bluetooth-status.connected.hoverable:hover .status-text,
.bluetooth-status.connected.hoverable:active .status-text {
  animation: none; /* Disable breathing on hover/active */
}

.bluetooth-icon {
  height: 32px; /* Scaled up by 60% (160% of original 20px) per requirements */
  width: auto;
  transition: filter 0.5s ease-in-out, transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-origin: center;
}

/* Bluetooth icon hover effect */
.bluetooth-status.hoverable:hover .bluetooth-icon,
.bluetooth-status.hoverable:active .bluetooth-icon {
  filter: brightness(0) saturate(100%) invert(65%) sepia(45%) saturate(1154%) hue-rotate(174deg) brightness(101%) contrast(101%);
  transform: scale(1.15);
}

.bluetooth-status.connected .bluetooth-icon {
  animation: breatheScale 3s ease-in-out infinite;
}

.bluetooth-status.connected.hoverable:hover .bluetooth-icon,
.bluetooth-status.connected.hoverable:active .bluetooth-icon {
  animation: none; /* Disable breathing on hover/active */
}

/* Breathing animation for connected state */
@keyframes breathe {
  0%, 100% {
    opacity: 0.5;
    color: #47708E;
    font-weight: var(--kb1-font-weight-normal);
    text-shadow: none;
  }
  50% {
    opacity: 1;
    color: var(--bluetooth-status-active);
    font-weight: var(--kb1-font-weight-bold);
    text-shadow: 0 0 20px rgba(116, 196, 255, 1), 0 0 40px rgba(116, 196, 255, 0.8), 0 0 60px rgba(116, 196, 255, 0.5);
  }
}

@keyframes breatheScale {
  0%, 100% {
    transform: scale(1);
    filter: none;
  }
  50% {
    transform: scale(1.15);
    filter: brightness(0) saturate(100%) invert(65%) sepia(45%) saturate(1154%) hue-rotate(174deg) brightness(120%) contrast(110%) drop-shadow(0 0 16px rgba(116, 196, 255, 1)) drop-shadow(0 0 32px rgba(116, 196, 255, 0.8));
  }
}

/* Horizontal divider under navigation */
.nav-divider {
  height: 3px;
  background: rgba(234, 234, 234, 0.3);
  width: 100%;
}

@media (max-width: 768px) {
  .tab-button {
    font-size: var(--kb1-font-input);
    padding: 0.75rem 1rem;
  }
  
  .bluetooth-status {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }
  
  .bluetooth-icon {
    height: 32px; /* Scaled up by 60% per requirements, even on smaller screens */
  }
}
</style>
