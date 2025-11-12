<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <h1 class="app-title">🚀 Kafka Vue Messaging</h1>
      
      <nav>
        <RouterLink to="/kafka">Kafka Messages</RouterLink>
        <RouterLink to="/websocket">WebSocket Demo</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2rem;
}

.wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.app-title {
  text-align: center;
  margin: 0 0 2rem 0;
  color: var(--color-heading);
  font-size: 2rem;
}

nav {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

nav a {
  display: inline-block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: var(--color-text);
  border: 2px solid transparent;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

nav a:hover {
  color: var(--color-text);
  background-color: var(--color-background-soft);
}

nav a.router-link-exact-active {
  color: var(--color-brand);
  border-color: var(--color-brand);
}

@media (max-width: 768px) {
  .app-title {
    font-size: 1.5rem;
  }
  
  nav {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
}
</style>
