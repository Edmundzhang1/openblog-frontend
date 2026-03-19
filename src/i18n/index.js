/**
 * FUREST 国际化配置 - Vue 响应式版本
 * 支持中英双语
 */
import { reactive, readonly } from 'vue'

export const messages = {
  zh: {
    nav: {
      home: '首页',
      commission: '约稿',
      gallery: '作品展示',
      schedule: '排期',
      blog: '动态',
      about: '关于',
      contact: '联系',
      login: '登录',
      orders: '订单查询',
      chat: '消息',
      profile: '个人中心',
      myOrders: '我的订单',
      logout: '退出登录',
      switchedToZh: '已切换到中文',
      switchedToEn: '已切换到英文',
      logoutSuccess: '已退出登录',
      defaultUser: '用户'
    },
    home: {
      title: '专业插画约稿服务',
      subtitle: '为您的创意提供完美的视觉呈现',
      ctaCommission: '委托申请',
      ctaGallery: '更多例图',
      scheduleTitle: '稿件排单日历',
      scheduleDesc: '点击查看日期添加待办事项',
      galleryTitle: '画风展示',
      galleryDesc: '点击标签查看不同风格的示例作品',
      quickNavTitle: '快速导航',
      currentStatus: '当前排单',
      available: '可接稿',
      busy: '进行中',
      closed: '已满'
    },
    commission: {
      title: '委托申请',
      subtitle: '选择您喜欢的风格，填写委托信息',
      step1: '选择画风',
      step2: '填写委托信息',
      guestMode: '游客模式（无需注册）',
      loginMode: '登录用户',
      loginRequired: '请先登录后再提交委托',
      goLogin: '去登录',
      nickname: '委托人昵称',
      contact: '联系方式',
      contactHint: 'QQ 或 邮箱（二选一）',
      contactEmail: '邮箱',
      usage: '作品用途',
      usagePlaceholder: '请选择用途',
      usagePersonal: '个人使用',
      usageCommercial: '商业用途',
      usageGame: '游戏使用',
      usageOther: '其他',
      description: '角色/委托描述',
      descriptionPlaceholder: '请详细描述您的需求，包括：\n- 角色性格、外貌特征\n- 服装、配饰细节\n- 姿势、表情要求\n- 背景需求（如有）\n- 其他特殊要求',
      details: '细节要求',
      detailsPlaceholder: '可选项：\n- 指定画风参考\n- 配色方案\n- 光影效果\n- 其他细节要求',
      budget: '预算范围',
      budgetPlaceholder: '请选择预算范围',
      schedule: '期望排单日期',
      selectedDate: '已选择日期：',
      notSelected: '未选择',
      occupiedLabel: '满',
      uploadRef: '上传设定图/OC',
      uploadHint: '点击或拖拽上传设定图/OC',
      terms: '我已阅读并同意',
      termsLink: '《委托条款》',
      termsTitle: '委托条款',
      termsAgree: '我同意',
      termsSections: [
        {
          title: '委托流程',
          content: '提交委托申请 → 画师确认并报价 → 支付定金 → 开始绘制 → 草稿确认 → 成稿交付 → 支付尾款'
        },
        {
          title: '付款说明',
          content: '本平台仅记录支付状态，不处理实际支付。支付方式由委托人与画师协商确定。'
        },
        {
          title: '修改政策',
          content: '草稿阶段可免费修改3次，成稿后不接受大改。请在草稿阶段充分沟通您的需求。'
        },
        {
          title: '交付时间',
          content: '预计交付时间仅供参考，实际时间会根据复杂度和当前排期有所调整。'
        },
        {
          title: '版权说明',
          content: '成稿交付后，委托人获得作品使用权，画师保留署名权和展示权。商业用途请在委托时明确说明。'
        },
        {
          title: '退款政策',
          content: '未开始绘制前可全额退款；已开始绘制后，根据进度协商退款金额。'
        }
      ],
      submit: '提交委托申请',
      submitting: '提交中...',
      submittedSuccess: '委托提交成功！',
      orderNumber: '订单号',
      orderNumberHint: '请保存此编号用于查询进度',
      copyOrderNumber: '复制订单号',
      styleRequiredError: '请先选择画风',
      termsRequiredError: '请同意委托条款',
      imageOnlyError: '仅支持图片文件',
      submitFailed: '提交失败',
      orderCopied: '订单号已复制',
      styles: [
        {
          key: 'avatar',
          name: '头像',
          desc: 'Q版、写实、半写实等多种风格可选',
          price: '¥100-300',
          placeholder: '头像'
        },
        {
          key: 'character',
          name: '立绘',
          desc: '完整角色立绘，含精细刻画',
          price: '¥300-800',
          placeholder: '立绘'
        },
        {
          key: 'illustration',
          name: '插图',
          desc: '含背景的完整插画，氛围感强',
          price: '¥500-1500',
          placeholder: '插图'
        },
        {
          key: 'concept',
          name: '设定图',
          desc: '角色三视图+细节设定',
          price: '¥800-2000',
          placeholder: '设定图'
        }
      ]
    },
    order: {
      title: '订单查询',
      subtitle: '输入订单号查看委托进度',
      orderNumber: '订单号',
      query: '查询',
      status: '订单状态',
      createdAt: '创建时间',
      style: '画风类型',
      amount: '金额',
      timeline: '进度时间线',
      contactArtist: '联系画师',
      noOrder: '未找到该订单'
    },
    payment: {
      title: '支付记录',
      subtitle: '查看和管理支付状态（仅记录，非实际支付）',
      mode: '支付方式',
      prepaid: '先付',
      postpaid: '后付',
      staged: '分期',
      paidAmount: '已付金额',
      unpaidAmount: '待付金额',
      status: '支付状态',
      unpaid: '未支付',
      partial: '部分支付',
      paid: '已付清',
      notes: '支付备注',
      update: '更新支付记录'
    },
    chat: {
      title: '站内消息',
      subtitle: '与画师沟通委托详情',
      placeholder: '输入消息...',
      send: '发送',
      uploadFile: '上传附件',
      orderRelated: '关联订单'
    },
    blog: {
      title: '创作动态',
      subtitle: '了解最新创作和委托规则',
      readMore: '阅读更多',
      publishedAt: '发布于',
      contactInArticle: '文章联系入口'
    },
    common: {
      loading: '加载中...',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      close: '关闭',
      success: '操作成功',
      error: '操作失败',
      languageZh: '中文',
      languageEn: '英文'
    },
    footer: {
      copyright: '© 2026 FUREST。保留所有权利。'
    }
  },
  en: {
    nav: {
      home: 'Home',
      commission: 'Commission',
      gallery: 'Gallery',
      schedule: 'Schedule',
      blog: 'Blog',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
      orders: 'Orders',
      chat: 'Messages',
      profile: 'Profile',
      myOrders: 'My Orders',
      logout: 'Log Out',
      switchedToZh: 'Switched to Chinese',
      switchedToEn: 'Switched to English',
      logoutSuccess: 'Logged out successfully',
      defaultUser: 'User'
    },
    home: {
      title: 'Professional Commission Service',
      subtitle: 'Bringing your creative visions to life',
      ctaCommission: 'Apply',
      ctaGallery: 'Gallery',
      scheduleTitle: 'Commission Calendar',
      scheduleDesc: 'Click dates to manage todos',
      galleryTitle: 'Style Gallery',
      galleryDesc: 'Click tabs to view different styles',
      quickNavTitle: 'Quick Links',
      currentStatus: 'Current Status',
      available: 'Open',
      busy: 'Busy',
      closed: 'Closed'
    },
    commission: {
      title: 'Commission Request',
      subtitle: 'Choose your style and fill in the details',
      step1: 'Select Style',
      step2: 'Fill Details',
      guestMode: 'Guest Mode (No registration)',
      loginMode: 'Logged in User',
      loginRequired: 'Please log in before submitting a commission',
      goLogin: 'Go to Login',
      nickname: 'Your Name',
      contact: 'Contact',
      contactHint: 'QQ or Email (choose one)',
      contactEmail: 'Email',
      usage: 'Usage',
      usagePlaceholder: 'Select usage',
      usagePersonal: 'Personal',
      usageCommercial: 'Commercial',
      usageGame: 'Game',
      usageOther: 'Other',
      description: 'Description',
      descriptionPlaceholder: 'Describe your requirements in detail, including:\n- Character personality and appearance\n- Clothing and accessory details\n- Pose and expression requirements\n- Background requests (if any)\n- Any other special notes',
      details: 'Details',
      detailsPlaceholder: 'Optional details:\n- Preferred style references\n- Color palette\n- Lighting preferences\n- Other specific requests',
      budget: 'Budget',
      budgetPlaceholder: 'Select budget',
      schedule: 'Desired Date',
      selectedDate: 'Selected: ',
      notSelected: 'Not selected',
      occupiedLabel: 'Full',
      uploadRef: 'Upload Reference/OC',
      uploadHint: 'Click or drag to upload reference/OC',
      terms: 'I agree to the',
      termsLink: 'Terms of Service',
      termsTitle: 'Terms of Service',
      termsAgree: 'I Agree',
      termsSections: [
        {
          title: 'Commission Process',
          content: 'Submit request → Artist confirms and quotes → Deposit payment → Drawing starts → Draft review → Final delivery → Remaining balance'
        },
        {
          title: 'Payment',
          content: 'This platform only records payment status and does not process actual payments. Payment methods are arranged directly between the client and the artist.'
        },
        {
          title: 'Revision Policy',
          content: 'Up to three free revisions are included during the draft stage. Major changes are not accepted after the final render stage, so please communicate your needs clearly during sketch review.'
        },
        {
          title: 'Delivery Time',
          content: 'Estimated delivery dates are for reference only. Actual timing may change depending on complexity and current workload.'
        },
        {
          title: 'Copyright',
          content: 'After final delivery, the client receives usage rights while the artist retains credit and portfolio display rights. Please declare any commercial use in advance.'
        },
        {
          title: 'Refund Policy',
          content: 'A full refund is available before work starts. Once work has begun, the refund amount will be negotiated based on progress.'
        }
      ],
      submit: 'Submit Request',
      submitting: 'Submitting...',
      submittedSuccess: 'Commission Submitted!',
      orderNumber: 'Order Number',
      orderNumberHint: 'Save this number to track progress',
      copyOrderNumber: 'Copy Order Number',
      styleRequiredError: 'Please select a style',
      termsRequiredError: 'Please agree to the terms',
      imageOnlyError: 'Only image files are supported',
      submitFailed: 'Submission failed',
      orderCopied: 'Order number copied',
      styles: [
        {
          key: 'avatar',
          name: 'Avatar',
          desc: 'Chibi, realistic, and semi-realistic options',
          price: '¥100-300',
          placeholder: 'Avatar'
        },
        {
          key: 'character',
          name: 'Character',
          desc: 'Full character illustration with refined detail',
          price: '¥300-800',
          placeholder: 'Character'
        },
        {
          key: 'illustration',
          name: 'Illustration',
          desc: 'Full illustration with background and atmosphere',
          price: '¥500-1500',
          placeholder: 'Illustration'
        },
        {
          key: 'concept',
          name: 'Concept',
          desc: 'Character design sheet with key detail callouts',
          price: '¥800-2000',
          placeholder: 'Concept'
        }
      ]
    },
    order: {
      title: 'Order Tracking',
      subtitle: 'Enter order number to check status',
      orderNumber: 'Order Number',
      query: 'Search',
      status: 'Status',
      createdAt: 'Created At',
      style: 'Style',
      amount: 'Amount',
      timeline: 'Timeline',
      contactArtist: 'Contact Artist',
      noOrder: 'Order not found'
    },
    payment: {
      title: 'Payment Records',
      subtitle: 'View and manage payment status (record only)',
      mode: 'Payment Mode',
      prepaid: 'Prepaid',
      postpaid: 'Postpaid',
      staged: 'Staged',
      paidAmount: 'Paid',
      unpaidAmount: 'Unpaid',
      status: 'Status',
      unpaid: 'Unpaid',
      partial: 'Partial',
      paid: 'Paid',
      notes: 'Notes',
      update: 'Update Record'
    },
    chat: {
      title: 'Messages',
      subtitle: 'Communicate with the artist',
      placeholder: 'Type a message...',
      send: 'Send',
      uploadFile: 'Upload File',
      orderRelated: 'Related Order'
    },
    blog: {
      title: 'Blog & Updates',
      subtitle: 'Latest works and commission rules',
      readMore: 'Read More',
      publishedAt: 'Published on',
      contactInArticle: 'Contact via Article'
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      success: 'Success',
      error: 'Error',
      languageZh: 'Chinese',
      languageEn: 'English'
    },
    footer: {
      copyright: '© 2026 FUREST. All rights reserved.'
    }
  }
}

