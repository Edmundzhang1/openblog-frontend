<template>
  <div class="profile-page fade-in">
    <!-- 页面标题 -->
    <header class="page-header">
      <div class="container">
        <h1>个人中心</h1>
        <p>管理您的个人资料和账户安全</p>
      </div>
    </header>

    <div class="container">
      <div class="profile-wrapper">
        <!-- 左侧菜单 -->
        <aside class="profile-sidebar">
          <div class="user-card">
            <img :src="userInfo.avatar_url || defaultAvatar" alt="avatar" class="user-avatar">
            <h3>{{ userInfo.nickname || '用户' }}</h3>
            <p class="user-uid">UID: {{ userInfo.uid }}</p>
            <p class="user-email">{{ userInfo.email }}</p>
            <span class="user-role">{{ roleText }}</span>
          </div>
          
          <nav class="profile-nav">
            <button 
              :class="{ active: activeTab === 'profile' }" 
              @click="activeTab = 'profile'"
            >
              📋 基本资料
            </button>
            <button 
              :class="{ active: activeTab === 'password' }" 
              @click="activeTab = 'password'"
            >
              🔐 {{ hasPassword ? '修改密码' : '设置密码' }}
            </button>
          </nav>
        </aside>

        <!-- 右侧内容区 -->
        <main class="profile-content">
          <!-- 基本资料 -->
          <section v-if="activeTab === 'profile'" class="content-section">
            <h2>基本资料</h2>
            <form @submit.prevent="updateProfile" class="profile-form">
              <!-- 头像上传 -->
              <div class="form-group">
                <label>头像</label>
                <div 
                  class="avatar-upload-wrapper"
                  :class="{ 'drag-over': isDragging, 'has-preview': avatarPreview || profileForm.avatar_url }"
                  @dragenter.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @dragover.prevent
                  @drop.prevent="handleDrop"
                >
                  <div class="avatar-preview" v-if="avatarPreview || profileForm.avatar_url">
                    <img :src="avatarPreview || profileForm.avatar_url" alt="头像预览">
                  </div>
                  <div class="avatar-upload-content" v-else>
                    <div class="upload-icon">📷</div>
                    <p class="upload-text">点击或拖拽上传头像</p>
                    <p class="upload-hint">支持 JPG、PNG、GIF，最大 2MB</p>
                  </div>
                  <input 
                    type="file" 
                    ref="avatarInput"
                    class="avatar-input"
                    accept="image/jpeg,image/png,image/gif"
                    @change="handleFileChange"
                  >
                  <div v-if="avatarPreview || profileForm.avatar_url" class="avatar-overlay">
                    <span class="change-text">更换头像</span>
                  </div>
                </div>
                <p v-if="avatarError" class="avatar-error">{{ avatarError }}</p>
              </div>

              <div class="form-group">
                <label>昵称</label>
                <input 
                  type="text" 
                  v-model="profileForm.nickname" 
                  placeholder="请输入昵称"
                  maxlength="50"
                >
              </div>

              <div class="form-group">
                <label>个人简介</label>
                <textarea 
                  v-model="profileForm.bio" 
                  placeholder="介绍一下自己..."
                  rows="4"
                  maxlength="500"
                ></textarea>
              </div>

              <div class="form-group">
                <label>邮箱</label>
                <input type="email" :value="userInfo.email" disabled>
                <p class="form-tip">邮箱不可修改</p>
              </div>

              <!-- QQ绑定 -->
              <div class="form-group qq-bind-group">
                <label>QQ账号</label>
                <div class="qq-bind-status">
                  <span v-if="userInfo.qq_openid" class="qq-bound">
                    ✅ 已绑定
                  </span>
                  <span v-else class="qq-unbound">
                    未绑定
                  </span>
                  <button 
                    type="button" 
                    class="btn-qq-bind"
                    :class="{ 'btn-unbind': userInfo.qq_openid }"
                    @click="handleQQBind"
                  >
                    {{ userInfo.qq_openid ? '解除绑定' : '去绑定' }}
                  </button>
                </div>
                <p class="form-tip">绑定QQ后可以使用QQ快速登录</p>
              </div>

              <div v-if="updateError" class="alert alert-error">{{ updateError }}</div>
              <div v-if="updateSuccess" class="alert alert-success">{{ updateSuccess }}</div>

              <button type="submit" class="btn-primary" :disabled="updating">
                {{ updating ? '保存中...' : '保存修改' }}
              </button>
            </form>
          </section>

          <!-- 修改/设置密码 -->
          <section v-else class="content-section">
            <h2>{{ hasPassword ? '修改登录密码' : '设置登录密码' }}</h2>
            <p class="section-desc">
              {{ hasPassword ? '为了账户安全，建议定期更换密码' : '设置密码后，您可以使用密码方式登录' }}
            </p>

            <form @submit.prevent="updatePassword" class="profile-form">
              <!-- 旧密码 - 仅在有密码时显示 -->
              <div v-if="hasPassword" class="form-group">
                <label>旧密码 <span class="required">*</span></label>
                <input 
                  type="password" 
                  v-model="passwordForm.old_password" 
                  placeholder="请输入旧密码"
                  required
                >
              </div>

              <div class="form-group">
                <label>{{ hasPassword ? '新密码' : '密码' }} <span class="required">*</span></label>
                <input 
                  type="password" 
                  v-model="passwordForm.new_password" 
                  placeholder="请输入6-20位密码"
                  minlength="6"
                  maxlength="20"
                  required
                >
              </div>

              <div class="form-group">
                <label>确认密码 <span class="required">*</span></label>
                <input 
                  type="password" 
                  v-model="passwordForm.confirm_password" 
                  placeholder="请再次输入密码"
                  required
                >
              </div>

              <div v-if="passwordError" class="alert alert-error">{{ passwordError }}</div>
              <div v-if="passwordSuccess" class="alert alert-success">{{ passwordSuccess }}</div>

              <button type="submit" class="btn-primary" :disabled="updatingPassword">
                {{ updatingPassword ? '保存中...' : (hasPassword ? '修改密码' : '设置密码') }}
              </button>
            </form>
          </section>
        </main>
      </div>
      
      <!-- 危险区域：账号注销 -->
      <div class="danger-zone">
        <h3>⚠️ 危险区域</h3>
        <div class="danger-content">
          <div class="danger-info">
            <h4>注销账号</h4>
            <p>注销后，您的所有数据将被删除或匿名化处理，且无法恢复。请谨慎操作。</p>
          </div>
          <button type="button" class="btn-danger" @click="showDeleteConfirm = true">
            注销账号
          </button>
        </div>
      </div>
    </div>
    
    <!-- 注销确认弹窗（邮箱验证码验证）-->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content danger-modal">
        <div class="modal-header">
          <h3>⚠️ 确认注销账号</h3>
          <button class="close-btn" @click="closeDeleteModal">×</button>
        </div>
        <div class="modal-body">
          <div class="warning-box">
            <p class="warning-title">此操作不可撤销！</p>
            <ul class="warning-list">
              <li>您的所有个人资料将被删除</li>
              <li>您的订单记录将被匿名化</li>
              <li>您的账户余额将被清空</li>
              <li>30天内无法使用相同邮箱注册</li>
            </ul>
          </div>
          
          <!-- 邮箱验证码输入 -->
          <div class="form-group verify-code-group">
            <label>请输入邮箱验证码 <span class="required">*</span></label>
            <p class="form-tip">验证码将发送至：{{ userInfo.email }}</p>
            <div class="verify-code-input">
              <input 
                type="text" 
                v-model="deleteVerifyCode" 
                placeholder="请输入6位验证码"
                maxlength="6"
                :disabled="deleting"
              >
              <button 
                type="button" 
                class="btn-send-code"
                :disabled="codeCountdown > 0 || sendingCode"
                @click="sendDeleteVerifyCode"
              >
                {{ sendingCode ? '发送中...' : (codeCountdown > 0 ? `${codeCountdown}s后重试` : '获取验证码') }}
              </button>
            </div>
          </div>
          
          <div class="confirm-checkbox">
            <label>
              <input type="checkbox" v-model="deleteConfirmChecked" :disabled="deleting">
              我已了解注销后果，确认注销账号
            </label>
          </div>
          
          <div v-if="deleteError" class="alert alert-error">{{ deleteError }}</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeDeleteModal" :disabled="deleting">
            取消
          </button>
          <button 
            type="button" 
            class="btn-danger" 
            :disabled="!deleteConfirmChecked || !deleteVerifyCode || deleting"
            @click="handleDeleteAccount"
          >
            {{ deleting ? '注销中...' : '确认注销' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { eventBus, apiRequest } from '../utils/eventBus'
import { clearSession, updateStoredUser } from '../utils/auth.js'
import { IMAGES } from '../config/assets.js'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()

    // 默认图片资源
    const defaultAvatar = IMAGES.defaultAvatar

    // 当前激活的标签
    const activeTab = ref('profile')
    
    // 用户信息
    const userInfo = reactive({
      uid: 0,
      email: '',
      nickname: '',
      avatar_url: '',
      bio: '',
      role: 'client',
      has_password: false,
      qq_openid: null
    })
    
    // 是否有密码（控制表单显示）
    const hasPassword = computed(() => userInfo.has_password)
    
    // 角色文本
    const roleText = computed(() => {
      const map = {
        'admin': '管理员',
        'artist': '画师',
        'client': '用户'
      }
      return map[userInfo.role?.toLowerCase()] || '用户'
    })
    
    // 资料表单
    const profileForm = reactive({
      nickname: '',
      avatar_url: '',
      bio: ''
    })
    
    // 头像上传相关
    const avatarInput = ref(null)
    const avatarPreview = ref(null)
    const avatarError = ref('')
    const isDragging = ref(false)
    const selectedAvatarFile = ref(null)
    
    // 密码表单
    const passwordForm = reactive({
      old_password: '',
      new_password: '',
      confirm_password: ''
    })
    
    // 状态
    const updating = ref(false)
    const updatingPassword = ref(false)
    const updateError = ref('')
    const updateSuccess = ref('')
    const passwordError = ref('')
    const passwordSuccess = ref('')
    
    // 账号注销相关（改为邮箱验证码验证）
    const showDeleteConfirm = ref(false)
    const deleteVerifyCode = ref('')
    const deleteConfirmChecked = ref(false)
    const deleting = ref(false)
    const deleteError = ref('')
    const codeCountdown = ref(0)
    const sendingCode = ref(false)
    let countdownTimer = null
    
    // 获取个人信息
    const fetchProfile = async () => {
      try {
        const res = await apiRequest('/api/user/profile', { showError: false })
        Object.assign(userInfo, res)
        // 同步表单数据
        profileForm.nickname = res.nickname || ''
        profileForm.avatar_url = res.avatar_url || ''
        profileForm.bio = res.bio || ''
        // 清除预览
        avatarPreview.value = null
        selectedAvatarFile.value = null
      } catch (error) {
        console.error('获取个人信息失败:', error)
        eventBus.emit('show-toast', { message: '获取个人信息失败', type: 'error' })
      }
    }
    
    // 处理文件选择
    const handleFileChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        handleFileSelect(file)
      }
    }
    
    // 处理拖拽文件
    const handleDrop = (event) => {
      isDragging.value = false
      const files = event.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    }
    
    // 处理文件选择（验证 + 预览）
    const handleFileSelect = (file) => {
      avatarError.value = ''
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        avatarError.value = '仅支持 JPG、PNG、GIF 格式的图片'
        return
      }
      
      // 验证文件大小（2MB）
      if (file.size > 2 * 1024 * 1024) {
        avatarError.value = '图片大小不能超过 2MB'
        return
      }
      
      // 保存文件供后续上传
      selectedAvatarFile.value = file
      
      // 使用 FileReader 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        avatarPreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }
    
    // 上传头像
    const uploadAvatar = async () => {
      if (!selectedAvatarFile.value) return null
      
      const formData = new FormData()
      formData.append('avatar', selectedAvatarFile.value)
      
      try {
        const res = await apiRequest('/api/v1/upload/avatar', {
          method: 'POST',
          body: formData,
          showError: false
        })
        return res.url
      } catch (error) {
        throw new Error(error.message || '头像上传失败')
      }
    }
    
    // 更新个人资料
    const updateProfile = async () => {
      updateError.value = ''
      updateSuccess.value = ''
      updating.value = true
      
      try {
        let avatarUrl = profileForm.avatar_url
        
        // 如果有选择新头像，先上传
        if (selectedAvatarFile.value) {
          avatarUrl = await uploadAvatar()
        }
        
        const res = await apiRequest('/api/user/profile', {
          method: 'PUT',
          showError: false,
          body: {
            nickname: profileForm.nickname,
            avatar_url: avatarUrl,
            bio: profileForm.bio
          }
        })
        
        // 更新本地状态
        userInfo.nickname = profileForm.nickname
        userInfo.avatar_url = avatarUrl
        userInfo.bio = profileForm.bio
        
        // 关键：更新本地会话中的用户信息，NavBar 会实时更新
        updateStoredUser({
          nickname: profileForm.nickname,
          avatar_url: avatarUrl
        })
        
        // 清除预览状态（因为已经保存到服务器）
        avatarPreview.value = null
        selectedAvatarFile.value = null
        profileForm.avatar_url = avatarUrl
        
        updateSuccess.value = '个人资料更新成功'
        
        // 2秒后自动隐藏成功提示
        setTimeout(() => {
          updateSuccess.value = ''
        }, 2000)
      } catch (error) {
        console.error('更新资料失败:', error)
        updateError.value = error.displayMessage || error.message || '更新失败'
      } finally {
        updating.value = false
      }
    }
    
    // 更新/设置密码
    const updatePassword = async () => {
      passwordError.value = ''
      passwordSuccess.value = ''
      
      // 验证新密码和确认密码一致
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        passwordError.value = '两次输入的密码不一致'
        return
      }
      
      // 验证密码长度
      if (passwordForm.new_password.length < 6) {
        passwordError.value = '密码长度至少6位'
        return
      }
      
      updatingPassword.value = true
      
      try {
        const res = await apiRequest('/api/user/password', {
          method: 'PUT',
          showError: false,
          body: {
            old_password: hasPassword.value ? passwordForm.old_password : '',
            new_password: passwordForm.new_password
          }
        })
        
        // 清空表单
        passwordForm.old_password = ''
        passwordForm.new_password = ''
        passwordForm.confirm_password = ''
        
        // 更新 has_password 状态
        userInfo.has_password = true
        
        passwordSuccess.value = res.is_first_set 
          ? '密码设置成功，请重新登录' 
          : '密码修改成功，请重新登录'
        
        eventBus.emit('show-toast', { 
          message: res.is_first_set ? '密码设置成功' : '密码修改成功', 
          type: 'success' 
        })
        
        // 延迟 1.5 秒后退出登录并跳转
        setTimeout(() => {
          clearSession()
          router.push('/login')
        }, 1500)
        
      } catch (error) {
        console.error('修改密码失败:', error)
        passwordError.value = error.displayMessage || error.message || '修改失败'
      } finally {
        updatingPassword.value = false
      }
    }
    
    // QQ绑定
    const handleQQBind = async () => {
      if (userInfo.qq_openid) {
        // 解除绑定（暂未实现，需要后端支持）
        eventBus.emit('show-toast', { message: '暂不支持解除绑定', type: 'warning' })
        return
      }
      
      try {
        const res = await apiRequest('/api/user/qq/bind', { showError: false })
        if (res.auth_url) {
          window.location.href = res.auth_url
        }
      } catch (error) {
        console.error('QQ绑定失败:', error)
        eventBus.emit('show-toast', { message: 'QQ绑定初始化失败', type: 'error' })
      }
    }
    
    // 关闭注销弹窗并清空状态
    const closeDeleteModal = () => {
      showDeleteConfirm.value = false
      deleteVerifyCode.value = ''
      deleteConfirmChecked.value = false
      deleteError.value = ''
      // 清除倒计时
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      codeCountdown.value = 0
    }
    
    // 发送注销验证码
    const sendDeleteVerifyCode = async () => {
      if (codeCountdown.value > 0) return
      
      sendingCode.value = true
      try {
        await apiRequest('/api/v1/auth/email/send-code', {
          method: 'POST',
          showError: false,
          body: {
            email: userInfo.email,
            type: 'delete_account'  // 可以添加类型区分用途
          }
        })
        
        eventBus.emit('show-toast', { message: '验证码已发送，请查收邮件', type: 'success' })
        
        // 开始倒计时
        codeCountdown.value = 60
        countdownTimer = setInterval(() => {
          codeCountdown.value--
          if (codeCountdown.value <= 0) {
            clearInterval(countdownTimer)
            countdownTimer = null
          }
        }, 1000)
      } catch (error) {
        console.error('发送验证码失败:', error)
        eventBus.emit('show-toast', { 
          message: error.displayMessage || error.message || '发送验证码失败', 
          type: 'error' 
        })
      } finally {
        sendingCode.value = false
      }
    }
    
    // 注销账号（使用邮箱验证码验证）
    const handleDeleteAccount = async () => {
      deleteError.value = ''
      
      // 验证验证码格式
      if (!deleteVerifyCode.value || deleteVerifyCode.value.length !== 6) {
        deleteError.value = '请输入6位验证码'
        return
      }
      
      deleting.value = true
      
      try {
        await apiRequest('/api/user/account', {
          method: 'DELETE',
          showError: false,
          body: {
            code: deleteVerifyCode.value
          }
        })
        
        // 清除倒计时
        if (countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
        
        eventBus.emit('show-toast', { 
          message: '账号已注销，感谢您的使用', 
          type: 'success' 
        })
        
        // 清除登录状态并跳转
        clearSession()
        router.push('/login')
        
      } catch (error) {
        console.error('注销失败:', error)
        deleteError.value = error.displayMessage || error.message || '注销失败'
      } finally {
        deleting.value = false
      }
    }
    
    onMounted(() => {
      fetchProfile()
    })
    
    return {
      activeTab,
      defaultAvatar,
      userInfo,
      hasPassword,
      roleText,
      profileForm,
      passwordForm,
      updating,
      updatingPassword,
      updateError,
      updateSuccess,
      passwordError,
      passwordSuccess,
      updateProfile,
      updatePassword,
      // 头像上传
      avatarInput,
      avatarPreview,
      avatarError,
      isDragging,
      handleFileChange,
      handleDrop,
      // QQ绑定
      handleQQBind,
      // 账号注销（邮箱验证码）
      showDeleteConfirm,
      deleteVerifyCode,
      deleteConfirmChecked,
      deleting,
      deleteError,
      codeCountdown,
      sendingCode,
      closeDeleteModal,
      sendDeleteVerifyCode,
      handleDeleteAccount
    }
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg-light);
}

