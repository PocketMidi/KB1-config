<template>
  <svg width="100%" viewBox="0 0 583 78" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath :id="`clip-cont-${uid}`">
        <rect width="583" height="78" fill="white"/>
      </clipPath>
    </defs>

    <g :clip-path="`url(#clip-cont-${uid})`">
      <mask :id="`mask-cont-${uid}`" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="-16" width="660" height="110">
        <path d="M659.477 0H0V78H659.477V0Z" fill="white"/>
      </mask>
      <g :mask="`url(#mask-cont-${uid})`">
        <rect width="882" height="843.46" transform="translate(-299 -382)" fill="var(--touch-profile-bg)"/>

        <!-- Outermost dashed circle -->
        <path class="dash-outer" opacity="0.45" d="M141.927 378C325.782 378 479.927 223.855 479.927 40C479.927 -143.855 325.782 -298 141.927 -298C-41.928 -298 -196.073 -143.855 -196.073 40C-196.073 223.855 -41.928 378 141.927 378Z" stroke="var(--touch-profile-highlight)" stroke-miterlimit="10" stroke-linecap="round" stroke-dasharray="4 8"/>

        <!-- Large filled circle -->
        <path class="fill-large" d="M141.927 319.743C303.484 319.743 434.451 194.498 434.451 40.0004C434.451 -114.497 303.484 -239.742 141.927 -239.742C-19.6304 -239.742 -150.598 -114.497 -150.598 40.0004C-150.598 194.498 -19.6304 319.743 141.927 319.743Z" fill="var(--touch-profile-ring-4)"/>

        <!-- Medium-large filled circle -->
        <path class="fill-med-lg" d="M141.927 204.55C236.957 204.55 313.995 130.878 313.995 39.9999C313.995 -50.8784 236.957 -124.55 141.927 -124.55C46.8958 -124.55 -30.1418 -50.8784 -30.1418 39.9999C-30.1418 130.878 46.8958 204.55 141.927 204.55Z" fill="var(--touch-profile-ring-3)"/>

        <!-- Medium-large dashed circle -->
        <path class="dash-med-lg" opacity="0.4" d="M141.927 234.116C254.032 234.116 344.912 147.208 344.912 40.0006C344.912 -67.2066 254.032 -154.115 141.927 -154.115C29.8208 -154.115 -61.059 -67.2066 -61.059 40.0006C-61.059 147.208 29.8208 234.116 141.927 234.116Z" stroke="var(--touch-profile-highlight)" stroke-miterlimit="10" stroke-linecap="round" stroke-dasharray="3 7.99"/>

        <!-- Medium filled circle -->
        <path class="fill-med" d="M141.927 140.435C199.93 140.435 246.951 95.4688 246.951 40.0002C246.951 -15.4684 199.93 -60.4346 141.927 -60.4346C83.9236 -60.4346 36.9028 -15.4684 36.9028 40.0002C36.9028 95.4688 83.9236 140.435 141.927 140.435Z" fill="var(--touch-profile-ring-2)"/>

        <!-- Medium dashed circle -->
        <path class="dash-med" opacity="0.5" d="M141.927 157.765C209.938 157.765 265.072 105.04 265.072 40.0005C265.072 -25.0388 209.938 -77.7637 141.927 -77.7637C73.9155 -77.7637 18.7815 -25.0388 18.7815 40.0005C18.7815 105.04 73.9155 157.765 141.927 157.765Z" stroke="var(--touch-profile-highlight)" stroke-miterlimit="10" stroke-linecap="round" stroke-dasharray="5 5"/>

        <!-- Small-medium filled circle -->
        <path class="fill-small" d="M141.927 91.8084C171.847 91.8084 196.102 68.6131 196.102 40.0001C196.102 11.3872 171.847 -11.8081 141.927 -11.8081C112.006 -11.8081 87.7512 11.3872 87.7512 40.0001C87.7512 68.6131 112.006 91.8084 141.927 91.8084Z" fill="var(--touch-profile-ring-1)"/>

        <!-- Small dashed circle -->
        <path class="dash-small" d="M141.927 97.6418C175.216 97.6418 202.202 71.8348 202.202 40.0003C202.202 8.16582 175.216 -17.6411 141.927 -17.6411C108.638 -17.6411 81.6516 8.16582 81.6516 40.0003C81.6516 71.8348 108.638 97.6418 141.927 97.6418Z" stroke="var(--touch-profile-highlight)" stroke-miterlimit="10" stroke-linecap="round" stroke-dasharray="2 5"/>

        <!-- Inner filled circle -->
        <path class="fill-center" d="M141.927 59.1505C152.987 59.1505 161.952 50.5765 161.952 40C161.952 29.4235 152.987 20.8496 141.927 20.8496C130.867 20.8496 121.901 29.4235 121.901 40C121.901 50.5765 130.867 59.1505 141.927 59.1505Z" fill="var(--touch-profile-highlight)"/>

        <!-- Innermost dashed circle -->
        <path class="dash-inner" d="M141.927 65.8342C156.846 65.8342 168.941 54.2679 168.941 40.0001C168.941 25.7323 156.846 14.166 141.927 14.166C127.007 14.166 114.912 25.7323 114.912 40.0001C114.912 54.2679 127.007 65.8342 141.927 65.8342Z" stroke="var(--touch-profile-stroke)" stroke-miterlimit="10" stroke-linecap="round" stroke-dasharray="2 3"/>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Generate unique ID for clip paths to prevent conflicts with multiple instances
const uid = computed(() => Math.random().toString(36).substr(2, 9))
</script>

<style scoped>
@keyframes pulse-full {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1.0; }
}

@keyframes pulse-88 {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.88; }
}

@keyframes pulse-75 {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.75; }
}

@keyframes pulse-63 {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.63; }
}

@keyframes pulse-50 {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.5; }
}

/* Inside-out animation - innermost starts first, outer circles have reduced max opacity */
.dash-outer { animation: pulse-50 3s ease-in-out infinite; animation-delay: 1.5s; }
.fill-large { animation: pulse-50 3s ease-in-out infinite; animation-delay: 1.2s; }
.fill-med-lg { animation: pulse-63 3s ease-in-out infinite; animation-delay: 0.9s; }
.dash-med-lg { animation: pulse-63 3s ease-in-out infinite; animation-delay: 0.9s; }
.fill-med { animation: pulse-75 3s ease-in-out infinite; animation-delay: 0.6s; }
.dash-med { animation: pulse-75 3s ease-in-out infinite; animation-delay: 0.6s; }
.fill-small { animation: pulse-88 3s ease-in-out infinite; animation-delay: 0.3s; }
.dash-small { animation: pulse-88 3s ease-in-out infinite; animation-delay: 0.3s; }
.fill-center { animation: pulse-full 3s ease-in-out infinite; animation-delay: 0s; }
.dash-inner { animation: pulse-full 3s ease-in-out infinite; animation-delay: 0s; }
</style>
