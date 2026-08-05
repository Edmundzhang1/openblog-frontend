<template>
  <main class="chat-page fade-in">
    <header class="page-header">
      <div class="container header-row">
        <div>
          <h1>{{ copy.title }}</h1>
          <p>{{ copy.subtitle }}</p>
        </div>
        <div class="connection-bar">
          <span class="connection-status" :class="connectionStatus">{{ connectionStatusText }}</span>
          <button
            type="button"
            class="text-button reconnect-button"
            :disabled="wsConnected || connectionStatus === 'connecting'"
            @click="reconnectWebSocket"
          >
            {{ copy.reconnect }}
          </button>
        </div>
      </div>
    </header>

    <section class="chat-section">
      <div class="container">
        <div class="chat-shell" :class="{ 'has-order': selectedOrder }">
          <aside class="orders-sidebar">
            <header class="sidebar-header">
              <div>
                <h2>{{ copy.orders }}</h2>
                <p>{{ copy.ordersHint }}</p>
              </div>
              <button
                type="button"
                class="icon-button"
                :title="copy.refresh"
                :aria-label="copy.refresh"
                :disabled="loadingOrders"
                @click="loadOrders"
              >
                ↻
              </button>
            </header>

            <div v-if="loadingOrders" class="sidebar-state">{{ copy.loadingOrders }}</div>
            <div v-else-if="ordersError" class="sidebar-state error-state">
              <p>{{ ordersError }}</p>
              <button type="button" class="text-button" @click="loadOrders">{{ copy.retry }}</button>
            </div>
            <div v-else class="sidebar-scroll">
              <div v-if="orders.length" class="order-list">
                <button
                  v-for="order in orders"
                  :key="order.order_id"
                  type="button"
                  class="order-item"
                  :class="{ active: selectedOrder?.order_id && selectedOrder?.order_id === order.order_id }"
                  @click="selectOrder(order)"
                >
                  <span class="avatar" aria-hidden="true">
                    <span>{{ initials(order.counterparty?.nickname) }}</span>
                    <img
                      v-if="order.counterparty?.avatar_url"
                      :src="assetUrl(order.counterparty.avatar_url)"
                      alt=""
                      @error="hideBrokenImage"
                    >
                  </span>
                  <span class="order-copy">
                    <strong>{{ order.counterparty?.nickname || copy.unknownUser }}</strong>
                    <span>{{ order.title }}</span>
                    <small>{{ order.order_no }}</small>
                  </span>
                  <span class="order-meta">
                    <small>{{ formatShortDate(order.created_at) }}</small>
                    <span class="status-label" :class="statusClass(order.status)">{{ formatStatus(order.status) }}</span>
                  </span>
                </button>
              </div>
              <div v-else class="sidebar-state">
                <strong>{{ copy.emptyOrders }}</strong>
                <p>{{ copy.emptyOrdersHint }}</p>
                <router-link to="/commission" class="text-link">{{ copy.createCommission }}</router-link>
              </div>
              <!-- 无订单的私信线程（order_id=0），绑定订单的线程仍展示在上方订单列表 -->
              <section v-if="dmThreads.length" class="dm-section">
                <h3 class="dm-title">{{ copy.dmTitle }}</h3>
                <button
                  v-for="thread in dmThreads"
                  :key="thread.thread_id"
                  type="button"
                  class="order-item"
                  :class="{ active: currentThread?.thread_id && String(currentThread?.thread_id) === String(thread.thread_id) }"
                  @click="selectDmThread(thread)"
                >
                  <span class="avatar" aria-hidden="true">
                    <span>{{ initials(thread.other_user_name) }}</span>
                  </span>
                  <span class="order-copy">
                    <strong>{{ thread.other_user_name || copy.unknownUser }}</strong>
                    <span>{{ thread.last_message_preview }}</span>
                  </span>
                  <span class="order-meta">
                    <small>{{ formatShortDate(thread.last_message_time) }}</small>
                    <span v-if="thread.unread_count > 0" class="unread-badge">{{ thread.unread_count }}</span>
                  </span>
                </button>
              </section>
            </div>
          </aside>

          <section class="conversation-panel" @dragover.prevent @drop.prevent="handleDrop">
            <div v-if="selectedOrder" class="conversation-layout">
              <header class="conversation-header">
                <button
                  type="button"
                  class="mobile-back"
                  :title="copy.backToOrders"
                  :aria-label="copy.backToOrders"
                  @click="closeConversation"
                >
                  ←
                </button>
                <span class="avatar partner-avatar" aria-hidden="true">
                  <span>{{ initials(selectedOrder.counterparty?.nickname) }}</span>
                  <img
                    v-if="selectedOrder.counterparty?.avatar_url"
                    :src="assetUrl(selectedOrder.counterparty.avatar_url)"
                    alt=""
                    @error="hideBrokenImage"
                  >
                </span>
                <div class="conversation-title">
                  <h2>{{ selectedOrder.counterparty?.nickname || copy.unknownUser }}</h2>
                  <router-link
                    v-if="selectedOrder.order_no"
                    :to="`/orders?order=${encodeURIComponent(selectedOrder.order_no)}`"
                  >
                    {{ selectedOrder.order_no }} · {{ selectedOrder.title }}
                  </router-link>
                </div>
                <button
                  type="button"
                  class="text-button clear-history"
                  :title="copy.clearHistory"
                  :aria-label="copy.clearHistory"
                  :disabled="!currentThread"
                  @click="clearHistory"
                >
                  {{ copy.clearHistory }}
                </button>
                <button
                  type="button"
                  class="attachment-button"
                  :title="copy.attachFile"
                  :aria-label="copy.attachFile"
                  :disabled="!currentThread || uploadingCount > 0"
                  @click="$refs.fileInput?.click()"
                >
                  +
                </button>
              </header>

              <div ref="messageList" class="message-list" aria-live="polite">
                <div v-if="loadingThread || loadingMessages" class="message-state">{{ copy.loadingMessages }}</div>
                <div v-else-if="messagesError" class="message-state error-state">
                  <p>{{ messagesError }}</p>
                  <button type="button" class="text-button" @click="loadMessages">{{ copy.retry }}</button>
                </div>
                <div v-else-if="!messages.length" class="message-state empty-message-state">
                  <strong>{{ copy.noMessages }}</strong>
                  <p>{{ copy.noMessagesHint }}</p>
                </div>
                <div v-else class="message-content">
                  <div v-if="hasOlderMessages" class="older-messages">
                    <button type="button" class="text-button" :disabled="loadingOlder" @click="loadOlderMessages">
                      {{ loadingOlder ? copy.loadingOlder : copy.loadOlder }}
                    </button>
                  </div>
                  <article
                    v-for="message in messages"
                    :key="message.message_id"
                    class="message"
                    :class="{ self: isSelf(message) }"
                  >
                  <span class="avatar message-avatar" aria-hidden="true">
                    <span>{{ initials(isSelf(message) ? currentUser.nickname : message.sender_name) }}</span>
                    <img
                      v-if="message.sender_avatar"
                      :src="assetUrl(message.sender_avatar)"
                      alt=""
                      @error="hideBrokenImage"
                    >
                  </span>
                  <div class="message-column">
                    <div class="message-meta">
                      <strong>{{ isSelf(message) ? copy.me : (message.sender_name || copy.unknownUser) }}</strong>
                      <time>{{ formatMessageTime(message.created_at) }}</time>
                      <span v-if="isSelf(message)" class="read-status" :class="{ unread: !message.is_read }">
                        {{ message.is_read ? copy.read : copy.unread }}
                      </span>
                    </div>
                    <div class="message-bubble">
                      <template v-if="message.message_type === 'TEXT'">
                        <p>{{ message.content }}</p>
                      </template>
                      <button
                        v-else-if="isImageMessage(message)"
                        type="button"
                        class="image-message"
                        @click="previewUrl = assetUrl(message.content)"
                      >
                        <img :src="assetUrl(message.content)" :alt="message.file_name || copy.imageAttachment">
                        <span>{{ message.file_name || copy.imageAttachment }}</span>
                      </button>
                      <a
                        v-else
                        :href="assetUrl(message.content)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="file-message"
                      >
                        <span class="file-mark" aria-hidden="true">FILE</span>
                        <span>
                          <strong>{{ message.file_name || copy.attachment }}</strong>
                          <small>{{ formatFileSize(message.file_size) }}</small>
                        </span>
                      </a>
                    </div>
                  </div>
                  </article>
                </div>
              </div>

              <footer class="composer">
                <input
                  ref="fileInput"
                  class="visually-hidden"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,image/jpeg,image/png,image/gif,application/pdf,text/plain"
                  @change="handleFileSelect"
                >
                <div v-if="uploadingCount" class="upload-status">
                  {{ copy.uploading.replace('{count}', uploadingCount) }}
                </div>
                <div class="composer-row">
                  <button
                    type="button"
                    class="composer-attachment"
                    :title="copy.attachFile"
                    :aria-label="copy.attachFile"
                    :disabled="!currentThread || uploadingCount > 0"
                    @click="$refs.fileInput?.click()"
                  >
                    +
                  </button>
                  <textarea
                    v-model="newMessage"
                    rows="2"
                    maxlength="10000"
                    :placeholder="copy.placeholder"
                    :disabled="!currentThread || sending"
                    @keydown.enter.exact.prevent="sendTextMessage"
                  ></textarea>
                  <button
                    type="button"
                    class="btn btn-primary send-button"
                    :disabled="!canSendText"
                    @click="sendTextMessage"
                  >
                    {{ sending ? copy.sending : copy.send }}
                  </button>
                </div>
                <p>{{ copy.fileHint }}</p>
              </footer>
            </div>

            <div v-else class="conversation-empty">
              <span aria-hidden="true">···</span>
              <strong>{{ copy.selectOrder }}</strong>
              <p>{{ copy.selectOrderHint }}</p>
            </div>
          </section>
        </div>
      </div>
    </section>

    <div v-if="previewUrl" class="preview-modal" role="dialog" :aria-label="copy.imagePreview" @click.self="previewUrl = ''">
      <img :src="previewUrl" :alt="copy.imagePreview">
      <button type="button" :title="copy.closePreview" :aria-label="copy.closePreview" @click="previewUrl = ''">×</button>
    </div>
  </main>
