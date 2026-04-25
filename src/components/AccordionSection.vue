<template>
  <div class="accordion-section" :class="{ 'is-open': isOpen }">
    <button 
      class="accordion-header" 
      @click="toggle"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-content-${id}`"
    >
      <div class="accordion-content-wrapper">
        <!-- Keyboard icon - single version with opacity control -->
        <svg v-if="showKeyboardIcon && isOpen" class="accordion-icon-img accordion-icon-keyboard is-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.86 17.96">
          <path fill="#eaeaea" d="M.01.29v17.38c0,.16.11.29.24.29h3.82c.13,0,.24-.13.24-.29v-8.41c0-.16-.11-.29-.24-.29h-.98c-.13,0-.24-.13-.24-.29V.29c0-.16-.11-.29-.24-.29H.24c-.13,0-.24.13-.24.29h.01Z"/>
          <path fill="#eaeaea" d="M17.85.29v17.38c0,.16-.11.29-.24.29h-3.82c-.13,0-.24-.13-.24-.29v-8.41c0-.16.11-.29.24-.29h.98c.13,0,.24-.13.24-.29V.29c0-.16.11-.29.24-.29h2.37c.13,0,.24.13.24.29h0Z"/>
          <path fill="#eaeaea" d="M6.86,17.96h4.14c.13,0,.24-.13.24-.29v-8.41c0-.16-.11-.29-.24-.29h-.79c-.13,0-.24-.13-.24-.29V.29c0-.16-.11-.29-.24-.29h-1.42c-.13,0-.24.13-.24.29v8.39c0,.16-.11.29-.24.29h-.98c-.13,0-.24.13-.24.29v8.41c0,.16.11.29.24.29h0Z"/>
        </svg>
        <svg v-if="showKeyboardIcon && !isOpen" class="accordion-icon-img accordion-icon-keyboard" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.86 17.96">
          <path fill="#eaeaea" d="M.01.29v17.38c0,.16.11.29.24.29h3.82c.13,0,.24-.13.24-.29v-8.41c0-.16-.11-.29-.24-.29h-.98c-.13,0-.24-.13-.24-.29V.29c0-.16-.11-.29-.24-.29H.24c-.13,0-.24.13-.24.29h.01Z"/>
          <path fill="#eaeaea" d="M17.85.29v17.38c0,.16-.11.29-.24.29h-3.82c-.13,0-.24-.13-.24-.29v-8.41c0-.16.11-.29.24-.29h.98c.13,0,.24-.13.24-.29V.29c0-.16.11-.29.24-.29h2.37c.13,0,.24.13.24.29h0Z"/>
          <path fill="#eaeaea" d="M6.86,17.96h4.14c.13,0,.24-.13.24-.29v-8.41c0-.16-.11-.29-.24-.29h-.79c-.13,0-.24-.13-.24-.29V.29c0-.16-.11-.29-.24-.29h-1.42c-.13,0,.24.13-.24.29v8.39c0,.16-.11.29-.24.29h-.98c-.13,0-.24.13-.24.29v8.41c0,.16.11.29.24.29h0Z"/>
        </svg>
        
        <!-- Lever icon - active version (when open) - used by both Lever 1 and Lever 2 -->
        <svg v-if="(showLever1Icon || showLever2Icon) && isOpen" class="accordion-icon-img accordion-icon-lever1 is-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128.48 99.43">
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="10" d="M73.98,31.89c26.03,1.76,46.6,23.43,46.6,49.9"/>
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="10" d="M35.51,46.12c-9.23,9.07-14.96,21.71-14.96,35.68"/>
          <line stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="10" x1="69.9" y1="79.34" x2="39.89" y2="3.98" fill="none"/>
          <circle fill="#eaeaea" cx="70" cy="80" r="15.91"/>
        </svg>
        <!-- Lever icon - inactive version (when closed) - used by both Lever 1 and Lever 2 -->
        <svg v-if="(showLever1Icon || showLever2Icon) && !isOpen" class="accordion-icon-img accordion-icon-lever1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128.48 99.43">
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="10" d="M56.61,33.86c4.55-1.36,9.36-2.09,14.35-2.09,27.62,0,50.02,22.39,50.02,50.02"/>
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="10" d="M20.94,81.79c0-6.08,1.08-11.9,3.07-17.29"/>
          <line stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="10" x1="69.9" y1="79.34" x2="7.5" y2="16" fill="none"/>
          <circle fill="#eaeaea" cx="70" cy="80" r="15.91"/>
        </svg>
        
        
        <!-- Press icon - active version (when open) - used by both Press 1 and Press 2 -->
        <svg v-if="(showPress1Icon || showPress2Icon) && isOpen" class="accordion-icon-img accordion-icon-press1 is-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.31 161.04">
          <polyline fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="12" points="193.93 102.27 180.37 102.27 75.29 102.27 61.74 102.27"/>
          <path fill="#eaeaea" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="12" d="M94.17,82h70.22c4.97,0,9,3,9,7v13.27h-88.22v-13.27c0-4,4.03-7,9-7Z"/>
        </svg>
        <!-- Press icon - inactive version (when closed) - used by both Press 1 and Press 2 -->
        <svg v-if="(showPress1Icon || showPress2Icon) && !isOpen" class="accordion-icon-img accordion-icon-press1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.31 161.04">
          <polyline fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="12" points="193.93 102.27 180.37 102.27 75.29 102.27 61.74 102.27"/>
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="12" d="M97.17,61.1h64.22c6.62,0,12,5.38,12,12v29.17h-88.22v-29.17c0-6.62,5.38-12,12-12Z"/>
        </svg>
        
        <!-- Touch icon - active version (when open) -->
        <svg v-if="showTouchIcon && isOpen" class="accordion-icon-img accordion-icon-touch is-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72.89 73.92">
          <circle fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" cx="36.88" cy="36.95" r="16.85"/>
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" d="M60.19,60.26c-12.87,12.87-33.74,12.87-46.61,0"/>
          <path fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" d="M13.58,13.65C26.45.78,47.32.78,60.19,13.65"/>
          <line stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" x1="4" y1="34.26" x2="4" y2="37.17"/>
          <line stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" x1="68.89" y1="34.26" x2="68.89" y2="37.17"/>
        </svg>
        <!-- Touch icon - inactive version (when closed) -->
        <svg v-if="showTouchIcon && !isOpen" class="accordion-icon-img accordion-icon-touch" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63.04 63.04">
          <circle fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" cx="31.52" cy="31.52" r="27.52"/>
          <circle fill="#eaeaea" cx="31.52" cy="31.52" r="14.14"/>
        </svg>
        
        <!-- Preset icon - active version (when open) -->
        <svg v-if="showPresetIcon && isOpen" class="accordion-icon-img accordion-icon-preset is-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.31 161.04">
          <path fill="#eaeaea" d="M165.18,29.93h-69.17c-6.84,0-12.43,5.59-12.43,12.43v70.14c0,6.84,5.59,12.43,12.43,12.43h69.17c6.84,0,12.43-5.59,12.43-12.43V42.36c0-6.84-5.59-12.43-12.43-12.43ZM161.07,104.67h-30.34c-1.45,3.38-4.8,5.75-8.71,5.75s-7.26-2.37-8.71-5.75h-13.84c-2.21,0-4-1.79-4-4s1.79-4,4-4h14.11c1.56-3.08,4.75-5.2,8.44-5.2s6.88,2.12,8.44,5.2h30.61c2.21,0,4,1.79,4,4s-1.79,4-4,4ZM161.07,81.21h-13.68c-1.45,3.38-4.8,5.75-8.71,5.75s-7.26-2.37-8.71-5.75h-30.5c-2.21,0-4-1.79-4-4s1.79-4,4-4h30.77c1.56-3.08,4.75-5.2,8.44-5.2s6.88,2.12,8.44,5.2h13.95c2.21,0,4,1.79,4,4s-1.79,4-4,4ZM161.07,57.75h-30.34c-1.45,3.38-4.8,5.75-8.71,5.75s-7.26-2.37-8.71-5.75h-13.84c-2.21,0-4-1.79-4-4s1.79-4,4-4h14.11c1.56-3.08,4.75-5.2,8.44-5.2s6.88,2.12,8.44,5.2h30.61c2.21,0,4,1.79,4,4s-1.79,4-4,4Z"/>
        </svg>
        <!-- Preset icon - inactive version (when closed) -->
        <svg v-if="showPresetIcon && !isOpen" class="accordion-icon-img accordion-icon-preset" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 252.31 161.04">
          <line fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="8" x1="99.47" y1="53.75" x2="161.07" y2="53.75"/>
          <circle fill="#eaeaea" cx="122.02" cy="54.03" r="9.47"/>
          <line fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="8" x1="99.47" y1="100.67" x2="161.07" y2="100.67"/>
          <circle fill="#eaeaea" cx="122.02" cy="100.94" r="9.47"/>
          <line fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="8" x1="99.47" y1="77.21" x2="161.07" y2="77.21"/>
          <circle fill="#eaeaea" cx="138.68" cy="77.49" r="9.47"/>
          <rect fill="none" stroke="#eaeaea" stroke-linecap="round" stroke-miterlimit="10" stroke-width="6" x="83.59" y="29.93" width="94.02" height="95" rx="7.58" ry="7.58"/>
        </svg>
        
        <!-- System icon - active version (when open) -->
        <svg v-if="showSystemIcon && isOpen" class="accordion-icon-img accordion-icon-system is-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107.49 109.44">
          <g>
            <path fill="#eaeaea" d="M44.19,108.45c-1.77,0-3.62-.12-5.5-.36l-.68-.09-2.45-9.83c-2.52-.66-4.94-1.6-7.23-2.81l-8.44,5.59-.56-.39c-3.54-2.49-6.67-5.49-9.32-8.92l-.42-.54,5.21-8.68c-1.3-2.23-2.35-4.61-3.12-7.1l-9.93-2.01-.12-.67c-.43-2.47-.64-4.96-.64-7.39,0-1.77.12-3.62.36-5.5l.09-.68,9.83-2.45c.66-2.51,1.6-4.94,2.81-7.23l-5.59-8.44.39-.56c2.49-3.54,5.49-6.67,8.92-9.32l.54-.42,8.68,5.22c1.39-.81,2.86-1.53,4.38-2.14.38-.15.78-.23,1.18-.23,1.61,0,2.94,1.21,3.1,2.82.41,4.09,1.45,8.07,3.09,11.83.68,1.56.05,3.41-1.45,4.21-5.14,2.74-8.17,8.27-7.71,14.09.54,6.9,5.91,12.51,12.76,13.34.61.07,1.23.11,1.83.11,5.58,0,10.59-3.1,13.09-8.1.68-1.36,2.02-2.2,3.51-2.2.43,0,.86.07,1.27.22,4.48,1.57,9.07,2,10.38,2.09h.14c1.23.06,2.33.68,3.01,1.7s.83,2.26.41,3.41c-.63,1.73-1.2,3.11-1.7,4.1l5.6,8.45-.39.56c-2.5,3.54-5.49,6.67-8.92,9.32l-.54.42-8.68-5.21c-2.23,1.3-4.61,2.35-7.1,3.12l-2.01,9.93-.67.12c-2.47.43-4.96.64-7.39.64l-.02-.02Z"/>
            <path fill="#eaeaea" d="M18.4,31.87l8.61,5.17c1.51-.92,3.1-1.71,4.75-2.38.27-.11.54-.16.81-.16,1.05,0,1.99.78,2.11,1.92.43,4.27,1.52,8.35,3.17,12.13.48,1.09.05,2.36-1,2.92-5.27,2.81-8.75,8.54-8.24,15.05.57,7.31,6.35,13.37,13.63,14.25.66.08,1.31.12,1.95.12,6.12,0,11.42-3.52,13.98-8.65.51-1.02,1.53-1.65,2.61-1.65.31,0,.63.05.94.16,4.22,1.48,8.59,2,10.63,2.14h.17c1.9.09,3.17,1.99,2.52,3.77-.58,1.6-1.29,3.37-1.92,4.51l5.55,8.37c-2.43,3.45-5.37,6.52-8.71,9.1l-8.61-5.17c-2.46,1.5-5.13,2.68-7.96,3.5l-2,9.85c-2.35.41-4.76.63-7.22.63-1.82,0-3.61-.13-5.37-.35l-2.43-9.75c-2.87-.69-5.59-1.76-8.11-3.15l-8.37,5.55c-3.45-2.43-6.52-5.37-9.1-8.71l5.17-8.61c-1.5-2.46-2.68-5.13-3.5-7.96l-9.85-2c-.41-2.35-.63-4.76-.63-7.22,0-1.82.13-3.61.35-5.37l9.75-2.43c.69-2.87,1.76-5.59,3.15-8.11l-5.55-8.37c2.43-3.45,5.37-6.52,8.71-9.1M18.26,29.45l-1.08.84c-3.5,2.71-6.57,5.92-9.12,9.53l-.79,1.12.76,1.14,4.89,7.38c-1.02,2.02-1.85,4.15-2.46,6.34l-8.59,2.14-1.33.33-.17,1.36c-.24,1.92-.37,3.82-.37,5.63,0,2.49.22,5.03.66,7.56l.23,1.35,1.34.27,8.68,1.76c.71,2.17,1.63,4.25,2.74,6.22l-4.56,7.59-.7,1.17.84,1.08c2.71,3.5,5.92,6.57,9.53,9.12l1.12.79,1.14-.76,7.38-4.89c2.02,1.02,4.15,1.85,6.34,2.46l2.14,8.59.33,1.33,1.36.17c1.92.24,3.82.37,5.63.37,2.49,0,5.03-.22,7.56-.66l1.35-.23.27-1.34,1.76-8.68c2.17-.71,4.25-1.63,6.22-2.74l7.59,4.56,1.17.7,1.08-.84c3.5-2.71,6.57-5.92,9.12-9.53l.79-1.12-.76-1.14-4.91-7.41c.45-.97.95-2.2,1.49-3.68.53-1.45.34-3.02-.52-4.31s-2.25-2.07-3.8-2.14h-.14c-1.31-.1-5.76-.52-10.09-2.04-.52-.18-1.05-.27-1.6-.27-1.87,0-3.55,1.06-4.4,2.76-2.33,4.65-7,7.55-12.2,7.55-.57,0-1.14-.03-1.71-.1-6.38-.77-11.37-6-11.88-12.42-.43-5.42,2.39-10.57,7.19-13.13,1.95-1.04,2.78-3.45,1.89-5.49-1.6-3.66-2.61-7.54-3.01-11.53-.21-2.12-1.97-3.72-4.1-3.72-.53,0-1.06.1-1.55.3-1.38.55-2.72,1.2-3.99,1.91l-7.59-4.56-1.17-.7h0Z"/>
          </g>
          <g>
            <path fill="#eaeaea" d="M75.19,64.36c-1.12,0-2.25-.06-3.36-.18l-.15-.02-2-7.33c-2.06-.46-4.07-1.19-5.97-2.17l-6.24,4.34-.13-.09c-1.55-1.04-2.99-2.2-4.3-3.45-.95-.91-1.88-1.92-2.77-3.02l-.1-.12,3.77-6.6c-1.14-1.80-2.05-3.74-2.69-5.76l-7.48-1.34-.03-.15c-.62-3.15-.76-6.37-.43-9.57l.02-.15,7.33-2c.46-2.06,1.19-4.07,2.17-5.97l-4.34-6.24.09-.13c1.04-1.55,2.2-2.99,3.45-4.3.92-.96,1.91-1.87,3.02-2.77l.12-.1,6.6,3.77c1.80-1.14,3.74-2.05,5.76-2.69l1.34-7.48.15-.03c2.04-.4,4.13-.6,6.2-.6,1.12,0,2.25.06,3.37.18l.15.02,2,7.33c2.06.46,4.07,1.19,5.97,2.17l6.24-4.34.13.09c1.55,1.04,2.99,2.2,4.3,3.45.95.91,1.88,1.92,2.77,3.02l.1.12-3.77,6.6c1.14,1.80,2.05,3.74,2.69,5.76l7.48,1.34.03.15c.62,3.15.76,6.37.43,9.57l-.02.15-7.33,2c-.46,2.06-1.19,4.07-2.17,5.97l4.34,6.24-.09.13c-1.04,1.54-2.2,2.99-3.45,4.3-.92.96-1.91,1.87-3.02,2.77l-.12.1-6.6-3.77c-1.80,1.14-3.74,2.05-5.76,2.69l-1.34,7.48-.15.03c-2.04.4-4.13.6-6.2.6h0ZM75.19,21.9c-2.87,0-5.54,1.14-7.52,3.21-1.92,2.01-2.94,4.64-2.88,7.42s1.2,5.36,3.21,7.28c1.94,1.86,4.49,2.88,7.18,2.88,2.87,0,5.54-1.14,7.52-3.21,1.92-2.01,2.94-4.64,2.88-7.42s-1.2-5.36-3.21-7.28c-1.94-1.86-4.49-2.88-7.18-2.88Z"/>
            <path fill="#eaeaea" d="M75.2.45c1.11,0,2.23.06,3.34.17l2,7.31c2.13.46,4.2,1.22,6.17,2.24l6.23-4.33c1.49,1,2.92,2.14,4.27,3.42.99.95,1.90,1.96,2.75,3l-3.76,6.59c1.20,1.87,2.13,3.88,2.78,5.95l7.46,1.34c.61,3.13.76,6.33.42,9.50l-7.31,2c-.46,2.13-1.22,4.2-2.24,6.17l4.33,6.23c-1,1.49-2.14,2.92-3.42,4.27-.95.99-1.96,1.90-3,2.75l-6.59-3.76c-1.87,1.20-3.88,2.13-5.95,2.78l-1.34,7.46c-2.03.40-4.10.60-6.16.60-1.11,0-2.23-.06-3.34-.17l-2-7.31c-2.13-.46-4.20-1.22-6.17-2.24l-6.23,4.33c-1.49-1-2.92-2.14-4.27-3.42-.99-.95-1.90-1.96-2.75-3l3.76-6.59c-1.20-1.87-2.13-3.88-2.78-5.95l-7.46-1.34c-.61-3.13-.76-6.33-.42-9.50l7.31-2c.46-2.13,1.22-4.20,2.24-6.17l-4.33-6.23c1-1.49,2.14-2.92,3.42-4.27.95-.99,1.96-1.90,3-2.75l6.59,3.76c1.87-1.20,3.88-2.13,5.95-2.78l1.34-7.46c2.03-.40,4.10-.60,6.16-.60M75.19,42.91c2.80,0,5.59-1.10,7.68-3.28,4.05-4.24,3.90-10.96-.34-15.02-2.06-1.97-4.70-2.94-7.34-2.94-2.80,0-5.59,1.10-7.68,3.28-4.05,4.24-3.90,10.96.34,15.02,2.06,1.97,4.70,2.94,7.34,2.94M75.20,0c-2.09,0-4.20.20-6.25.61l-.30.06-.05.30-1.29,7.19c-1.95.64-3.82,1.51-5.56,2.60l-6.35-3.62-.27-.15-.24.19c-1.10.89-2.12,1.83-3.04,2.79-1.26,1.31-2.43,2.77-3.47,4.33l-.17.26.18.25,4.18,6c-.94,1.84-1.64,3.78-2.10,5.77l-7.05,1.93-.30.08-.03.31c-.34,3.22-.19,6.46.43,9.64l.06.30.30.05,7.19,1.29c.64,1.95,1.51,3.82,2.60,5.56l-3.62,6.35-.15.27.19.24c.89,1.10,1.83,2.12,2.79,3.04,1.31,1.26,2.77,2.43,4.33,3.47l.26.17.25-.18,6-4.18c1.84.94,3.78,1.64,5.77,2.10l1.93,7.05.08.30.31.03c1.12.12,2.26.18,3.39.18,2.09,0,4.20-.20,6.25-.61l.30-.06.05-.30,1.29-7.19c1.95-.64,3.82-1.51,5.56-2.60l6.35,3.62.27.15.24-.19c1.10-.89,2.12-1.83,3.04-2.79,1.26-1.32,2.43-2.77,3.47-4.33l.17-.26-.18-.25-4.18-6c.94-1.84,1.64-3.78,2.10-5.77l7.05-1.93.30-.08.03-.31c.34-3.22.19-6.46-.43-9.64l-.06-.30-.30-.05-7.19-1.29c-.64-1.95-1.51-3.82-2.60-5.56l3.62-6.35.15-.27-.19-.24c-.89-1.10-1.83-2.12-2.79-3.04-1.31-1.26-2.77-2.43-4.33-3.47l-.26-.17-.25.18-6,4.18c-1.84-.94-3.78-1.64-5.77-2.10l-1.93-7.05-.08-.30-.31-.03c-1.12-.12-2.26-.18-3.39-.18h0ZM75.19,42.46c-2.63,0-5.13-1-7.03-2.82-1.96-1.88-3.08-4.41-3.14-7.12-.06-2.72.94-5.29,2.82-7.26,1.94-2.03,4.55-3.14,7.35-3.14,2.63,0,5.13,1,7.03,2.82,4.05,3.88,4.20,10.33.32,14.38-1.94,2.03-4.55,3.14-7.35,3.14h0Z"/>
          </g>
        </svg>
        <!-- System icon - inactive version (when closed) -->
        <svg v-if="showSystemIcon && !isOpen" class="accordion-icon-img accordion-icon-system" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108.78 110.75">
          <path fill="none" stroke="#eaeaea" stroke-miterlimit="10" stroke-width="4.5" d="M73.36,73.19c-2.04-.15-6.42-.66-10.63-2.14-1.39-.49-2.89.17-3.55,1.49-2.83,5.67-9,9.37-15.94,8.53-7.28-.88-13.06-6.94-13.63-14.25-.51-6.5,2.97-12.23,8.24-15.05,1.05-.56,1.47-1.83,1-2.92-1.65-3.78-2.74-7.86-3.17-12.13-.14-1.42-1.59-2.29-2.91-1.76-1.66.67-3.25,1.46-4.75,2.38l-8.61-5.17c-3.34,2.58-6.28,5.65-8.71,9.10l5.55,8.37c-1.39,2.52-2.45,5.24-3.15,8.11l-9.75,2.43c-.22,1.76-.35,3.55-.35,5.37,0,2.46.22,4.87.63,7.22l9.85,2c.82,2.83,2,5.50,3.50,7.96l-5.17,8.61c2.58,3.34,5.65,6.28,9.10,8.71l8.37-5.55c2.52,1.39,5.24,2.45,8.11,3.15l2.43,9.75c1.76.22,3.55.35,5.37.35,2.46,0,4.87-.22,7.22-.63l2-9.85c2.83-.82,5.50-2,7.96-3.50l8.61,5.17c3.34-2.58,6.28-5.65,8.71-9.10l-5.55-8.37c.63-1.14,1.33-2.91,1.92-4.51.65-1.78-.62-3.68-2.52-3.76h-.18Z"/>
          <path fill="none" stroke="#eaeaea" stroke-miterlimit="10" stroke-width="4.5" d="M99.66,13.61c-.8-.99-1.66-1.94-2.61-2.84-1.27-1.22-2.63-2.29-4.05-3.25l-5.90,4.11c-1.87-.97-3.84-1.69-5.85-2.13l-1.89-6.93c-3-.32-6.04-.18-9.01.40l-1.27,7.07c-1.96.62-3.86,1.50-5.64,2.64l-6.24-3.56c-.99.80-1.94,1.66-2.84,2.61-1.22,1.27-2.29,2.63-3.25,4.05l4.11,5.90c-.97,1.87-1.69,3.84-2.13,5.85l-6.93,1.89c-.32,3-.18,6.04.40,9.01l7.07,1.27c.62,1.96,1.50,3.86,2.64,5.64l-3.56,6.24c.80.99,1.66,1.94,2.61,2.84,1.27,1.22,2.63,2.29,4.05,3.25l5.90-4.11c1.87.97,3.84,1.69,5.85,2.13l1.89,6.93c3,.32,6.04.18,9.01-.40l1.27-7.07c1.96-.62,3.86-1.50,5.64-2.64l6.24,3.56c.99-.80,1.94-1.66,2.84-2.61,1.22-1.27,2.29-2.63,3.25-4.05l-4.11-5.90c.97-1.87,1.69-3.84,2.13-5.85l6.93-1.89c.32-3,.18-6.04-.40-9.01l-7.07-1.27c-.62-1.96-1.50-3.86-2.64-5.64l3.56-6.24h0ZM83.04,39.14c-3.61,3.78-9.61,3.92-13.39.30s-3.92-9.61-.30-13.39,9.61-3.92,13.39-.30c3.78,3.61,3.92,9.61.30,13.39Z"/>
        </svg>
        
        <div class="accordion-text-content">
          <div class="accordion-title-row">
            <h3 class="accordion-title-text">
              {{ title }}
              <span v-if="titleSuffix" class="title-suffix" :class="{ fading: titleSuffixFading }">{{ titleSuffix }}</span>
            </h3>
            <slot name="header-right">
              <div v-if="midiCc !== undefined" class="midi-cc-display">
                MIDI CC <span class="midi-cc-number">{{ midiCc }}</span>
              </div>
            </slot>
            <span class="accordion-icon">{{ isOpen ? '−' : '+' }}</span>
          </div>
          <div v-if="subtitle" class="accordion-subtitle">{{ subtitle }}</div>
        </div>
      </div>
    </button>
    <div 
      :id="`accordion-content-${id}`"
      class="accordion-content"
      :class="{ 'is-open': isOpen }"
    >
      <div class="accordion-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  subtitle?: string;
  midiCc?: number;
  id?: string;
  defaultOpen?: boolean;
  titleSuffix?: string;
  titleSuffixFading?: boolean;
  showKeyboardIcon?: boolean;  // Show keyboard icon (filled when open, outline when closed)
  showLever1Icon?: boolean;    // Show Lever 1 icon
  showLever2Icon?: boolean;    // Show Lever 2 icon (same as L1)
  showPress1Icon?: boolean;    // Show Press 1 icon
  showPress2Icon?: boolean;    // Show Press 2 icon (same as P1)
  showTouchIcon?: boolean;     // Show Touch icon
  showPresetIcon?: boolean;    // Show Preset icon
  showSystemIcon?: boolean;    // Show System icon
}>();

const isOpen = ref(props.defaultOpen ?? false);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

defineExpose({
  close,
  isOpen
});
</script>

<style scoped>
.accordion-section {
  background: var(--color-background-soft);
  border: none;
  border-radius: var(--kb1-radius-lg);
  margin-bottom: 6px; /* Gap between accordion sections */
  overflow: visible;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.accordion-section:not(.is-open) {
  overflow: hidden;
}

.accordion-header {
  width: 100%;
  display: block;
  padding: 0.25rem 1rem; /* 4px top/bottom, 16px left/right */
  background: rgba(106, 104, 83, 0.2); /* Warm brownish tone for dark mode */
  border: none;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  min-height: 44px; /* Minimum header height for touch target */
  font-family: var(--kb1-font-family);
  border-radius: var(--kb1-radius-lg);
}

.accordion-section.is-open .accordion-header {
  background: rgba(106, 104, 83, 0.7); /* More visible when open */
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.accordion-header:hover {
  background: rgba(106, 104, 83, 0.6); /* More visible on hover */
}

.accordion-header:active {
  background: rgba(106, 104, 83, 0.8); /* Brightest when pressed */
}

.accordion-content-wrapper {
  width: 100%;
  display: flex; /* Flex container for icon and text */
  align-items: center; /* Center icon vertically across both rows */
  gap: 1.0rem; /* ← 16px gap between icon and text (adjust this to move text closer/farther from icon) */
}

.accordion-text-content {
  flex: 1; /* Take remaining space */
  min-width: 0; /* Allow text to shrink */
  padding: 0.25rem 0; /* ← 4px top/bottom padding around text (adjust this for more vertical breathing room) */
}

.accordion-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--kb1-spacing-xxs);
}

.accordion-icon-img {
  /* Base icon styles - all icons share these */
  width: auto;
  opacity: 0.3; /* 30% opacity when closed */
  transition: opacity 0.2s;
  flex-shrink: 0;
  align-self: center; /* Center vertically in flex container */
}

/* Individual icon sizing and spacing controls */
.accordion-icon-keyboard {
  height: 18px; /* Keyboard icon height */
  margin-left: 0rem; /* Space from left edge */
  margin-right: 0rem; /* Space between icon and text */
}

.accordion-icon-lever1 {
  height: 16px; /* Lever icon height - used by both Lever 1 and Lever 2 */
  margin-left: -.1rem; /* Space from left edge */
  margin-right: -.2rem; /* Space between icon and text */
}

.accordion-icon-press1 {
  height: 20px; /* Press icon height - used by both Press 1 and Press 2 */
  margin-left: -.5rem; /* Space from left edge */
  margin-right: -.5rem; /* Space between icon and text */
}

.accordion-icon-touch {
  height: 15px; /* Touch icon height */
  margin-left: 0rem; /* Space from left edge */
  margin-right: 0rem; /* Space between icon and text */
}
.accordion-icon-preset {
  height: 34px; /* Preset icon height */
  margin-left: -1.25rem; /* Space from left edge */
  margin-right: -1.1rem; /* Space between icon and text */
}

.accordion-icon-system {
  height: 28px; /* System icon height */
  margin-left: -.25rem; /* Space from left edge */
  margin-right: -.5rem; /* Space between icon and text */
}

.accordion-icon-img.is-open {
  opacity: 1; /* 100% opacity when open */
}

.accordion-title-text {
  margin: 0;
  font-size: var(--kb1-font-input); /* 13px */
  font-weight: var(--kb1-font-weight-medium);
  color: #848484;
  text-transform: var(--kb1-text-transform-uppercase);
  font-family: var(--kb1-font-family);
  transition: color 0.2s;
  flex: 1;
  min-width: 0;
}

.accordion-header:hover .accordion-title-text {
  color: rgba(234, 234, 234, 0.8);
}

.title-suffix {
  color: var(--ui-highlight);
  margin-left: var(--kb1-spacing-sm);
  font-weight: var(--kb1-font-weight-medium);
  text-transform: var(--kb1-text-transform-none);
  opacity: 1;
  transition: none;
}

.title-suffix.fading {
  opacity: 0;
  transition: opacity 2s ease-out;
}

.accordion-section.is-open .accordion-title-text {
  font-weight: var(--kb1-font-weight-bold);
  color: #EAEAEA;
}

.accordion-subtitle {
  margin-top: 0.125rem;
  font-size: var(--kb1-font-input); /* 13px */
  color: var(--color-text-muted);
  line-height: 1.4;
  font-family: var(--kb1-font-family);
  white-space: nowrap;
  overflow: visible;
  width: 100%;
}

.midi-cc-display {
  font-size: var(--kb1-font-input); /* 13px */
  font-weight: var(--kb1-font-weight-normal);
  color: #848484;
  font-family: var(--kb1-font-family);
  flex-shrink: 0;
  white-space: nowrap;
}

.midi-cc-number {
  color: var(--ui-highlight);
  font-weight: var(--kb1-font-weight-semibold);
}

.accordion-icon {
  font-size: var(--kb1-font-input); /* 13px */
  font-weight: var(--kb1-font-weight-light);
  color: var(--color-text-muted);
  transition: transform 0.2s;
  min-width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.accordion-section.is-open .accordion-icon {
  transform: rotate(0deg);
}

.accordion-content {
  max-height: 0; /* Collapsed state */
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.accordion-content.is-open {
  max-height: 5000px; /* Large value for smooth expand animation */
  transition: max-height 0.3s ease-in;
  overflow: visible;
}

.accordion-body {
  padding: 0; /* No padding - child controls its own spacing */
}

@media (max-width: 768px) {
  .accordion-header {
    padding: 0.25rem 1rem; /* Same padding on mobile */
  }
  
  .accordion-body {
    padding: 0; /* No padding on mobile either */
  }
  
  .accordion-icon {
    margin-left: var(--kb1-spacing-sm);
  }
}
</style>
