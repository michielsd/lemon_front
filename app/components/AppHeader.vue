<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="h-6 w-auto shrink-0" />
      </NuxtLink>

      <UButton
        to="/chat"
        label="Chat"
        color="neutral"
        variant="ghost"
        size="xs"
      />

      <UButton
        to="/tables"
        label="Tables"
        color="neutral"
        variant="ghost"
        size="xs"
      />

      <UButton
        to="/helpers"
        label="Helpers"
        color="neutral"
        variant="ghost"
        size="xs"
      />

      <UButton
        to="/dataviewer"
        label="Data viewer"
        color="neutral"
        variant="ghost"
        size="xs"
      />

      <TemplateMenu />
    </template>

    <template #right>
      <UColorModeButton />

      <UButton
        to="https://github.com/nuxt-ui-templates/starter"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UHeader>
</template>