.page-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  color: var(--white);
  padding: 50px 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.page-header p {
  opacity: 0.9;
}

.profile-wrapper {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .profile-wrapper {
    grid-template-columns: 1fr;
  }
}

/* 侧边栏 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px 20px;
  text-align: center;
  box-shadow: var(--shadow);
}

.user-card .user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  border: 3px solid var(--primary-color);
}

.user-card h3 {
  font-size: 1.2rem;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.user-card .user-uid {
  font-size: 0.8rem;
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 5px;
  font-family: monospace;
}

.user-card .user-email {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 10px;
  word-break: break-all;
}

.user-card .user-role {
  display: inline-block;
  background: var(--primary-color);
  color: var(--white);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
}

.profile-nav {
  background: var(--white);
  border-radius: var(--radius);
  padding: 10px;
  box-shadow: var(--shadow);
}

.profile-nav button {
  display: block;
  width: 100%;
  padding: 12px 15px;
  text-align: left;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--text-dark);
  transition: var(--transition);
}

.profile-nav button:hover {
  background: var(--bg-light);
}

.profile-nav button.active {
  background: var(--primary-color);
  color: var(--white);
}

/* 内容区 */
.profile-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  box-shadow: var(--shadow);
  min-height: 500px;
}

.content-section h2 {
  font-size: 1.4rem;
  color: var(--text-dark);
  margin-bottom: 10px;
}

