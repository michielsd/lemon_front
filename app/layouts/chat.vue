<template>
  <div class="flex h-dvh flex-col overflow-hidden">
    <AppHeader class="shrink-0" />

    <UDashboardGroup
      unit="rem"
      class="min-h-0 flex-1"
    >
      <div class="m-4 flex min-w-0 flex-1 overflow-hidden rounded-lg bg-default/75 shadow ring ring-default">
        <slot />
      </div>
    </UDashboardGroup>
  </div>
</template>