// 创建响应式状态
const state = reactive({
  locale: 'zh'
})

// 创建 i18n 插件
export default {
  install(app) {
    // 初始化语言
    const saved = localStorage.getItem('furest-locale')
    if (saved && messages[saved]) {
      state.locale = saved
    }

    // 全局翻译方法
    const t = (key) => {
      const keys = key.split('.')
      let value = messages[state.locale]
      for (const k of keys) {
        value = value?.[k]
      }
      return value || key
    }

    // 设置语言方法
    const setLocale = (locale) => {
      if (messages[locale]) {
        state.locale = locale
        localStorage.setItem('furest-locale', locale)
        // 触发事件通知所有组件更新
        window.dispatchEvent(new CustomEvent('locale-changed', { detail: locale }))
      }
    }

    // 获取当前语言
    const getLocale = () => state.locale

    // 注册全局属性
    app.config.globalProperties.$t = t
    app.config.globalProperties.$i18n = {
      locale: readonly(state).locale,
      setLocale,
      getLocale,
      t
    }

    // 提供注入
    app.provide('i18n', {
      locale: readonly(state).locale,
      setLocale,
      getLocale,
      t
    })
  }
}

// 导出便利函数（用于非组件环境）
export function t(key) {
  const keys = key.split('.')
  let value = messages[state.locale]
  for (const k of keys) {
    value = value?.[k]
  }
  return value || key
}

export function setLocale(locale) {
  if (messages[locale]) {
    state.locale = locale
    localStorage.setItem('furest-locale', locale)
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: locale }))
  }
}

export function getLocale() {
  return state.locale
}