</template>

<script>
import { inject } from 'vue'
import { API_ENDPOINTS, getApiUrl, getAssetUrl } from '../config/api'
import { apiRequest, showToast } from '../utils/eventBus'
import { AUTH_CHANGED_EVENT, getAccessToken, getCurrentUser, getRefreshToken, refreshSession } from '../utils/auth'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'])
const ALLOWED_FILE_EXTENSIONS = /\.(jpe?g|png|gif|pdf|txt)$/i
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif)(?:$|[?#])/i

const CONTENT = {
  zh: {
    title: '订单沟通', subtitle: '围绕委托订单发送消息与参考附件', orders: '相关订单', ordersHint: '最近 50 条',
    refresh: '刷新订单', loadingOrders: '正在加载订单...', retry: '重试', unknownUser: '未知用户',
    emptyOrders: '暂无可沟通的订单', emptyOrdersHint: '提交委托后，订单会显示在这里。', createCommission: '发起委托', dmTitle: '私信',
    backToOrders: '返回订单列表', attachFile: '添加附件', loadingMessages: '正在加载消息...', loadingOlder: '正在加载...', loadOlder: '加载更早消息', noMessages: '还没有消息',
    noMessagesHint: '发送第一条消息，开始沟通具体需求。', me: '我', imageAttachment: '图片附件', attachment: '附件',
    uploading: '正在发送 {count} 个附件...', placeholder: '输入消息，Enter 发送，Shift + Enter 换行', sending: '发送中...',
    send: '发送', fileHint: '附件支持 JPG、PNG、GIF、PDF、TXT，单个不超过 10MB。也可以拖到聊天区域发送。',
    selectOrder: '选择一个订单开始沟通', selectOrderHint: '聊天线程与订单绑定，仅订单双方可以查看。',
    imagePreview: '图片预览', closePreview: '关闭预览', invalidFileType: '不支持此文件类型', fileTooLarge: '文件超过 10MB',
    filesSent: '附件已发送', orderUnavailable: '这个订单不在当前账号的可沟通列表中',
    reconnect: '重新连接', clearHistory: '清除记录', historyCleared: '聊天记录已清除', read: '已读', unread: '未读',
    connection: { connected: '已连接', connecting: '连接中...', disconnected: '未连接', error: '连接错误' },
    status: { SUBMITTED: '已提交', QUOTED: '已报价', CONFIRMED: '已确认', IN_PROGRESS: '绘制中', DRAFT_DELIVERED: '草稿已交付', FINAL_DELIVERED: '成稿已交付', COMPLETED: '已完成', CANCELLED: '已取消' }
  },
  en: {
    title: 'Order Messages', subtitle: 'Discuss commission details and exchange reference files', orders: 'Related Orders', ordersHint: 'Latest 50',
    refresh: 'Refresh orders', loadingOrders: 'Loading orders...', retry: 'Try again', unknownUser: 'Unknown user',
    emptyOrders: 'No orders to discuss', emptyOrdersHint: 'Your order will appear here after a commission is submitted.', createCommission: 'Start a commission', dmTitle: 'Messages',
    backToOrders: 'Back to orders', attachFile: 'Add attachment', loadingMessages: 'Loading messages...', loadingOlder: 'Loading...', loadOlder: 'Load earlier messages', noMessages: 'No messages yet',
    noMessagesHint: 'Send the first message to start discussing the brief.', me: 'Me', imageAttachment: 'Image attachment', attachment: 'Attachment',
    uploading: 'Sending {count} attachment(s)...', placeholder: 'Write a message. Enter to send, Shift + Enter for a new line', sending: 'Sending...',
    send: 'Send', fileHint: 'JPG, PNG, GIF, PDF, and TXT are supported up to 10MB each. You can also drop files here.',
    selectOrder: 'Select an order to start messaging', selectOrderHint: 'Each thread belongs to an order and is visible only to its participants.',
    imagePreview: 'Image preview', closePreview: 'Close preview', invalidFileType: 'This file type is not supported', fileTooLarge: 'File exceeds 10MB',
    filesSent: 'Attachment sent', orderUnavailable: 'This order is not available for messaging with the current account',
    reconnect: 'Reconnect', clearHistory: 'Clear history', historyCleared: 'Chat history cleared', read: 'Read', unread: 'Unread',
    connection: { connected: 'Connected', connecting: 'Connecting...', disconnected: 'Disconnected', error: 'Connection error' },
    status: { SUBMITTED: 'Submitted', QUOTED: 'Quoted', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress', DRAFT_DELIVERED: 'Draft Delivered', FINAL_DELIVERED: 'Final Delivered', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }
  }
}

export default {
  name: 'Chat',
  setup() {
    return { i18n: inject('i18n') }
  },
  data() {
    return {
      currentUser: getCurrentUser(),
      orders: [],
      // 无订单的私信线程（order_id=0），来自 GET /chat/threads
      dmThreads: [],
      selectedOrder: null,
      currentThread: null,
      messages: [],
      loadingOrders: false,
      loadingThread: false,
      loadingMessages: false,
      ordersError: '',
      messagesError: '',
      newMessage: '',
      sending: false,
      uploadingCount: 0,
      previewUrl: '',
      pollTimer: null,
      selectionNonce: 0,
      loadingOlder: false,
      hasOlderMessages: false,
      pollingInFlight: false,
      // WebSocket 实时消息状态
      ws: null,
      wsConnected: false,
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
      reconnectTimer: null,
      hasEverConnected: false,
      refreshingToken: false,
      pingTimer: null,
      // 通过 ?artist_id= 进入的私信会话对应的画师 UID
      activeArtistUid: 0
    }
  },
  computed: {
    locale() { return this.i18n.getLocale() },
    copy() { return CONTENT[this.locale] },
    canSendText() {
      return Boolean(this.currentThread && this.newMessage.trim() && !this.sending && !this.uploadingCount)
    },
    connectionStatusText() {
      return this.copy.connection[this.connectionStatus] || this.connectionStatus
    }
  },
  watch: {
    // Navbar 会跳转 /chat?artist_id=<uid> 发起私信，已在聊天页时需要响应 query 变化
    '$route.query.artist_id'(value) {
      const uid = Number(String(value || '').trim())
      if (uid > 0 && uid !== this.activeArtistUid) this.openArtistThread(uid)
    }
  },
  async mounted() {
    await this.loadOrders()
    const orderNo = String(this.$route.query.order || '').trim()
    const artistId = String(this.$route.query.artist_id || '').trim()
    if (orderNo) await this.openRouteOrder(orderNo)
    else if (artistId) await this.openArtistThread(artistId)
    this.connectWebSocket()
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    window.addEventListener(AUTH_CHANGED_EVENT, this.handleAuthChanged)
  },
  beforeUnmount() {
    this.stopPolling()
    this.disconnectWebSocket()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener(AUTH_CHANGED_EVENT, this.handleAuthChanged)
  },
  methods: {
    assetUrl(path) {
      // 聊天附件走受保护端点，<img>/<a> 无法带 Authorization 头，改用查询参数携带 token
      if (path && path.startsWith('/api/v1/chat/files/')) {
        const token = getAccessToken()
        if (token) {
          const sep = path.includes('?') ? '&' : '?'
          return getAssetUrl(`${path}${sep}token=${encodeURIComponent(token)}`)
        }
      }
      return getAssetUrl(path)
    },
    initials(name) {
      const value = String(name || '?').trim()
      return Array.from(value).slice(0, 2).join('').toUpperCase()
    },
    hideBrokenImage(event) {
      event.currentTarget.hidden = true
    },
    async loadOrders() {
      // 私信线程随订单一起刷新，失败不影响订单展示
      this.loadDmThreads()
      this.loadingOrders = true
      this.ordersError = ''
      try {
        const data = await apiRequest(`${API_ENDPOINTS.MY_ORDERS}?page=1&page_size=50`, { showError: false })
        this.orders = Array.isArray(data?.orders) ? data.orders : []
        if (this.selectedOrder) {
          const refreshed = this.orders.find((item) => item.order_id === this.selectedOrder.order_id)
          if (refreshed) this.selectedOrder = refreshed
        }
      } catch (error) {
        this.ordersError = error.message
      } finally {
        this.loadingOrders = false
      }
    },
    // 拉取私信线程列表，只保留无订单（order_id=0）的会话，避免与订单列表重复
    async loadDmThreads() {
      try {
        const data = await apiRequest(API_ENDPOINTS.CHAT_THREADS, { showError: false })
        const threads = Array.isArray(data?.threads) ? data.threads : []
        this.dmThreads = threads.filter((thread) => !Number(thread.order_id))
      } catch {
        // 私信列表加载失败静默处理，不影响订单与聊天主流程
      }
    },
    // 点击侧边栏私信线程：线程已存在，直接复用会话面板打开，无需再创建
    async selectDmThread(thread) {
      if (!thread?.thread_id) return
      const nonce = ++this.selectionNonce
      this.stopPolling()
      this.activeArtistUid = 0
      this.selectedOrder = null
      this.currentThread = null
      this.messages = []
      this.hasOlderMessages = false
      this.messagesError = ''
      this.loadingThread = true
      try {
        this.currentThread = thread
        // 无订单私信：用线程信息合成会话入口，复用会话面板展示
        this.selectedOrder = {
          order_id: thread.order_id || null,
          order_no: thread.order_no || '',
          title: '',
          status: '',
          created_at: thread.created_at,
          counterparty: { nickname: thread.other_user_name || '', avatar_url: '' }
        }
        await this.loadMessages()
        if (nonce !== this.selectionNonce) return
        await this.markAsRead(thread.thread_id)
        if (nonce !== this.selectionNonce) return
        thread.unread_count = 0
        this.startPolling()
      } catch (error) {
        if (nonce === this.selectionNonce) this.messagesError = error.message
      } finally {
        if (nonce === this.selectionNonce) this.loadingThread = false
      }
    },
    async openRouteOrder(orderNo) {
      let order = this.orders.find((item) => item.order_no === orderNo)
      if (!order) {
        try {
          const detail = await apiRequest(API_ENDPOINTS.ORDER_DETAIL(orderNo), { showError: false })
          const ownUID = Number(this.currentUser?.uid)
          const isClient = ownUID === Number(detail?.client?.uid)
          const isArtist = ownUID === Number(detail?.artist?.uid)
          if (!isClient && !isArtist) throw new Error(this.copy.orderUnavailable)
          order = {
            order_id: detail.order_id,
            order_no: detail.order_no,
            title: detail.title,
            status: detail.status,
            created_at: detail.created_at,
            counterparty: isClient ? detail.artist : detail.client
          }
          this.orders.unshift(order)
        } catch (error) {
          showToast(error.message || this.copy.orderUnavailable, 'error')
          return
        }
      }
      await this.selectOrder(order, false)
    },
    // 从画师空间进入（?artist_id=<uid>）：创建或获取与该画师的私信线程
    async openArtistThread(artistId) {
      const uid = Number(artistId)
      if (!Number.isFinite(uid) || uid <= 0) return
      const nonce = ++this.selectionNonce
      this.stopPolling()
      this.activeArtistUid = uid
      this.selectedOrder = null
      this.currentThread = null
      this.messages = []
      this.hasOlderMessages = false
      this.messagesError = ''
      this.loadingThread = true
      try {
        const thread = await apiRequest(API_ENDPOINTS.CHAT_CREATE_THREAD, {
          method: 'POST',
          body: { artist_id: uid },
          showError: false
        })
        if (nonce !== this.selectionNonce) return
        this.currentThread = thread
        // 无订单私信：用线程信息合成会话入口，复用会话面板展示
        this.selectedOrder = {
          order_id: thread.order_id || null,
          order_no: thread.order_no || '',
          title: '',
          status: '',
          created_at: thread.created_at,
          counterparty: { nickname: thread.other_user_name || '', avatar_url: '' }
        }
        await this.loadMessages()
        if (nonce !== this.selectionNonce) return
        await this.markAsRead(thread.thread_id)
        if (nonce !== this.selectionNonce) return
        this.startPolling()
      } catch (error) {
        if (nonce === this.selectionNonce) {
          this.messagesError = error.message
          showToast(error.message, 'error')
        }
      } finally {
        if (nonce === this.selectionNonce) this.loadingThread = false
      }
    },
    async selectOrder(order, updateRoute = true) {
      if (!order?.order_id) return
      const nonce = ++this.selectionNonce
      this.stopPolling()
      this.activeArtistUid = 0
      this.selectedOrder = order
      this.currentThread = null
      this.messages = []
      this.hasOlderMessages = false
      this.messagesError = ''
      this.loadingThread = true
      if (updateRoute && this.$route.query.order !== order.order_no) {
        await this.$router.replace({ path: '/chat', query: { order: order.order_no } })
      }
      try {
        const thread = await apiRequest(API_ENDPOINTS.CHAT_CREATE_THREAD, {
          method: 'POST',
          body: { order_id: order.order_id },
          showError: false
        })
        if (nonce !== this.selectionNonce) return
        this.currentThread = thread
        await this.loadMessages()
        if (nonce !== this.selectionNonce) return
        await this.markAsRead(thread.thread_id)
        if (nonce !== this.selectionNonce) return
        this.startPolling()
      } catch (error) {
        if (nonce === this.selectionNonce) this.messagesError = error.message
      } finally {
        if (nonce === this.selectionNonce) this.loadingThread = false
      }
    },
    async loadMessages({ silent = false } = {}) {
      if (!this.currentThread?.thread_id) return
      if (silent && this.pollingInFlight) return
      const threadID = this.currentThread.thread_id
      const incremental = silent && this.messages.length > 0
      if (!silent) {
        this.loadingMessages = true
        this.messagesError = ''
      }
      if (silent) this.pollingInFlight = true
      try {
        const params = new URLSearchParams({ thread_id: String(threadID), page: '1', page_size: '50' })
        if (incremental) params.set('last_message_id', String(this.messages.at(-1).message_id))
        const data = await apiRequest(`${API_ENDPOINTS.CHAT_MESSAGES}?${params.toString()}`, { showError: false })
        if (this.currentThread?.thread_id !== threadID) return

        const fetchedMessages = Array.isArray(data?.messages) ? [...data.messages] : []
        const totalPages = Math.max(1, Number(data?.pagination?.total_pages || 1))
        for (let page = 2; incremental && page <= totalPages; page++) {
          const pageParams = new URLSearchParams(params)
          pageParams.set('page', String(page))
          const nextPage = await apiRequest(`${API_ENDPOINTS.CHAT_MESSAGES}?${pageParams.toString()}`, { showError: false })
          if (this.currentThread?.thread_id !== threadID) return
          if (Array.isArray(nextPage?.messages)) fetchedMessages.push(...nextPage.messages)
        }

        let addedCount = 0
        if (incremental) {
          addedCount = this.mergeMessages(fetchedMessages)
        } else {
          this.messages = fetchedMessages.reverse()
          this.hasOlderMessages = Number(data?.pagination?.total || 0) > this.messages.length
          addedCount = this.messages.length
        }
        if (addedCount > 0) {
          await this.$nextTick()
          this.scrollToBottom()
          if (silent) await this.markAsRead(threadID)
        }
      } catch (error) {
        if (!silent && this.currentThread?.thread_id === threadID) this.messagesError = error.message
      } finally {
        if (silent) this.pollingInFlight = false
        if (!silent && this.currentThread?.thread_id === threadID) this.loadingMessages = false
      }
    },
    async loadOlderMessages() {
      if (!this.currentThread?.thread_id || this.loadingOlder || !this.hasOlderMessages || !this.messages.length) return
      const threadID = this.currentThread.thread_id
      const list = this.$refs.messageList
      const previousHeight = list?.scrollHeight || 0
      const previousTop = list?.scrollTop || 0
      this.loadingOlder = true
      try {
        const params = new URLSearchParams({
          thread_id: String(threadID),
          page: '1',
          page_size: '50',
          before_message_id: String(this.messages[0].message_id)
        })
        const data = await apiRequest(`${API_ENDPOINTS.CHAT_MESSAGES}?${params.toString()}`, { showError: false })
        if (this.currentThread?.thread_id !== threadID) return
        const olderMessages = Array.isArray(data?.messages) ? [...data.messages].reverse() : []
        this.mergeMessages(olderMessages)
        this.hasOlderMessages = olderMessages.length >= 50
        await this.$nextTick()
        if (list) list.scrollTop = previousTop + list.scrollHeight - previousHeight
      } catch (error) {
        if (this.currentThread?.thread_id === threadID) showToast(error.message, 'error')
      } finally {
        this.loadingOlder = false
      }
    },
    mergeMessages(incoming) {
      const messagesByID = new Map(this.messages.map((message) => [String(message.message_id), message]))
      let addedCount = 0
      for (const message of incoming) {
        const key = String(message.message_id)
        if (!messagesByID.has(key)) addedCount++
        messagesByID.set(key, message)
      }
      this.messages = Array.from(messagesByID.values()).sort((left, right) => Number(left.message_id) - Number(right.message_id))
      return addedCount
    },
    async markAsRead(threadID = this.currentThread?.thread_id) {
      if (!threadID) return
      try {
        await apiRequest(API_ENDPOINTS.CHAT_READ, {
          method: 'POST',
          body: { thread_id: threadID },
          showError: false
        })
      } catch {
        // 已读回执更新失败不影响消息阅读
      }
    },
    async sendTextMessage() {
      const content = this.newMessage.trim()
      if (!content || !this.currentThread || this.sending) return
      const threadID = this.currentThread.thread_id
      this.sending = true
      try {
        const message = await this.sendMessagePayload({ message_type: 'TEXT', content }, threadID)
        if (this.currentThread?.thread_id === threadID) {
          this.mergeMessages([message])
          this.newMessage = ''
          await this.$nextTick()
          this.scrollToBottom()
        }
      } finally {
        this.sending = false
      }
    },
    async sendMessagePayload(payload, threadID = this.currentThread?.thread_id) {
      if (!threadID) throw new Error(this.copy.orderUnavailable)
      return apiRequest(API_ENDPOINTS.CHAT_MESSAGES, {
        method: 'POST',
        body: { thread_id: threadID, ...payload }
      })
    },
    // 清除当前会话的聊天记录（仅影响自己）
    async clearHistory() {
      if (!this.currentThread) return
      const threadID = this.currentThread.thread_id
      try {
        await apiRequest(`${API_ENDPOINTS.CHAT_CREATE_THREAD}/${threadID}/clear`, { method: 'POST' })
        if (this.currentThread?.thread_id === threadID) this.messages = []
        showToast(this.copy.historyCleared, 'success')
      } catch {
        // apiRequest 已展示后端返回的错误信息
      }
    },
    handleFileSelect(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      this.uploadFiles(files)
    },
    handleDrop(event) {
      if (!this.currentThread || this.uploadingCount) return
      this.uploadFiles(Array.from(event.dataTransfer?.files || []))
    },
    async uploadFiles(files) {
      if (!this.currentThread || !files.length || this.uploadingCount) return
      const threadID = this.currentThread.thread_id
      const validFiles = files.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          showToast(`${file.name}: ${this.copy.fileTooLarge}`, 'error')
          return false
        }
        if (!ALLOWED_FILE_TYPES.has(file.type) && !ALLOWED_FILE_EXTENSIONS.test(file.name)) {
          showToast(`${file.name}: ${this.copy.invalidFileType}`, 'error')
          return false
        }
        return true
      })
      this.uploadingCount = validFiles.length
      let sent = 0
      for (const file of validFiles) {
        try {
          const form = new FormData()
          form.append('file', file)
          const uploaded = await apiRequest(API_ENDPOINTS.UPLOAD, { method: 'POST', body: form })
          const message = await this.sendMessagePayload({
            message_type: 'FILE',
            content: uploaded.url,
            file_name: uploaded.original_name || file.name,
            file_size: uploaded.size ?? file.size
          }, threadID)
          if (this.currentThread?.thread_id === threadID) this.mergeMessages([message])
          sent++
        } catch {
          // apiRequest 已展示后端返回的错误信息
        } finally {
          this.uploadingCount--
        }
      }
      if (sent) {
        showToast(this.copy.filesSent, 'success')
        if (this.currentThread?.thread_id === threadID) {
          await this.$nextTick()
          this.scrollToBottom()
        }
      }
    },
    isSelf(message) { return Number(message.sender_id) === Number(this.currentUser?.uid) },
    isImageMessage(message) {
      // 受保护附件的 content 是 /api/v1/chat/files/{id} 无扩展名，需同时看 file_name
      return message.message_type === 'FILE' &&
        (IMAGE_EXTENSIONS.test(message.content || '') || IMAGE_EXTENSIONS.test(message.file_name || ''))
    },
    formatFileSize(bytes) {
      const size = Number(bytes || 0)
      if (!size) return ''
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
      return `${(size / 1024 / 1024).toFixed(1)} MB`
    },
    formatStatus(status) { return this.copy.status[status] || status || '-' },
    statusClass(status) { return String(status || '').toLowerCase().replaceAll('_', '-') },
    formatShortDate(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit' }).format(date)
    },
    formatMessageTime(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return new Intl.DateTimeFormat(this.locale === 'zh' ? 'zh-CN' : 'en-US', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(date)
    },
    scrollToBottom() {
      const list = this.$refs.messageList
      if (list) list.scrollTop = list.scrollHeight
    },
    closeConversation() {
      this.selectionNonce++
      this.stopPolling()
      this.activeArtistUid = 0
      this.selectedOrder = null
      this.currentThread = null
      this.messages = []
      this.hasOlderMessages = false
      this.$router.replace('/chat')
    },
    startPolling() {
      this.stopPolling()
      // WebSocket 在线时实时推送已覆盖新消息，无需轮询
      if (this.wsConnected) return
      this.pollTimer = window.setInterval(() => this.loadMessages({ silent: true }), 12000)
    },
    stopPolling() {
      if (this.pollTimer) window.clearInterval(this.pollTimer)
      this.pollTimer = null
    },
    // ==================== WebSocket 实时消息 ====================
    buildWsUrl() {
      // API_ENDPOINTS.WS 是相对路径，需拼成 ws(s):// URL；BASE_URL 为空时走同源
      const httpUrl = getApiUrl(API_ENDPOINTS.WS)
      const base = /^https?:\/\//i.test(httpUrl)
        ? httpUrl.replace(/^http/i, 'ws')
        : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${httpUrl}`
      return `${base}?token=${encodeURIComponent(getAccessToken())}`
    },
    connectWebSocket() {
      if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return
      if (!getAccessToken()) {
        // 无令牌无法发起连接，回到未连接状态，避免停在「连接中...」
        this.connectionStatus = 'disconnected'
        return
      }
      this.connectionStatus = 'connecting'
      try {
        this.ws = new WebSocket(this.buildWsUrl())
      } catch {
        this.connectionStatus = 'error'
        return
      }
      this.ws.onopen = () => {
        this.wsConnected = true
        this.connectionStatus = 'connected'
        this.reconnectAttempts = 0
        this.hasEverConnected = true
        this.stopPolling()
        this.startPing()
      }
      this.ws.onmessage = (event) => {
        try {
          this.handleWsMessage(JSON.parse(event.data))
        } catch {
          // 忽略无法解析的消息
        }
      }
      this.ws.onerror = () => {
        // 只标记连接状态，不改显示状态——onerror 后必定跟随 onclose，由 onclose 统一驱动状态，
        // 避免短暂闪断时状态栏误显示「连接错误」
        this.wsConnected = false
      }
      this.ws.onclose = (event) => {
        this.wsConnected = false
        this.ws = null
        this.stopPing()
        // 断线期间回退到轮询，保证新消息可见
        if (this.currentThread) this.startPolling()
        // 从未成功连接过（可能是 token 过期导致 401），先刷新 token 再重连
        if (!this.hasEverConnected && event.code !== 1000 && !this.refreshingToken) {
          this.refreshTokenAndReconnect()
          return
        }
        if (!event.wasClean) {
          // 异常断开：不限次数自动重连（指数退避封顶 30s），
          // 后端重启/网络恢复后自动回连，不再停留在「连接错误」
          this.attemptReconnect()
        } else {
          this.connectionStatus = 'disconnected'
        }
      }
    },
    // 处理收到的 WebSocket 消息，适配后端 dto.WSMessage 结构
    handleWsMessage(msg) {
      const payload = msg?.payload || {}
      switch (msg?.type) {
        case 'CHAT':
          // 自己发送的消息已通过 HTTP 响应回显，这里只处理对方发来的
          if (String(payload.sender_id) === String(this.currentUser?.uid)) return
          if (this.currentThread && String(payload.thread_id) === String(this.currentThread.thread_id)) {
            // 拉取权威消息数据（含附件字段），随后标记已读
            this.loadMessages({ silent: true }).then(() => this.markAsRead())
          } else {
            // 其他会话有新消息时刷新订单与私信列表，让排序、时间与未读数保持最新
            this.loadOrders()
          }
          break
        case 'READ':
          this.updateMessageReadStatus(payload.message_id)
          break
        default:
          // ORDER / SYSTEM / PONG 等通知在此页面无需处理
          break
      }
    },
    updateMessageReadStatus(messageID) {
      const message = this.messages.find((item) => String(item.message_id) === String(messageID))
      if (message) message.is_read = true
    },
    startPing() {
      this.stopPing()
      // 定时发送心跳，保持连接
      this.pingTimer = window.setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'PING', payload: {}, timestamp: Date.now() }))
        }
      }, 30000)
    },
    stopPing() {
      if (this.pingTimer) window.clearInterval(this.pingTimer)
      this.pingTimer = null
    },
    attemptReconnect() {
      this.reconnectAttempts++
      // 指数退避封顶 30s；指数本身也封顶，避免 attempts 无限增长导致 2**n 溢出
      const delay = Math.min(1000 * 2 ** Math.min(this.reconnectAttempts, 5), 30000)
      this.connectionStatus = 'connecting'
      this.reconnectTimer = window.setTimeout(() => this.connectWebSocket(), delay)
    },
    async refreshTokenAndReconnect() {
      if (!getRefreshToken()) {
        // 无刷新令牌无法自动恢复，回到未连接状态，由用户手动重连或重新登录
        this.connectionStatus = 'disconnected'
        return
      }
      this.refreshingToken = true
      try {
        // 刷新机制统一走 utils/auth 的单飞 refreshSession，避免与 apiRequest 的 401 刷新竞争
        await refreshSession()
        this.reconnectAttempts = 0
        window.setTimeout(() => this.connectWebSocket(), 500)
      } catch {
        // 刷新失败时保持未连接状态，用户可手动重连
        this.connectionStatus = 'disconnected'
      } finally {
        this.refreshingToken = false
      }
    },
    reconnectWebSocket() {
      if (this.ws) {
        this.ws.onclose = null
        this.ws.close(1000, '手动重连')
        this.ws = null
      }
      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      this.reconnectAttempts = 0
      this.hasEverConnected = false
      this.connectWebSocket()
    },
    disconnectWebSocket() {
      if (this.reconnectTimer) {
        window.clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      this.stopPing()
      if (this.ws) {
        this.ws.onclose = null
        this.ws.close(1000, '离开页面')
        this.ws = null
      }
      this.wsConnected = false
      this.connectionStatus = 'disconnected'
    },
    handleVisibilityChange() {
      // 从后台切回页面时，若连接已断开则重连
      if (document.visibilityState === 'visible' && !this.wsConnected) this.reconnectWebSocket()
    },
    handleAuthChanged(event) {
      // 登出或切换账号后，断开旧身份的连接并按新身份重连
      this.currentUser = getCurrentUser()
      this.disconnectWebSocket()
      if (event.detail) this.connectWebSocket()
    }
  }
}
</script>

<style scoped>
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.connection-bar { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; }
.connection-status { padding: 4px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
.connection-status.connected { background: #F0FDF4; color: #15803D; }
.connection-status.connecting { background: #FFFBEB; color: #B45309; }
.connection-status.disconnected { background: #F5F5F5; color: rgba(26, 26, 26, 0.65); }
.connection-status.error { background: #FEF2F2; color: #B91C1C; }
.reconnect-button { font-size: 0.78rem; text-decoration: none; }
.reconnect-button:disabled { opacity: 0.45; cursor: not-allowed; }
.chat-section { padding: 64px 0; }
.chat-shell { display: grid; grid-template-columns: 330px minmax(0, 1fr); height: min(680px, calc(100vh - 210px)); min-height: 520px; overflow: hidden; background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: var(--shadow); }
.orders-sidebar { min-width: 0; border-right: 1px solid #E5E7EB; background: #FAFAFA; }
.sidebar-header { height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 18px; border-bottom: 1px solid #E5E7EB; background: #fff; }
.sidebar-header h2 { margin: 0; font-size: 1.05rem; }
.sidebar-header p { margin: 3px 0 0; color: var(--text-muted); font-size: 0.78rem; }
.icon-button, .mobile-back, .attachment-button, .composer-attachment { flex: 0 0 auto; width: 38px; height: 38px; display: inline-grid; place-items: center; border: 1px solid #E5E7EB; border-radius: 8px; background: #fff; color: var(--primary-color); font-size: 1.2rem; cursor: pointer; transition: var(--transition); }
.icon-button:disabled, .attachment-button:disabled, .composer-attachment:disabled { opacity: 0.45; cursor: not-allowed; }
.sidebar-state, .message-state, .conversation-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; padding: 34px 24px; color: var(--text-muted); text-align: center; }
.sidebar-state { min-height: calc(100% - 76px); }
.sidebar-state p, .message-state p, .conversation-empty p { margin: 0; }
.error-state { color: #B91C1C; }
.text-button, .text-link { border: 0; background: none; color: var(--primary-color); font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; transition: var(--transition); }
.sidebar-scroll { height: calc(100% - 76px); overflow-y: auto; }
.order-item { width: 100%; display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: 11px; padding: 14px 16px; border: 0; border-bottom: 1px solid #E5E7EB; background: transparent; color: inherit; text-align: left; cursor: pointer; transition: var(--transition); }
.order-item:hover, .order-item.active { background: #fff; }
.order-item.active { box-shadow: inset 3px 0 var(--accent-color); }
.dm-title { margin: 0; padding: 12px 16px 4px; color: var(--text-muted); font-size: 0.75rem; }
.unread-badge { min-width: 18px; padding: 2px 6px; border-radius: 9px; background: #EF4444; color: #fff; font-size: 0.68rem; font-weight: 700; text-align: center; }
.avatar { position: relative; width: 42px; height: 42px; display: inline-grid; place-items: center; overflow: hidden; border-radius: 50%; background: #F0F0F0; color: var(--text-dark); font-size: 0.8rem; font-weight: 800; }
.avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.order-copy { min-width: 0; display: grid; gap: 3px; }
.order-copy strong, .order-copy span, .order-copy small { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.order-copy strong { font-size: 0.92rem; }
.order-copy span { color: var(--text-light); font-size: 0.82rem; }
.order-copy small, .order-meta small { color: var(--text-muted); font-size: 0.7rem; }
.order-meta { display: grid; justify-items: end; gap: 8px; }
.status-label { max-width: 86px; padding: 3px 6px; overflow: hidden; border-radius: 8px; background: #F5F5F5; color: rgba(26, 26, 26, 0.65); font-size: 0.68rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.status-label.cancelled { background: #FEF2F2; color: #B91C1C; }
.status-label.completed { background: #F0FDF4; color: #15803D; }
.conversation-panel { min-width: 0; min-height: 0; }
.conversation-layout { height: 100%; display: grid; grid-template-rows: 76px minmax(0, 1fr) auto; }
.conversation-header { min-width: 0; display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid #E5E7EB; }
.mobile-back { display: none; }
.partner-avatar { flex: 0 0 auto; }
.conversation-title { flex: 1; min-width: 0; }
.conversation-title h2 { margin: 0 0 4px; overflow: hidden; font-size: 1rem; text-overflow: ellipsis; white-space: nowrap; }
.conversation-title a { display: block; overflow: hidden; color: var(--text-muted); font-size: 0.78rem; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; transition: var(--transition); }
.conversation-title a:hover { color: var(--primary-color); text-decoration: underline; }
.clear-history { flex: 0 0 auto; font-size: 0.78rem; text-decoration: none; }
.clear-history:disabled { opacity: 0.45; cursor: not-allowed; }
.attachment-button, .composer-attachment { font-size: 1.45rem; line-height: 1; }
.message-list { min-height: 0; overflow-y: auto; padding: 22px; background: #FAFAFA; }
.message-state { min-height: 100%; }
.empty-message-state strong { color: var(--text-dark); }
.message { max-width: 76%; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 17px; }
.message.self { margin-left: auto; flex-direction: row-reverse; }
.message-avatar { flex: 0 0 auto; width: 34px; height: 34px; font-size: 0.68rem; }
.message-column { min-width: 0; }
.message-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 5px; color: var(--text-muted); font-size: 0.75rem; }
.message-meta time { color: var(--text-muted); font-size: 0.68rem; }
.message.self .message-meta { justify-content: flex-end; }
.read-status { font-size: 0.68rem; color: #15803D; }
.read-status.unread { color: var(--text-muted); }
.message-bubble { overflow: hidden; border: 1px solid #E5E7EB; border-radius: 8px; background: #fff; color: var(--text-dark); }
.message.self .message-bubble { border-color: var(--primary-color); background: var(--primary-color); color: #fff; }
.message.self .read-status { color: rgba(21, 128, 61, 0.9); }
.message-bubble > p { margin: 0; padding: 10px 13px; line-height: 1.55; overflow-wrap: anywhere; white-space: pre-wrap; }
.image-message { max-width: min(320px, 100%); display: grid; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.image-message img { width: 100%; max-height: 300px; display: block; object-fit: contain; background: #F0F0F0; }
.image-message span { padding: 7px 10px; overflow: hidden; font-size: 0.74rem; text-overflow: ellipsis; white-space: nowrap; }
.file-message { min-width: 230px; max-width: 360px; display: flex; align-items: center; gap: 11px; padding: 12px; color: inherit; text-decoration: none; }
.file-mark { flex: 0 0 auto; width: 42px; height: 34px; display: grid; place-items: center; border: 1px solid currentColor; border-radius: 8px; font-size: 0.62rem; font-weight: 800; }
.file-message > span:last-child { min-width: 0; display: grid; gap: 3px; }
.file-message strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-message small { opacity: 0.72; }
.composer { padding: 13px 18px 12px; border-top: 1px solid #E5E7EB; background: #fff; }
.composer-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: stretch; gap: 9px; }
.composer-attachment { height: auto; min-height: 46px; }
.composer textarea { width: 100%; min-height: 46px; max-height: 120px; resize: vertical; padding: 11px 12px; border: 1px solid #E5E7EB; border-radius: 8px; font: inherit; line-height: 1.45; }
.composer textarea:focus { outline: 2px solid rgba(59, 130, 246, 0.14); border-color: var(--accent-color); }
.send-button { min-width: 76px; border-radius: 8px; }
.composer > p, .upload-status { margin: 7px 0 0 48px; color: var(--text-muted); font-size: 0.72rem; }
.upload-status { margin-top: 0; margin-bottom: 7px; color: var(--primary-color); font-weight: 700; }
.conversation-empty { height: 100%; }
.conversation-empty > span { color: var(--text-muted); font-size: 2rem; letter-spacing: 0; }
.conversation-empty strong { color: var(--text-dark); }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.preview-modal { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 30px; background: rgba(0, 0, 0, 0.9); }
.preview-modal img { max-width: 94vw; max-height: 90vh; object-fit: contain; }
.preview-modal button { position: absolute; top: 18px; right: 24px; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,0.45); border-radius: 8px; background: rgba(0,0,0,0.25); color: #fff; font-size: 1.8rem; cursor: pointer; }

@media (max-width: 760px) {
  .header-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .chat-section { padding: 18px 0 36px; }
  .chat-section > .container { padding: 0 12px; }
  .chat-shell { display: block; height: calc(100dvh - 160px); min-height: 480px; }
  .orders-sidebar { height: 100%; border-right: 0; }
  .chat-shell.has-order .orders-sidebar { display: none; }
  .conversation-panel { display: none; height: 100%; }
  .chat-shell.has-order .conversation-panel { display: block; }
  .mobile-back { display: inline-grid; }
  .conversation-header { padding: 12px; }
  .partner-avatar { display: none; }
  .attachment-button { display: none; }
  .clear-history { font-size: 0.72rem; }
  .message-list { padding: 16px 12px; }
  .message { max-width: 91%; }
  .message-avatar { display: none; }
  .composer { padding: 10px; }
  .composer-row { grid-template-columns: 38px minmax(0, 1fr); }
  .send-button { grid-column: 2; min-height: 42px; }
  .composer > p, .upload-status { margin-left: 0; }
}
</style>
