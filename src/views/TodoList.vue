<template>
  <div class="todo-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <div class="container">
        <h1>TODO</h1>
        <p>智能管理您的稿期，合理安排每一单委托</p>
      </div>
    </header>

    <!-- 统计卡片 -->
    <div class="container">
      <div class="stats-grid fade-in">
        <div class="stat-card">
          <div class="stat-value">{{ statTotal }}</div>
          <div class="stat-label">本月排单</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statPending }}</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statCompleted }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>

      <div class="todolist-container fade-in">
        <!-- 左侧：日历 -->
        <div class="calendar-section">
          <div class="calendar-header">
            <h2>{{ calendarTitle }}</h2>
            <div class="calendar-nav">
              <button @click="changeMonth(-1)">‹</button>
              <button @click="changeMonth(1)">›</button>
            </div>
          </div>
          <div class="calendar-grid">
            <!-- 星期标题 -->
            <div class="calendar-weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
            <!-- 日期格子 -->
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index"
              :class="[
                'calendar-day',
                day.isOtherMonth ? 'other-month' : '',
                day.isToday ? 'today' : '',
                day.isSelected ? 'selected' : '',
                day.statusClass
              ]"
              @click="!day.isOtherMonth && selectDate(day.dateStr, day.day)"
            >
              <span class="day-number">{{ day.day }}</span>
              <div class="day-dots">
                <div 
                  v-for="(dot, idx) in day.dots" 
                  :key="idx" 
                  class="day-dot" 
                  :style="{ background: dot.color }"
                ></div>
              </div>
              <span v-if="day.workload > 0" class="day-workload">{{ day.workload.toFixed(1) }}天</span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作面板 -->
        <div class="side-panel">
          <!-- 设置面板 -->
          <div class="settings-section">
            <h3>⚙️ 工作设置</h3>
            <div class="setting-item">
              <label>每日最大工作量（天）</label>
              <input 
                type="number" 
                v-model.number="maxWorkload" 
                min="0.5" 
                step="0.5"
                @change="updateMaxWorkload"
              >
            </div>
            <div class="setting-item">
              <label>画风类型</label>
              <div class="style-list">
                <div v-for="style in styles" :key="style.id" class="style-item">
                  <div class="style-color" :style="{ background: style.color }"></div>
                  <div class="style-info">
                    <div class="style-name">{{ style.name }}</div>
                    <div class="style-days">{{ style.days }}天/单</div>
                  </div>
                  <div class="style-actions">
                    <button class="btn-small btn-edit" @click="editStyle(style)">编辑</button>
                    <button class="btn-small btn-delete" @click="deleteStyle(style.id)">删除</button>
                  </div>
                </div>
              </div>
              <button class="btn-add-style" @click="openStyleModal">+ 添加画风</button>
            </div>
          </div>

          <!-- 选中日期信息 -->
          <div class="date-info" v-if="selectedDate">
            <h3>{{ selectedDateDisplay }}</h3>
            <div class="workload-bar">
              <div class="workload-progress">
                <div 
                  class="workload-fill" 
                  :class="workloadBarClass"
                  :style="{ width: workloadPercentage + '%' }"
                ></div>
              </div>
              <div class="workload-text">{{ currentWorkload.toFixed(1) }}/{{ maxWorkload }}</div>
            </div>
          </div>
          <div class="date-info" v-else>
            <h3>请选择日期</h3>
          </div>

          <!-- 排单列表 -->
          <div class="commission-list">
            <h3>当日排单</h3>
            <div v-if="selectedDateCommissions.length === 0" class="empty-state">
              <div class="empty-state-icon">📝</div>
              <p>{{ selectedDate ? '暂无排单' : '请选择日期查看排单' }}</p>
            </div>
            <div v-else>
              <div 
                v-for="commission in selectedDateCommissions" 
                :key="commission.id"
                class="commission-item"
              >
                <div class="commission-header">
                  <div>
                    <span 
                      class="commission-tag" 
                      :style="{ 
                        background: getStyle(commission.styleId)?.color + '20', 
                        color: getStyle(commission.styleId)?.color 
                      }"
                    >
                      <span 
                        class="style-dot" 
                        :style="{ background: getStyle(commission.styleId)?.color || '#ccc' }"
                      ></span>
                      {{ getStyle(commission.styleId)?.name || '未知画风' }}
                    </span>
                    <div class="commission-client">{{ commission.clientName }}</div>
                  </div>
                  <button class="close-btn" @click="deleteCommission(commission.id)">×</button>
                </div>
                <div class="commission-meta">
                  <span>📦 {{ commission.quantity }}单</span>
                  <span>⏱️ {{ (getStyle(commission.styleId)?.days || 0) * commission.quantity }}天</span>
                </div>
                <div v-if="commission.note" class="commission-note">
                  📝 {{ commission.note }}
                </div>
                <div class="commission-actions">
                  <button 
                    :class="['btn-status', commission.status === 'completed' ? 'completed' : '']"
                    @click="toggleStatus(commission)"
                  >
                    {{ commission.status === 'completed' ? '✓ 已完成' : '○ 进行中' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 添加排单 -->
          <div class="add-commission" v-if="selectedDate">
            <h3>+ 添加排单</h3>
            <form @submit.prevent="addCommission">
              <div class="form-group">
                <label>客户名称</label>
                <input type="text" v-model="newCommission.clientName" required placeholder="输入客户名">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>画风类型</label>
                  <select v-model="newCommission.styleId" required @change="checkOverload">
                    <option value="">选择画风</option>
                    <option v-for="style in styles" :key="style.id" :value="style.id">
                      {{ style.name }} ({{ style.days }}天)
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>数量</label>
                  <input type="number" v-model.number="newCommission.quantity" min="1" required @input="checkOverload">
                </div>
              </div>
              <div class="form-group">
                <label>备注</label>
                <textarea v-model="newCommission.note" rows="2" placeholder="可选：添加备注信息"></textarea>
              </div>
              <div v-if="showOverloadWarning" class="alert alert-warning">
                ⚠️ 添加此排单将超过每日工作量限制
              </div>
              <button type="submit" class="btn-primary">添加排单</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 画风设置弹窗 -->
    <div class="modal" :class="{ active: showStyleModal }">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingStyle ? '编辑画风' : '添加画风' }}</h3>
          <button class="close-btn" @click="closeStyleModal">×</button>
        </div>
        <form @submit.prevent="saveStyle">
          <div class="form-group">
            <label>画风名称</label>
            <input type="text" v-model="styleForm.name" required placeholder="如：Q版头像">
          </div>
          <div class="form-group">
            <label>所需工期（天）</label>
            <input type="number" v-model.number="styleForm.days" min="0.5" step="0.5" required>
          </div>
          <div class="form-group">
            <label>颜色标识</label>
            <input type="color" v-model="styleForm.color">
          </div>
          <button type="submit" class="btn-primary">保存</button>
        </form>
      </div>
    </div>

    <!-- 首次设置引导弹窗 -->
    <div class="modal" :class="{ active: showSetupModal }">
      <div class="modal-content" @click.stop>
        <div class="setup-welcome">
          <h2>🎨 欢迎使用 TODO</h2>
          <p>在开始使用前，请先设置您的工作参数</p>
        </div>
        <div class="setup-steps">
          <div class="setup-step">
            <div class="step-number">1</div>
            <div class="step-text">设置每日工作量</div>
          </div>
          <div class="setup-step">
            <div class="step-number">2</div>
            <div class="step-text">添加画风类型</div>
          </div>
          <div class="setup-step">
            <div class="step-number">3</div>
            <div class="step-text">开始排单</div>
          </div>
        </div>
        <form @submit.prevent="saveSetup">
          <div class="form-group">
            <label>每日最大工作量（天）</label>
            <input type="number" v-model.number="setupMaxWorkload" min="0.5" step="0.5" required>
            <small style="color: var(--text-light);">表示您每天愿意投入的总工期天数</small>
          </div>
          <div class="alert alert-info">
            💡 例如：每天最多画3个头像（每个0.5天），或1个立绘（2天）+1个头像（0.5天）
          </div>
          <button type="submit" class="btn-primary">开始设置画风类型</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const STORAGE_KEYS = {
  STYLES: 'furest_vue_styles',
  MAX_WORKLOAD: 'furest_vue_max_workload',
  COMMISSIONS: 'furest_vue_commissions',
  SETUP_DONE: 'furest_vue_setup_done'
}

