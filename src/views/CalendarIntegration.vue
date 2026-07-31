<template>
  <div class="calendar-page">
    <!-- 页面标题 -->
    <header class="page-header">
      <div class="container">
        <h1>📅 我的排期日历</h1>
        <p>管理您的稿期安排和重要事项</p>
      </div>
    </header>

    <div class="container">
      <div class="calendar-layout">
        <!-- 左侧：日历 -->
        <div class="calendar-section">
          <!-- 月份切换 -->
          <div class="calendar-header">
            <h2>{{ currentYear }}年 {{ currentMonth }}月</h2>
            <div class="calendar-nav">
              <el-button @click="changeMonth(-1)">‹ 上月</el-button>
              <el-button @click="goToToday">今天</el-button>
              <el-button @click="changeMonth(1)">下月 ›</el-button>
            </div>
          </div>

          <!-- 星期标题 -->
          <div class="calendar-weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
          </div>

          <!-- 日期格子 -->
          <div class="calendar-grid">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-day"
              :class="{
                'other-month': day.isOtherMonth,
                'is-today': day.isToday,
                'is-selected': day.isSelected,
                [day.statusClass]: true
              }"
              @click="onDayClick(day)"
            >
              <div class="day-header">
                <span class="day-number">{{ day.day }}</span>
                <span v-if="day.schedules.length > 0" class="event-count">
                  {{ day.schedules.length }}
                </span>
              </div>
              
              <!-- 事件标记点 -->
              <div class="event-dots">
                <span
                  v-for="(event, idx) in day.schedules.slice(0, 4)"
                  :key="idx"
                  class="event-dot"
                  :style="{ background: event.color }"
                  :title="event.title"
                />
              </div>
            </div>
          </div>

          <!-- 图例 -->
          <div class="calendar-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background: #6B8E6B"></span>
              <span>普通标记</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #FFB6C1"></span>
              <span>接稿单</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background: #999999"></span>
              <span>请假休息</span>
            </div>
          </div>
        </div>

        <!-- 右侧：事件详情/新增 -->
        <div class="side-panel">
          <!-- 选中日期的事件列表 -->
          <div class="panel-card" v-if="selectedDate">
            <h3>{{ selectedDateDisplay }} 的排期</h3>
            
            <div v-if="selectedDateSchedules.length === 0" class="empty-state">
              <p>暂无排期</p>
              <el-button type="primary" @click="showAddDialog = true">
                + 添加标记
              </el-button>
            </div>
            
            <div v-else class="event-list">
              <div
                v-for="event in selectedDateSchedules"
                :key="event.id"
                class="event-item"
                :style="{ borderLeftColor: event.color }"
              >
                <div class="event-title">{{ event.title }}</div>
                <div class="event-content" v-if="event.content">{{ event.content }}</div>
                <div class="event-type">
                  <el-tag size="small" :style="{ background: event.color + '20', color: event.color, borderColor: event.color }">
                    {{ getTypeLabel(event.type) }}
                  </el-tag>
                </div>
              </div>
              
              <el-button type="primary" @click="showAddDialog = true" class="add-more-btn">
                + 添加更多
              </el-button>
            </div>
          </div>

          <!-- 未选中日期时的提示 -->
          <div class="panel-card" v-else>
            <div class="empty-state">
              <p>点击日历日期查看或添加排期</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增事件弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加排期"
      width="500px"
    >
      <el-form :model="newEventForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="newEventForm.title" placeholder="例如：Q版头像稿" />
        </el-form-item>
        
        <el-form-item label="类型">
          <el-radio-group v-model="newEventForm.type">
            <el-radio-button :label="1">普通标记</el-radio-button>
            <el-radio-button :label="2">接稿单</el-radio-button>
            <el-radio-button :label="3">请假休息</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="日期">
          <el-date-picker
            v-model="newEventForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="newEventForm.content"
            type="textarea"
            rows="3"
            placeholder="添加详细说明..."
          />
        </el-form-item>
        
        <el-form-item label="颜色">
          <el-color-picker v-model="newEventForm.color" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddEvent" :loading="loading">
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getSchedulesAPI, createScheduleAPI } from '@/api/calendar.js'
import { ElMessage } from 'element-plus'

