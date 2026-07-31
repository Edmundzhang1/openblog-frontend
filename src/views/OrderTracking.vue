<template>
  <main class="orders-page fade-in">
    <header class="page-header">
      <div class="container">
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.subtitle }}</p>
      </div>
    </header>

    <section class="orders-section">
      <div class="container orders-layout" :class="{ 'with-list': currentUser }">
        <aside v-if="currentUser" class="my-orders-panel">
          <div class="panel-heading">
            <div>
              <h2>{{ copy.myOrders }}</h2>
              <p>{{ copy.myOrdersHint }}</p>
            </div>
              <button type="button" class="icon-button" :title="copy.refresh" :disabled="loadingList" @click="loadMyOrders">
                <RefreshCw :size="16" :class="{ spinning: loadingList }" aria-hidden="true" />
              </button>
          </div>

          <div v-if="loadingList" class="panel-state">{{ copy.loading }}</div>
          <div v-else-if="listError" class="panel-state error-state">
            <p>{{ listError }}</p>
            <button type="button" class="text-button" @click="loadMyOrders">{{ copy.retry }}</button>
          </div>
          <div v-else-if="myOrders.length" class="my-orders-list">
            <button
              v-for="item in myOrders"
              :key="item.order_id"
              type="button"
              class="my-order-item"
              :class="{ active: order?.order_no === item.order_no }"
              @click="selectOrder(item.order_no)"
            >
              <span class="my-order-main">
                <strong>{{ item.title }}</strong>
                <small>{{ item.order_no }}</small>
                <small>{{ item.counterparty?.nickname || copy.unknownUser }} · {{ formatOrderType(item.order_type) }}</small>
              </span>
              <span class="my-order-side">
                <span class="mini-status" :class="statusClass(item.status)">{{ formatStatus(item.status) }}</span>
                <small>{{ formatDate(item.created_at, false) }}</small>
              </span>
            </button>
          </div>
          <div v-else class="panel-state">{{ copy.emptyOrders }}</div>
        </aside>

        <div class="tracking-column">
          <section class="query-panel">
            <label for="order-number">{{ copy.orderNumber }}</label>
            <div class="query-row">
              <input
                id="order-number"
                v-model.trim="orderNumber"
                type="text"
                maxlength="18"
                autocomplete="off"
                :placeholder="copy.orderPlaceholder"
                @keyup.enter="queryOrder"
              >
              <button type="button" class="btn btn-primary" :disabled="loadingDetail" @click="queryOrder">
                {{ loadingDetail ? copy.loading : copy.query }}
              </button>
            </div>
            <p>{{ currentUser ? copy.memberHint : copy.guestHint }}</p>
          </section>

          <section v-if="order" class="order-detail-panel">
            <header class="order-heading">
              <div>
                <span class="eyebrow">{{ order.order_no }}</span>
                <h2>{{ order.title || copy.publicProgress }}</h2>
                <p>{{ order.order_type ? `${formatOrderType(order.order_type)} · ` : '' }}{{ formatDate(order.created_at) }}</p>
              </div>
              <span class="order-status" :class="statusClass(order.status)">{{ order.status_text || formatStatus(order.status) }}</span>
            </header>

            <div v-if="hasFullDetail" class="summary-grid">
              <div>
                <span>{{ copy.client }}</span>
                <strong>{{ order.client?.nickname || '-' }}</strong>
              </div>
              <div>
                <span>{{ copy.artist }}</span>
                <strong>{{ order.artist?.nickname || '-' }}</strong>
              </div>
              <div>
                <span>{{ copy.price }}</span>
                <strong>{{ formatMoney(order.final_price || order.quoted_price) }}</strong>
              </div>
              <div>
                <span>{{ copy.paymentStatus }}</span>
                <strong>{{ formatPaymentStatus(order.payment_status) }}</strong>
              </div>
            </div>

            <div v-if="hasFullDetail" class="description-block">
              <h3>{{ copy.requirements }}</h3>
              <p>{{ order.description }}</p>
            </div>

            <div class="timeline-block">
              <h3>{{ copy.timeline }}</h3>
              <ol class="timeline">
                <li
                  v-for="step in timelineSteps"
                  :key="step.status"
                  :class="{ completed: isStepCompleted(step), current: order.status === step.status }"
                >
                  <span class="timeline-dot"></span>
                  <div>
                    <strong>{{ step.label }}</strong>
                    <time v-if="getStepTime(step)">{{ formatDate(getStepTime(step)) }}</time>
                  </div>
                </li>
              </ol>
            </div>

            <div v-if="hasFullDetail" class="payment-block">
              <h3>{{ copy.paymentTitle }}</h3>
              <div class="payment-grid">
                <div><span>{{ copy.paymentMode }}</span><strong>{{ formatPaymentMode(order.payment_mode) }}</strong></div>
                <div v-if="order.quoted_price"><span>{{ copy.quotedAmount }}</span><strong>{{ formatMoney(order.quoted_price) }}</strong></div>
                <div><span>{{ copy.totalAmount }}</span><strong>{{ formatMoney(totalAmount) }}</strong></div>
                <div><span>{{ copy.paidAmount }}</span><strong>{{ formatMoney(order.paid_amount) }}</strong></div>
                <div><span>{{ copy.unpaidAmount }}</span><strong>{{ formatMoney(unpaidAmount) }}</strong></div>
              </div>
            </div>

            <section v-if="hasFullDetail" class="workflow-block">
              <div class="section-heading-row">
                <div>
                  <h3>{{ copy.workflowTitle }}</h3>
                  <p>{{ copy.workflowHint }}</p>
                </div>
              </div>

              <div v-if="canQuote" class="inline-form quote-form">
                <label for="quote-amount">{{ copy.quoteAmount }}</label>
                <div class="inline-form-row">
                  <input id="quote-amount" v-model="quoteInput" type="number" min="0.01" step="0.01" :placeholder="copy.amountPlaceholder">
                  <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="submitQuote">
                    <Send :size="16" aria-hidden="true" />{{ copy.submitQuote }}
                  </button>
                </div>
              </div>

              <div v-if="canConfirm" class="action-row">
                <span>{{ copy.quoteReady.replace('{amount}', formatMoney(order.quoted_price)) }}</span>
                <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="confirmQuote">
                  <Check :size="16" aria-hidden="true" />{{ copy.confirmQuote }}
                </button>
              </div>

              <div v-if="canStart" class="action-row">
                <span>{{ copy.confirmedHint }}</span>
                <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="startWork">
                  <Play :size="16" aria-hidden="true" />{{ copy.startWork }}
                </button>
              </div>

              <div v-if="canRecordPayment" class="payment-form">
                <h4>{{ copy.recordPayment }}</h4>
                <div class="payment-input-grid">
                  <label>
                    {{ copy.paymentAmount }}
                    <input v-model="paymentAmountInput" type="number" min="0.01" step="0.01" :placeholder="formatMoney(unpaidAmount)">
                  </label>
                  <label>
                    {{ copy.paymentMethod }}
                    <input v-model.trim="paymentMethodInput" maxlength="50" :placeholder="copy.paymentMethodPlaceholder">
                  </label>
                  <label>
                    {{ copy.transactionId }}
                    <input v-model.trim="transactionInput" maxlength="100" :placeholder="copy.transactionPlaceholder">
                  </label>
                  <button type="button" class="btn btn-primary" :disabled="actionLoading" @click="recordPayment">
                    <CircleDollarSign :size="16" aria-hidden="true" />{{ copy.savePayment }}
                  </button>
                </div>
              </div>

              <div v-if="canCancel" class="action-row cancel-row">
                <span>{{ copy.cancelHint }}</span>
                <button type="button" class="btn btn-outline danger-button" :disabled="actionLoading" @click="cancelOrder">
                  <X :size="16" aria-hidden="true" />{{ copy.cancelOrder }}
                </button>
              </div>
            </section>

            <section v-if="hasFullDetail" class="deliverables-block">
              <div class="section-heading-row">
                <div>
                  <h3>{{ copy.deliverablesTitle }}</h3>
                  <p>{{ copy.deliverablesHint }}</p>
                </div>
                <button type="button" class="icon-button" :title="copy.refreshDeliverables" :disabled="loadingDeliverables" @click="loadDeliverables">
                  <RefreshCw :size="16" :class="{ spinning: loadingDeliverables }" aria-hidden="true" />
                </button>
              </div>

              <div v-if="loadingDeliverables" class="inline-state">{{ copy.loading }}</div>
              <div v-else-if="deliverableError" class="inline-state error-state">
                <p>{{ deliverableError }}</p>
                <button type="button" class="text-button" @click="loadDeliverables">{{ copy.retry }}</button>
              </div>
              <div v-else-if="deliverables.length" class="deliverable-list">
                <article v-for="item in deliverables" :key="item.id" class="deliverable-item">
                  <img
                    v-if="item.watermark_url"
                    class="deliverable-preview"
                    :src="getAssetUrl(item.watermark_url)"
                    :alt="formatStage(item.stage)"
                    @click="openPreview(item.watermark_url)"
                  >
                  <div class="deliverable-info">
                    <div class="deliverable-title-row">
                      <strong>{{ formatStage(item.stage) }}</strong>
                      <span class="mini-status" :class="deliverableStatusClass(item.status)">{{ formatDeliverableStatus(item.status) }}</span>
                    </div>
                    <small>{{ formatDate(item.created_at) }}</small>
                    <div class="deliverable-actions">
                      <button v-if="item.original_url" type="button" class="text-button action-button" @click="downloadOriginal(item)">
                        <Download :size="15" aria-hidden="true" />{{ copy.downloadOriginal }}
                      </button>
                      <button v-if="item.watermark_url" type="button" class="text-button action-button" @click="openPreview(item.watermark_url)">
                        <Eye :size="15" aria-hidden="true" />{{ copy.preview }}
                      </button>
                      <template v-if="canReviewDeliverable(item)">
                        <button type="button" class="text-button action-button success-text" :disabled="deliverableActionId === item.id" @click="reviewDeliverable(item, 'ACCEPTED')">
                          <Check :size="15" aria-hidden="true" />{{ copy.acceptDeliverable }}
                        </button>
                        <button type="button" class="text-button action-button danger-text" :disabled="deliverableActionId === item.id" @click="reviewDeliverable(item, 'REJECTED')">
                          <X :size="15" aria-hidden="true" />{{ copy.rejectDeliverable }}
                        </button>
                      </template>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="inline-state">{{ copy.noDeliverables }}</div>
            </section>

            <section v-if="canUploadDeliverable" class="upload-deliverable-block">
              <div class="section-heading-row">
                <div>
                  <h3>{{ copy.uploadDeliverable }}</h3>
                  <p>{{ copy.uploadDeliverableHint }}</p>
                </div>
              </div>
              <div class="upload-deliverable-form">
                <label>
                  {{ copy.deliveryStage }}
                  <select v-model="uploadStage">
                    <option v-for="stage in uploadStages" :key="stage.value" :value="stage.value">{{ stage.label }}</option>
                  </select>
                </label>
                <label class="file-picker">
                  {{ copy.deliveryFile }}
                  <input ref="deliverableFileInput" type="file" accept="image/jpeg,image/png,image/gif" @change="handleDeliverableFile">
                  <span>{{ uploadFile?.name || copy.chooseFile }}</span>
                </label>
                <button type="button" class="btn btn-primary" :disabled="uploading || !uploadFile" @click="uploadDeliverable">
                  <Upload :size="16" aria-hidden="true" />{{ uploading ? copy.uploading : copy.uploadNow }}
                </button>
              </div>
            </section>

            <footer class="order-actions">
              <router-link v-if="canOpenChat" :to="`/chat?order=${encodeURIComponent(order.order_no)}`" class="btn btn-primary">
                <MessageCircle :size="16" aria-hidden="true" />
                {{ copy.openChat }}
              </router-link>
              <button type="button" class="btn btn-outline" @click="copyOrderNumber"><Copy :size="16" aria-hidden="true" />{{ copy.copyOrderNumber }}</button>
            </footer>
          </section>

          <section v-else-if="searched" class="empty-detail" role="status">
            <strong>{{ copy.noOrder }}</strong>
            <p>{{ detailError || copy.checkNumber }}</p>
          </section>
          <section v-else class="empty-detail intro-state">
            <strong>{{ copy.readyTitle }}</strong>
            <p>{{ copy.readyHint }}</p>
          </section>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import { inject } from 'vue'