const defaultStyles = [
  { id: 1, name: 'Q版头像', days: 0.5, color: '#FFB6C1' },
  { id: 2, name: '日系立绘', days: 2, color: '#98D8C8' },
  { id: 3, name: '厚涂插图', days: 5, color: '#87CEEB' },
  { id: 4, name: '设定页', days: 3, color: '#DDA0DD' }
]

export default {
  name: 'TodoList',
  data() {
    return {
      // 核心数据
      styles: [],
      maxWorkload: 3,
      commissions: [],
      
      // 日历状态
      currentDate: new Date(),
      selectedDate: null,
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      
      // 新排单表单
      newCommission: {
        clientName: '',
        styleId: '',
        quantity: 1,
        note: ''
      },
      
      // 画风表单
      styleForm: {
        id: null,
        name: '',
        days: 1,
        color: '#6B8E6B'
      },
      
      // UI 状态
      showStyleModal: false,
      showSetupModal: false,
      showOverloadWarning: false,
      editingStyle: null,
      setupMaxWorkload: 3
    }
  },
  
  computed: {
    calendarTitle() {
      return `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月`
    },
    
    selectedDateDisplay() {
      if (!this.selectedDate) return ''
      const date = new Date(this.selectedDate)
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
    },
    
    selectedDateCommissions() {
      if (!this.selectedDate) return []
      return this.commissions.filter(c => c.date === this.selectedDate)
    },
    
    currentWorkload() {
      return this.calculateDayWorkload(this.selectedDateCommissions)
    },
    
    workloadPercentage() {
      return Math.min((this.currentWorkload / this.maxWorkload) * 100, 100)
    },
    
    workloadBarClass() {
      if (this.currentWorkload > this.maxWorkload) return 'overload'
      if (this.currentWorkload === this.maxWorkload) return 'busy'
      return 'free'
    },
    
    calendarDays() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startPadding = firstDay.getDay()
      const daysInMonth = lastDay.getDate()
      const prevMonthLastDay = new Date(year, month, 0).getDate()
      
      const today = new Date()
      const days = []
      
      // 上月填充
      for (let i = startPadding - 1; i >= 0; i--) {
        days.push({
          day: prevMonthLastDay - i,
          isOtherMonth: true,
          isToday: false,
          isSelected: false,
          dateStr: '',
          workload: 0,
          statusClass: '',
          dots: []
        })
      }
      
      // 当月日期
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
        const isSelected = this.selectedDate === dateStr
        
        const dayCommissions = this.commissions.filter(c => c.date === dateStr)
        const workload = this.calculateDayWorkload(dayCommissions)
        const statusClass = this.getWorkloadStatusClass(workload)
        
        const dots = dayCommissions.slice(0, 5).map(c => {
          const style = this.styles.find(s => s.id === c.styleId)
          return { color: style ? style.color : '#ccc' }
        })
        
        days.push({
          day,
          isOtherMonth: false,
          isToday,
          isSelected,
          dateStr,
          workload,
          statusClass,
          dots
        })
      }
      
      // 下月填充
      const totalCells = startPadding + daysInMonth
      const remainingCells = (7 - (totalCells % 7)) % 7
      for (let i = 1; i <= remainingCells; i++) {
        days.push({
          day: i,
          isOtherMonth: true,
          isToday: false,
          isSelected: false,
          dateStr: '',
          workload: 0,
          statusClass: '',
          dots: []
        })
      }
      
      return days
    },
    
    statTotal() {
      return this.getMonthCommissions().length
    },
    
    statPending() {
      return this.getMonthCommissions().filter(c => c.status !== 'completed').length
    },
    
    statCompleted() {
      return this.getMonthCommissions().filter(c => c.status === 'completed').length
    }
  },
  
  mounted() {
    this.loadData()
    this.checkFirstTime()
  },
  
  methods: {
    loadData() {
      const styles = localStorage.getItem(STORAGE_KEYS.STYLES)
      const maxWorkload = localStorage.getItem(STORAGE_KEYS.MAX_WORKLOAD)
      const commissions = localStorage.getItem(STORAGE_KEYS.COMMISSIONS)
      
      this.styles = styles ? JSON.parse(styles) : [...defaultStyles]
      this.maxWorkload = maxWorkload ? parseFloat(maxWorkload) : 3
      this.commissions = commissions ? JSON.parse(commissions) : []
    },
    
    saveData() {
      localStorage.setItem(STORAGE_KEYS.STYLES, JSON.stringify(this.styles))
      localStorage.setItem(STORAGE_KEYS.MAX_WORKLOAD, this.maxWorkload)
      localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(this.commissions))
    },
    
    checkFirstTime() {
      if (!localStorage.getItem(STORAGE_KEYS.SETUP_DONE)) {
        this.showSetupModal = true
      }
    },
    
    // 日历操作
    changeMonth(delta) {
      const newDate = new Date(this.currentDate)
      newDate.setMonth(newDate.getMonth() + delta)
      this.currentDate = newDate
    },
    
    selectDate(dateStr, day) {
      this.selectedDate = dateStr
      this.newCommission = { clientName: '', styleId: '', quantity: 1, note: '' }
      this.showOverloadWarning = false
    },
    
    calculateDayWorkload(commissions) {
      return commissions.reduce((sum, c) => {
        const style = this.styles.find(s => s.id === c.styleId)
        return sum + (style ? style.days * c.quantity : 0)
      }, 0)
    },
    
    getWorkloadStatusClass(workload) {
      if (workload === 0) return ''
      if (workload > this.maxWorkload) return 'status-overload'
      if (workload === this.maxWorkload) return 'status-busy'
      return 'status-free'
    },
    
    getStyle(styleId) {
      return this.styles.find(s => s.id === styleId)
    },
    
    // 排单操作
    addCommission() {
      const style = this.styles.find(s => s.id === this.newCommission.styleId)
      const currentWorkload = this.calculateDayWorkload(this.selectedDateCommissions)
      const newWorkload = currentWorkload + (style.days * this.newCommission.quantity)
      
      if (newWorkload > this.maxWorkload) {
        if (!confirm('添加此排单将超过每日工作量限制，是否继续？')) {
          return
        }
      }
      
      const commission = {
        id: Date.now(),
        date: this.selectedDate,
        ...this.newCommission,
        status: 'pending'
      }
      
      this.commissions.push(commission)
      this.saveData()
      this.newCommission = { clientName: '', styleId: '', quantity: 1, note: '' }
      this.showOverloadWarning = false
    },
    
    deleteCommission(id) {
      if (confirm('确定删除这个排单吗？')) {
        this.commissions = this.commissions.filter(c => c.id !== id)
        this.saveData()
      }
    },
    
    toggleStatus(commission) {
      commission.status = commission.status === 'completed' ? 'pending' : 'completed'
      this.saveData()
    },
    
    checkOverload() {
      if (!this.newCommission.styleId || !this.selectedDate) {
        this.showOverloadWarning = false
        return
      }
      
      const style = this.styles.find(s => s.id === this.newCommission.styleId)
      const currentWorkload = this.calculateDayWorkload(this.selectedDateCommissions)
      const newWorkload = currentWorkload + (style.days * this.newCommission.quantity)
      
      this.showOverloadWarning = newWorkload > this.maxWorkload
    },
    
    // 画风管理
    openStyleModal() {
      this.styleForm = { id: null, name: '', days: 1, color: '#6B8E6B' }
      this.editingStyle = null
      this.showStyleModal = true
    },
    
    editStyle(style) {
      this.styleForm = { ...style }
      this.editingStyle = style
      this.showStyleModal = true
    },
    
    closeStyleModal() {
      this.showStyleModal = false
      if (!localStorage.getItem(STORAGE_KEYS.SETUP_DONE) && this.styles.length === 0) {
        alert('请至少添加一种画风类型')
        this.openStyleModal()
      } else if (!localStorage.getItem(STORAGE_KEYS.SETUP_DONE)) {
        localStorage.setItem(STORAGE_KEYS.SETUP_DONE, 'true')
      }
    },
    
    saveStyle() {
      if (this.editingStyle) {
        const index = this.styles.findIndex(s => s.id === this.styleForm.id)
        this.styles[index] = { ...this.styleForm }
      } else {
        this.styles.push({
          ...this.styleForm,
          id: Date.now()
        })
      }
      this.saveData()
      this.closeStyleModal()
    },
    
    deleteStyle(id) {
      if (confirm('确定删除这个画风吗？相关的排单数据将保留但显示为未知画风。')) {
        this.styles = this.styles.filter(s => s.id !== id)
        this.saveData()
      }
    },
    
    // 设置
    saveSetup() {
      this.maxWorkload = this.setupMaxWorkload
      this.saveData()
      this.showSetupModal = false
      this.openStyleModal()
    },
    
    updateMaxWorkload() {
      this.saveData()
    },
    
    // 统计
    getMonthCommissions() {
      const currentMonth = this.currentDate.getMonth()
      const currentYear = this.currentDate.getFullYear()
      
      return this.commissions.filter(c => {
        const date = new Date(c.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })
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

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin: 30px auto;
  max-width: 1400px;
  padding: 0 20px;
}

.stat-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  box-shadow: var(--shadow);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-light);
  margin-top: 5px;
}

