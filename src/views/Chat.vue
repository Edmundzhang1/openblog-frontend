<template>
  <div class="chat">
    <header class="page-header">
      <div class="container">
        <h1>{{ $t('chat.title') }}</h1>
        <p>{{ $t('chat.subtitle') }}</p>
      </div>
    </header>

    <section class="chat-section">
      <div class="container">
        <div class="chat-layout">
          <!-- 会话列表 -->
          <div class="chat-sidebar">
            <div class="sidebar-header">
              <h3>会话列表</h3>
            </div>
            <div class="thread-list">
              <div 
                v-for="thread in threads" 
                :key="thread.id"
                class="thread-item"
                :class="{ active: currentThread?.id === thread.id }"
                @click="selectThread(thread)"
              >
                <div class="thread-avatar">
                  <img :src="thread.avatar" :alt="thread.name">
                  <span v-if="thread.unread" class="unread-badge">{{ thread.unread }}</span>
                </div>
                <div class="thread-info">
                  <div class="thread-name">{{ thread.name }}</div>
                  <div class="thread-preview">{{ thread.lastMessage }}</div>
                </div>
                <div class="thread-meta">
                  <span class="thread-time">{{ thread.lastTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 聊天区域 -->
          <div class="chat-main">
            <div v-if="currentThread" class="chat-container">
              <!-- 聊天头部 -->
              <div class="chat-header">
                <div class="chat-partner">
                  <img :src="currentThread.avatar" :alt="currentThread.name">
                  <div class="partner-info">
                    <h4>{{ currentThread.name }}</h4>
                    <span v-if="currentThread.orderId" class="order-tag">
                      {{ $t('chat.orderRelated') }}: #{{ currentThread.orderId }}
                    </span>
                  </div>
                </div>
                <div class="chat-actions">
                  <button class="btn-icon" @click="showUpload = true" title="上传文件">
                    📎
                  </button>
                </div>
              </div>

              <!-- 消息列表 -->
              <div ref="messageList" class="message-list">
                <div 
                  v-for="message in messages" 
                  :key="message.id"
                  class="message"
                  :class="{ self: message.isSelf, 'message-file': message.type === 'file' }"
                >
                  <div class="message-avatar">
                    <img :src="message.avatar" :alt="message.sender">
                  </div>
                  <div class="message-content">
                    <div class="message-header">
                      <span class="sender">{{ message.sender }}</span>
                      <span class="time">{{ formatTime(message.time) }}</span>
                    </div>
                    <div class="message-body">
                      <template v-if="message.type === 'text'">
                        {{ message.content }}
                      </template>
                      <template v-else-if="message.type === 'file'">
                        <a :href="message.fileUrl" target="_blank" class="file-attachment">
                          <span class="file-icon">📄</span>
                          <div class="file-info">
                            <span class="file-name">{{ message.fileName }}</span>
                            <span class="file-size">{{ message.fileSize }}</span>
                          </div>
                        </a>
                      </template>
                      <template v-else-if="message.type === 'image'">
                        <img :src="message.imageUrl" class="message-image" @click="previewImage(message.imageUrl)">
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 输入区域 -->
              <div class="chat-input-area">
                <div class="input-actions">
                  <button @click="showUpload = true" title="上传附件">📎</button>
                  <button @click="showEmoji = !showEmoji" title="表情">😊</button>
                </div>
                <div class="input-box">
                  <textarea 
                    v-model="newMessage" 
                    :placeholder="$t('chat.placeholder')"
                    @keypress.enter.prevent="sendMessage"
                    rows="3"
                  ></textarea>
                  <button class="btn btn-primary send-btn" @click="sendMessage">
                    {{ $t('chat.send') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="chat-empty">
              <div class="empty-icon">💬</div>
              <p>选择一个会话开始聊天</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 文件上传弹窗 -->
    <div v-if="showUpload" class="upload-modal" @click.self="showUpload = false">
      <div class="upload-modal-content">
        <h3>上传文件</h3>
        <div 
          class="upload-dropzone"
          :class="{ 'drag-over': dragOver }"
          @drop.prevent="handleDrop"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @click="$refs.fileInput.click()"
        >
          <input 
            ref="fileInput"
            type="file" 
            multiple
            @change="handleFileSelect"
            style="display: none"
          >
          <div class="upload-icon">📁</div>
          <p>点击或拖拽文件到此处</p>
          <span class="upload-hint">支持图片、文档等附件</span>
        </div>
        <div class="upload-actions">
          <button class="btn btn-secondary" @click="showUpload = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImageUrl" class="image-preview-modal" @click.self="previewImageUrl = null">
      <img :src="previewImageUrl" alt="preview">
      <button class="close-btn" @click="previewImageUrl = null">×</button>
    </div>
  </div>
</template>

<script>
import { showToast } from '../utils/eventBus'
import { inject } from 'vue'

export default {
  name: 'Chat',
  setup() {
    const i18n = inject('i18n')
    return { i18n }
  },
  data() {
    return {
      threads: [
        {
          id: 1,
          name: 'FUREST工作室',
          avatar: 'https://via.placeholder.com/50/6b8e6b/ffffff?text=F',
          lastMessage: '好的，草稿会在明天发送给您',
          lastTime: '10:30',
          unread: 2,
          orderId: 'ORD123'
        },
        {
          id: 2,
          name: '客服小助手',
          avatar: 'https://via.placeholder.com/50/d4a574/ffffff?text=C',
          lastMessage: '请问有什么可以帮助您的？',
          lastTime: '昨天',
          unread: 0
        }
      ],
      currentThread: null,
      messages: [],
      newMessage: '',
      showUpload: false,
      showEmoji: false,
      dragOver: false,
      previewImageUrl: null,
      ws: null
    }
  },
  mounted() {
    // 检查URL参数中是否有订单ID
    const orderId = this.$route.query.order
    if (orderId) {
      const thread = this.threads.find(t => t.orderId === orderId)
      if (thread) {
        this.selectThread(thread)
      }
    }
    // 初始化WebSocket连接
    this.initWebSocket()
  },
  beforeUnmount() {
    if (this.ws) {
      this.ws.close()
    }
  },
  methods: {
    selectThread(thread) {
      this.currentThread = thread
      thread.unread = 0
      // 加载历史消息
      this.loadMessages(thread.id)
    },
    loadMessages(threadId) {
      // 模拟加载消息
      this.messages = [
        {
          id: 1,
          sender: 'FUREST工作室',
          avatar: 'https://via.placeholder.com/40/6b8e6b/ffffff?text=F',
          content: '您好！感谢您提交委托申请，我已经查看了您的需求。',
          time: new Date(Date.now() - 86400000).toISOString(),
          type: 'text',
          isSelf: false
        },
        {
          id: 2,
          sender: '我',
          avatar: 'https://via.placeholder.com/40/999/ffffff?text=U',
          content: '您好！请问大概什么时候可以开始绘制呢？',
          time: new Date(Date.now() - 3600000).toISOString(),
          type: 'text',
          isSelf: true
        },
        {
          id: 3,
          sender: 'FUREST工作室',
          avatar: 'https://via.placeholder.com/40/6b8e6b/ffffff?text=F',
          content: '根据目前的排期，预计下周可以开始。我会先发送草稿给您确认。',
          time: new Date(Date.now() - 1800000).toISOString(),
          type: 'text',
          isSelf: false
        }
      ]
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    sendMessage() {
      if (!this.newMessage.trim()) return

      const message = {
        id: Date.now(),
        sender: '我',
        avatar: 'https://via.placeholder.com/40/999/ffffff?text=U',
        content: this.newMessage.trim(),
        time: new Date().toISOString(),
        type: 'text',
        isSelf: true
      }

      this.messages.push(message)
      this.newMessage = ''
      this.scrollToBottom()

      // 发送给后端
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          threadId: this.currentThread.id,
          content: message.content,
          type: 'text'
        }))
      }

      // 更新会话列表
      this.currentThread.lastMessage = message.content
      this.currentThread.lastTime = '刚刚'
    },
    handleFileSelect(e) {
      const files = Array.from(e.target.files)
      this.uploadFiles(files)
    },
    handleDrop(e) {
      this.dragOver = false
      const files = Array.from(e.dataTransfer.files)
      this.uploadFiles(files)
    },
    uploadFiles(files) {
      files.forEach(file => {
        // 模拟文件上传
        const message = {
          id: Date.now() + Math.random(),
          sender: '我',
          avatar: 'https://via.placeholder.com/40/999/ffffff?text=U',
          fileName: file.name,
          fileSize: this.formatFileSize(file.size),
          fileUrl: URL.createObjectURL(file),
          time: new Date().toISOString(),
          type: file.type.startsWith('image/') ? 'image' : 'file',
          imageUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          isSelf: true
        }
        this.messages.push(message)
      })
      this.showUpload = false
      this.scrollToBottom()
      showToast('文件已发送', 'success')
    },
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },
    formatTime(time) {
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      return `${date.getMonth() + 1}/${date.getDate()}`
    },
    scrollToBottom() {
      const list = this.$refs.messageList
      if (list) {
        list.scrollTop = list.scrollHeight
      }
    },
    previewImage(url) {
      this.previewImageUrl = url
    },
    initWebSocket() {
      // 连接WebSocket（实际项目中使用真实的WS地址）
      // this.ws = new WebSocket('wss://your-api.com/ws')
    }
  }
}
</script>