import { Check, CircleDollarSign, Copy, Download, Eye, MessageCircle, Play, RefreshCw, Send, Upload, X } from '@lucide/vue'
import { API_ENDPOINTS, getAssetUrl } from '../config/api'
import { apiRequest, downloadFile, eventBus, showToast } from '../utils/eventBus'
import { getCurrentUser } from '../utils/auth'

const STATUS_SEQUENCE = [
  'SUBMITTED',
  'QUOTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'DRAFT_DELIVERED',
  'FINAL_DELIVERED',
  'COMPLETED'
]

const CONTENT = {
  zh: {
    title: '订单查询', subtitle: '使用订单号查看委托详情与交付进度', orderNumber: '订单号',
    orderPlaceholder: 'CO-YYYYMMDD-XXXXXX', query: '查询订单', loading: '加载中...',
    guestHint: '可凭订单号查询脱敏后的状态与时间线；需求和付款信息仅订单双方可见。',
    memberHint: '可输入订单号，也可从左侧的本人订单中直接选择。', myOrders: '我的订单',
    myOrdersHint: '最近 50 条', refresh: '刷新订单', retry: '重新加载', emptyOrders: '暂无相关订单',
    unknownUser: '未知用户', client: '委托人', artist: '画师', price: '成交金额', paymentStatus: '支付状态',
    requirements: '需求说明', timeline: '进度时间线', paymentTitle: '付款信息', paymentMode: '付款模式',
    quotedAmount: '报价金额', totalAmount: '订单总额', paidAmount: '已付金额', unpaidAmount: '待付金额', openChat: '进入订单沟通',
    copyOrderNumber: '复制订单号', copied: '订单号已复制', copyFailed: '复制失败，请手动记录订单号',
    workflowTitle: '订单操作', workflowHint: '报价、付款和交付状态会记录在订单中。', quoteAmount: '报价金额（元）', amountPlaceholder: '例如 680', submitQuote: '提交报价',
    quoteReady: '当前报价：{amount}', confirmQuote: '确认报价', confirmedHint: '客户已确认合作，可以开始创作。', startWork: '开始创作',
    recordPayment: '登记到账', paymentAmount: '本次金额（元）', paymentMethod: '支付方式', paymentMethodPlaceholder: '微信、支付宝或转账', transactionId: '支付流水号', transactionPlaceholder: '可选', savePayment: '保存到账记录',
    cancelHint: '订单进入终态前，双方都可以说明原因取消。', cancelOrder: '取消订单', cancelPrompt: '请输入取消原因',
    actionSaved: '操作已保存', invalidAmount: '请输入有效的金额',
    deliverablesTitle: '交付物', deliverablesHint: '客户先查看水印预览，付款完成后可下载原图。', refreshDeliverables: '刷新交付物', noDeliverables: '暂时还没有交付物。',
    preview: '查看预览', downloadOriginal: '下载原图', acceptDeliverable: '确认接收', rejectDeliverable: '需要修改', uploadDeliverable: '上传交付物', uploadDeliverableHint: '支持 JPG、PNG 或 GIF，单个文件不超过 10MB。', deliveryStage: '交付阶段', deliveryFile: '文件', chooseFile: '选择图片文件', uploadNow: '上传', uploading: '上传中...',
    stages: { DRAFT: '草稿', COLOR: '线稿 / 上色', FINAL: '终稿' }, deliverableStatuses: { PENDING_CONFIRM: '待确认', ACCEPTED: '已确认', REJECTED: '需修改' },
    orderTypes: { avatar: '头像', character: '立绘', illustration: '插图', concept: '设定图' },
    noOrder: '未找到订单', checkNumber: '请核对订单号后重试。', orderRequired: '请输入订单号',
    readyTitle: '等待查询', readyHint: '输入完整订单号即可查看订单状态与时间线。', publicProgress: '委托进度',
    status: { SUBMITTED: '已提交', QUOTED: '已报价', CONFIRMED: '已确认', IN_PROGRESS: '绘制中', DRAFT_DELIVERED: '草稿已交付', FINAL_DELIVERED: '成稿已交付', COMPLETED: '已完成', CANCELLED: '已取消' },
    timelineLabels: { SUBMITTED: '委托已提交', QUOTED: '画师已报价', CONFIRMED: '双方已确认', IN_PROGRESS: '开始创作', DRAFT_DELIVERED: '草稿已交付', FINAL_DELIVERED: '成稿已交付', COMPLETED: '订单已完成', CANCELLED: '订单已取消' },
    paymentModes: { PREPAID: '先付', POSTPAID: '后付', STAGED: '分期' },
    paymentStatuses: { UNPAID: '未支付', PARTIAL: '部分支付', PAID: '已付清' },
    negotiable: '待报价', unset: '未设置'
  },
  en: {
    title: 'Order Tracking', subtitle: 'View commission details and progress with an order number', orderNumber: 'Order number',
    orderPlaceholder: 'CO-YYYYMMDD-XXXXXX', query: 'Find order', loading: 'Loading...',
    guestHint: 'An order number reveals only redacted status and timeline data. Brief and payment details are limited to participants.',
    memberHint: 'Enter an order number or select one of your orders from the list.', myOrders: 'My Orders',
    myOrdersHint: 'Latest 50', refresh: 'Refresh orders', retry: 'Try again', emptyOrders: 'No related orders yet.',
    unknownUser: 'Unknown user', client: 'Client', artist: 'Artist', price: 'Final price', paymentStatus: 'Payment',
    requirements: 'Requirements', timeline: 'Timeline', paymentTitle: 'Payment details', paymentMode: 'Payment mode',
    quotedAmount: 'Quoted amount', totalAmount: 'Order total', paidAmount: 'Paid', unpaidAmount: 'Outstanding', openChat: 'Open order chat',
    copyOrderNumber: 'Copy order number', copied: 'Order number copied.', copyFailed: 'Copy failed. Record the number manually.',
    workflowTitle: 'Order actions', workflowHint: 'Quotes, payment records, and delivery decisions are saved to the order.', quoteAmount: 'Quote amount', amountPlaceholder: 'For example, 680', submitQuote: 'Submit quote',
    quoteReady: 'Current quote: {amount}', confirmQuote: 'Confirm quote', confirmedHint: 'The client confirmed the commission. You can start working.', startWork: 'Start work',
    recordPayment: 'Record payment', paymentAmount: 'Amount', paymentMethod: 'Payment method', paymentMethodPlaceholder: 'WeChat, Alipay, or transfer', transactionId: 'Transaction ID', transactionPlaceholder: 'Optional', savePayment: 'Save payment',
    cancelHint: 'Either participant can cancel before the order reaches a terminal state.', cancelOrder: 'Cancel order', cancelPrompt: 'Enter a cancellation reason',
    actionSaved: 'Changes saved.', invalidAmount: 'Enter a valid amount.',
    deliverablesTitle: 'Deliverables', deliverablesHint: 'Clients review watermarked previews first. Originals unlock after payment.', refreshDeliverables: 'Refresh deliverables', noDeliverables: 'No deliverables yet.',
    preview: 'Preview', downloadOriginal: 'Download original', acceptDeliverable: 'Accept', rejectDeliverable: 'Request changes', uploadDeliverable: 'Upload deliverable', uploadDeliverableHint: 'JPG, PNG, or GIF up to 10 MB per file.', deliveryStage: 'Stage', deliveryFile: 'File', chooseFile: 'Choose an image', uploadNow: 'Upload', uploading: 'Uploading...',
    stages: { DRAFT: 'Draft', COLOR: 'Line / Color', FINAL: 'Final' }, deliverableStatuses: { PENDING_CONFIRM: 'Awaiting review', ACCEPTED: 'Accepted', REJECTED: 'Changes requested' },
    orderTypes: { avatar: 'Avatar', character: 'Character', illustration: 'Illustration', concept: 'Concept' },
    noOrder: 'Order not found', checkNumber: 'Check the order number and try again.', orderRequired: 'Enter an order number.',
    readyTitle: 'Ready to search', readyHint: 'Enter a complete order number to view its status and timeline.', publicProgress: 'Commission Progress',
    status: { SUBMITTED: 'Submitted', QUOTED: 'Quoted', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress', DRAFT_DELIVERED: 'Draft Delivered', FINAL_DELIVERED: 'Final Delivered', COMPLETED: 'Completed', CANCELLED: 'Cancelled' },
    timelineLabels: { SUBMITTED: 'Commission submitted', QUOTED: 'Quote provided', CONFIRMED: 'Commission confirmed', IN_PROGRESS: 'Work started', DRAFT_DELIVERED: 'Draft delivered', FINAL_DELIVERED: 'Final delivered', COMPLETED: 'Order completed', CANCELLED: 'Order cancelled' },
    paymentModes: { PREPAID: 'Prepaid', POSTPAID: 'Postpaid', STAGED: 'Staged' },
    paymentStatuses: { UNPAID: 'Unpaid', PARTIAL: 'Partially paid', PAID: 'Paid' },
    negotiable: 'Pending quote', unset: 'Not set'
  }
}

const TIMELINE_FIELDS = {
  SUBMITTED: 'submitted_at', QUOTED: 'quoted_at', CONFIRMED: 'confirmed_at',
  IN_PROGRESS: 'started_at', DRAFT_DELIVERED: 'draft_delivered_at',
  FINAL_DELIVERED: 'final_delivered_at', COMPLETED: 'completed_at', CANCELLED: 'cancelled_at'
}

export default {
  name: 'OrderTracking',
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    return {
      currentUser: getCurrentUser(), orderNumber: '', order: null, myOrders: [],
      loadingDetail: false, loadingList: false, searched: false, detailError: '', listError: '',
      deliverables: [], loadingDeliverables: false, deliverableError: '', actionLoading: false,
      quoteInput: '', paymentAmountInput: '', paymentMethodInput: '', transactionInput: '',
      uploadStage: 'DRAFT', uploadFile: null, uploading: false, deliverableActionId: 0
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] },
    timelineSteps() {
      const statuses = this.order?.status === 'CANCELLED' ? [...STATUS_SEQUENCE, 'CANCELLED'] : STATUS_SEQUENCE
      return statuses.map((status) => ({ status, field: TIMELINE_FIELDS[status], label: this.copy.timelineLabels[status] }))
    },
    totalAmount() { return Number(this.order?.final_price || this.order?.quoted_price || 0) },
    unpaidAmount() { return Math.max(0, this.totalAmount - Number(this.order?.paid_amount || 0)) },
    hasFullDetail() { return this.order?.detail_level === 'FULL' },
    canOpenChat() {
      const uid = Number(this.currentUser?.uid)
      return uid > 0 && (uid === Number(this.order?.client?.uid) || uid === Number(this.order?.artist?.uid))
    },
    isArtist() { return this.currentUser?.role === 'ARTIST' },
    isAdmin() { return this.currentUser?.role === 'ADMIN' },
    isClient() { return this.currentUser?.role === 'CLIENT' },
    canQuote() { return this.isArtist && this.order?.status === 'SUBMITTED' && Number(this.order?.artist?.uid) === Number(this.currentUser?.uid) },
    canConfirm() { return this.isClient && this.order?.status === 'QUOTED' && Number(this.order?.client?.uid) === Number(this.currentUser?.uid) },
    canStart() { return this.isArtist && this.order?.status === 'CONFIRMED' && Number(this.order?.artist?.uid) === Number(this.currentUser?.uid) },
    canCancel() {
      const isParticipant = Number(this.currentUser?.uid) === Number(this.order?.client?.uid) || Number(this.currentUser?.uid) === Number(this.order?.artist?.uid)
      return isParticipant && !['COMPLETED', 'CANCELLED'].includes(this.order?.status)
    },
    canRecordPayment() {
      return (this.isArtist || this.isAdmin) && this.totalAmount > Number(this.order?.paid_amount || 0) && this.order?.status !== 'CANCELLED'
    },
    canUploadDeliverable() {
      return this.isArtist && Number(this.currentUser?.uid) === Number(this.order?.artist?.uid) && ['IN_PROGRESS', 'DRAFT_DELIVERED'].includes(this.order?.status)
    },
    uploadStages() {
      return ['DRAFT', 'COLOR', 'FINAL'].map((value) => ({ value, label: this.copy.stages[value] }))
    }
  },
  async mounted() {
    if (this.currentUser) await this.loadMyOrders()
    const routeOrder = String(this.$route.query.order || '').trim()
    if (routeOrder) {
      this.orderNumber = routeOrder
      await this.queryOrder()
    }
  },
  methods: {
    async loadMyOrders() {
      this.loadingList = true
      this.listError = ''
      try {
        const data = await apiRequest(`${API_ENDPOINTS.MY_ORDERS}?page=1&page_size=50`, { showError: false })
        this.myOrders = Array.isArray(data?.orders) ? data.orders : []
      } catch (error) {
        this.listError = error.message
      } finally {
        this.loadingList = false
      }
    },
    async selectOrder(orderNo) {
      this.orderNumber = orderNo
      await this.queryOrder()
    },
    async queryOrder() {
      const orderNo = this.orderNumber.trim()
      if (!orderNo) {
        showToast(this.copy.orderRequired, 'error')
        return
      }
      this.loadingDetail = true
      this.searched = false
      this.detailError = ''
      try {
        this.order = await apiRequest(API_ENDPOINTS.ORDER_DETAIL(orderNo), { showError: false })
        if (this.hasFullDetail) await this.loadDeliverables()
        if (this.$route.query.order !== orderNo) {
          await this.$router.replace({ path: '/orders', query: { order: orderNo } })
        }
      } catch (error) {
        this.order = null
        this.detailError = error.message
      } finally {
        this.loadingDetail = false
        this.searched = true
      }
    },
    async loadDeliverables() {
      if (!this.order?.order_no || !this.hasFullDetail) {
        this.deliverables = []
        return
      }
      this.loadingDeliverables = true
      this.deliverableError = ''
      try {
        const data = await apiRequest(API_ENDPOINTS.ORDER_DELIVERABLES(this.order.order_no), { showError: false })
        this.deliverables = Array.isArray(data?.deliverables) ? data.deliverables : []
      } catch (error) {
        this.deliverableError = error.message
        this.deliverables = []
      } finally {
        this.loadingDeliverables = false
      }
    },
    async reloadOrder() {
      const orderNo = this.order?.order_no
      if (!orderNo) return
      this.orderNumber = orderNo
      this.loadingDetail = true
      try {
        this.order = await apiRequest(API_ENDPOINTS.ORDER_DETAIL(orderNo), { showError: false })
        await this.loadDeliverables()
        await this.loadMyOrders()
      } catch (error) {
        this.detailError = error.message
      } finally {
        this.loadingDetail = false
      }
    },
    async updateStatus(targetStatus, extra = {}) {
      if (!this.order || !Number.isInteger(Number(this.order.version))) return
      this.actionLoading = true
      try {
        await apiRequest(API_ENDPOINTS.ORDER_UPDATE_STATUS(this.order.order_no), {
          method: 'PATCH',
          body: { ...extra, target_status: targetStatus, version: this.order.version }
        })
        await this.reloadOrder()
        showToast(this.copy.actionSaved, 'success')
      } finally {
        this.actionLoading = false
      }
    },
    centsFromAmount(value) {
      const amount = Number.parseFloat(String(value).replace(',', '.'))
      if (!Number.isFinite(amount) || amount <= 0) return 0
      return Math.round(amount * 100)
    },
    async submitQuote() {
      const quotedPrice = this.centsFromAmount(this.quoteInput)
      if (!quotedPrice) {
        showToast(this.copy.invalidAmount, 'error')
        return
      }
      await this.updateStatus('QUOTED', { quoted_price: quotedPrice })
      this.quoteInput = ''
    },
    async confirmQuote() { await this.updateStatus('CONFIRMED') },
    async startWork() { await this.updateStatus('IN_PROGRESS') },
    async cancelOrder() {
      const reason = window.prompt(this.copy.cancelPrompt)
      if (!reason?.trim()) return
      await this.updateStatus('CANCELLED', { cancel_reason: reason.trim() })
    },
    async recordPayment() {
      const payAmount = this.centsFromAmount(this.paymentAmountInput)
      if (!payAmount) {
        showToast(this.copy.invalidAmount, 'error')
        return
      }
      this.actionLoading = true
      try {
        await apiRequest(API_ENDPOINTS.ORDER_UPDATE_PAYMENT(this.order.order_no), {
          method: 'PATCH',
          body: { pay_amount: payAmount, payment_method: this.paymentMethodInput, transaction_id: this.transactionInput }
        })
        this.paymentAmountInput = ''
        this.paymentMethodInput = ''
        this.transactionInput = ''
        await this.reloadOrder()
        showToast(this.copy.actionSaved, 'success')
      } finally {
        this.actionLoading = false
      }
    },
    handleDeliverableFile(event) { this.uploadFile = event.target.files?.[0] || null },
    async uploadDeliverable() {
      if (!this.uploadFile || !this.order) return
      const body = new FormData()
      body.append('stage', this.uploadStage)
      body.append('file', this.uploadFile)
      this.uploading = true
      try {
        await apiRequest(API_ENDPOINTS.ORDER_DELIVERABLES(this.order.order_no), { method: 'POST', body })
        this.uploadFile = null
        if (this.$refs.deliverableFileInput) this.$refs.deliverableFileInput.value = ''
        await this.reloadOrder()
        showToast(this.copy.actionSaved, 'success')
      } finally {
        this.uploading = false
      }
    },
    canReviewDeliverable(item) {
      return this.isClient && Number(this.currentUser?.uid) === Number(this.order?.client?.uid) && item.status === 'PENDING_CONFIRM'
    },
    async reviewDeliverable(item, status) {
      this.deliverableActionId = item.id
      try {
        await apiRequest(API_ENDPOINTS.DELIVERABLE_STATUS(item.id), { method: 'PATCH', body: { status } })
        await this.reloadOrder()
        showToast(this.copy.actionSaved, 'success')
      } finally {
        this.deliverableActionId = 0
      }
    },
    async downloadOriginal(item) {
      await downloadFile(item.original_url, `order-${this.order.order_no}-${String(item.stage).toLowerCase()}-${item.id}`)
    },
    openPreview(path) { eventBus.emit('open-lightbox', getAssetUrl(path)) },
    formatStage(stage) { return this.copy.stages[stage] || stage || '-' },
    formatDeliverableStatus(status) { return this.copy.deliverableStatuses[status] || status || '-' },
    deliverableStatusClass(status) { return String(status || '').toLowerCase().replaceAll('_', '-') },
    // 订单类型来自 v2 的画风映射（头像/立绘/插图/设定图），未命中时原样展示
    formatOrderType(type) {
      if (!type) return '-'
      return this.copy.orderTypes[type] || this.copy.orderTypes[String(type).toLowerCase()] || type
    },
    formatStatus(status) { return this.copy.status[status] || status || '-' },
    statusClass(status) { return String(status || '').toLowerCase().replaceAll('_', '-') },
    formatPaymentMode(mode) { return this.copy.paymentModes[mode] || (mode ? mode : this.copy.unset) },
    formatPaymentStatus(status) { return this.copy.paymentStatuses[status] || status || this.copy.unset },
    formatMoney(cents) {
      const amount = Number(cents || 0)
      if (!amount) return this.copy.negotiable
      return new Intl.NumberFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', { style: 'currency', currency: 'CNY' }).format(amount / 100)
    },
    formatDate(value, withTime = true) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
      }).format(date)
    },
    getStepTime(step) { return this.order?.timeline?.[step.field] || '' },
    isStepCompleted(step) {
      if (this.getStepTime(step)) return true
      if (this.order?.status === 'CANCELLED') return false
      return STATUS_SEQUENCE.indexOf(step.status) <= STATUS_SEQUENCE.indexOf(this.order?.status)
    },
    async copyOrderNumber() {
      try {
        await navigator.clipboard.writeText(this.order.order_no)
        showToast(this.copy.copied, 'success')
      } catch {
        showToast(this.copy.copyFailed, 'error')
      }
    }
  }
}
</script>

