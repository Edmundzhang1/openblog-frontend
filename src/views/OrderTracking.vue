<template>
  <div class="order-tracking">
    <header class="page-header">
      <div class="container">
        <h1>{{ content.title }}</h1>
        <p>{{ content.subtitle }}</p>
      </div>
    </header>

    <section class="tracking-section">
      <div class="container">
        <!-- 查询表单 -->
        <div class="query-form">
          <div class="input-group">
            <input 
              v-model="orderNumber" 
              type="text" 
              :placeholder="content.orderNumber"
              @keypress.enter="queryOrder"
            >
            <button class="btn btn-primary" @click="queryOrder" :disabled="loading">
              {{ loading ? content.loading : content.query }}
            </button>
          </div>
          <p class="hint">{{ content.guestHint }}</p>
        </div>

        <!-- 查询结果 -->
        <div v-if="order" class="order-result">
          <div class="order-card">
            <div class="order-header">
              <div class="order-number">
                <span class="label">{{ content.orderNumber }}</span>
                <span class="value">{{ order.id }}</span>
              </div>
              <div class="order-status" :class="order.status">
                {{ formatStatus(order.status) }}
              </div>
            </div>

            <div class="order-info">
              <div class="info-row">
                <span class="label">{{ content.createdAt }}</span>
                <span class="value">{{ formatDate(order.created_at) }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ content.style }}</span>
                <span class="value">{{ formatStyle(order.style) }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ content.clientName }}</span>
                <span class="value">{{ order.client_name }}</span>
              </div>
              <div class="info-row" v-if="order.budget">
                <span class="label">{{ content.budget }}</span>
                <span class="value">{{ order.budget }}</span>
              </div>
            </div>

            <!-- 进度时间线 -->
            <div class="timeline-section">
              <h3>{{ content.timeline }}</h3>
              <div class="timeline">
                <div 
                  v-for="(step, index) in timelineSteps" 
                  :key="index"
                  class="timeline-item"
                  :class="{ completed: isStepCompleted(step.status), current: order.status === step.status }"
                >
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-title">{{ step.label }}</div>
                    <div v-if="getStepTime(step.status)" class="timeline-time">
                      {{ formatDate(getStepTime(step.status)) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 支付状态 -->
            <div v-if="order.payment" class="payment-section">
              <h3>{{ content.paymentTitle }}</h3>
              <div class="payment-info">
                <div class="info-row">
                  <span class="label">{{ content.paymentMode }}</span>
                  <span class="value">{{ formatPaymentMode(order.payment.mode) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ content.paymentStatus }}</span>
                  <span class="value" :class="order.payment.status">
                    {{ formatPaymentStatus(order.payment.status) }}
                  </span>
                </div>
                <div class="info-row">
                  <span class="label">{{ content.paidAmount }}</span>
                  <span class="value">¥{{ order.payment.paid_amount || 0 }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ content.unpaidAmount }}</span>
                  <span class="value">¥{{ order.payment.unpaid_amount || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="order-actions">
              <router-link 
                v-if="order.status !== 'cancelled' && order.status !== 'completed'" 
                :to="`/chat?order=${order.id}`" 
                class="btn btn-primary"
              >
                {{ content.contactArtist }}
              </router-link>
              <button class="btn btn-secondary" @click="copyOrderNumber">
                {{ content.copyOrderNumber }}
              </button>
            </div>
          </div>
        </div>

        <!-- 未找到订单 -->
        <div v-else-if="searched" class="no-result">
          <div class="empty-icon">🔍</div>
          <p>{{ content.noOrder }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { showToast } from '../utils/eventBus'
import { inject } from 'vue'

const ORDER_CONTENT = {
  zh: {
    title: '订单查询',
    subtitle: '输入订单号查看委托进度',
    orderNumber: '订单号',
    query: '查询',
    loading: '加载中...',
    guestHint: '游客无需登录，输入订单号即可查询委托进度',
    createdAt: '创建时间',
    style: '画风类型',
    clientName: '委托人昵称',
    budget: '预算范围',
    timeline: '进度时间线',
    paymentTitle: '支付记录',
    paymentMode: '支付方式',
    paymentStatus: '支付状态',
    paidAmount: '已付金额',
    unpaidAmount: '待付金额',
    contactArtist: '联系画师',
    copyOrderNumber: '复制订单号',
    noOrder: '未找到该订单',
    orderRequired: '请输入订单号',
    orderCopied: '订单号已复制',
    demoClientName: '测试用户',
    timelineSteps: [
      { status: 'submitted', label: '委托已提交' },
      { status: 'quoted', label: '已报价' },
      { status: 'confirmed', label: '已确认' },
      { status: 'in_progress', label: '绘制中' },
      { status: 'draft_delivered', label: '草稿已交付' },
      { status: 'final_delivered', label: '成稿已交付' },
      { status: 'completed', label: '已完成' }
    ],
    statusMap: {
      submitted: '已提交',
      quoted: '已报价',
      confirmed: '已确认',
      in_progress: '绘制中',
      draft_delivered: '草稿已交付',
      final_delivered: '成稿已交付',
      completed: '已完成',
      cancelled: '已取消'
    },
    styleMap: {
      avatar: '头像',
      character: '立绘',
      illustration: '插图',
      concept: '设定图'
    },
    paymentModeMap: {
      prepaid: '先付',
      postpaid: '后付',
      staged: '分期'
    },
    paymentStatusMap: {
      unpaid: '未支付',
      partial: '部分支付',
      paid: '已付清'
    }
  },
  en: {
    title: 'Order Tracking',
    subtitle: 'Enter order number to check status',
    orderNumber: 'Order Number',
    query: 'Search',
    loading: 'Loading...',
    guestHint: 'Guest users can check commission progress directly with an order number.',
    createdAt: 'Created At',
    style: 'Style',
    clientName: 'Client Name',
    budget: 'Budget',
    timeline: 'Timeline',
    paymentTitle: 'Payment Records',
    paymentMode: 'Payment Mode',
    paymentStatus: 'Payment Status',
    paidAmount: 'Paid Amount',
    unpaidAmount: 'Unpaid Amount',
    contactArtist: 'Contact Artist',
    copyOrderNumber: 'Copy Order Number',
    noOrder: 'Order not found',
    orderRequired: 'Please enter an order number.',
    orderCopied: 'Order number copied.',
    demoClientName: 'Demo User',
    timelineSteps: [
      { status: 'submitted', label: 'Submitted' },
      { status: 'quoted', label: 'Quoted' },
      { status: 'confirmed', label: 'Confirmed' },
      { status: 'in_progress', label: 'In Progress' },
      { status: 'draft_delivered', label: 'Draft Delivered' },
      { status: 'final_delivered', label: 'Final Delivered' },
      { status: 'completed', label: 'Completed' }
    ],
    statusMap: {
      submitted: 'Submitted',
      quoted: 'Quoted',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      draft_delivered: 'Draft Delivered',
      final_delivered: 'Final Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    },
    styleMap: {
      avatar: 'Avatar',
      character: 'Character',
      illustration: 'Illustration',
      concept: 'Concept'
    },
    paymentModeMap: {
      prepaid: 'Prepaid',
      postpaid: 'Postpaid',
      staged: 'Staged'
    },
    paymentStatusMap: {
      unpaid: 'Unpaid',
      partial: 'Partial',
      paid: 'Paid'
    }
  }
}

export default {
  name: 'OrderTracking',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      orderNumber: '',
      order: null,
      loading: false,
      searched: false
    }
  },
  computed: {
    locale() {
      return this.i18n.getLocale()
    },
    content() {
      return ORDER_CONTENT[this.locale]
    },
    timelineSteps() {
      return this.content.timelineSteps
    }
  },
  methods: {
    async queryOrder() {
      if (!this.orderNumber.trim()) {
        showToast(this.content.orderRequired, 'error')
        return
      }

      this.loading = true
      this.searched = false

      try {
        const response = await fetch(`/api/v1/orders/${this.orderNumber.trim()}`)
        
        if (response.ok) {
          this.order = await response.json()
        } else {
          this.order = null
        }
      } catch (error) {
        if (this.orderNumber.trim() === 'DEMO123') {
          this.order = {
            id: 'DEMO123',
            status: 'in_progress',
            created_at: new Date().toISOString(),
            style: 'character',
            client_name: this.content.demoClientName,
            budget: '¥300-500',
            payment: {
              mode: 'prepaid',
              status: 'partial',
              paid_amount: 200,
              unpaid_amount: 300
            },
            timeline: [
              { status: 'submitted', time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'quoted', time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'confirmed', time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { status: 'in_progress', time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
            ]
          }
        } else {
          this.order = null
        }
      } finally {
        this.loading = false
        this.searched = true
      }
    },
    formatStatus(status) {
      return this.content.statusMap[status] || status
    },
    formatStyle(style) {
      return this.content.styleMap[style] || style
    },
    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d)
    },
    formatPaymentMode(mode) {
      return this.content.paymentModeMap[mode] || mode
    },
    formatPaymentStatus(status) {
      return this.content.paymentStatusMap[status] || status
    },
    isStepCompleted(stepStatus) {
      const statusOrder = ['submitted', 'quoted', 'confirmed', 'in_progress', 'draft_delivered', 'final_delivered', 'completed']
      const currentIndex = statusOrder.indexOf(this.order?.status)
      const stepIndex = statusOrder.indexOf(stepStatus)
      return stepIndex <= currentIndex
    },
    getStepTime(stepStatus) {
      if (!this.order?.timeline) return null
      const event = this.order.timeline.find(t => t.status === stepStatus)
      return event?.time
    },
    copyOrderNumber() {
      if (this.order) {
        navigator.clipboard.writeText(this.order.id)
        showToast(this.content.orderCopied, 'success')
      }
    }
  }
}
</script>

<style scoped>
.tracking-section {
  padding: 60px 0;
}

.query-form {
  max-width: 600px;
  margin: 0 auto 40px;
  text-align: center;
}

.input-group {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.input-group input {
  flex: 1;
  padding: 15px 20px;
  border: 2px solid #ddd;
  border-radius: var(--radius);
  font-size: 1.1rem;
  text-align: center;
  letter-spacing: 2px;
}

.input-group input:focus {
  border-color: var(--primary-color);
  outline: none;
}

.hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.order-result {
  max-width: 800px;
  margin: 0 auto;
}

.order-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 40px;
  box-shadow: var(--shadow);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--bg-light);
}

.order-number .label {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-right: 10px;
}

.order-number .value {
  font-size: 1.5rem;
  font-weight: bold;
  font-family: monospace;
  letter-spacing: 2px;
}

.order-status {
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
}

.order-status.submitted {
  background: #e3f2fd;
  color: #1976d2;
}

.order-status.in_progress {
  background: #fff3e0;
  color: #f57c00;
}

.order-status.completed {
  background: #e8f5e9;
  color: #388e3c;
}

.order-status.cancelled {
  background: #ffebee;
  color: #d32f2f;
}

.order-info {
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--bg-light);
}

.info-row .label {
  color: var(--text-muted);
}

.info-row .value {
  font-weight: 500;
}

.timeline-section, .payment-section {
  margin-bottom: 30px;
}

.timeline-section h3, .payment-section h3 {
  margin-bottom: 20px;
  color: var(--text-dark);
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: #ddd;
}

.timeline-item {
  position: relative;
  padding: 15px 0;
  opacity: 0.5;
}

.timeline-item.completed {
  opacity: 1;
}

.timeline-item.current {
  font-weight: 600;
}

.timeline-dot {
  position: absolute;
  left: -26px;
  top: 18px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ddd;
  border: 3px solid var(--white);
  box-shadow: 0 0 0 2px #ddd;
}

.timeline-item.completed .timeline-dot {
  background: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.timeline-item.current .timeline-dot {
  background: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.timeline-time {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 5px;
}

.order-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 20px;
  border-top: 2px solid var(--bg-light);
}

.no-result {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-result p {
  color: var(--text-muted);
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }
  
  .order-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .order-actions {
    flex-direction: column;
  }
}
</style>
