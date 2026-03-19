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
  background: var(--text-dark);
  color: var(--white);
  padding: 40px 0 20px;
  text-align: center;
}

.footer p {
  opacity: 0.8;
}
</style>