<style scoped>
.orders-section { padding: 64px 0; }
.orders-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.orders-layout.with-list { grid-template-columns: 330px minmax(0, 1fr); }
.my-orders-panel, .query-panel, .order-detail-panel, .empty-detail { background: #fff; border: 1px solid #E5E5E5; border-radius: 8px; box-shadow: var(--shadow); }
.my-orders-panel { position: sticky; top: 90px; max-height: calc(100vh - 115px); overflow: hidden; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px; border-bottom: 1px solid #E5E5E5; }
.panel-heading h2 { margin: 0; font-size: 1.05rem; }
.panel-heading p { margin: 2px 0 0; color: var(--text-muted); font-size: 0.82rem; }
.icon-button { width: 36px; height: 36px; border: 1px solid var(--primary-color); border-radius: 8px; background: #fff; color: var(--primary-color); font-size: 1.25rem; cursor: pointer; transition: var(--transition); }
.icon-button:disabled { cursor: wait; opacity: 0.55; }
.spinning { animation: spin 0.85s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.my-orders-list { max-height: calc(100vh - 185px); overflow-y: auto; }
.my-order-item { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 15px 18px; border: 0; border-bottom: 1px solid #E5E5E5; background: #fff; text-align: left; cursor: pointer; transition: var(--transition); }
.my-order-item:hover, .my-order-item.active { background: #F5F5F5; }
.my-order-item.active { box-shadow: inset 3px 0 var(--primary-color); }
.my-order-main, .my-order-side { min-width: 0; display: grid; gap: 4px; }
.my-order-main strong, .my-order-main small { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.my-order-main small, .my-order-side small { color: var(--text-muted); font-size: 0.74rem; }
.my-order-side { justify-items: end; align-content: start; }
.mini-status, .order-status { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 8px; background: #F5F5F5; color: var(--text-muted); font-size: 0.74rem; font-weight: 700; }
.tracking-column { min-width: 0; display: grid; gap: 20px; }
.query-panel { padding: 24px; }
.query-panel label { display: block; margin-bottom: 9px; font-weight: 700; }
.query-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
.query-row input { width: 100%; min-width: 0; height: 48px; padding: 0 14px; border: 1px solid #E5E5E5; border-radius: 8px; font: 600 1rem/1 monospace; letter-spacing: 0; transition: var(--transition); }
.query-row input:focus { outline: 2px solid rgba(59, 130, 246, 0.16); border-color: var(--primary-color); }
.query-row .btn { border-radius: 8px; padding: 0 22px; }
.query-panel > p { margin: 10px 0 0; color: var(--text-muted); font-size: 0.84rem; }
.order-detail-panel { padding: 30px; }
.order-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; padding-bottom: 22px; border-bottom: 1px solid #E5E5E5; }
.eyebrow { display: block; margin-bottom: 7px; color: var(--text-muted); font: 700 0.8rem/1.2 monospace; }
.order-heading h2 { margin: 0 0 5px; font-size: 1.45rem; overflow-wrap: anywhere; }
.order-heading p { margin: 0; color: var(--text-muted); }
.order-status { flex-shrink: 0; padding: 7px 11px; font-size: 0.82rem; }
.submitted, .quoted { background: #EFF6FF; color: #1D4ED8; }
.confirmed, .in-progress { background: #FFFBEB; color: #B45309; }
.draft-delivered, .final-delivered { background: #F5F3FF; color: #6D28D9; }
.completed, .paid { background: #F0FDF4; color: #15803D; }
.cancelled { background: #FEF2F2; color: #B91C1C; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; margin: 24px 0; background: #f0f0f0; border: 1px solid #f0f0f0; }
.summary-grid > div { min-width: 0; display: grid; gap: 4px; padding: 15px; background: #FAFAFA; }
.summary-grid span, .payment-grid span { color: var(--text-muted); font-size: 0.78rem; }
.summary-grid strong { overflow-wrap: anywhere; }
.description-block, .timeline-block, .payment-block { margin-top: 28px; }
.description-block h3, .timeline-block h3, .payment-block h3 { margin: 0 0 14px; font-size: 1rem; }
.description-block p { margin: 0; padding: 16px; background: #FAFAFA; color: var(--text-light); white-space: pre-wrap; overflow-wrap: anywhere; }
.timeline { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 10px; list-style: none; padding: 0; }
.timeline li { position: relative; min-width: 0; display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 8px; color: var(--text-muted); }
.timeline li::before { content: ''; position: absolute; top: 7px; left: 9px; width: calc(100% + 2px); height: 2px; background: #E5E5E5; z-index: 0; }
.timeline li:nth-child(4n)::before, .timeline li:last-child::before { display: none; }
.timeline-dot { position: relative; z-index: 1; width: 16px; height: 16px; border: 3px solid #E5E5E5; background: #fff; border-radius: 50%; }
.timeline li.completed { color: var(--text-dark); }
.timeline li.completed .timeline-dot { border-color: var(--primary-color); background: var(--primary-color); }
.timeline li.current .timeline-dot { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.16); }
.timeline strong { display: block; font-size: 0.82rem; }
.timeline time { display: block; margin-top: 3px; color: var(--text-muted); font-size: 0.72rem; }
.payment-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.payment-grid > div { display: grid; gap: 4px; padding: 13px; border-left: 3px solid #E5E5E5; background: #FAFAFA; }
.workflow-block, .deliverables-block, .upload-deliverable-block { margin-top: 28px; padding-top: 24px; border-top: 1px solid #E5E5E5; }
.section-heading-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.section-heading-row h3 { margin: 0; font-size: 1rem; }
.section-heading-row p { margin: 4px 0 0; color: var(--text-muted); font-size: 0.84rem; }
.inline-form, .payment-form { padding: 16px; background: #FAFAFA; }
.inline-form > label, .payment-form h4 { display: block; margin: 0 0 9px; font-size: 0.86rem; font-weight: 700; }
.inline-form-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; }
.inline-form input, .payment-input-grid input, .upload-deliverable-form select { width: 100%; min-width: 0; height: 42px; padding: 0 11px; border: 1px solid #E5E5E5; border-radius: 8px; background: #fff; color: var(--text-dark); font: inherit; transition: var(--transition); }
.inline-form input:focus, .payment-input-grid input:focus, .upload-deliverable-form select:focus { outline: 2px solid rgba(59, 130, 246, 0.16); border-color: var(--primary-color); }
.inline-form-row .btn, .action-row .btn, .payment-input-grid .btn, .upload-deliverable-form .btn { min-height: 42px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: 8px; }
.action-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 12px; padding: 14px 16px; border: 1px solid #E5E5E5; background: #fff; }
.action-row > span { min-width: 0; color: var(--text-light); font-size: 0.88rem; overflow-wrap: anywhere; }
.payment-form { margin-top: 12px; }
.payment-input-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: 10px; align-items: end; }
.payment-input-grid label, .upload-deliverable-form > label { min-width: 0; display: grid; gap: 7px; color: var(--text-light); font-size: 0.8rem; font-weight: 700; }
.cancel-row { border-color: #FCA5A5; background: #FEF2F2; }
.danger-button { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; gap: 7px; border-color: #FCA5A5; color: #B91C1C; transition: var(--transition); }
.danger-button:hover { background: #FEF2F2; }
.inline-state { padding: 22px 16px; border: 1px dashed #E5E5E5; color: var(--text-muted); text-align: center; }
.inline-state p { margin: 0; }
.deliverable-list { display: grid; gap: 12px; }
.deliverable-item { min-width: 0; display: grid; grid-template-columns: 128px minmax(0, 1fr); gap: 16px; padding: 12px; border: 1px solid #E5E5E5; background: #fff; }
.deliverable-preview { width: 128px; aspect-ratio: 4 / 3; object-fit: cover; background: #F5F5F5; cursor: zoom-in; }
.deliverable-info { min-width: 0; display: grid; align-content: start; gap: 8px; }
.deliverable-info > small { color: var(--text-muted); }
.deliverable-title-row { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.deliverable-title-row strong { overflow-wrap: anywhere; }
.deliverable-actions { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 2px; }
.action-button { min-height: 30px; display: inline-flex; align-items: center; gap: 5px; margin: 0; padding: 0; }
.success-text { color: #15803D; }
.danger-text { color: #B91C1C; }
.pending-confirm { background: #FFFBEB; color: #B45309; }
.accepted { background: #F0FDF4; color: #15803D; }
.rejected { background: #FEF2F2; color: #B91C1C; }
.upload-deliverable-form { display: grid; grid-template-columns: minmax(130px, 0.55fr) minmax(220px, 1.45fr) auto; gap: 12px; align-items: end; }
.file-picker input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.file-picker span { min-width: 0; height: 42px; display: flex; align-items: center; padding: 0 11px; border: 1px solid #E5E5E5; border-radius: 8px; background: #fff; color: var(--text-dark); font-weight: 400; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; transition: var(--transition); }
.order-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 28px; padding-top: 20px; border-top: 1px solid #E5E5E5; }
.order-actions .btn, .outline-button { min-height: 44px; padding: 0 18px; border-radius: 8px; }
.outline-button { border: 1px solid var(--primary-color); background: #fff; color: var(--primary-color); font: inherit; font-weight: 700; cursor: pointer; transition: var(--transition); }
.empty-detail, .panel-state { padding: 42px 24px; text-align: center; color: var(--text-light); }
.empty-detail strong { display: block; margin-bottom: 6px; color: var(--text-dark); }
.empty-detail p, .panel-state p { margin: 0; }
.intro-state { min-height: 220px; display: grid; align-content: center; }
.text-button { margin-top: 9px; border: 0; background: transparent; color: var(--primary-color); font-weight: 700; cursor: pointer; transition: var(--transition); }
.error-state { color: #B91C1C; }
@media (max-width: 980px) {
  .orders-layout.with-list { grid-template-columns: 280px minmax(0, 1fr); }
  .summary-grid, .payment-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .payment-input-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .timeline { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .timeline li:nth-child(4n)::before { display: block; }
  .timeline li:nth-child(2n)::before { display: none; }
}
@media (max-width: 760px) {
  .orders-section { padding-top: 24px; }
  .orders-layout.with-list { grid-template-columns: 1fr; }
  .my-orders-panel { position: static; max-height: 360px; }
  .my-orders-list { max-height: 290px; }
  .query-row { grid-template-columns: 1fr; }
  .query-row .btn { height: 46px; }
  .order-detail-panel { padding: 20px; }
  .order-heading { flex-direction: column; }
  .summary-grid, .payment-grid { grid-template-columns: 1fr 1fr; }
  .upload-deliverable-form { grid-template-columns: 1fr 1fr; }
  .upload-deliverable-form .btn { grid-column: 1 / -1; }
  .order-actions { flex-direction: column; }
}
@media (max-width: 480px) {
  .summary-grid, .payment-grid, .timeline { grid-template-columns: 1fr; }
  .inline-form-row, .payment-input-grid, .upload-deliverable-form { grid-template-columns: 1fr; }
  .action-row, .deliverable-title-row { align-items: flex-start; flex-direction: column; }
  .action-row .btn, .danger-button { width: 100%; }
  .deliverable-item { grid-template-columns: 1fr; }
  .deliverable-preview { width: 100%; }
  .timeline li::before { left: 7px; top: 15px; width: 2px; height: calc(100% + 2px); }
  .timeline li:nth-child(2n)::before { display: block; }
  .timeline li:last-child::before { display: none; }
}
</style>
