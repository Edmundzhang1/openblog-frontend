<template>
  <main class="login-page">
    <header class="page-header fade-in">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="login-section container">
      <div class="login-panel fade-in">
        <div class="login-intro">
          <span class="intro-mark">F</span>
          <p class="intro-kicker">{{ siteConfig.site_name }} ACCOUNT</p>
          <h2>{{ content.introTitle }}</h2>
          <p>{{ content.introText }}</p>
          <ul>
            <li v-for="item in content.benefits" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div class="login-forms">
          <!-- 登录方式切换 Tab（v2） -->
          <div class="login-tabs">
            <button
              class="tab-btn"
              :class="{ active: loginMode === 'code' }"
              type="button"
              @click="switchMode('code')"
            >
              {{ content.codeTab }}
            </button>
            <button
              class="tab-btn"
              :class="{ active: loginMode === 'password' }"
              type="button"
              @click="switchMode('password')"
            >
              {{ content.passwordTab }}
            </button>
          </div>

          <!-- 邮箱验证码登录/注册一体（本地） -->
          <form v-if="loginMode === 'code'" class="login-form" @submit.prevent="handleCodeLogin">
            <div>
              <h2>{{ content.formTitle }}</h2>
              <p class="form-desc">{{ content.formDesc }}</p>
            </div>

            <label class="field">
              <span>{{ content.email }}</span>
              <input
                v-model.trim="form.email"
                type="email"
                autocomplete="email"
                :placeholder="content.emailPlaceholder"
                required
                @blur="validateEmail"
              >
              <small v-if="emailError" class="field-error">{{ emailError }}</small>
            </label>

            <label class="field">
              <span>{{ content.code }}</span>
              <div class="code-row">
                <input
                  v-model.trim="form.code"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  pattern="[0-9]{6}"
                  :placeholder="content.codePlaceholder"
                  required
                >
                <button
                  class="send-code"
                  type="button"
                  :disabled="sendingCode || cooldown > 0 || !isEmailValid"
                  @click="sendCode"
                >
                  {{ sendCodeLabel }}
                </button>
              </div>
            </label>

            <label class="field">
              <span>{{ content.nickname }} <small>{{ content.optional }}</small></span>
              <input
                v-model.trim="form.nickname"
                type="text"
                maxlength="50"
                autocomplete="nickname"
                :placeholder="content.nicknamePlaceholder"
              >
            </label>

            <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

            <button class="submit-button" type="submit" :disabled="submitting">
              {{ submitting ? content.submitting : content.submit }}
            </button>
            <p class="privacy-note">{{ content.privacy }}</p>
          </form>

          <!-- 密码登录（v2） -->
          <form v-else class="login-form" @submit.prevent="handlePasswordLogin">
            <div>
              <h2>{{ content.passwordFormTitle }}</h2>
              <p class="form-desc">{{ content.passwordFormDesc }}</p>
            </div>

            <label class="field">
              <span>{{ content.email }}</span>
              <input
                v-model.trim="passwordForm.email"
                type="email"
                autocomplete="email"
                :placeholder="content.emailPlaceholder"
                required
              >
            </label>

            <label class="field">
              <span>{{ content.password }}</span>
              <input
                v-model="passwordForm.password"
                type="password"
                autocomplete="current-password"
                :placeholder="content.passwordPlaceholder"
                required
              >
            </label>

            <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

            <button class="submit-button" type="submit" :disabled="submitting">
              {{ submitting ? content.loggingIn : content.loginSubmit }}
            </button>
            <p class="privacy-note">{{ content.passwordTip }}</p>
          </form>

          <!-- 第三方登录：QQ（v2） -->
          <div class="third-party-login">
            <div class="divider">
              <span>{{ content.thirdParty }}</span>
            </div>
            <div class="social-buttons">
              <button type="button" class="btn-qq" :disabled="qqLoading" @click="handleQQLogin">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 14.5h-7c-.83 0-1.5-.67-1.5-1.5v-1c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5zm0-4h-7c-.83 0-1.5-.67-1.5-1.5v-1c0-.83.67-1.5 1.5-1.5h7c.83 0 1.5.67 1.5 1.5v1c0 .83-.67 1.5-1.5 1.5z"/>
                </svg>
                <span>{{ content.qqLogin }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import { inject } from 'vue'
import { siteConfig } from '../state/siteConfig'
import { API_ENDPOINTS } from '../config/api'
import { apiRequest, showToast } from '../utils/eventBus'
import { getCurrentUser, getPostLoginRoute, isAuthenticated, saveSession } from '../utils/auth'

const CONTENT = {
  zh: {
    title: '登录或注册',
    subtitle: '使用邮箱验证码或密码安全进入平台账户',
    introTitle: '从需求到交付，进度始终清晰',
    introText: '同一个账号即可提交委托、查询订单并与画师沟通。首次验证邮箱时会自动创建账号。',
    benefits: ['查看自己的全部委托', '在订单内发送消息和附件', '持续跟踪报价、绘制和交付状态'],
    codeTab: '验证码登录',
    passwordTab: '密码登录',
    formTitle: '邮箱验证',
    formDesc: '无需设置密码，验证码 5 分钟内有效。未注册邮箱将自动创建账户。',
    passwordFormTitle: '密码登录',
    passwordFormDesc: '使用邮箱与密码登录已有账户。',
    email: '邮箱',
    emailPlaceholder: 'name@example.com',
    code: '验证码',
    codePlaceholder: '6 位数字',
    nickname: '昵称',
    optional: '首次注册时可选',
    nicknamePlaceholder: '未填写时将使用邮箱前缀',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    passwordTip: '首次使用请先用验证码登录并设置密码。',
    sendCode: '发送验证码',
    sendingCode: '发送中...',
    resend: '{seconds} 秒后重发',
    submit: '继续',
    submitting: '验证中...',
    loginSubmit: '登录',
    loggingIn: '登录中...',
    privacy: '继续即表示你同意仅将邮箱用于账号验证和订单通知。',
    thirdParty: '其他登录方式',
    qqLogin: 'QQ 登录',
    sent: '验证码已发送，请查收邮箱',
    debugSent: '开发模式验证码已自动填入',
    success: '登录成功',
    registerSuccess: '注册并登录成功',
    invalidEmail: '请先输入有效邮箱',
    invalidCode: '请输入 6 位数字验证码',
    passwordRequired: '请输入密码',
    qqLoginFailed: 'QQ 登录初始化失败，请稍后重试'
  },
  en: {
    title: 'Sign In or Register',
    subtitle: 'Use an email verification code or password to access your account securely',
    introTitle: 'Keep every commission clear from brief to delivery',
    introText: 'One account lets you submit commissions, track orders, and talk with your artist. Your account is created on first verification.',
    benefits: ['Review all of your commissions', 'Send messages and attachments per order', 'Track quotes, production, and delivery'],
    codeTab: 'Code Login',
    passwordTab: 'Password Login',
    formTitle: 'Verify your email',
    formDesc: 'No password is needed. The code remains valid for 5 minutes. New accounts are created automatically.',
    passwordFormTitle: 'Password Login',
    passwordFormDesc: 'Sign in to an existing account with email and password.',
    email: 'Email',
    emailPlaceholder: 'name@example.com',
    code: 'Verification code',
    codePlaceholder: '6 digits',
    nickname: 'Nickname',
    optional: 'optional for first registration',
    nicknamePlaceholder: 'Defaults to your email prefix',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    passwordTip: 'First time? Sign in with a code and set your password.',
    sendCode: 'Send code',
    sendingCode: 'Sending...',
    resend: 'Resend in {seconds}s',
    submit: 'Continue',
    submitting: 'Verifying...',
    loginSubmit: 'Sign In',
    loggingIn: 'Signing in...',
    privacy: 'By continuing, you agree that your email may be used for account verification and order notices.',
    thirdParty: 'Other sign-in options',
    qqLogin: 'Sign in with QQ',
    sent: 'Verification code sent. Check your inbox.',
    debugSent: 'Development code filled in automatically.',
    success: 'Signed in successfully.',
    registerSuccess: 'Account created and signed in successfully.',
    invalidEmail: 'Enter a valid email first.',
    invalidCode: 'Enter the 6-digit verification code.',
    passwordRequired: 'Enter your password.',
    qqLoginFailed: 'Failed to start QQ sign-in. Please try again later.'
  }
}

// 邮箱格式校验正则（v2 抽取为常量复用）
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default {
  name: 'Login',
  setup() {
    return { i18n: inject('i18n'), siteConfig }
  },
  data() {
    return {
      // 登录模式: 'code' | 'password'
      loginMode: 'code',
      form: { email: '', code: '', nickname: '' },
      passwordForm: { email: '', password: '' },
      sendingCode: false,
      submitting: false,
      qqLoading: false,
      cooldown: 0,
      cooldownTimer: null,
      errorMessage: '',
      emailError: ''
    }
  },
  computed: {
    content() {
      return CONTENT[this.i18n.getLocale()]
    },
    isEmailValid() {
      return EMAIL_REGEX.test(this.form.email)
    },
    sendCodeLabel() {
      if (this.sendingCode) return this.content.sendingCode
      if (this.cooldown > 0) return this.content.resend.replace('{seconds}', this.cooldown)
      return this.content.sendCode
    }
  },
  mounted() {
    if (isAuthenticated()) this.redirectAfterLogin(getCurrentUser())
  },
  beforeUnmount() {
    window.clearInterval(this.cooldownTimer)
  },
  methods: {
    // 切换登录方式时清空错误提示
    switchMode(mode) {
      this.loginMode = mode
      this.errorMessage = ''
      this.emailError = ''
    },
    // 邮箱失焦校验（v2 的更严格校验）
    validateEmail() {
      if (this.form.email && !this.isEmailValid) {
        this.emailError = this.content.invalidEmail
      } else {
        this.emailError = ''
      }
    },
    getRedirectTarget() {
      const redirect = this.$route.query.redirect
      return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/orders'
    },
    redirectAfterLogin(user) {
      return this.$router.replace(getPostLoginRoute(user, this.getRedirectTarget()))
    },
    // 登录成功统一收尾：saveSession 内部已写入本地会话并触发 AUTH_CHANGED_EVENT，
    // Navbar 等组件监听该事件自动刷新登录态
    finalizeLogin(data) {
      const user = saveSession(data)
      showToast(data?.is_new_user ? this.content.registerSuccess : this.content.success, 'success')
      return this.redirectAfterLogin(user)
    },
    startCooldown(seconds = 60) {
      window.clearInterval(this.cooldownTimer)
      this.cooldown = seconds
      this.cooldownTimer = window.setInterval(() => {
        this.cooldown -= 1
        if (this.cooldown <= 0) window.clearInterval(this.cooldownTimer)
      }, 1000)
    },
    async sendCode() {
      this.errorMessage = ''
      if (!this.isEmailValid) {
        this.errorMessage = this.content.invalidEmail
        return
      }

      this.sendingCode = true
      try {
        const data = await apiRequest(API_ENDPOINTS.AUTH_SEND_CODE, {
          method: 'POST',
          auth: false,
          body: { email: this.form.email }
        })
        if (data?.debug_code) {
          this.form.code = data.debug_code
          showToast(this.content.debugSent, 'success')
        } else {
          showToast(data?.message || this.content.sent, 'success')
        }
        this.startCooldown(data?.retry_after || 60)
      } catch (error) {
        this.errorMessage = error.message
      } finally {
        this.sendingCode = false
      }
    },
    async handleCodeLogin() {
      this.errorMessage = ''
      if (!this.isEmailValid) {
        this.errorMessage = this.content.invalidEmail
        return
      }
      if (!/^\d{6}$/.test(this.form.code)) {
        this.errorMessage = this.content.invalidCode
        return
      }

      this.submitting = true
      try {
        const data = await apiRequest(API_ENDPOINTS.AUTH_LOGIN_REGISTER, {
          method: 'POST',
          auth: false,
          body: {
            email: this.form.email,
            code: this.form.code,
            nickname: this.form.nickname
          }
        })
        await this.finalizeLogin(data)
      } catch (error) {
        this.errorMessage = error.message
      } finally {
        this.submitting = false
      }
    },
    // 密码登录（v2），走本地 apiRequest 架构
    async handlePasswordLogin() {
      this.errorMessage = ''
      if (!EMAIL_REGEX.test(this.passwordForm.email)) {
        this.errorMessage = this.content.invalidEmail
        return
      }
      if (!this.passwordForm.password) {
        this.errorMessage = this.content.passwordRequired
        return
      }

      this.submitting = true
      try {
        const data = await apiRequest(API_ENDPOINTS.AUTH_PASSWORD_LOGIN, {
          method: 'POST',
          auth: false,
          body: {
            email: this.passwordForm.email,
            password: this.passwordForm.password
          }
        })
        await this.finalizeLogin(data)
      } catch (error) {
        this.errorMessage = error.message
      } finally {
        this.submitting = false
      }
    },
    // QQ 第三方登录（v2）：获取授权链接后跳转
    async handleQQLogin() {
      this.qqLoading = true
      try {
        const data = await apiRequest('/api/auth/qq/auth-url', { auth: false })
        if (data?.auth_url) {
          window.location.href = data.auth_url
        } else {
          throw new Error(this.content.qqLoginFailed)
        }
      } catch (error) {
        showToast(error.message || this.content.qqLoginFailed, 'error')
      } finally {
        this.qqLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login-section { padding: 64px 20px; }
.login-panel { max-width: 940px; margin: 0 auto; display: grid; grid-template-columns: 0.9fr 1.1fr; background: var(--white); box-shadow: var(--shadow-hover); border-radius: 8px; overflow: hidden; }
.login-intro { padding: 48px; background: #F5F5F5; color: var(--text-dark); }
.intro-mark { display: grid; place-items: center; width: 52px; height: 52px; border: 2px solid var(--primary-color); color: var(--primary-color); font-size: 1.7rem; font-weight: 800; margin-bottom: 26px; }
.intro-kicker { color: var(--primary-color); font-size: 0.78rem; font-weight: 700; letter-spacing: 0; }
.login-intro h2 { font-size: 2rem; margin: 14px 0; line-height: 1.3; }
.login-intro > p:not(.intro-kicker) { color: var(--text-light); line-height: 1.8; }
.login-intro ul { margin: 28px 0 0; padding: 0; list-style: none; display: grid; gap: 13px; }
.login-intro li::before { content: '✓'; color: var(--primary-color); margin-right: 10px; }
.login-forms { padding: 48px; }
.login-tabs { display: flex; gap: 10px; margin-bottom: 28px; border-bottom: 2px solid #F0F0F0; }
.tab-btn { flex: 1; padding: 12px 20px; background: none; border: 0; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 1rem; font-weight: 600; color: var(--text-light); transition: var(--transition); }
.tab-btn:hover { color: var(--primary-color); }
.tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
.login-form { display: grid; gap: 22px; }
.login-form h2 { font-size: 1.7rem; margin: 0 0 6px; }
.form-desc, .privacy-note { color: var(--text-muted); line-height: 1.6; }
.field { display: grid; gap: 8px; font-weight: 600; color: var(--text-dark); }
.field small { color: var(--text-muted); font-weight: 400; }
.field input { width: 100%; height: 48px; padding: 0 14px; border: 1px solid #E5E5E5; border-radius: 8px; font: inherit; transition: var(--transition); }
.field input:focus { outline: 2px solid rgba(59, 130, 246, 0.2); border-color: var(--primary-color); }
.field-error { color: #B91C1C; font-weight: 400; }
.code-row { display: grid; grid-template-columns: 1fr 132px; gap: 10px; }
.send-code, .submit-button { border: 0; border-radius: 8px; font-weight: 700; cursor: pointer; transition: var(--transition); }
.send-code { background: #EFF6FF; color: var(--primary-color); padding: 0 12px; }
.send-code:disabled, .submit-button:disabled { opacity: 0.55; cursor: not-allowed; }
.submit-button { height: 50px; background: var(--primary-color); color: #fff; font-size: 1rem; }
.submit-button:hover:not(:disabled) { background: #2563EB; }
.form-error { padding: 12px 14px; background: #FEF2F2; border-left: 3px solid #B91C1C; color: #B91C1C; line-height: 1.5; }
.privacy-note { margin: -8px 0 0; font-size: 0.82rem; text-align: center; }
.third-party-login { margin-top: 28px; padding-top: 24px; border-top: 1px solid #F0F0F0; }
.divider { display: flex; align-items: center; margin-bottom: 18px; color: var(--text-muted); font-size: 0.85rem; }
.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #F0F0F0; }
.divider span { padding: 0 14px; }
.social-buttons { display: flex; justify-content: center; }
.btn-qq { display: flex; align-items: center; gap: 8px; padding: 10px 24px; background: #12B7F5; color: #fff; border: 0; border-radius: 8px; cursor: pointer; font-size: 0.95rem; font-weight: 600; transition: var(--transition); }
.btn-qq:hover:not(:disabled) { background: #0EA5E0; }
.btn-qq:disabled { opacity: 0.55; cursor: not-allowed; }
.btn-qq svg { width: 20px; height: 20px; }
@media (max-width: 760px) {
  .login-section { padding: 64px 16px; }
  .login-panel { grid-template-columns: 1fr; }
  .login-intro, .login-forms { padding: 30px 24px; }
  .login-intro h2 { font-size: 1.55rem; }
  .code-row { grid-template-columns: minmax(0, 1fr) 116px; }
}
</style>
