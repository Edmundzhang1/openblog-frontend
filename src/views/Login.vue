<template>
  <div class="login-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <div class="container">
      <div class="login-wrapper">
        <!-- 登录卡片 -->
        <div class="login-card">
          <h2>{{ content.welcomeTitle }}</h2>
          <p class="login-desc">{{ content.welcomeDesc }}</p>
          
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label>{{ content.usernameLabel }}</label>
              <input 
                type="text" 
                v-model="loginForm.username" 
                required 
                :placeholder="content.usernamePlaceholder"
              >
            </div>
            <div class="form-group">
              <label>{{ content.passwordLabel }}</label>
              <input 
                type="password" 
                v-model="loginForm.password" 
                required 
                :placeholder="content.passwordPlaceholder"
              >
            </div>
            <div v-if="loginError" class="alert alert-error">{{ loginError }}</div>
            <button type="submit" class="btn-login" :disabled="loginLoading">
              {{ loginLoading ? content.loginLoading : content.loginButton }}
            </button>
          </form>

          <div class="form-footer">
            <span>{{ content.noAccount }}</span>
            <a href="#" @click.prevent="showRegister = true">{{ content.registerNow }}</a>
          </div>

          <div class="demo-accounts">
            <p>📝 {{ content.demoUserLabel }}: user / user123</p>
            <p>🔐 {{ content.demoAdminLabel }}: admin / furest123</p>
          </div>
        </div>

        <!-- 功能介绍 -->
        <div class="features-section">
          <h3>🎨 {{ content.featuresTitle }}</h3>
          <div class="features-grid">
            <div v-for="feature in content.features" :key="feature.title" :class="['feature-item', feature.admin ? 'admin-feature' : '']">
              <div class="feature-icon">{{ feature.icon }}</div>
              <div class="feature-content">
                <h4>{{ feature.title }}</h4>
                <p>{{ feature.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <div class="modal" :class="{ active: showRegister }" @click.self="closeRegisterModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ content.registerTitle }}</h3>
          <button class="close-btn" @click="closeRegisterModal">×</button>
        </div>
        <form @submit.prevent="handleRegister" class="login-form">
          <div class="form-group">
            <label>{{ content.usernameLabel }}</label>
            <input type="text" v-model="registerForm.username" required :placeholder="content.registerUsernamePlaceholder">
          </div>
          <div class="form-group">
            <label>{{ content.emailLabel }}</label>
            <input type="email" v-model="registerForm.email" :placeholder="content.emailPlaceholder">
          </div>
          <div class="form-group">
            <label>{{ content.passwordLabel }}</label>
            <input type="password" v-model="registerForm.password" required :placeholder="content.registerPasswordPlaceholder">
          </div>
          <div class="form-group">
            <label>{{ content.confirmPasswordLabel }}</label>
            <input type="password" v-model="registerForm.confirmPassword" required :placeholder="content.confirmPasswordPlaceholder">
          </div>
          <div v-if="registerError" class="alert alert-error">{{ registerError }}</div>
          <button type="submit" class="btn-login" :disabled="registerLoading">
            {{ registerLoading ? content.registerLoading : content.registerButton }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { eventBus } from '../utils/eventBus'
import { getCurrentUser, getPostLoginRoute, loginLocal, registerLocalUser } from '../utils/auth'

const LOGIN_CONTENT = {
  zh: {
    title: '登录',
    subtitle: '登录 FUREST 解锁更多功能',
    welcomeTitle: '欢迎回来',
    welcomeDesc: '请输入您的账号密码登录',
    usernameLabel: '用户名',
    usernamePlaceholder: '请输入用户名',
    registerUsernamePlaceholder: '设置用户名',
    passwordLabel: '密码',
    passwordPlaceholder: '请输入密码',
    registerPasswordPlaceholder: '至少6位密码',
    confirmPasswordLabel: '确认密码',
    confirmPasswordPlaceholder: '再次输入密码',
    emailLabel: '邮箱（可选）',
    emailPlaceholder: '用于找回密码',
    loginButton: '登录',
    loginLoading: '登录中...',
    registerButton: '注册',
    registerLoading: '注册中...',
    noAccount: '还没有账号？',
    registerNow: '立即注册',
    registerTitle: '用户注册',
    demoUserLabel: '测试用户',
    demoAdminLabel: '管理员',
    featuresTitle: '登录后可解锁',
    features: [
      { icon: '📅', title: '个人排期管理', desc: '使用 TODO 功能管理您的约稿排期' },
      { icon: '💾', title: '数据云端同步', desc: '您的排单数据永久保存，换设备不丢失' },
      { icon: '🔔', title: '截止提醒', desc: '稿件截止日期前自动提醒，不再错过交稿' },
      { icon: '📊', title: '工作量统计', desc: '查看月度工作量统计，合理安排时间' },
      { icon: '🔧', title: '管理后台', desc: '管理员账号自动进入后台管理系统', admin: true }
    ],
    messages: {
      adminLoginSuccess: '管理员登录成功！',
      loginSuccess: '登录成功！',
      registerSuccess: '注册成功！请登录',
      invalidCredentials: '用户名或密码错误',
      loginFailed: '登录失败，请稍后重试',
      networkError: '网络错误，请稍后重试',
      passwordMismatch: '两次密码输入不一致',
      passwordTooShort: '密码长度至少6位',
      registerFailed: '注册失败',
      accountExists: '该账号信息已存在'
    }
  },
  en: {
    title: 'Login',
    subtitle: 'Sign in to FUREST to unlock more features',
    welcomeTitle: 'Welcome Back',
    welcomeDesc: 'Enter your account details to sign in',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter your username',
    registerUsernamePlaceholder: 'Choose a username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    registerPasswordPlaceholder: 'At least 6 characters',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter your password again',
    emailLabel: 'Email (Optional)',
    emailPlaceholder: 'Used for password recovery',
    loginButton: 'Login',
    loginLoading: 'Signing in...',
    registerButton: 'Register',
    registerLoading: 'Creating account...',
    noAccount: 'No account yet?',
    registerNow: 'Create one now',
    registerTitle: 'User Registration',
    demoUserLabel: 'Demo User',
    demoAdminLabel: 'Admin',
    featuresTitle: 'Unlocked After Login',
    features: [
      { icon: '📅', title: 'Personal Schedule Management', desc: 'Use the TODO planner to manage your commission schedule' },
      { icon: '💾', title: 'Cloud Sync', desc: 'Your schedule data stays saved across devices' },
      { icon: '🔔', title: 'Deadline Reminders', desc: 'Get reminders before delivery deadlines so nothing is missed' },
      { icon: '📊', title: 'Workload Statistics', desc: 'Review your monthly workload and plan your time better' },
      { icon: '🔧', title: 'Admin Dashboard', desc: 'Admin accounts are sent directly to the management backend', admin: true }
    ],
    messages: {
      adminLoginSuccess: 'Admin login successful.',
      loginSuccess: 'Logged in successfully.',
      registerSuccess: 'Registration successful. Please sign in.',
      invalidCredentials: 'Incorrect username or password.',
      loginFailed: 'Login failed. Please try again later.',
      networkError: 'Network error. Please try again later.',
      passwordMismatch: 'The passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      registerFailed: 'Registration failed.',
      accountExists: 'This account information is already in use.'
    }
  }
}

export default {
  name: 'Login',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginError: '',
      loginLoading: false,
      
      showRegister: false,
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      registerError: '',
      registerLoading: false
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return LOGIN_CONTENT[this.locale]
    }
  },
  
  mounted() {
    this.checkLoginStatus()
  },
  
  methods: {
    closeRegisterModal() {
      this.showRegister = false
      this.registerError = ''
    },
    getRedirectTarget() {
      return typeof this.$route.query.redirect === 'string' ? this.$route.query.redirect : '/todo'
    },
    parseErrorMessage(error) {
      return String(error || '').toLowerCase()
    },
    resolveLoginError(status, error) {
      const message = this.parseErrorMessage(error)
      if (
        status === 401 ||
        status === 403 ||
        message.includes('invalid') ||
        message.includes('username') ||
        message.includes('password') ||
        message.includes('credential') ||
        message.includes('用户') ||
        message.includes('密码') ||
        message.includes('账号')
      ) {
        return this.content.messages.invalidCredentials
      }
      return this.content.messages.loginFailed
    },
    resolveRegisterError(status, error) {
      const message = this.parseErrorMessage(error)
      if (
        status === 409 ||
        message.includes('exist') ||
        message.includes('already') ||
        message.includes('duplicate') ||
        message.includes('taken') ||
        message.includes('已存在') ||
        message.includes('重复')
      ) {
        return this.content.messages.accountExists
      }
      return this.content.messages.registerFailed
    },
    // 检查登录状态
    checkLoginStatus() {
      const currentUser = getCurrentUser()
      if (!currentUser) return

      eventBus.emit('login-success', { role: currentUser.role, username: currentUser.username })
      this.$router.replace(getPostLoginRoute(currentUser, this.getRedirectTarget()))
    },
    
    // 统一登录处理
    async handleLogin() {
      this.loginError = ''
      this.loginLoading = true
      
      try {
        const result = loginLocal(this.loginForm)

        if (!result.ok) {
          this.loginError = this.content.messages.invalidCredentials
          return
        }

        const successMessage = result.user.role === 'admin'
          ? this.content.messages.adminLoginSuccess
          : this.content.messages.loginSuccess

        eventBus.emit('show-toast', { message: successMessage, type: 'success' })
        eventBus.emit('login-success', { role: result.user.role, username: result.user.username })
        await this.$router.push(getPostLoginRoute(result.user, this.getRedirectTarget()))
      } catch (e) {
        console.error('登录失败:', e)
        this.loginError = this.content.messages.loginFailed
      } finally {
        this.loginLoading = false
      }
    },
    
    // 用户注册
    async handleRegister() {
      this.registerError = ''
      
      if (this.registerForm.password !== this.registerForm.confirmPassword) {
        this.registerError = this.content.messages.passwordMismatch
        return
      }
      
      if (this.registerForm.password.length < 6) {
        this.registerError = this.content.messages.passwordTooShort
        return
      }
      
      this.registerLoading = true
      
      try {
        const result = registerLocalUser({
          username: this.registerForm.username,
          password: this.registerForm.password,
          email: this.registerForm.email
        })

        if (result.ok) {
          eventBus.emit('show-toast', { message: this.content.messages.registerSuccess, type: 'success' })
          this.registerForm = { username: '', email: '', password: '', confirmPassword: '' }
          this.closeRegisterModal()
          // 自动填充登录表单
          this.loginForm.username = result.user.username
          this.loginForm.password = ''
        } else {
          this.registerError = result.error === 'ACCOUNT_EXISTS'
            ? this.content.messages.accountExists
            : this.content.messages.registerFailed
        }
      } catch (e) {
        console.error('注册失败:', e)
        this.registerError = this.content.messages.registerFailed
      } finally {
        this.registerLoading = false
      }
    }
  }
}
</script>

<style scoped>
/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: var(--white);
  padding: 60px 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* 登录容器 */
.login-wrapper {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 50px;
  max-width: 1100px;
  margin: 50px auto;
  padding: 0 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

/* 登录卡片 */
.login-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px 35px;
  box-shadow: var(--shadow);
}

.login-card h2 {
  font-size: 1.6rem;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.login-desc {
  color: var(--text-light);
  margin-bottom: 30px;
}

/* 表单 */
.login-form .form-group {
  margin-bottom: 20px;
}

.login-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-dark);
}