/* 主容器 */
.todolist-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  max-width: 1400px;
  margin: 0 auto 60px;
  padding: 0 20px;
}

@media (max-width: 1024px) {
  .todolist-container {
    grid-template-columns: 1fr;
  }
}

/* 日历 */
.calendar-section {
  background: var(--white);
  border-radius: var(--radius);
  padding: 25px;
  box-shadow: var(--shadow);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.calendar-header h2 {
  font-size: 1.5rem;
  color: var(--text-dark);
}

.calendar-nav {
  display: flex;
  gap: 10px;
}

.calendar-nav button {
  background: var(--bg-light);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1.1rem;
  transition: var(--transition);
}

.calendar-nav button:hover {
  background: var(--primary-color);
  color: var(--white);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
  padding: 12px 0;
  font-size: 0.9rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  min-height: 80px;
  border: 2px solid transparent;
}

.calendar-day:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.calendar-day.other-month {
  color: var(--text-muted);
  background: var(--bg-light);
  opacity: 0.5;
  cursor: default;
}

.calendar-day.today {
  border-color: var(--primary-color);
  font-weight: 600;
}

.calendar-day.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.3);
}

.calendar-day.status-free {
  background: #F0FFF0;
}

.calendar-day.status-busy {
  background: #FFFACD;
}

