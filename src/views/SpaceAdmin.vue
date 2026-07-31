<template>
  <div class="space-admin-page">
    <header class="page-header">
      <div class="container">
        <h1>空间管理</h1>
        <p>管理您的作品、关于页面和联系方式</p>
      </div>
    </header>

    <section class="admin-section">
      <div class="container">
        <!-- 标签切换 -->
        <div class="admin-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner">🎨</div>
          <p>加载中...</p>
        </div>

        <!-- 作品管理 -->
        <div v-else-if="activeTab === 'works'" class="tab-content fade-in">
          <div class="section-header">
            <h2>作品管理</h2>
            <button class="btn btn-primary" @click="openWorkModal()">+ 添加作品</button>
          </div>

          <div v-if="works.length === 0" class="empty-state">
            <div class="empty-icon">🖼️</div>
            <p>暂无作品</p>
            <p class="hint">点击上方按钮添加您的第一个作品</p>
          </div>

          <div v-else class="works-grid">
            <div v-for="work in works" :key="work.id" class="work-card">
              <img :src="work.image_url" :alt="work.title" @error="handleImageError">
              <div class="work-info">
                <h4>{{ work.title }}</h4>
                <span class="category-tag">{{ getCategoryLabel(work.category) }}</span>
              </div>
              <div class="work-actions">
                <button class="btn-small" @click="openWorkModal(work)">编辑</button>
                <button class="btn-small btn-danger" @click="deleteWork(work.id)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于页面 -->
        <div v-else-if="activeTab === 'about'" class="tab-content fade-in">
          <div class="section-header">
            <h2>关于页面</h2>
            <button class="btn btn-primary" @click="saveAbout" :disabled="saving">
              {{ saving ? '保存中...' : '保存更改' }}
            </button>
          </div>

          <div class="about-editor">
            <!-- 工作室历史 -->
            <div class="editor-section">
              <h3>🏛️ 工作室历史</h3>
              <div v-for="(item, index) in aboutData.history" :key="index" class="about-item">
                <input v-model="item.date" placeholder="年份，如：2024年" class="small-input">
                <input v-model="item.title" placeholder="标题" class="title-input">
                <textarea v-model="item.desc" placeholder="描述" rows="2"></textarea>
                <button class="btn-small btn-danger" @click="removeAboutItem('history', index)">删除</button>
              </div>
              <button class="btn btn-outline" @click="addAboutItem('history')">+ 添加历史</button>
            </div>

            <!-- 创作理念 -->
            <div class="editor-section">
              <h3>💡 创作理念</h3>
              <div v-for="(item, index) in aboutData.philosophy" :key="index" class="about-item">
                <input v-model="item.title" placeholder="理念标题" class="title-input">
                <textarea v-model="item.desc" placeholder="理念描述" rows="3"></textarea>
                <button class="btn-small btn-danger" @click="removeAboutItem('philosophy', index)">删除</button>
              </div>
              <button class="btn btn-outline" @click="addAboutItem('philosophy')">+ 添加理念</button>
            </div>

            <!-- 团队成员 -->
            <div class="editor-section">
              <h3>👥 团队成员</h3>
              <div v-for="(item, index) in aboutData.team" :key="index" class="about-item">
                <input v-model="item.icon" placeholder="图标，如：🎨" class="small-input">
                <input v-model="item.name" placeholder="姓名" class="title-input">
                <input v-model="item.role" placeholder="职位" class="role-input">
                <button class="btn-small btn-danger" @click="removeAboutItem('team', index)">删除</button>
              </div>
              <button class="btn btn-outline" @click="addAboutItem('team')">+ 添加成员</button>
            </div>

            <!-- 服务范围 -->
            <div class="editor-section">
              <h3>🎯 服务范围</h3>
              <div v-for="(item, index) in aboutData.services" :key="index" class="about-item">
                <input v-model="item.icon" placeholder="图标，如：🎭" class="small-input">
                <input v-model="item.title" placeholder="服务名称" class="title-input">
                <textarea v-model="item.desc" placeholder="服务描述" rows="2"></textarea>
                <button class="btn-small btn-danger" @click="removeAboutItem('services', index)">删除</button>
              </div>
              <button class="btn btn-outline" @click="addAboutItem('services')">+ 添加服务</button>
            </div>

            <!-- 委托流程 -->
            <div class="editor-section">
              <h3>📋 委托流程</h3>
              <div v-for="(item, index) in aboutData.process" :key="index" class="about-item">
                <input v-model="item.title" placeholder="步骤标题" class="title-input">
                <textarea v-model="item.desc" placeholder="步骤描述" rows="2"></textarea>
                <button class="btn-small btn-danger" @click="removeAboutItem('process', index)">删除</button>
              </div>
              <button class="btn btn-outline" @click="addAboutItem('process')">+ 添加步骤</button>
            </div>
          </div>
        </div>

        <!-- 联系方式 -->
        <div v-else-if="activeTab === 'contact'" class="tab-content fade-in">
          <div class="section-header">
            <h2>联系方式</h2>
            <button class="btn btn-primary" @click="saveContact" :disabled="saving">
              {{ saving ? '保存中...' : '保存更改' }}
            </button>
          </div>

          <div class="contact-editor">
            <div class="form-grid">
              <div class="form-group">
                <label>QQ</label>
                <input v-model="contactData.qq" placeholder="QQ号码">
              </div>
              <div class="form-group">
                <label>微信</label>
                <input v-model="contactData.wechat" placeholder="微信号">
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input v-model="contactData.email" placeholder="email@example.com" type="email">
              </div>
              <div class="form-group">
                <label>小红书</label>
                <input v-model="contactData.xiaohongshu" placeholder="主页链接">
              </div>
              <div class="form-group">
                <label>Bilibili</label>
                <input v-model="contactData.bilibili" placeholder="空间链接">
              </div>
              <div class="form-group">
                <label>X (Twitter)</label>
                <input v-model="contactData.twitter" placeholder="主页链接">
              </div>
              <div class="form-group">
                <label>微博</label>
                <input v-model="contactData.weibo" placeholder="主页链接">
              </div>
              <div class="form-group">
                <label>个人网站</label>
                <input v-model="contactData.website" placeholder="https://...">
              </div>
            </div>

            <div class="faq-section">
              <h3>常见问题 (FAQ)</h3>
              <div v-for="(item, index) in contactData.faq" :key="index" class="faq-item-editor">
                <input v-model="item.q" placeholder="问题" class="question-input">
                <textarea v-model="item.a" placeholder="回答" rows="3"></textarea>
                <button class="btn-small btn-danger" @click="removeFaq(index)">删除</button>
              </div>
              <button class="btn btn-outline" @click="addFaq">+ 添加FAQ</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 作品编辑弹窗 -->
    <div v-if="showWorkModal" class="modal" @click.self="closeWorkModal">
      <div class="modal-content fade-in">
        <div class="modal-header">
          <h3>{{ editingWork ? '编辑作品' : '添加作品' }}</h3>
          <button class="close-btn" @click="closeWorkModal">×</button>
        </div>
        <form @submit.prevent="saveWork">
          <div class="form-group">
            <label>作品标题</label>
            <input v-model="workForm.title" required placeholder="输入作品标题">
          </div>
          <div class="form-group">
            <label>图片链接</label>
            <input v-model="workForm.image_url" required placeholder="https://...">
            <img v-if="workForm.image_url" :src="workForm.image_url" class="preview-image">
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="workForm.category">
              <option value="all">全部</option>
              <option value="avatar">头像</option>
              <option value="character">立绘</option>
              <option value="illustration">插图</option>
              <option value="concept">设定图</option>
            </select>
          </div>
          <div class="form-group">
            <label>排序</label>
            <input v-model.number="workForm.sort_order" type="number" placeholder="数字越小越靠前">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeWorkModal">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { getMyWorksAPI, createWorkAPI, updateWorkAPI, deleteWorkAPI, getMyAboutAPI, updateMyAboutAPI, getMyContactAPI, updateMyContactAPI } from '@/api/artist.js'
