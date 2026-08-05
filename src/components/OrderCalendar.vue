<template>
  <!-- 我的约稿日历（仅自己可见）：蓝点=约稿日期，绿点=预计完成（约稿日期 + 画风工期）
       外观与画师空间的排单日历保持一致 -->
  <div class="calendar order-calendar" v-if="allOrders.length > 0">
    <div class="calendar-header">
      <h3>约稿日历</h3>
      <div class="calendar-nav">
        <button @click="shiftMonth(-1)">‹</button>
        <button @click="shiftMonth(1)">›</button>
      </div>
    </div>
    <div class="cal-legend">
      <span><i class="day-dot dot-start"></i>约稿日期</span>
      <span><i class="day-dot dot-due"></i>预计完成</span>
    </div>
    <div class="calendar-grid">
      <div class="calendar-weekday" v-for="day in ['日','一','二','三','四','五','六']" :key="day">{{ day }}</div>
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="calendar-day"
        :class="[
          day.isOtherMonth ? 'other-month' : '',
          day.isToday ? 'today' : ''
        ]"
        @click="!day.isOtherMonth && day.marks.length && (selectedDay = day.dateStr)"
      >
        <span class="day-number">{{ day.day }}</span>
        <div class="day-dots" v-if="day.marks.length > 0">
          <span
            v-for="(m, mi) in day.marks.slice(0, 5)"
            :key="mi"
            class="day-dot"
            :class="m === 'start' ? 'dot-start' : 'dot-due'"
          ></span>
        </div>
      </div>
    </div>
    <div v-if="selectedDayOrders.length > 0" class="cal-detail">
      <h4>{{ selectedDay }} 的委托</h4>
      <div v-for="item in selectedDayOrders" :key="item.order_no + item.kind" class="cal-detail-row">
        <i class="day-dot" :class="item.kind === 'start' ? 'dot-start' : 'dot-due'"></i>
        <span class="cal-detail-title">{{ item.title }}</span>
        <span class="cal-detail-meta">{{ item.kind === 'start' ? '约稿日期' : '预计完成' }} · {{ item.artistName }} · {{ item.statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { apiRequest } from '../utils/eventBus'

export default {
  name: 'OrderCalendar',
  setup() {
    const allOrders = ref([])
    const now = new Date()
    const calYear = ref(now.getFullYear())
    const calMonth = ref(now.getMonth() + 1)
    const selectedDay = ref('')
    const artistStyles = ref({}) // 画师 uid -> 画风列表（含工期 days）

    const fmtDate = d =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    // 每个订单生成两个日历标记：约稿日期（created_at）与预计完成（+画风工期）
    const orderMarks = computed(() => {
      const marks = []
      for (const o of allOrders.value) {
        if (!o.created_at) continue
        const created = new Date(o.created_at)
        if (isNaN(created)) continue
        marks.push({ dateStr: fmtDate(created), kind: 'start', order: o })
        const styles = artistStyles.value[o.counterparty?.uid] || []
        const style = styles.find(s => s.name === o.order_type)
        if (style?.days) {
          const due = new Date(created)
          due.setDate(due.getDate() + Number(style.days))
          marks.push({ dateStr: fmtDate(due), kind: 'due', order: o })
        }
      }
      return marks
    })

    const calendarDays = computed(() => {
      const year = calYear.value
      const month = calMonth.value
      const daysInMonth = new Date(year, month, 0).getDate()
      const startPadding = new Date(year, month - 1, 1).getDay()
      const todayStr = fmtDate(new Date())
      const cells = []
      // 上月填充（与排单日历一样显示为淡色占位）
      const prevMonthDays = new Date(year, month - 1, 0).getDate()
      for (let i = startPadding - 1; i >= 0; i--) {
        cells.push({ day: prevMonthDays - i, dateStr: '', isOtherMonth: true, marks: [] })
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = fmtDate(new Date(year, month - 1, d))
        cells.push({
          day: d,
          dateStr,
          isOtherMonth: false,
          isToday: dateStr === todayStr,
          marks: orderMarks.value.filter(m => m.dateStr === dateStr).map(m => m.kind)
        })
      }
      // 下月填充
      const totalCells = startPadding + daysInMonth
      const remainingCells = (7 - (totalCells % 7)) % 7
      for (let i = 1; i <= remainingCells; i++) {
        cells.push({ day: i, dateStr: '', isOtherMonth: true, marks: [] })
      }
      return cells
    })

    const selectedDayOrders = computed(() => {
      if (!selectedDay.value) return []
      return orderMarks.value
        .filter(m => m.dateStr === selectedDay.value)
        .map(m => ({
          kind: m.kind,
          order_no: m.order.order_no,
          title: m.order.title,
          statusText: m.order.status_text,
          artistName: m.order.counterparty?.nickname || '画师'
        }))
    })

    const shiftMonth = delta => {
      let m = calMonth.value + delta
      let y = calYear.value
      if (m < 1) { m = 12; y -= 1 }
      if (m > 12) { m = 1; y += 1 }
      calYear.value = y
      calMonth.value = m
    }

    // 获取我的订单与各画师的画风（用于估算工期）
    const fetchOrders = async () => {
      try {
        const data = await apiRequest('/api/v1/me/orders?page_size=50', { showError: false })
        allOrders.value = data?.orders || []
        const uids = [...new Set(allOrders.value.map(o => o.counterparty?.uid).filter(Boolean))]
        await Promise.all(uids.map(async uid => {
          try {
            const res = await apiRequest(`/api/v1/space/${uid}/styles`, { showError: false, unwrap: false })
            const list = res?.data?.list || res?.data || []
            artistStyles.value = { ...artistStyles.value, [uid]: Array.isArray(list) ? list : [] }
          } catch { /* 该画师画风获取失败则只标约稿日期 */ }
        }))
      } catch (error) {
        console.error('获取订单失败:', error)
      }
    }

    onMounted(fetchOrders)

    return { allOrders, calYear, calMonth, calendarDays, selectedDay, selectedDayOrders, shiftMonth }
  }
}
</script>

<style scoped>
/* 与 SpaceHome 排单日历同款外观 */
.calendar {
  background: var(--bg-light);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-header h3 {
  font-size: 1.2rem;
  color: var(--text-dark);
}

.calendar-nav {
  display: flex;
  gap: 10px;
}

.calendar-nav button {
  background: var(--white);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.calendar-nav button:hover {
  background: var(--primary-color);
  color: var(--white);
}

.cal-legend {
  display: flex;
  gap: 24px;
  margin: 0 0 16px;
  color: var(--text-light);
  font-size: 0.85rem;
}

.cal-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  color: var(--text-muted);
  padding: 10px 0;
  font-size: 0.85rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 8px;
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  font-size: 0.9rem;
  min-height: 60px;
}

.calendar-day:hover {
  background: var(--secondary-color);
}

.calendar-day.other-month {
  color: var(--text-muted);
  background: transparent;
  cursor: default;
}

.calendar-day.today {
  background: var(--primary-color) !important;
  color: var(--white);
}

.day-number {
  font-size: 0.95rem;
  font-weight: 500;
  z-index: 2;
  position: relative;
}

.calendar-day.today .day-number {
  color: var(--white);
  font-weight: 700;
}

.day-dots {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 2px;
  z-index: 1;
  position: relative;
}

.day-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.95), 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 当日日期的圆点缩小（与排单日历一致） */
.calendar-day.today .day-dot {
  width: 4px;
  height: 4px;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(0, 0, 0, 0.2);
}

.dot-start {
  background: var(--primary-color);
}

.dot-due {
  background: #22C55E;
}

.cal-detail {
  margin-top: 20px;
}

.cal-detail h4 {
  margin-bottom: 12px;
  font-size: 1rem;
  color: var(--text-dark);
}

.cal-detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.cal-detail-title {
  font-weight: 600;
}

.cal-detail-meta {
  color: var(--text-light);
  font-size: 0.85rem;
}
</style>
