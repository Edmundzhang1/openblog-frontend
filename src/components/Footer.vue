<template>
  <footer class="footer">
    <div class="container">
      <p>{{ $t('footer.copyright') }}</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  background: var(--white);
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
  padding: 64px 0;
  text-align: center;
}
</style>