<style scoped>
.chat-section {
  padding: 40px 0;
  min-height: calc(100vh - 200px);
}

.chat-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  height: 600px;
}

@media (max-width: 768px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }
  
  .chat-sidebar {
    display: none;
  }
}

/* 侧边栏 */
.chat-sidebar {
  background: var(--bg-light);
  border-right: 1px solid #eee;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.sidebar-header h3 {
  font-size: 1.1rem;
}

.thread-list {
  overflow-y: auto;
  height: calc(100% - 60px);
}

.thread-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  cursor: pointer;
  transition: var(--transition);
}

.thread-item:hover,
.thread-item.active {
  background: var(--white);
}

.thread-avatar {
  position: relative;
}

.thread-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thread-info {
  flex: 1;
  min-width: 0;
}

.thread-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.thread-preview {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thread-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 聊天区域 */
.chat-main {
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.chat-partner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-partner img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.partner-info h4 {
  font-size: 1rem;
  margin-bottom: 2px;
}

.order-tag {
  font-size: 0.8rem;
  color: var(--primary-color);
  background: rgba(107, 142, 107, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 5px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.btn-icon:hover {
  background: var(--bg-light);
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.message-content {
  background: var(--bg-light);
  padding: 12px 16px;
  border-radius: var(--radius);
  border-top-left-radius: 4px;
}

.message.self .message-content {
  background: var(--primary-color);
  color: var(--white);
  border-top-left-radius: var(--radius);
  border-top-right-radius: 4px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.message.self .message-header {
  flex-direction: row-reverse;
}

.sender {
  font-weight: 600;
}

.time {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.message.self .time {
  color: rgba(255,255,255,0.7);
}

.message-body {
  line-height: 1.5;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.file-attachment {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--white);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-dark);
}

.file-icon {
  font-size: 2rem;
}

.file-info {
  display: flex;
  flex-direction: column;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* 输入区域 */
.chat-input-area {
  border-top: 1px solid #eee;
  padding: 15px 20px;
}

.input-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input-actions button {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.input-actions button:hover {
  background: var(--bg-light);
}

.input-box {
  display: flex;
  gap: 10px;
}

.input-box textarea {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: var(--radius);
  resize: none;
  font-family: inherit;
  font-size: 0.95rem;
}

.input-box textarea:focus {
  border-color: var(--primary-color);
  outline: none;
}

.send-btn {
  padding: 0 25px;
}

/* 空状态 */
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

/* 上传弹窗 */
.upload-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.upload-modal-content {
  background: var(--white);
  border-radius: var(--radius);
  padding: 30px;
  width: 100%;
  max-width: 400px;
}

.upload-modal-content h3 {
  margin-bottom: 20px;
}

.upload-dropzone {
  border: 2px dashed #ddd;
  border-radius: var(--radius);
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
}

.upload-dropzone.drag-over,
.upload-dropzone:hover {
  border-color: var(--primary-color);
  background: var(--bg-light);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.upload-hint {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.upload-actions {
  margin-top: 20px;
  text-align: right;
}

/* 图片预览 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-modal img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.image-preview-modal .close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  background: none;
  border: none;
  color: white;
  font-size: 2.5rem;
  cursor: pointer;
}
</style>