.calendar-day.status-overload {
  background: #FFE4E1;
}

.day-number {
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.day-dots {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

.day-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.day-workload {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: auto;
}

/* 右侧面板 */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section,
.date-info,
.commission-list,
.add-commission {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.settings-section h3,
.date-info h3,
.commission-list h3,
.add-commission h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: var(--text-dark);
}

/* 设置项 */
.setting-item {
  margin-bottom: 20px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-dark);
}

.setting-item input[type="number"] {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

/* 画风列表 */
.style-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.style-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  background: var(--bg-light);
  border-radius: var(--radius-sm);
}

.style-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.style-info {
  flex: 1;
}

.style-name {
  font-weight: 500;
}

.style-days {
  font-size: 0.85rem;
  color: var(--text-light);
}

.style-actions {
  display: flex;
  gap: 5px;
}

.btn-small {
  padding: 5px 10px;
  font-size: 0.8rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.btn-edit {
  background: var(--secondary-color);
  color: var(--text-dark);
}

.btn-delete {
  background: #ffebee;
  color: #c62828;
}

.btn-add-style {
  width: 100%;
  padding: 12px;
  background: var(--bg-light);
  border: 2px dashed var(--primary-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  color: var(--primary-color);
  font-weight: 500;
}

.btn-add-style:hover {
  background: var(--secondary-color);
}

/* 工作量条 */
.workload-bar {
  display: flex;
  align-items: center;
  gap: 15px;
}

.workload-progress {
  flex: 1;
  height: 12px;
  background: var(--bg-light);
  border-radius: 6px;
  overflow: hidden;
}

.workload-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.workload-fill.free { background: #6B8E6B; }
.workload-fill.busy { background: #D4A574; }
.workload-fill.overload { background: #E57373; }

.workload-text {
  font-size: 0.95rem;
  font-weight: 500;
  min-width: 80px;
  text-align: right;
}

/* 排单项 */
.commission-item {
  background: var(--bg-light);
  border-radius: var(--radius-sm);
  padding: 15px;
  margin-bottom: 12px;
  transition: var(--transition);
}

.commission-item:hover {
  box-shadow: var(--shadow);
}

.commission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.commission-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.style-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.commission-client {
  font-weight: 600;
  color: var(--text-dark);
  margin-top: 8px;
}

.commission-meta {
  font-size: 0.85rem;
  color: var(--text-light);
  display: flex;
  gap: 15px;
}

.commission-note {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.commission-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.btn-status {
  padding: 6px 12px;
  font-size: 0.8rem;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  background: var(--secondary-color);
  color: var(--text-dark);
}

.btn-status.completed {
  background: #d4edda;
  color: #155724;
}

/* 表单 */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: var(--transition);
}

.btn-primary:hover {
  background: var(--accent-color);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-light);
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 10px;
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
}

.modal.active {
  display: flex;
}

.modal-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

/* 设置引导 */
.setup-welcome {
  text-align: center;
  padding: 20px 0;
}

.setup-welcome h2 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.setup-steps {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 30px 0;
}

.setup-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.step-text {
  font-size: 0.9rem;
  color: var(--text-light);
}

/* 提示 */
.alert {
  padding: 12px 15px;
  border-radius: var(--radius-sm);
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.alert-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

/* 响应式 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .setup-steps {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
