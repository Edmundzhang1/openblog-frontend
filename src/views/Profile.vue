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

              <!-- 我的主页地址（只读，slug 由系统分配） -->
              <div class="form-group">
                <label>我的主页地址</label>
                <div class="space-path-row">
                  <router-link :to="mySpacePath" class="space-path-link">{{ mySpacePath }}</router-link>
                </div>
                <p class="form-tip">{{ mySpaceHint }}</p>
              </div>

              <!-- QQ绑定（POST /api/v1/auth/bind-qq，body: { qq_number }） -->
              <div class="form-group qq-bind-group">
                <label>QQ账号</label>
                <div class="qq-bind-status">
                  <span v-if="boundQQ" class="qq-bound">
                    ✅ {{ tt('已绑定', 'Bound') }}（{{ boundQQ }}）
                  </span>
                  <input
                    v-else
                    type="text"
                    v-model.trim="qqNumberInput"
                    class="qq-input"
                    :placeholder="tt('请输入QQ号', 'Enter QQ number')"
                    maxlength="15"
                    :disabled="qqBinding"
                  >
                  <button 
                    type="button" 
                    class="btn-qq-bind"
                    :class="{ 'btn-unbind': boundQQ }"
                    :disabled="qqBinding"
                    @click="handleQQBind"
                  >
                    {{ boundQQ ? tt('解除绑定', 'Unbind') : (qqBinding ? tt('绑定中...', 'Binding...') : tt('绑定', 'Bind')) }}
                  </button>
                </div>
                <p class="form-tip">{{ tt('绑定QQ后可以使用QQ快速登录', 'Bind your QQ for quick login') }}</p>
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
              <!-- 后端 SetPassword（POST /api/v1/me/password）不校验旧密码，body 仅需 { password }，
                   因此不再提供旧密码输入框 -->
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
    
    <!-- 注销确认弹窗（DELETE /api/v1/me 无需验证码，保留确认勾选交互）-->
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
            :disabled="!deleteConfirmChecked || deleting"
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
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { eventBus, apiRequest } from '../utils/eventBus'
import { clearSession, updateStoredUser } from '../utils/auth.js'
import { API_ENDPOINTS } from '../config/api.js'
import { IMAGES } from '../config/assets.js'