import { showToast } from '../utils/eventBus'
import { IMAGES } from '../config/assets.js'

export default {
  name: 'SpaceAdmin',
  setup() {
    return {
      // 使用 Vue 3 Composition API 模式
    }
  },
  data() {
    return {
      activeTab: 'works',
      tabs: [
        { key: 'works', label: '🖼️ 作品管理' },
        { key: 'about', label: '📝 关于页面' },
        { key: 'contact', label: '📞 联系方式' }
      ],
      loading: false,
      saving: false,
      
      // 作品数据
      works: [],
      showWorkModal: false,
      editingWork: null,
      workForm: {
        title: '',
        image_url: '',
        category: 'all',
        sort_order: 0
      },
      
      // 关于页面数据
      aboutData: {
        history: [],
        philosophy: [],
        team: [],
        services: [],
        process: []
      },
      
      // 联系方式数据
      contactData: {
        qq: '',
        wechat: '',
        email: '',
        xiaohongshu: '',
        bilibili: '',
        twitter: '',
        weibo: '',
        website: '',
        faq: []
      }
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    handleImageError(e) {
      e.target.src = IMAGES.imageLoadError
    },
    
    // 🔥 加载所有数据
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadWorks(),
          this.loadAbout(),
          this.loadContact()
        ])
      } catch (err) {
        console.error('[SpaceAdmin] 加载数据失败:', err)
        showToast('加载数据失败', 'error')
      } finally {
        this.loading = false
      }
    },
    
    // ============ 作品管理 ============
    async loadWorks() {
      try {
        const res = await getMyWorksAPI()
        if (res.data?.list) {
          this.works = res.data.list
        }
      } catch (err) {
        console.error('[SpaceAdmin] 加载作品失败:', err)
      }
    },
    
    openWorkModal(work = null) {
      if (work) {
        this.editingWork = work
        this.workForm = { ...work }
      } else {
        this.editingWork = null
        this.workForm = {
          title: '',
          image_url: '',
          category: 'all',
          sort_order: 0
        }
      }
      this.showWorkModal = true
    },
    
    closeWorkModal() {
      this.showWorkModal = false
      this.editingWork = null
    },
    
    async saveWork() {
      this.saving = true
      try {
        if (this.editingWork) {
          await updateWorkAPI(this.editingWork.id, this.workForm)
          showToast('作品更新成功', 'success')
        } else {
          await createWorkAPI(this.workForm)
          showToast('作品添加成功', 'success')
        }
        await this.loadWorks()
        this.closeWorkModal()
      } catch (err) {
        console.error('[SpaceAdmin] 保存作品失败:', err)
        showToast(err.message || '保存失败', 'error')
      } finally {
        this.saving = false
      }
    },
    
    async deleteWork(id) {
      if (!confirm('确定删除这个作品吗？')) return
      
      try {
        await deleteWorkAPI(id)
        showToast('作品删除成功', 'success')
        await this.loadWorks()
      } catch (err) {
        console.error('[SpaceAdmin] 删除作品失败:', err)
        showToast(err.message || '删除失败', 'error')
      }
    },
    
    getCategoryLabel(category) {
      const labels = {
        all: '全部',
        avatar: '头像',
        character: '立绘',
        illustration: '插图',
        concept: '设定图'
      }
      return labels[category] || category
    },
    
    // ============ 关于页面 ============
    async loadAbout() {
      try {
        const res = await getMyAboutAPI()
        if (res.data) {
          this.aboutData = {
            history: res.data.history || [],
            philosophy: res.data.philosophy || [],
            team: res.data.team || [],
            services: res.data.services || [],
            process: res.data.process || []
          }
        }
      } catch (err) {
        console.error('[SpaceAdmin] 加载关于页面失败:', err)
      }
    },
    
    addAboutItem(section) {
      const templates = {
        history: { date: '', title: '', desc: '' },
        philosophy: { title: '', desc: '' },
        team: { icon: '', name: '', role: '' },
        services: { icon: '', title: '', desc: '' },
        process: { title: '', desc: '' }
      }
      this.aboutData[section].push(templates[section])
    },
    
    removeAboutItem(section, index) {
      this.aboutData[section].splice(index, 1)
    },
    
    async saveAbout() {
      this.saving = true
      try {
        await updateMyAboutAPI(this.aboutData)
        showToast('关于页面保存成功', 'success')
      } catch (err) {
        console.error('[SpaceAdmin] 保存关于页面失败:', err)
        showToast(err.message || '保存失败', 'error')
      } finally {
        this.saving = false
      }
    },
    
    // ============ 联系方式 ============
    async loadContact() {
      try {
        const res = await getMyContactAPI()
        if (res.data) {
          this.contactData = {
            qq: res.data.qq || '',
            wechat: res.data.wechat || '',
            email: res.data.email || '',
            xiaohongshu: res.data.xiaohongshu || '',
            bilibili: res.data.bilibili || '',
            twitter: res.data.twitter || '',
            weibo: res.data.weibo || '',
            website: res.data.website || '',
            faq: res.data.faq || []
          }
        }
      } catch (err) {
        console.error('[SpaceAdmin] 加载联系方式失败:', err)
      }
    },
    
    addFaq() {
      this.contactData.faq.push({ q: '', a: '' })
    },
    
    removeFaq(index) {
      this.contactData.faq.splice(index, 1)
    },
    
    async saveContact() {
      this.saving = true
      try {
        await updateMyContactAPI(this.contactData)
        showToast('联系方式保存成功', 'success')
      } catch (err) {
        console.error('[SpaceAdmin] 保存联系方式失败:', err)
        showToast(err.message || '保存失败', 'error')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.space-admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.admin-section {
  padding: 30px 0 60px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 标签切换 */
.admin-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: white;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: #f0f0f0;
}

.tab-btn.active {
  background: #667eea;
  color: white;
}

/* 内容区域 */
.tab-content {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #333;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-outline {
  background: transparent;
  border: 1px dashed #ccc;
  color: #666;
}

.btn-outline:hover {
  border-color: #667eea;
  color: #667eea;
}

.btn-small {
  padding: 5px 12px;
  font-size: 0.8rem;
}

.btn-danger {
  background: #ff6b6b;
  color: white;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 80px 20px;
}

.spinner {
  font-size: 48px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.hint {
  font-size: 0.9rem;
  margin-top: 10px;
}

/* 作品网格 */
.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.work-card {
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s;
}

.work-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.work-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.work-info {
  padding: 15px;
}

.work-info h4 {
  margin-bottom: 8px;
  font-size: 1rem;
}

.category-tag {
  display: inline-block;
  padding: 4px 10px;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
}

.work-actions {
  padding: 0 15px 15px;
  display: flex;
  gap: 10px;
}

/* 编辑器样式 */
.about-editor {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.editor-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.editor-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.about-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  display: grid;
  gap: 10px;
}

.about-item input,
.about-item textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.small-input {
  width: 120px;
}

.title-input {
  flex: 1;
}

.role-input {
  width: 200px;
}

/* 联系方式编辑器 */
.contact-editor {
  max-width: 800px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #555;
}

.form-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.faq-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.faq-section h3 {
  margin-bottom: 20px;
}

.faq-item-editor {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.question-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 0.95rem;
}

.faq-item-editor textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
}

.modal form {
  padding: 20px;
}

.modal .form-group {
  margin-bottom: 20px;
}

.preview-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