// ==================== 事件类型枚举与配置（原 calendar store） ====================
const ScheduleType = {
  NORMAL: 1,     // 普通标记
  COMMISSION: 2, // 接稿单
  LEAVE: 3       // 请假休息
}

const ScheduleTypeConfig = {
  [ScheduleType.NORMAL]: {
    label: '普通标记',
    color: '#6B8E6B',
    bgColor: 'rgba(107, 142, 107, 0.1)'
  },
  [ScheduleType.COMMISSION]: {
    label: '接稿单',
    color: '#FFB6C1',
    bgColor: 'rgba(255, 182, 193, 0.1)'
  },
  [ScheduleType.LEAVE]: {
    label: '请假休息',
    color: '#999999',
    bgColor: 'rgba(153, 153, 153, 0.1)'
  }
}

// ==================== 日历状态（原 calendar store，内联为组件内状态） ====================
const schedules = ref([])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const loading = ref(false)
const error = ref(null)

// 按日期分组的事件映射：{ '2024-03-15': [event1, event2], ... }
const schedulesByDate = computed(() => {
  const map = {}
  schedules.value.forEach(schedule => {
    const dateKey = formatDateKey(new Date(schedule.start_time))
    if (!map[dateKey]) {
      map[dateKey] = []
    }
    map[dateKey].push(schedule)
  })
  return map
})

function getSchedulesByDate(dateStr) {
  return schedulesByDate.value[dateStr] || []
}

// 格式化日期为 YYYY-MM-DD
function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 从后端获取某月的所有事件列表
async function fetchSchedules(year, month) {
  loading.value = true
  error.value = null

  try {
    currentYear.value = year
    currentMonth.value = month

    const res = await getSchedulesAPI(year, month)
    schedules.value = res.data?.list || []

    return { success: true, data: schedules.value }
  } catch (err) {
    error.value = err.message || '获取数据失败'
    console.error('[Calendar] 获取排期失败:', err)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

// 新增日历事件（后端落库后乐观更新本地 state）
async function addSchedule(eventData) {
  loading.value = true

  try {
    const payload = {
      ...eventData,
      type: eventData.type || ScheduleType.NORMAL,
      color: eventData.color || ScheduleTypeConfig[ScheduleType.NORMAL].color,
      is_all_day: eventData.is_all_day !== false
    }

    const res = await createScheduleAPI(payload)
    const savedEvent = res.data
    if (savedEvent) {
      schedules.value.push(savedEvent)
    }

    return { success: true, data: savedEvent }
  } catch (err) {
    error.value = err.message || '创建失败'
    console.error('[Calendar] 创建事件失败:', err)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

// ==================== 响应式数据 ====================
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const selectedDate = ref(null)
const showAddDialog = ref(false)

// 新增事件表单
const newEventForm = ref({
  title: '',
  type: ScheduleType.NORMAL,
  date: new Date(),
  content: '',
  color: ScheduleTypeConfig[ScheduleType.NORMAL].color
})

// 监听类型变化自动更新颜色
watch(() => newEventForm.value.type, (newType) => {
  newEventForm.value.color = ScheduleTypeConfig[newType].color
})

// ==================== 计算属性 ====================

// 选中日期的显示文本
const selectedDateDisplay = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

// 选中日期的事件列表
const selectedDateSchedules = computed(() => {
  if (!selectedDate.value) return []
  return getSchedulesByDate(selectedDate.value)
})

// 日历格子数据
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const days = []
  
  // 上月填充
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      isOtherMonth: true,
      isToday: false,
      isSelected: false,
      dateStr: '',
      schedules: []
    })
  }
  
  // 当月日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const isSelected = selectedDate.value === dateStr
    const schedules = getSchedulesByDate(dateStr)
    
    days.push({
      day,
      isOtherMonth: false,
      isToday,
      isSelected,
      dateStr,
      schedules
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
      schedules: []
    })
  }
  
  return days
})