.login-form input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition);
}

.login-form input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.btn-login {
  width: 100%;
  padding: 14px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: var(--transition);
  margin-top: 10px;
}

.btn-login:hover:not(:disabled) {
  background: var(--accent-color);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 提示 */
.alert {
  padding: 12px 15px;
  border-radius: var(--radius-sm);
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

/* 表单底部 */
.form-footer {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid var(--bg-light);
  color: var(--text-light);
}

.form-footer a {
  color: var(--primary-color);
  font-weight: 500;
  text-decoration: none;
  margin-left: 5px;
}

.form-footer a:hover {
  text-decoration: underline;
}

/* 测试账号 */
.demo-accounts {
  margin-top: 25px;
  padding: 15px;
  background: var(--bg-light);
  border-radius: var(--radius-sm);
}

.demo-accounts p {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 5px 0;
}

/* 功能介绍 */
.features-section h3 {
  font-size: 1.3rem;
  color: var(--text-dark);
  margin-bottom: 25px;
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.feature-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition: var(--transition);
}

.feature-item:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-hover);
}

.feature-icon {
  font-size: 1.8rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-light);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.feature-content h4 {
  font-size: 1rem;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.feature-content p {
  font-size: 0.9rem;
  color: var(--text-light);
}

.admin-feature {
  border-left: 4px solid var(--accent-color);
}

.admin-feature .feature-icon {
  background: rgba(212, 165, 116, 0.1);
}

/* 弹窗 */
.modal {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: var(--text-dark);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}
</style>