.section-desc {
  color: var(--text-light);
  margin-bottom: 25px;
  font-size: 0.9rem;
}

.profile-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-dark);
}

.form-group label .required {
  color: #e74c3c;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-group input:disabled {
  background: var(--bg-light);
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-tip {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.btn-primary {
  padding: 12px 30px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: var(--transition);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-color);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 15px;
  border-radius: var(--radius-sm);
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.alert-error {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

/* QQ绑定 */
.qq-bind-group {
  background: var(--bg-light);
  padding: 15px;
  border-radius: var(--radius-sm);
}

.qq-bind-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.qq-bound {
  color: #2e7d32;
  font-weight: 500;
}

.qq-unbound {
  color: var(--text-light);
}

.btn-qq-bind {
  padding: 8px 16px;
  background: #12B7F5;
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
}

.btn-qq-bind:hover {
  background: #0ea5e0;
}

.btn-qq-bind.btn-unbind {
  background: #e0e0e0;
  color: var(--text-dark);
}

.btn-qq-bind.btn-unbind:hover {
  background: #d0d0d0;
}

/* 危险区域 */
.danger-zone {
  max-width: 1100px;
  margin: 30px auto;
  padding: 25px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: var(--radius);
}

.danger-zone h3 {
  color: #c62828;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.danger-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.danger-info h4 {
  color: var(--text-dark);
  margin-bottom: 5px;
}

.danger-info p {
  color: var(--text-light);
  font-size: 0.9rem;
}

.btn-danger {
  padding: 10px 24px;
  background: #e53935;
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: var(--transition);
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.danger-modal {
  border-top: 4px solid #e53935;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--bg-light);
}

.modal-header h3 {
  color: #c62828;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-light);
}

.modal-body {
  padding: 20px;
}

.warning-box {
  background: #fff3e0;
  border: 1px solid #ffb74d;
  border-radius: var(--radius-sm);
  padding: 15px;
  margin-bottom: 20px;
}

.warning-title {
  color: #e65100;
  font-weight: 600;
  margin-bottom: 10px;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-dark);
}

.warning-list li {
  margin-bottom: 5px;
}

.confirm-checkbox {
  margin-top: 20px;
}

.confirm-checkbox label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: var(--text-dark);
}

.confirm-checkbox input {
  width: 18px;
  height: 18px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid var(--bg-light);
}

.btn-secondary {
  padding: 10px 24px;
  background: var(--bg-light);
  color: var(--text-dark);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.95rem;
  transition: var(--transition);
}

.btn-secondary:hover {
  background: #e0e0e0;
}

@media (max-width: 768px) {
  .danger-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 头像上传样式 */
.avatar-upload-wrapper {
  position: relative;
  width: 150px;
  height: 150px;
  border: 2px dashed #ddd;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  background: var(--bg-light);
}

.avatar-upload-wrapper:hover {
  border-color: var(--primary-color);
  background: #f0f7ff;
}

.avatar-upload-wrapper.drag-over {
  border-color: var(--primary-color);
  background: #e3f2fd;
  transform: scale(1.02);
}

.avatar-upload-wrapper.has-preview {
  border-style: solid;
  border-color: var(--primary-color);
}

.avatar-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius);
}

.avatar-upload-content {
  text-align: center;
  padding: 20px;
}

.upload-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
  opacity: 0.6;
}

.upload-text {
  font-size: 0.95rem;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 0.8rem;
  color: var(--text-light);
}

.avatar-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: var(--radius);
}

.avatar-upload-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.change-text {
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
}

.avatar-error {
  color: #e53935;
  font-size: 0.85rem;
  margin-top: 8px;
}

/* 邮箱验证码输入框样式 */
.verify-code-group {
  margin-top: 20px;
}

.verify-code-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.verify-code-input input {
  flex: 1;
  text-align: center;
  letter-spacing: 4px;
  font-size: 1.1rem;
  font-weight: 500;
}

.btn-send-code {
  padding: 12px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: var(--transition);
  min-width: 110px;
}

.btn-send-code:hover:not(:disabled) {
  background: var(--accent-color);
}

.btn-send-code:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .verify-code-input {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn-send-code {
    width: 100%;
    padding: 10px;
  }
}
</style>