// ==================== 方法 ====================

/**
 * 初始化加载数据
 */
onMounted(async () => {
  await loadMonthData()
})

/**
 * 加载当月数据
 */
async function loadMonthData() {
  const result = await fetchSchedules(currentYear.value, currentMonth.value)
  if (!result.success) {
    ElMessage.error(result.error || '加载数据失败')
  }
}

/**
 * 切换月份
 */
async function changeMonth(delta) {
  let newMonth = currentMonth.value + delta
  let newYear = currentYear.value
  
  if (newMonth > 12) {
    newMonth = 1
    newYear++
  } else if (newMonth < 1) {
    newMonth = 12
    newYear--
  }
  
  await fetchSchedules(newYear, newMonth)
}

/**
 * 回到今天
 */
async function goToToday() {
  const now = new Date()
  selectedDate.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  await fetchSchedules(now.getFullYear(), now.getMonth() + 1)
}

/**
 * 点击日期格子
 */
function onDayClick(day) {
  if (day.isOtherMonth) return
  
  selectedDate.value = day.dateStr
  
  // 如果有事件，可以展开详情；如果没有，可以直接打开新增弹窗
  if (day.schedules.length === 0) {
    newEventForm.value.date = new Date(day.dateStr)
    // showAddDialog.value = true  // 可选：自动打开新增
  }
}

/**
 * 添加新事件
 */
async function handleAddEvent() {
  console.log('🔥 按钮被点击了')
  
  if (!newEventForm.value.title.trim()) {
    ElMessage.warning('请输入标题')
    console.log('❌ 表单校验失败：标题为空')
    return
  }
  
  console.log('✅ 表单校验通过，准备发送请求')
  
  const eventData = {
    title: newEventForm.value.title,
    content: newEventForm.value.content,
    start_time: newEventForm.value.date.toISOString(),
    type: newEventForm.value.type,
    color: newEventForm.value.color,
    is_all_day: true
  }
  
  console.log('📤 调用 addSchedule:', eventData)
  const result = await addSchedule(eventData)
  console.log('📥 请求结果:', result)
  
  if (result.success) {
    ElMessage.success('添加成功')
    showAddDialog.value = false
    
    // 重置表单
    newEventForm.value = {
      title: '',
      type: ScheduleType.NORMAL,
      date: new Date(),
      content: '',
      color: ScheduleTypeConfig[ScheduleType.NORMAL].color
    }
  } else {
    ElMessage.error(result.error || '添加失败')
  }
}

/**
 * 获取类型标签
 */
function getTypeLabel(type) {
  return ScheduleTypeConfig[type]?.label || '未知'
}
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 0;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 10px;
  font-size: 2rem;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.calendar-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
}

@media (max-width: 968px) {
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}

/* 日历区域 */
.calendar-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.calendar-nav {
  display: flex;
  gap: 8px;
}

/* 星期标题 */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  color: #666;
  padding: 8px;
}

/* 日历格子 */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.calendar-day.other-month {
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: default;
}

.calendar-day.is-today {
  background: #ecf5ff;
  border-color: #409eff;
}

.calendar-day.is-today .day-number {
  color: #409eff;
  font-weight: bold;
}

.calendar-day.is-selected {
  background: #409eff;
  color: white;
}

.calendar-day.is-selected .day-number {
  color: white;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.day-number {
  font-size: 14px;
}

.event-count {
  font-size: 12px;
  background: #f56c6c;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-dots {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: auto;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* 图例 */
.calendar-legend {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 侧边栏 */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.panel-card h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

/* 事件列表 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid;
}

.event-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.event-content {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.event-type {
  display: flex;
}

.add-more-btn {
  margin-top: 8px;
  width: 100%;
}
</style>