export default {
  name: 'Profile',
  setup() {
    const router = useRouter()
    const i18n = inject('i18n', { getLocale: () => 'zh' })

    // 新增文案（中英双语）
    const locale = computed(() => {
      try { return i18n.getLocale?.() || 'zh' } catch { return 'zh' }
    })
    // 双语助手：新增/修改的文案统一走 tt(zh, en)
    const tt = (zh, en) => (locale.value === 'zh' ? zh : en)

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
      slug: '',
      role: 'client',
      has_password: false,
      contact_info: ''
    })
    
    // 已绑定的 QQ 号（后端 BindQQ 写入 contact_info JSON 的 qq 字段）
    const boundQQ = computed(() => {
      try {
        const info = JSON.parse(userInfo.contact_info || '{}')
        return info.qq || ''
      } catch {
        return ''
      }
    })
    const qqNumberInput = ref('')
    const qqBinding = ref(false)
    
    // 我的主页地址（slug 未设置时回退 uid；slug 仅管理员可修改）
    const mySpacePath = computed(() => `/@${userInfo.slug || userInfo.uid}`)
    const mySpaceHint = computed(() => locale.value === 'zh'
      ? '主页路径由系统分配，如需修改请联系管理员'
      : 'Your page path is assigned by the system. Contact an administrator to change it.')
    
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
    
    // 密码表单（后端不校验旧密码，仅提交新密码）
    const passwordForm = reactive({
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
    
    // 账号注销相关（确认弹窗 + DELETE /api/v1/me）
    const showDeleteConfirm = ref(false)
    const deleteConfirmChecked = ref(false)
    const deleting = ref(false)
    const deleteError = ref('')
    
    // 获取个人信息（GET /api/v1/me）
    const fetchProfile = async () => {
      try {
        const res = await apiRequest(API_ENDPOINTS.ME, { showError: false })
        Object.assign(userInfo, res || {})
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
    
    // 上传头像（统一走 /api/v1/upload，字段名 file）
    const uploadAvatar = async () => {
      if (!selectedAvatarFile.value) return null
      
      const formData = new FormData()
      formData.append('file', selectedAvatarFile.value)
      
      try {
        const res = await apiRequest(API_ENDPOINTS.UPLOAD, {
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
        
        // PUT /api/v1/me（白名单：nickname/avatar_url/bio/contact_info；slug 不可修改）
        await apiRequest(API_ENDPOINTS.ME_UPDATE, {
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
        passwordError.value = tt('两次输入的密码不一致', 'Passwords do not match')
        return
      }
      
      // 验证密码长度
      if (passwordForm.new_password.length < 6) {
        passwordError.value = tt('密码长度至少6位', 'Password must be at least 6 characters')
        return
      }
      
      updatingPassword.value = true
      // 后端不校验旧密码，is_first_set 由前端按 has_password 推断（仅用于文案）
      const isFirstSet = !hasPassword.value
      
      try {
        // POST /api/v1/me/password，body 仅需 { password }
        await apiRequest(API_ENDPOINTS.ME_PASSWORD, {
          method: 'POST',
          showError: false,
          body: {
            password: passwordForm.new_password
          }
        })
        
        // 清空表单
        passwordForm.new_password = ''
        passwordForm.confirm_password = ''
        
        // 更新 has_password 状态
        userInfo.has_password = true
        
        passwordSuccess.value = isFirstSet
          ? tt('密码设置成功，请重新登录', 'Password set. Please log in again.')
          : tt('密码修改成功，请重新登录', 'Password updated. Please log in again.')
        
        eventBus.emit('show-toast', { 
          message: isFirstSet ? tt('密码设置成功', 'Password set') : tt('密码修改成功', 'Password updated'), 
          type: 'success' 
        })
        
        // 延迟 1.5 秒后退出登录并跳转
        setTimeout(() => {
          clearSession()
          router.push('/login')
        }, 1500)
        
      } catch (error) {
        console.error('修改密码失败:', error)
        passwordError.value = error.displayMessage || error.message || tt('修改失败', 'Update failed')
      } finally {
        updatingPassword.value = false
      }
    }
    
    // QQ绑定（POST /api/v1/auth/bind-qq，body: { qq_number }，要求 5-15 位数字）
    const handleQQBind = async () => {
      if (boundQQ.value) {
        // 解除绑定（后端暂无解绑接口）
        eventBus.emit('show-toast', { message: tt('暂不支持解除绑定', 'Unbinding is not supported yet'), type: 'warning' })
        return
      }
      
      if (!/^\d{5,15}$/.test(qqNumberInput.value)) {
        eventBus.emit('show-toast', { message: tt('请输入 5-15 位数字 QQ 号', 'Please enter a 5-15 digit QQ number'), type: 'error' })
        return
      }
      
      qqBinding.value = true
      try {
        await apiRequest(API_ENDPOINTS.AUTH_BIND_QQ, {
          method: 'POST',
          showError: false,
          body: { qq_number: qqNumberInput.value }
        })
        eventBus.emit('show-toast', { message: tt('QQ号绑定成功', 'QQ account bound'), type: 'success' })
        qqNumberInput.value = ''
        // 刷新 contact_info，更新绑定状态展示
        await fetchProfile()
      } catch (error) {
        console.error('QQ绑定失败:', error)
        eventBus.emit('show-toast', {
          message: error.displayMessage || error.message || tt('QQ绑定失败', 'Failed to bind QQ'),
          type: 'error'
        })
      } finally {
        qqBinding.value = false
      }
    }
    
    // 关闭注销弹窗并清空状态
    const closeDeleteModal = () => {
      showDeleteConfirm.value = false
      deleteConfirmChecked.value = false
      deleteError.value = ''
    }
    
    // 注销账号（DELETE /api/v1/me，软删除当前账号，无需请求体）
    const handleDeleteAccount = async () => {
      deleteError.value = ''
      deleting.value = true
      
      try {
        await apiRequest(API_ENDPOINTS.ME_DELETE, {
          method: 'DELETE',
          showError: false
        })
        
        eventBus.emit('show-toast', { 
          message: tt('账号已注销，感谢您的使用', 'Your account has been deleted. Thank you for using our service.'), 
          type: 'success' 
        })
        
        // 清除本地登录态并跳回首页
        clearSession()
        router.push('/')
        
      } catch (error) {
        console.error('注销失败:', error)
        deleteError.value = error.displayMessage || error.message || tt('注销失败', 'Failed to delete account')
      } finally {
        deleting.value = false
      }
    }
    
    onMounted(() => {
      fetchProfile()
    })
    
    return {
      tt,
      activeTab,
      defaultAvatar,
      userInfo,
      hasPassword,
      roleText,
      mySpacePath,
      mySpaceHint,
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
      boundQQ,
      qqNumberInput,
      qqBinding,
      handleQQBind,
      // 账号注销（确认弹窗 + DELETE /me）
      showDeleteConfirm,
      deleteConfirmChecked,
      deleting,
      deleteError,
      closeDeleteModal,
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

.profile-wrapper {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
  max-width: 1100px;
  margin: 48px auto 64px;
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
  border: 2px solid #E5E7EB;
}

.user-card h3 {
  font-size: 1.2rem;
  color: var(--text-dark);
  margin-bottom: 5px;
}

.user-card .user-uid {
  font-size: 0.8rem;
  color: var(--text-muted);
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
  border-radius: var(--radius);
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
  background: #F5F5F5;
}

.profile-nav button.active {
  background: var(--primary-color);
  color: var(--white);
}

/* 内容区 */
.profile-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
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
  color: #EF4444;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-group input:disabled {
  background: #FAFAFA;
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

/* 我的主页地址（只读） */
.space-path-row {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-sm);
  background: #FAFAFA;
}

.space-path-link {
  color: var(--primary-color);
  font-weight: 600;
  font-family: monospace;
  text-decoration: none;
}

.space-path-link:hover {
  color: var(--accent-color);
  text-decoration: underline;
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
  background: #FEF2F2;
  color: #B91C1C;
  border: 1px solid #FECACA;
}

.alert-success {
  background: #F0FDF4;
  color: #15803D;
  border: 1px solid #BBF7D0;
}

/* QQ绑定 */
.qq-bind-group {
  background: #FAFAFA;
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
  color: #15803D;
  font-weight: 500;
}

.qq-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}

.qq-input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.qq-unbound {
  color: var(--text-light);
}

.btn-qq-bind {
  padding: 8px 16px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  transition: var(--transition);
}

.btn-qq-bind:hover {
  background: var(--accent-color);
}

.btn-qq-bind.btn-unbind {
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid #E5E7EB;
}

.btn-qq-bind.btn-unbind:hover {
  background: #FAFAFA;
}

/* 危险区域 */
.danger-zone {
  max-width: 1100px;
  margin: 0 auto 64px;
  padding: 32px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: var(--radius);
}

.danger-zone h3 {
  color: #B91C1C;
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
  background: #EF4444;
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: var(--transition);
}

.btn-danger:hover:not(:disabled) {
  background: #DC2626;
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
  border-top: 4px solid #EF4444;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.modal-header h3 {
  color: #B91C1C;
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
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: var(--radius-sm);
  padding: 15px;
  margin-bottom: 20px;
}

.warning-title {
  color: #B45309;
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
  border-top: 1px solid #E5E7EB;
}

.btn-secondary {
  padding: 10px 24px;
  background: var(--white);
  color: var(--text-dark);
  border: 1px solid var(--text-dark);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.95rem;
  transition: var(--transition);
}

.btn-secondary:hover {
  background: var(--text-dark);
  color: var(--white);
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
  border: 2px dashed #D1D5DB;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  overflow: hidden;
  background: #FAFAFA;
}

.avatar-upload-wrapper:hover {
  border-color: var(--accent-color);
  background: #EFF6FF;
}

.avatar-upload-wrapper.drag-over {
  border-color: var(--accent-color);
  background: #EFF6FF;
}

.avatar-upload-wrapper.has-preview {
  border-style: solid;
  border-color: #E5E7EB;
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
  color: #EF4444;
  font-size: 0.85rem;
  margin-top: 8px;
}
</style>
