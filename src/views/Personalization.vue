<template>
  <div class="personalization-page">
    <!-- 头像裁剪弹窗 -->
    <div v-if="showCropModal" class="crop-modal" @click.self="closeCropModal">
      <div class="crop-modal-content">
        <div class="crop-modal-header">
          <h3>{{ copy.crop.title }}</h3>
          <button class="close-btn" @click="closeCropModal">×</button>
        </div>
        <div class="crop-container">
          <div class="crop-wrapper" ref="cropArea">
            <!-- 原始图片 -->
            <img 
              ref="cropImageRef"
              :src="cropImageSrc" 
              class="crop-original-image" 
              alt="original"
              @load="onImageLoad"
            >
            
            <!-- 四边遮罩 -->
            <div v-if="hasCropSelection" class="crop-mask top-mask" :style="topMaskStyle"></div>
            <div v-if="hasCropSelection" class="crop-mask bottom-mask" :style="bottomMaskStyle"></div>
            <div v-if="hasCropSelection" class="crop-mask left-mask" :style="leftMaskStyle"></div>
            <div v-if="hasCropSelection" class="crop-mask right-mask" :style="rightMaskStyle"></div>
            
            <!-- 可拖拽的裁剪框 -->
            <div v-if="hasCropSelection" class="crop-selection" 
                 :style="selectionStyle"
                 @pointerdown.prevent="startMove">
              <!-- 九宫格辅助线 -->
              <div class="grid-lines">
                <div class="grid-line h1"></div>
                <div class="grid-line h2"></div>
                <div class="grid-line v1"></div>
                <div class="grid-line v2"></div>
              </div>
              <!-- 边框 -->
              <div class="selection-border"></div>
              <!-- 四个角的手柄 -->
              <div class="corner-handle tl" @pointerdown.stop.prevent="startResize($event, 'tl')"></div>
              <div class="corner-handle tr" @pointerdown.stop.prevent="startResize($event, 'tr')"></div>
              <div class="corner-handle bl" @pointerdown.stop.prevent="startResize($event, 'bl')"></div>
              <div class="corner-handle br" @pointerdown.stop.prevent="startResize($event, 'br')"></div>
            </div>
          </div>
          
          <div class="crop-controls">
            <div class="control-row">
              <label>{{ copy.crop.sizeLabel }}</label>
              <span class="size-value">{{ Math.round(cropDisplaySize) }}px</span>
            </div>
            <input
              type="range"
              v-model.number="cropSliderSize"
              :min="minCropSize"
              :max="maxCropSize"
              step="1"
              class="size-slider"
              :disabled="!hasCropSelection"
            >
            <p class="crop-hint">{{ copy.crop.hint }}</p>
          </div>
        </div>
        <div class="crop-modal-footer">
          <button class="btn btn-outline" @click="closeCropModal">{{ copy.crop.cancel }}</button>
          <button class="btn btn-primary" @click="applyCrop">{{ copy.crop.apply }}</button>
        </div>
      </div>
    </div>

    <!-- 页面标题 -->
    <section class="page-header">
      <div class="container">
        <h1>{{ copy.header.title }}</h1>
        <p>{{ copy.header.subtitle }}</p>
      </div>
    </section>

    <div class="container">
      <div class="personalization-layout">
        <!-- 侧边导航 -->
        <aside class="settings-nav">
          <div class="nav-card">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['nav-btn', { active: currentTab === tab.id }]"
              @click="currentTab = tab.id"
            >
              <span class="nav-icon">{{ tab.icon }}</span>
              <span>{{ tab.name }}</span>
            </button>
          </div>
          
          <div class="action-card">
            <button class="btn btn-primary btn-block" @click="saveSettings">
              {{ copy.actions.save }}
            </button>
            <button class="btn btn-outline btn-block" @click="previewSettings">
              {{ copy.actions.preview }}
            </button>
            <button class="btn btn-danger btn-block" @click="resetSettings">
              {{ copy.actions.reset }}
            </button>
          </div>
        </aside>

        <!-- 设置内容区 -->
        <main class="settings-content">
          <!-- 个人信息设置 -->
          <section v-if="currentTab === 'profile'" class="settings-section">
            <h2>{{ copy.profile.section }}</h2>
            
            <div class="setting-card">
              <h3>{{ copy.profile.avatarTitle }}</h3>
              <div class="avatar-setting">
                <div class="avatar-preview">
                  <img :src="config.profile.avatar" alt="avatar">
                </div>
                <div class="avatar-actions">
                  <label class="btn btn-outline">
                    <input type="file" accept="image/*" @change="handleAvatarUpload" hidden>
                    {{ copy.profile.uploadAvatar }}
                  </label>
                  <button v-if="cropImageSrc" class="btn btn-outline" @click="reopenCrop">
                    {{ copy.profile.recrop }}
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <h3>{{ copy.profile.basicInfo }}</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>{{ copy.profile.displayName }}</label>
                  <input type="text" v-model="config.profile.name" :placeholder="copy.profile.displayNamePlaceholder">
                </div>
                <div class="form-group full-width">
                  <label>{{ copy.profile.tags }}</label>
                  <div class="tags-input">
                    <div class="tags-list">
                      <span v-for="(tag, index) in config.profile.tags" :key="index" class="tag-item">
                        {{ tag }}
                        <button class="tag-remove" @click="removeTag(index)">×</button>
                      </span>
                    </div>
                    <div class="tag-add-row">
                      <input 
                        type="text" 
                        v-model="newTag" 
                        :placeholder="copy.profile.tagPlaceholder"
                        @keypress.enter="addTag"
                      >
                      <button class="btn btn-sm btn-outline" @click="addTag">+</button>
                    </div>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>{{ copy.profile.bio }}</label>
                  <textarea v-model="config.profile.bio" rows="4" :placeholder="copy.profile.bioPlaceholder"></textarea>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <h3>{{ copy.profile.emails }}</h3>
              <div class="emails-list">
                <div v-for="(email, index) in config.profile.emails" :key="index" class="email-item">
                  <input type="email" v-model="config.profile.emails[index]" placeholder="your@email.com">
                  <button class="btn-remove" @click="removeEmail(index)" :title="copy.actions.deleteTitle">×</button>
                </div>
                <button class="btn btn-outline btn-add" @click="addEmail">
                  {{ copy.profile.addEmail }}
                </button>
              </div>
            </div>

            <div class="setting-card">
              <h3>{{ copy.profile.social }}</h3>
              <div class="social-list">
                <div v-for="(item, index) in config.profile.social" :key="index" class="social-item">
                  <select v-model="item.platform" class="platform-select">
                    <option v-for="platform in availablePlatformsList" :key="platform.platform" :value="platform.platform">
                      {{ platform.icon }} {{ platform.name }}
                    </option>
                  </select>
                  <input type="text" v-model="item.url" :placeholder="copy.profile.socialPlaceholder">
                  <button class="btn-remove" @click="removeSocial(index)" :title="copy.actions.deleteTitle">×</button>
                </div>
                <button class="btn btn-outline btn-add" @click="addSocial">
                  {{ copy.profile.addSocial }}
                </button>
              </div>
            </div>
          </section>

          <!-- 主题颜色设置 -->
          <section v-if="currentTab === 'theme'" class="settings-section">
            <h2>{{ copy.theme.section }}</h2>
            
            <div class="setting-card">
              <h3>{{ copy.theme.presetsTitle }}</h3>
              <div class="preset-groups">
                <div class="preset-group">
                  <div class="preset-group-header">
                    <div>
                      <h4>{{ copy.theme.builtInTitle }}</h4>
                      <p>{{ copy.theme.builtInDesc }}</p>
                    </div>
                  </div>
                  <div class="theme-presets">
                    <button 
                      v-for="preset in builtInThemePresetOptions" 
                      :key="preset.name"
                      class="preset-btn"
                      @click="applyPreset(preset)"
                      :title="getPresetDisplayName(preset)"
                    >
                      <div class="preset-colors">
                        <span class="color-dot" :style="{ background: preset.primaryColor }"></span>
                        <span class="color-dot" :style="{ background: preset.accentColor }"></span>
                      </div>
                      <span class="preset-name">{{ getPresetDisplayName(preset) }}</span>
                    </button>
                  </div>
                </div>

                <div class="preset-group">
                  <div class="preset-group-header">
                    <div>
                      <h4>{{ copy.theme.customTitle }}</h4>
                      <p>{{ copy.theme.customDesc }}</p>
                    </div>
                    <span class="preset-group-count">{{ customPresetCountLabel }}</span>
                  </div>
                  <div v-if="customThemePresetOptions.length" class="theme-presets custom-theme-presets">
                    <div
                      v-for="preset in customThemePresetOptions"
                      :key="preset.name"
                      class="preset-card"
                    >
                      <button
                        class="preset-btn"
                        @click="applyPreset(preset)"
                        :title="getPresetDisplayName(preset)"
                      >
                        <div class="preset-colors">
                          <span class="color-dot" :style="{ background: preset.primaryColor }"></span>
                          <span class="color-dot" :style="{ background: preset.accentColor }"></span>
                        </div>
                        <span class="preset-name">{{ getPresetDisplayName(preset) }}</span>
                      </button>
                      <button class="preset-delete-btn" @click="deleteCustomThemePreset(preset)">
                        {{ copy.actions.deleteTitle }}
                      </button>
                    </div>
                  </div>
                  <p v-else class="preset-empty">
                    {{ copy.theme.customEmpty }}
                  </p>
                </div>
              </div>
            </div>

            <div class="setting-card">
              <div class="setting-card-header">
                <div class="theme-custom-header">
                  <h3>{{ copy.theme.customColorTitle }}</h3>
                  <div class="theme-name-row">
                    <label class="theme-name-label">{{ copy.theme.currentName }}</label>
                    <div class="theme-name-editor">
                      <input
                        v-if="isEditingThemePresetName"
                        ref="themePresetNameInput"
                        v-model.trim="currentThemePresetName"
                        type="text"
                        class="theme-name-input"
                        maxlength="30"
                        :placeholder="copy.theme.namePlaceholder"
                        @blur="finishThemePresetNameEdit"
                        @keydown.enter.prevent="finishThemePresetNameEdit"
                        @keydown.esc.prevent="cancelThemePresetNameEdit"
                      >
                      <span v-else class="theme-name-value">{{ currentThemePresetName }}</span>
                      <button class="btn btn-sm btn-outline add-preset-btn" @mousedown.prevent @click="toggleThemePresetNameEdit">
                        {{ themeNameToggleLabel }}
                      </button>
                    </div>
                  </div>
                </div>
                <button class="btn btn-sm btn-outline add-preset-btn" @click="addCurrentThemeToPresets">
                  {{ copy.theme.addToPresets }}
                </button>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>{{ copy.theme.primary }}</label>
                  <div class="color-input">
                    <input type="color" v-model="config.theme.primaryColor">
                    <input type="text" v-model="config.theme.primaryColor">
                  </div>
                </div>
                <div class="form-group">
                  <label>{{ copy.theme.primaryDark }}</label>
                  <div class="color-input">
                    <input type="color" v-model="config.theme.primaryDark">
                    <input type="text" v-model="config.theme.primaryDark">
                  </div>
                </div>
                <div class="form-group">
                  <label>{{ copy.theme.secondary }}</label>
                  <div class="color-input">
                    <input type="color" v-model="config.theme.secondaryColor">
                    <input type="text" v-model="config.theme.secondaryColor">
                  </div>
                </div>
                <div class="form-group">
                  <label>{{ copy.theme.accent }}</label>
                  <div class="color-input">
                    <input type="color" v-model="config.theme.accentColor">
                    <input type="text" v-model="config.theme.accentColor">
                  </div>
                </div>
                <div class="form-group">
                  <label>{{ copy.theme.bgLight }}</label>
                  <div class="color-input">
                    <input type="color" v-model="config.theme.bgLight">
                    <input type="text" v-model="config.theme.bgLight">
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 首页轮播图设置 -->
          <section v-if="currentTab === 'hero'" class="settings-section">
            <h2>{{ copy.hero.section }}</h2>
            
            <div class="setting-card">
              <h3>{{ copy.hero.manager }}</h3>
              <p class="section-note">{{ copy.hero.note }}</p>
              <div class="slides-list">
                <div 
                  v-for="(slide, index) in config.hero.slides" 
                  :key="index"
                  class="slide-item"
                >
                  <div class="slide-preview">
                    <img :src="slide.image" @error="handleImageError">
                  </div>
                  <div class="slide-fields">
                    <input type="text" v-model="slide.title" :placeholder="copy.hero.titlePlaceholder">
                    <input type="text" v-model="slide.desc" :placeholder="copy.hero.descPlaceholder">
                    <div class="image-input-row">
                      <label class="btn btn-sm btn-outline">
                        <input type="file" accept="image/*" @change="(e) => handleSlideUpload(e, index)" hidden>
                        {{ copy.hero.replaceImage }}
                      </label>
                    </div>
                  </div>
                  <button class="btn-remove" @click="removeSlide(index)" :title="copy.actions.deleteTitle">×</button>
                </div>
                
                <button class="btn btn-outline btn-add" @click="addSlide">
                  {{ copy.hero.add }}
                </button>
              </div>
            </div>
          </section>

          <!-- 背景设置 -->
          <section v-if="currentTab === 'background'" class="settings-section">
            <h2>{{ copy.background.section }}</h2>
            
            <div class="setting-card">
              <h3>{{ copy.background.toggleTitle }}</h3>
              <label class="toggle-switch">
                <input type="checkbox" v-model="config.background.enabled">
                <span class="toggle-slider"></span>
                <span class="toggle-label">{{ backgroundToggleLabel }}</span>
              </label>
            </div>

            <div class="setting-card" v-if="config.background.enabled">
              <h3>{{ copy.background.typeTitle }}</h3>
              <div class="radio-group">
                <label class="radio-btn">
                  <input type="radio" v-model="config.background.type" value="color">
                  <span>{{ copy.background.color }}</span>
                </label>
                <label class="radio-btn">
                  <input type="radio" v-model="config.background.type" value="image">
                  <span>{{ copy.background.image }}</span>
                </label>
                <label class="radio-btn">
                  <input type="radio" v-model="config.background.type" value="gradient">
                  <span>{{ copy.background.gradient }}</span>
                </label>
              </div>
            </div>

            <div class="setting-card" v-if="config.background.enabled">
              <h3>{{ copy.background.settingsTitle }}</h3>
              
              <!-- 纯色背景 -->
              <div v-if="config.background.type === 'color'" class="form-group">
                <label>{{ copy.background.pickColor }}</label>
                <div class="color-input">
                  <input type="color" v-model="config.background.color">
                  <input type="text" v-model="config.background.color">
                </div>
              </div>

              <!-- 图片背景 -->
              <div v-if="config.background.type === 'image'" class="background-image-setting">
                <div class="image-preview" v-if="config.background.image">
                  <img :src="config.background.image" alt="background">
                </div>
                <div class="image-actions">
                  <label class="btn btn-outline">
                    <input type="file" accept="image/*" @change="handleBackgroundUpload" hidden>
                    {{ copy.background.uploadImage }}
                  </label>
                  <input 
                    type="text" 
                    v-model="config.background.image" 
                    :placeholder="copy.background.imageUrlPlaceholder"
                    class="url-input"
                  >
                </div>
              </div>

              <!-- 渐变背景 -->
              <div v-if="config.background.type === 'gradient'" class="gradient-setting">
                <div class="form-grid gradient-grid">
                  <div class="form-group">
                    <label>{{ copy.background.startColor }}</label>
                    <div class="color-input">
                      <input type="color" v-model="config.background.gradientFrom">
                      <input type="text" v-model="config.background.gradientFrom">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>{{ copy.background.endColor }}</label>
                    <div class="color-input">
                      <input type="color" v-model="config.background.gradientTo">
                      <input type="text" v-model="config.background.gradientTo">
                    </div>
                  </div>
                  <div class="form-group full-width">
                    <label>{{ backgroundAngleLabel }}</label>
                    <input 
                      type="range" 
                      v-model.number="config.background.gradientAngle" 
                      min="0" 
                      max="360" 
                      step="1"
                    >
                  </div>
                </div>
                <div class="gradient-preview" :style="{ background: backgroundGradientPreview }"></div>
              </div>

              <div class="form-group" v-if="config.background.type === 'image'">
                <label>{{ backgroundOpacityLabel }}</label>
                <input 
                  type="range" 
                  v-model.number="config.background.opacity" 
                  min="0" 
                  max="1" 
                  step="0.05"
                >
              </div>
            </div>
          </section>

          <!-- 作品展示设置 -->
          <section v-if="currentTab === 'gallery'" class="settings-section">
            <h2>{{ copy.gallery.section }}</h2>
            
            <div class="setting-card">
              <h3>{{ copy.gallery.titleSettings }}</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>{{ copy.gallery.mainTitle }}</label>
                  <input type="text" v-model="config.gallery.title" :placeholder="copy.gallery.mainPlaceholder">
                </div>
                <div class="form-group">
                  <label>{{ copy.gallery.subtitle }}</label>
                  <input type="text" v-model="config.gallery.subtitle" :placeholder="copy.gallery.subtitlePlaceholder">
                </div>
              </div>
            </div>

            <div class="setting-card">
              <h3>{{ copy.gallery.manager }}</h3>
              <div class="works-list">
                <div 
                  v-for="(work, index) in config.gallery.works" 
                  :key="work.id"
                  class="work-item"
                >
                  <div class="work-preview">
                    <img :src="work.image" @error="handleImageError">
                  </div>
                  <div class="work-fields">
                    <input type="text" v-model="work.title" :placeholder="copy.gallery.workTitlePlaceholder">
                    <input type="text" v-model="work.category" :placeholder="copy.gallery.categoryPlaceholder">
                    <div class="image-input-row">
                      <label class="btn btn-sm btn-outline">
                        <input type="file" accept="image/*" @change="(e) => handleWorkUpload(e, index)" hidden>
                        {{ copy.gallery.uploadImage }}
                      </label>
                      <input type="text" v-model="work.image" :placeholder="copy.gallery.imageUrlPlaceholder">
                    </div>
                  </div>
                  <button class="btn-remove" @click="removeWork(index)" :title="copy.actions.deleteTitle">×</button>
                </div>
                
                <button class="btn btn-outline btn-add" @click="addWork">
                  {{ copy.gallery.add }}
                </button>
              </div>
            </div>
          </section>

          <!-- 站点信息设置 -->
          <section v-if="currentTab === 'site'" class="settings-section">
            <h2>{{ copy.site.section }}</h2>
            
            <div class="setting-card">
              <h3>{{ copy.site.siteInfoTitle }}</h3>
              <div class="form-group">
                <label>{{ copy.site.siteTitleLabel }}</label>
                <input type="text" v-model="config.site.name" placeholder="FUREST">
              </div>
            </div>

            <div class="setting-card">
              <h3>{{ copy.site.logoTitle }}</h3>
              <div class="logo-setting">
                <div
                  class="logo-preview"
                  :class="{ empty: !config.site.logo || logoPreviewFailed }"
                  :style="logoPreviewFrameStyle"
                >
                  <img
                    v-if="config.site.logo && !logoPreviewFailed"
                    :src="config.site.logo"
                    alt="logo"
                    :style="logoPreviewImageStyle"
                    @error="handleLogoPreviewError"
                  >
                  <span v-else>{{ config.site.name?.slice(0, 1) || copy.site.fallbackLogo }}</span>
                </div>
                <div class="logo-actions">
                  <label class="btn btn-outline">
                    <input type="file" accept="image/*" @change="handleLogoUpload" hidden>
                    {{ copy.site.uploadLogo }}
                  </label>
                  <input 
                    type="text" 
                    v-model="config.site.logo" 
                    :placeholder="copy.site.logoUrlPlaceholder"
                    class="url-input"
                    @input="logoPreviewFailed = false"
                  >
                </div>
              </div>
              <div class="logo-size-control">
                <div class="control-row">
                  <label>{{ copy.site.logoSize }}</label>
                  <span class="size-value">{{ config.site.logoSize }}px</span>
                </div>
                <div class="logo-size-inputs">
                  <input
                    type="range"
                    v-model.number="config.site.logoSize"
                    min="28"
                    max="120"
                    step="1"
                    @change="syncLogoSize"
                  >
                  <input
                    type="number"
                    v-model.number="config.site.logoSize"
                    min="28"
                    max="120"
                    step="1"
                    @change="syncLogoSize"
                    @blur="syncLogoSize"
                  >
                </div>
                <p class="hint">{{ copy.site.logoSizeHint }}</p>
              </div>
            </div>

            <div class="setting-card">
              <h3>{{ copy.site.fontTitle }}</h3>
              <div class="font-options">
                <button
                  v-for="font in siteFontOptionsList"
                  :key="font.value"
                  type="button"
                  class="font-option"
                  :class="{ active: config.site.fontFamily === font.value }"
                  :style="{ fontFamily: font.value }"
                  @click="config.site.fontFamily = font.value"
                >
                  <span class="font-option-name">{{ font.label }}</span>
                  <span class="font-option-preview">{{ font.preview }}</span>
                  <span class="font-option-sample">{{ copy.site.fontSample }}</span>
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- 保存成功提示 -->
    <Toast />
  </div>
</template>

<script>
import { ref, reactive, onMounted, onBeforeUnmount, nextTick, computed, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  getSavedPersonalization,
  getPreviewDraft,
  savePersonalization, 
  resetPersonalization,
  applyTheme,
  applyBackground,
  enterPreviewMode,
  buildGradientValue,
  getThemePresets,
  addThemePreset,
  removeThemePreset,
  fileToBase64,
  availablePlatforms,
  siteFontOptions
} from '../utils/personalization.js'
import { showToast } from '../utils/eventBus.js'
import Toast from '../components/Toast.vue'

const PERSONALIZATION_MESSAGES = {
  zh: {
    crop: {
      title: '✂️ 裁剪头像',
      sizeLabel: '裁剪框大小',
      hint: '💡 拖动方框移动位置，也可以使用滑块或四角手柄缩放裁剪区域',
      cancel: '取消',
      apply: '应用裁剪'
    },
    header: {
      title: '🎨 个性化设置',
      subtitle: '自定义您的个人空间，展现独特风格'
    },
    tabs: {
      profile: '个人信息',
      theme: '主题配色',
      hero: '首页轮播',
      background: '页面背景',
      gallery: '作品展示',
      site: '站点信息'
    },
    actions: {
      save: '💾 保存设置',
      preview: '👁️ 预览效果',
      reset: '🔄 恢复默认',
      rename: '修改名字',
      finish: '完成',
      deleteTitle: '删除'
    },
    profile: {
      section: '👤 个人信息',
      avatarTitle: '头像设置',
      uploadAvatar: '📷 上传头像',
      recrop: '✂️ 重新裁剪',
      basicInfo: '基本信息',
      displayName: '显示名称',
      displayNamePlaceholder: '您的名称',
      tags: '职业标签',
      tagPlaceholder: '添加标签（如：插画师）',
      bio: '个人简介',
      bioPlaceholder: '介绍一下自己...',
      emails: '联系邮箱',
      addEmail: '+ 添加邮箱',
      social: '社交链接',
      socialPlaceholder: '输入链接地址',
      addSocial: '+ 添加社交链接'
    },
    theme: {
      section: '🎨 主题配色',
      presetsTitle: '预设配色方案',
      builtInTitle: '内置方案',
      builtInDesc: '适合快速切换整体氛围',
      customTitle: '自定义方案',
      customDesc: '这里会收纳你手动添加的配色方案',
      customCount: '{count} 个',
      customEmpty: '还没有自定义方案，设置好颜色后点击“添加到预设方案”即可收录到这里。',
      customColorTitle: '自定义颜色',
      currentName: '当前名字',
      namePlaceholder: '请输入方案名称',
      addToPresets: '添加到预设方案',
      primary: '主色调',
      primaryDark: '深色主调',
      secondary: '辅助色',
      accent: '强调色',
      bgLight: '背景浅色',
      defaultPresetPrefix: '自定义方案'
    },
    hero: {
      section: '🖼️ 首页轮播图',
      manager: '轮播图片管理',
      note: '首页会直接使用这里的轮播图内容，不再单独提供轮播开关。',
      titlePlaceholder: '标题',
      descPlaceholder: '描述',
      replaceImage: '📷 更换图片',
      add: '+ 添加轮播图',
      newTitle: '新轮播图',
      newDesc: '点击编辑描述文字'
    },
    background: {
      section: '🌅 页面背景',
      toggleTitle: '背景开关',
      enabled: '启用自定义背景',
      disabled: '使用默认背景',
      typeTitle: '背景类型',
      color: '纯色',
      image: '图片',
      gradient: '渐变',
      settingsTitle: '背景设置',
      pickColor: '选择颜色',
      uploadImage: '📷 上传背景图',
      imageUrlPlaceholder: '或输入图片URL',
      startColor: '起始颜色',
      endColor: '结束颜色',
      angle: '渐变角度: {value}°',
      opacity: '不透明度: {value}%'
    },
    gallery: {
      section: '🎨 作品展示',
      titleSettings: '标题设置',
      mainTitle: '主标题',
      mainPlaceholder: '作品集',
      subtitle: '副标题',
      subtitlePlaceholder: '精选作品展示',
      manager: '作品管理',
      workTitlePlaceholder: '作品标题',
      categoryPlaceholder: '分类',
      uploadImage: '📷 上传',
      imageUrlPlaceholder: '或输入图片URL',
      add: '+ 添加作品',
      newTitle: '新作品',
      newCategory: '插画'
    },
    site: {
      section: '🌐 站点信息',
      siteInfoTitle: '站点名称',
      siteTitleLabel: '网站标题',
      logoTitle: 'Logo 设置',
      uploadLogo: '📷 上传 Logo',
      logoUrlPlaceholder: '或输入图片URL',
      logoSize: 'Logo 图片大小',
      logoSizeHint: '调整后会同时作用于顶部导航栏的 Logo 图片。',
      fontTitle: '字体风格',
      fontSample: 'OpenBlog 个性化标题',
      fallbackLogo: 'Logo',
      fontOptions: [
        { label: '清晰黑体', preview: '结构清晰，适合内容展示' },
        { label: '圆润现代', preview: '更轻盈的现代界面风格' },
        { label: '雅致宋体', preview: '偏编辑感，适合站点标题展示' },
        { label: '手写楷体', preview: '更有个性和作品集气质' },
        { label: '经典衬线', preview: '更偏传统杂志式排版' }
      ]
    },
    presets: {
      '森林绿': '森林绿',
      '海洋蓝': '海洋蓝',
      '樱花粉': '樱花粉',
      '紫罗兰': '紫罗兰',
      '薄荷青': '薄荷青',
      '日落橙': '日落橙',
      '暗夜黑': '暗夜黑'
    },
    platforms: {
      twitter: 'Twitter',
      instagram: 'Instagram',
      pixiv: 'Pixiv',
      weibo: '微博',
      bilibili: 'Bilibili',
      github: 'GitHub',
      youtube: 'YouTube',
      facebook: 'Facebook',
      discord: 'Discord',
      telegram: 'Telegram',
      xiaohongshu: '小红书',
      zhihu: '知乎',
      douyin: '抖音',
      custom: '自定义'
    },
    messages: {
      saveSuccess: '设置已保存！',
      saveFailed: '保存失败，请重试',
      resetConfirm: '确定要恢复默认设置吗？所有自定义内容将丢失。',
      resetSuccess: '已恢复默认设置',
      presetApplied: '已应用「{name}」主题',
      presetDuplicate: '当前配色已存在于「{name}」中',
      presetAddFailed: '添加预设失败，请重试',
      presetAdded: '已添加「{name}」到预设方案',
      presetDeleteConfirm: '确定删除自定义方案「{name}」吗？',
      presetDeleteFailed: '删除失败，请重试',
      presetDeleted: '已删除「{name}」',
      uploadFailed: '上传失败',
      avatarCropped: '头像裁剪完成',
      keepOneEmail: '至少保留一个邮箱',
      logoUploadSuccess: 'Logo上传成功',
      backgroundUploadSuccess: '背景图上传成功',
      imageUploadSuccess: '图片上传成功',
      keepOneSlide: '至少保留一张轮播图'
    },
    imageFallback: '图片加载失败'
  },
  en: {
    crop: {
      title: '✂️ Crop Avatar',
      sizeLabel: 'Crop Size',
      hint: '💡 Drag the frame to move it, or use the slider and corner handles to resize the crop area.',
      cancel: 'Cancel',
      apply: 'Apply Crop'
    },
    header: {
      title: '🎨 Personalization',
      subtitle: 'Customize your personal space and show your own style'
    },
    tabs: {
      profile: 'Profile',
      theme: 'Theme',
      hero: 'Hero',
      background: 'Background',
      gallery: 'Gallery',
      site: 'Site'
    },
    actions: {
      save: '💾 Save Settings',
      preview: '👁️ Preview',
      reset: '🔄 Reset',
      rename: 'Rename',
      finish: 'Done',
      deleteTitle: 'Delete'
    },
    profile: {
      section: '👤 Profile',
      avatarTitle: 'Avatar',
      uploadAvatar: '📷 Upload Avatar',
      recrop: '✂️ Re-crop',
      basicInfo: 'Basic Info',
      displayName: 'Display Name',
      displayNamePlaceholder: 'Your name',
      tags: 'Tags',
      tagPlaceholder: 'Add a tag, for example: Illustrator',
      bio: 'Bio',
      bioPlaceholder: 'Tell visitors about yourself...',
      emails: 'Email Addresses',
      addEmail: '+ Add Email',
      social: 'Social Links',
      socialPlaceholder: 'Enter link URL',
      addSocial: '+ Add Social Link'
    },
    theme: {
      section: '🎨 Theme Colors',
      presetsTitle: 'Preset Palettes',
      builtInTitle: 'Built-in Palettes',
      builtInDesc: 'Quickly switch the overall visual mood',
      customTitle: 'Custom Palettes',
      customDesc: 'Palettes you add manually will appear here',
      customCount: '{count} saved',
      customEmpty: 'No custom palettes yet. Configure your colors and click "Add to Presets" to save one here.',
      customColorTitle: 'Custom Colors',
      currentName: 'Current Name',
      namePlaceholder: 'Enter a palette name',
      addToPresets: 'Add to Presets',
      primary: 'Primary',
      primaryDark: 'Primary Dark',
      secondary: 'Secondary',
      accent: 'Accent',
      bgLight: 'Light Background',
      defaultPresetPrefix: 'Custom Palette'
    },
    hero: {
      section: '🖼️ Hero Carousel',
      manager: 'Hero Slides',
      note: 'The homepage now uses the slides here directly, so there is no separate hero toggle.',
      titlePlaceholder: 'Title',
      descPlaceholder: 'Description',
      replaceImage: '📷 Replace Image',
      add: '+ Add Slide',
      newTitle: 'New Slide',
      newDesc: 'Click to edit the description'
    },
    background: {
      section: '🌅 Page Background',
      toggleTitle: 'Background Toggle',
      enabled: 'Use custom background',
      disabled: 'Use default background',
      typeTitle: 'Background Type',
      color: 'Solid Color',
      image: 'Image',
      gradient: 'Gradient',
      settingsTitle: 'Background Settings',
      pickColor: 'Choose Color',
      uploadImage: '📷 Upload Background',
      imageUrlPlaceholder: 'Or enter an image URL',
      startColor: 'Start Color',
      endColor: 'End Color',
      angle: 'Gradient Angle: {value}°',
      opacity: 'Opacity: {value}%'
    },
    gallery: {
      section: '🎨 Gallery',
      titleSettings: 'Title Settings',
      mainTitle: 'Main Title',
      mainPlaceholder: 'Gallery',
      subtitle: 'Subtitle',
      subtitlePlaceholder: 'Featured works showcase',
      manager: 'Works Manager',
      workTitlePlaceholder: 'Work Title',
      categoryPlaceholder: 'Category',
      uploadImage: '📷 Upload',
      imageUrlPlaceholder: 'Or enter an image URL',
      add: '+ Add Work',
      newTitle: 'New Work',
      newCategory: 'Illustration'
    },
    site: {
      section: '🌐 Site Info',
      siteInfoTitle: 'Site Name',
      siteTitleLabel: 'Website Title',
      logoTitle: 'Logo',
      uploadLogo: '📷 Upload Logo',
      logoUrlPlaceholder: 'Or enter an image URL',
      logoSize: 'Logo Image Size',
      logoSizeHint: 'This also updates the logo image shown in the top navigation bar.',
      fontTitle: 'Font Style',
      fontSample: 'OpenBlog Personalization Title',
      fallbackLogo: 'Logo',
      fontOptions: [
        { label: 'Clean Sans', preview: 'Clear structure, good for readable content' },
        { label: 'Soft Modern', preview: 'A lighter and more modern UI feel' },
        { label: 'Elegant Song', preview: 'More editorial and title-focused' },
        { label: 'Handwritten Kai', preview: 'More personality for portfolio pages' },
        { label: 'Classic Serif', preview: 'Closer to a traditional magazine style' }
      ]
    },
    presets: {
      '森林绿': 'Forest Green',
      '海洋蓝': 'Ocean Blue',
      '樱花粉': 'Sakura Pink',
      '紫罗兰': 'Violet',
      '薄荷青': 'Mint Teal',
      '日落橙': 'Sunset Orange',
      '暗夜黑': 'Midnight Black'
    },
    platforms: {
      twitter: 'Twitter',
      instagram: 'Instagram',
      pixiv: 'Pixiv',
      weibo: 'Weibo',
      bilibili: 'Bilibili',
      github: 'GitHub',
      youtube: 'YouTube',
      facebook: 'Facebook',
      discord: 'Discord',
      telegram: 'Telegram',
      xiaohongshu: 'Xiaohongshu',
      zhihu: 'Zhihu',
      douyin: 'Douyin',
      custom: 'Custom'
    },
    messages: {
      saveSuccess: 'Settings saved.',
      saveFailed: 'Failed to save settings. Please try again.',
      resetConfirm: 'Reset everything to defaults? All custom content will be lost.',
      resetSuccess: 'Settings have been reset.',
      presetApplied: 'Applied "{name}" theme.',
      presetDuplicate: 'This palette already exists in "{name}".',
      presetAddFailed: 'Failed to add the preset. Please try again.',
      presetAdded: 'Added "{name}" to presets.',
      presetDeleteConfirm: 'Delete the custom palette "{name}"?',
      presetDeleteFailed: 'Failed to delete the preset. Please try again.',
      presetDeleted: 'Deleted "{name}".',
      uploadFailed: 'Upload failed.',
      avatarCropped: 'Avatar cropped successfully.',
      keepOneEmail: 'Keep at least one email address.',
      logoUploadSuccess: 'Logo uploaded successfully.',
      backgroundUploadSuccess: 'Background image uploaded successfully.',
      imageUploadSuccess: 'Image uploaded successfully.',
      keepOneSlide: 'Keep at least one slide.'
    },
    imageFallback: 'Image Load Failed'
  }
}

export default {
  name: 'Personalization',
  components: { Toast },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const i18n = inject('i18n')
    const locale = computed(() => i18n.getLocale())
    const copy = computed(() => PERSONALIZATION_MESSAGES[locale.value] || PERSONALIZATION_MESSAGES.zh)
    const formatCopy = (message, params = {}) => String(message || '').replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '')
    const currentTab = ref('profile')
    const MIN_CROP_SIZE_DISPLAY = 60
    const createEmptyCropSelection = () => ({ x: 0, y: 0, size: 0 })
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
    const getDefaultThemePresetName = () => `${copy.value.theme.defaultPresetPrefix} ${themePresetOptions.value.filter(preset => preset.isCustom).length + 1}`
    const themePresetOptions = ref(getThemePresets())
    const builtInThemePresetOptions = computed(() => themePresetOptions.value.filter(preset => !preset.isCustom))
    const customThemePresetOptions = computed(() => themePresetOptions.value.filter(preset => preset.isCustom))
    const currentThemePresetName = ref(getDefaultThemePresetName())
    const isEditingThemePresetName = ref(false)
    const themePresetNameInput = ref(null)
    const lastThemePresetName = ref(currentThemePresetName.value)
    const logoPreviewFailed = ref(false)
    
    // 头像裁剪相关
    const showCropModal = ref(false)
    const cropImageSrc = ref('')
    const originalImageSrc = ref('')
    const cropImageMetrics = reactive({
      naturalWidth: 0,
      naturalHeight: 0,
      displayWidth: 0,
      displayHeight: 0
    })
    const cropSelection = ref(createEmptyCropSelection())
    const interaction = reactive({
      active: false,
      mode: null,
      handle: null,
      startPointer: { x: 0, y: 0 },
      startSelection: createEmptyCropSelection(),
      anchor: { x: 0, y: 0 }
    })
    const resizeObserver = ref(null)
    
    // 标签输入
    const newTag = ref('')
    
    const tabs = computed(() => [
      { id: 'profile', name: copy.value.tabs.profile, icon: '👤' },
      { id: 'theme', name: copy.value.tabs.theme, icon: '🎨' },
      { id: 'hero', name: copy.value.tabs.hero, icon: '🖼️' },
      { id: 'background', name: copy.value.tabs.background, icon: '🌅' },
      { id: 'gallery', name: copy.value.tabs.gallery, icon: '🎨' },
      { id: 'site', name: copy.value.tabs.site, icon: '🌐' }
    ])

    // 创建响应式配置对象
    const config = reactive(getPreviewDraft() || getSavedPersonalization())
    
    // 确保新字段存在（兼容旧数据）
    if (!config.profile.tags) config.profile.tags = ['插画师', '设计师']
    if (!config.profile.emails) config.profile.emails = [config.profile.email || 'contact@example.com']
    if (!config.site.fontFamily) config.site.fontFamily = siteFontOptions[0].value
    config.hero.enabled = true
    if (!Array.isArray(config.profile.social)) {
      config.profile.social = [
        { platform: 'twitter', url: config.profile.social?.twitter || '', icon: '🐦', name: 'Twitter' },
        { platform: 'instagram', url: config.profile.social?.instagram || '', icon: '📷', name: 'Instagram' },
        { platform: 'pixiv', url: config.profile.social?.pixiv || '', icon: '🎨', name: 'Pixiv' },
        { platform: 'weibo', url: config.profile.social?.weibo || '', icon: '📝', name: '微博' },
        { platform: 'bilibili', url: config.profile.social?.bilibili || '', icon: '📺', name: 'Bilibili' }
      ]
    }

    // 计算属性
    const hasCropSelection = computed(() => {
      return cropSelection.value.size > 0 &&
        cropImageMetrics.naturalWidth > 0 &&
        cropImageMetrics.naturalHeight > 0 &&
        cropImageMetrics.displayWidth > 0 &&
        cropImageMetrics.displayHeight > 0
    })

    const displayScaleX = computed(() => {
      return cropImageMetrics.naturalWidth
        ? cropImageMetrics.displayWidth / cropImageMetrics.naturalWidth
        : 0
    })

    const displayScaleY = computed(() => {
      return cropImageMetrics.naturalHeight
        ? cropImageMetrics.displayHeight / cropImageMetrics.naturalHeight
        : 0
    })

    const displayScale = computed(() => {
      if (!displayScaleX.value || !displayScaleY.value) return 0
      return Math.min(displayScaleX.value, displayScaleY.value)
    })

    const displayCropFrame = computed(() => {
      if (!hasCropSelection.value) {
        return { x: 0, y: 0, size: 0 }
      }

      return {
        x: cropSelection.value.x * displayScaleX.value,
        y: cropSelection.value.y * displayScaleY.value,
        size: cropSelection.value.size * displayScale.value
      }
    })

    const maxCropSize = computed(() => {
      return Math.round(Math.min(cropImageMetrics.displayWidth, cropImageMetrics.displayHeight))
    })

    const minCropSize = computed(() => {
      if (!maxCropSize.value) return MIN_CROP_SIZE_DISPLAY
      return Math.max(1, Math.min(MIN_CROP_SIZE_DISPLAY, maxCropSize.value))
    })

    const cropDisplaySize = computed(() => {
      return hasCropSelection.value ? displayCropFrame.value.size : 0
    })

    const cropSliderSize = computed({
      get: () => Math.round(cropDisplaySize.value),
      set: (nextSize) => resizeSelectionFromCenter(Number(nextSize))
    })
    
    // 裁剪选择框样式
    const selectionStyle = computed(() => ({
      left: displayCropFrame.value.x + 'px',
      top: displayCropFrame.value.y + 'px',
      width: displayCropFrame.value.size + 'px',
      height: displayCropFrame.value.size + 'px',
      cursor: interaction.active && interaction.mode === 'move' ? 'grabbing' : 'grab'
    }))
    
    // 顶部遮罩
    const topMaskStyle = computed(() => ({
      top: 0,
      left: 0,
      right: 0,
      height: Math.max(0, displayCropFrame.value.y) + 'px'
    }))
    
    // 底部遮罩
    const bottomMaskStyle = computed(() => ({
      bottom: 0,
      left: 0,
      right: 0,
      height: Math.max(0, cropImageMetrics.displayHeight - displayCropFrame.value.y - displayCropFrame.value.size) + 'px'
    }))
    
    // 左侧遮罩
    const leftMaskStyle = computed(() => ({
      top: displayCropFrame.value.y + 'px',
      left: 0,
      width: Math.max(0, displayCropFrame.value.x) + 'px',
      height: Math.max(0, displayCropFrame.value.size) + 'px'
    }))
    
    // 右侧遮罩
    const rightMaskStyle = computed(() => ({
      top: displayCropFrame.value.y + 'px',
      right: 0,
      width: Math.max(0, cropImageMetrics.displayWidth - displayCropFrame.value.x - displayCropFrame.value.size) + 'px',
      height: Math.max(0, displayCropFrame.value.size) + 'px'
    }))

    const getPresetDisplayName = (preset) => {
      if (!preset) return ''
      return preset.isCustom ? preset.name : (copy.value.presets[preset.name] || preset.name)
    }
    const customPresetCountLabel = computed(() => formatCopy(copy.value.theme.customCount, {
      count: customThemePresetOptions.value.length
    }))
    const themeNameToggleLabel = computed(() => (
      isEditingThemePresetName.value ? copy.value.actions.finish : copy.value.actions.rename
    ))
    const backgroundToggleLabel = computed(() => (
      config.background.enabled ? copy.value.background.enabled : copy.value.background.disabled
    ))
    const backgroundAngleLabel = computed(() => formatCopy(copy.value.background.angle, {
      value: config.background.gradientAngle
    }))
    const backgroundOpacityLabel = computed(() => formatCopy(copy.value.background.opacity, {
      value: Math.round(config.background.opacity * 100)
    }))
    const availablePlatformsList = computed(() => availablePlatforms.map(platform => ({
      ...platform,
      name: copy.value.platforms[platform.platform] || platform.name
    })))
    const siteFontOptionsList = computed(() => siteFontOptions.map((font, index) => ({
      ...font,
      label: copy.value.site.fontOptions[index]?.label || font.label,
      preview: copy.value.site.fontOptions[index]?.preview || font.preview
    })))
    const backgroundGradientPreview = computed(() => buildGradientValue(config.background))
    const clampedLogoSize = computed(() => {
      const numericSize = Number(config.site.logoSize)
      if (!Number.isFinite(numericSize)) return 56
      return Math.min(Math.max(Math.round(numericSize), 28), 120)
    })
    const logoPreviewFrameStyle = computed(() => {
      const frameSize = Math.max(92, clampedLogoSize.value + 24)
      return {
        width: `${frameSize}px`,
        height: `${frameSize}px`
      }
    })
    const logoPreviewImageStyle = computed(() => ({
      width: `${clampedLogoSize.value}px`,
      height: `${clampedLogoSize.value}px`
    }))

    const refreshThemePresetOptions = () => {
      themePresetOptions.value = getThemePresets()
    }

    const syncLogoSize = () => {
      config.site.logoSize = clampedLogoSize.value
    }

    // 保存设置
    const saveSettings = () => {
      syncLogoSize()
      config.hero.enabled = true
      if (savePersonalization(config)) {
        applyTheme(config.theme, config.site)
        applyBackground(config.background)
        showToast(copy.value.messages.saveSuccess, 'success')
      } else {
        showToast(copy.value.messages.saveFailed, 'error')
      }
    }

    // 预览效果
    const previewSettings = () => {
      syncLogoSize()
      config.hero.enabled = true
      enterPreviewMode(config)
      
      // 保存当前设置状态到 sessionStorage，用于返回时恢复
      sessionStorage.setItem('personalization_preview', JSON.stringify({
        tab: currentTab.value,
        scrollY: window.scrollY
      }))
      
      // 跳转到首页预览
      router.push({
        path: '/',
        query: { preview: '1' }
      })
    }

    // 重置设置
    const resetSettings = () => {
      if (confirm(copy.value.messages.resetConfirm)) {
        // 重置为默认配置
        resetPersonalization()
        
        // 重新加载默认配置
        const freshConfig = getSavedPersonalization()
        Object.assign(config, freshConfig)
        config.hero.enabled = true
        refreshThemePresetOptions()
        currentThemePresetName.value = getDefaultThemePresetName()
        lastThemePresetName.value = currentThemePresetName.value
        isEditingThemePresetName.value = false
        logoPreviewFailed.value = false
        
        // 确保新格式字段
        if (!config.profile.tags) config.profile.tags = ['插画师', '设计师']
        if (!config.profile.emails) config.profile.emails = ['contact@example.com']
        if (!Array.isArray(config.profile.social)) {
          config.profile.social = [
            { platform: 'twitter', url: '', icon: '🐦', name: 'Twitter' },
            { platform: 'instagram', url: '', icon: '📷', name: 'Instagram' },
            { platform: 'pixiv', url: '', icon: '🎨', name: 'Pixiv' },
            { platform: 'weibo', url: '', icon: '📝', name: '微博' },
            { platform: 'bilibili', url: '', icon: '📺', name: 'Bilibili' }
          ]
        }
        
        // 清除裁剪相关状态
        closeCropModal()
        cropImageSrc.value = ''
        originalImageSrc.value = ''
        cropSelection.value = createEmptyCropSelection()
        cropImageMetrics.naturalWidth = 0
        cropImageMetrics.naturalHeight = 0
        cropImageMetrics.displayWidth = 0
        cropImageMetrics.displayHeight = 0
        
        showToast(copy.value.messages.resetSuccess, 'success')
      }
    }

    // 应用预设主题
    const applyPreset = (preset) => {
      const { name, isCustom, ...themeValues } = preset
      Object.assign(config.theme, themeValues)
      currentThemePresetName.value = getPresetDisplayName(preset)
      lastThemePresetName.value = getPresetDisplayName(preset)
      isEditingThemePresetName.value = false
      showToast(formatCopy(copy.value.messages.presetApplied, {
        name: getPresetDisplayName(preset)
      }), 'success')
    }

    const startThemePresetNameEdit = async () => {
      lastThemePresetName.value = currentThemePresetName.value
      isEditingThemePresetName.value = true
      await nextTick()
      themePresetNameInput.value?.focus()
      themePresetNameInput.value?.select()
    }

    const finishThemePresetNameEdit = () => {
      currentThemePresetName.value = currentThemePresetName.value.trim() || getDefaultThemePresetName()
      lastThemePresetName.value = currentThemePresetName.value
      isEditingThemePresetName.value = false
    }

    const cancelThemePresetNameEdit = () => {
      currentThemePresetName.value = lastThemePresetName.value || getDefaultThemePresetName()
      isEditingThemePresetName.value = false
    }

    const toggleThemePresetNameEdit = () => {
      if (isEditingThemePresetName.value) {
        finishThemePresetNameEdit()
        return
      }

      startThemePresetNameEdit()
    }

    const addCurrentThemeToPresets = () => {
      finishThemePresetNameEdit()

      const result = addThemePreset({
        name: currentThemePresetName.value,
        ...config.theme
      })

      if (!result.ok) {
        if (result.reason === 'duplicate') {
          showToast(formatCopy(copy.value.messages.presetDuplicate, {
            name: getPresetDisplayName(result.preset)
          }), 'info')
          return
        }

        showToast(copy.value.messages.presetAddFailed, 'error')
        return
      }

      refreshThemePresetOptions()
      currentThemePresetName.value = result.preset.name
      lastThemePresetName.value = result.preset.name
      showToast(formatCopy(copy.value.messages.presetAdded, {
        name: getPresetDisplayName(result.preset)
      }), 'success')
    }

    const deleteCustomThemePreset = (preset) => {
      if (!preset?.isCustom) return
      if (!confirm(formatCopy(copy.value.messages.presetDeleteConfirm, {
        name: getPresetDisplayName(preset)
      }))) {
        return
      }

      const result = removeThemePreset(preset.name)
      if (!result.ok) {
        showToast(copy.value.messages.presetDeleteFailed, 'error')
        return
      }

      refreshThemePresetOptions()
      if (currentThemePresetName.value === preset.name) {
        currentThemePresetName.value = getDefaultThemePresetName()
        lastThemePresetName.value = currentThemePresetName.value
      }
      showToast(formatCopy(copy.value.messages.presetDeleted, {
        name: getPresetDisplayName(preset)
      }), 'success')
    }

    // ========== 头像裁剪功能 ==========
    const cropArea = ref(null)
    const cropImageRef = ref(null)

    const syncDisplayedImageSize = () => {
      if (!cropImageRef.value) return

      const rect = cropImageRef.value.getBoundingClientRect()
      cropImageMetrics.displayWidth = rect.width
      cropImageMetrics.displayHeight = rect.height
    }

    const stopResizeObserver = () => {
      if (resizeObserver.value) {
        resizeObserver.value.disconnect()
        resizeObserver.value = null
      }
    }

    const startResizeObserver = () => {
      stopResizeObserver()

      if (!cropImageRef.value || typeof ResizeObserver === 'undefined') {
        return
      }

      resizeObserver.value = new ResizeObserver(() => {
        syncDisplayedImageSize()
      })
      resizeObserver.value.observe(cropImageRef.value)
    }

    const getMinCropSizeNatural = () => {
      if (!displayScale.value) return 0

      const naturalMinSize = minCropSize.value / displayScale.value
      return Math.min(
        Math.min(cropImageMetrics.naturalWidth, cropImageMetrics.naturalHeight),
        naturalMinSize
      )
    }

    const clampSelectionWithinImage = (selection, minimumSize = getMinCropSizeNatural()) => {
      const maxSize = Math.min(cropImageMetrics.naturalWidth, cropImageMetrics.naturalHeight)
      const minSize = Math.min(maxSize, Math.max(0, minimumSize || 0))
      const size = clamp(selection.size, minSize, maxSize)

      return {
        x: clamp(selection.x, 0, cropImageMetrics.naturalWidth - size),
        y: clamp(selection.y, 0, cropImageMetrics.naturalHeight - size),
        size
      }
    }

    const initializeCropSelection = () => {
      const minDimension = Math.min(cropImageMetrics.naturalWidth, cropImageMetrics.naturalHeight)
      if (!minDimension) return

      const defaultSize = clamp(
        minDimension * 0.5,
        getMinCropSizeNatural() || 0,
        minDimension
      )

      cropSelection.value = {
        x: (cropImageMetrics.naturalWidth - defaultSize) / 2,
        y: (cropImageMetrics.naturalHeight - defaultSize) / 2,
        size: defaultSize
      }
    }

    const resizeSelectionFromCenter = (nextDisplaySize) => {
      if (!hasCropSelection.value || !displayScale.value) return

      const requestedDisplaySize = clamp(
        Number(nextDisplaySize) || 0,
        minCropSize.value,
        maxCropSize.value
      )
      const requestedNaturalSize = requestedDisplaySize / displayScale.value
      const centerX = cropSelection.value.x + (cropSelection.value.size / 2)
      const centerY = cropSelection.value.y + (cropSelection.value.size / 2)
      const maxSize = 2 * Math.min(
        centerX,
        centerY,
        cropImageMetrics.naturalWidth - centerX,
        cropImageMetrics.naturalHeight - centerY
      )
      const minSize = Math.min(getMinCropSizeNatural(), maxSize)
      const size = clamp(requestedNaturalSize, minSize, maxSize)

      cropSelection.value = clampSelectionWithinImage({
        x: centerX - (size / 2),
        y: centerY - (size / 2),
        size
      }, minSize)
    }

    const getPointerPositionInNatural = (event) => {
      const cropAreaRect = cropArea.value?.getBoundingClientRect()
      if (!cropAreaRect || !displayScaleX.value || !displayScaleY.value) {
        return null
      }

      return {
        x: (event.clientX - cropAreaRect.left) / displayScaleX.value,
        y: (event.clientY - cropAreaRect.top) / displayScaleY.value
      }
    }

    const getResizeAnchor = (selection, handle) => {
      switch (handle) {
        case 'tl':
          return { x: selection.x + selection.size, y: selection.y + selection.size }
        case 'tr':
          return { x: selection.x, y: selection.y + selection.size }
        case 'bl':
          return { x: selection.x + selection.size, y: selection.y }
        case 'br':
          return { x: selection.x, y: selection.y }
        default:
          return { x: 0, y: 0 }
      }
    }

    const getMaxResizeSize = (handle, anchor) => {
      switch (handle) {
        case 'tl':
          return Math.min(anchor.x, anchor.y)
        case 'tr':
          return Math.min(cropImageMetrics.naturalWidth - anchor.x, anchor.y)
        case 'bl':
          return Math.min(anchor.x, cropImageMetrics.naturalHeight - anchor.y)
        case 'br':
          return Math.min(cropImageMetrics.naturalWidth - anchor.x, cropImageMetrics.naturalHeight - anchor.y)
        default:
          return 0
      }
    }

    const buildSelectionFromHandle = (handle, anchor, size) => {
      switch (handle) {
        case 'tl':
          return { x: anchor.x - size, y: anchor.y - size, size }
        case 'tr':
          return { x: anchor.x, y: anchor.y - size, size }
        case 'bl':
          return { x: anchor.x - size, y: anchor.y, size }
        case 'br':
          return { x: anchor.x, y: anchor.y, size }
        default:
          return createEmptyCropSelection()
      }
    }

    const removePointerListeners = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopInteraction)
      window.removeEventListener('pointercancel', stopInteraction)
    }

    const stopInteraction = () => {
      interaction.active = false
      interaction.mode = null
      interaction.handle = null
      removePointerListeners()
    }

    const startInteraction = (event, mode, handle = null) => {
      if (!hasCropSelection.value) return
      if (event.button !== undefined && event.button !== 0) return

      stopInteraction()

      interaction.active = true
      interaction.mode = mode
      interaction.handle = handle
      interaction.startPointer = { x: event.clientX, y: event.clientY }
      interaction.startSelection = { ...cropSelection.value }
      interaction.anchor = handle
        ? getResizeAnchor(cropSelection.value, handle)
        : { x: 0, y: 0 }

      window.addEventListener('pointermove', onPointerMove, { passive: false })
      window.addEventListener('pointerup', stopInteraction)
      window.addEventListener('pointercancel', stopInteraction)
    }

    const startMove = (event) => {
      startInteraction(event, 'move')
    }

    const startResize = (event, handle) => {
      startInteraction(event, 'resize', handle)
    }

    const onPointerMove = (event) => {
      if (!interaction.active) return
      event.preventDefault()

      if (interaction.mode === 'move') {
        const deltaX = (event.clientX - interaction.startPointer.x) / displayScaleX.value
        const deltaY = (event.clientY - interaction.startPointer.y) / displayScaleY.value

        cropSelection.value = clampSelectionWithinImage({
          x: interaction.startSelection.x + deltaX,
          y: interaction.startSelection.y + deltaY,
          size: interaction.startSelection.size
        }, interaction.startSelection.size)
        return
      }

      if (interaction.mode === 'resize' && interaction.handle) {
        const pointer = getPointerPositionInNatural(event)
        if (!pointer) return

        let deltaX = 0
        let deltaY = 0

        switch (interaction.handle) {
          case 'tl':
            deltaX = interaction.anchor.x - pointer.x
            deltaY = interaction.anchor.y - pointer.y
            break
          case 'tr':
            deltaX = pointer.x - interaction.anchor.x
            deltaY = interaction.anchor.y - pointer.y
            break
          case 'bl':
            deltaX = interaction.anchor.x - pointer.x
            deltaY = pointer.y - interaction.anchor.y
            break
          case 'br':
            deltaX = pointer.x - interaction.anchor.x
            deltaY = pointer.y - interaction.anchor.y
            break
        }

        const maxSize = getMaxResizeSize(interaction.handle, interaction.anchor)
        const minSize = Math.min(getMinCropSizeNatural(), maxSize)
        const size = clamp((deltaX + deltaY) / 2, minSize, maxSize)

        cropSelection.value = buildSelectionFromHandle(interaction.handle, interaction.anchor, size)
      }
    }
    
    // 图片加载完成
    const onImageLoad = async () => {
      if (!cropImageRef.value) return

      cropImageMetrics.naturalWidth = cropImageRef.value.naturalWidth
      cropImageMetrics.naturalHeight = cropImageRef.value.naturalHeight

      await nextTick()
      syncDisplayedImageSize()

      if (cropSelection.value.size > 0) {
        cropSelection.value = clampSelectionWithinImage(cropSelection.value)
      } else {
        initializeCropSelection()
      }

      startResizeObserver()
    }
    
    // 头像上传
    const handleAvatarUpload = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const base64 = await fileToBase64(file)
          originalImageSrc.value = base64
          cropImageSrc.value = base64
          cropSelection.value = createEmptyCropSelection()
          cropImageMetrics.naturalWidth = 0
          cropImageMetrics.naturalHeight = 0
          cropImageMetrics.displayWidth = 0
          cropImageMetrics.displayHeight = 0
          showCropModal.value = true
          await nextTick()

          if (cropImageRef.value?.complete) {
            onImageLoad()
          }
        } catch (err) {
          showToast(copy.value.messages.uploadFailed, 'error')
        } finally {
          e.target.value = ''
        }
      }
    }

    // 重新打开裁剪
    const reopenCrop = async () => {
      if (originalImageSrc.value) {
        cropImageSrc.value = originalImageSrc.value
        showCropModal.value = true
        await nextTick()

        if (cropImageRef.value?.complete) {
          onImageLoad()
        }
      }
    }

    // 关闭裁剪弹窗
    const closeCropModal = () => {
      showCropModal.value = false
      stopInteraction()
      stopResizeObserver()
    }

    // 应用裁剪
    const applyCrop = () => {
      if (!originalImageSrc.value || !cropSelection.value.size) return

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const size = cropSelection.value.size
      
      // 设置输出尺寸（头像通常用正方形，但限制最大尺寸）
      const outputSize = Math.max(1, Math.min(Math.round(size), 400))
      canvas.width = outputSize
      canvas.height = outputSize
      
      const img = new Image()
      img.onload = () => {
        // 使用更好的图像质量
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        ctx.drawImage(
          img,
          cropSelection.value.x,
          cropSelection.value.y,
          size,
          size,
          0,
          0,
          outputSize,
          outputSize
        )
        config.profile.avatar = canvas.toDataURL('image/jpeg', 0.9)
        closeCropModal()
        showToast(copy.value.messages.avatarCropped, 'success')
      }
      img.src = originalImageSrc.value
    }

    // ========== 标签管理 ==========
    const addTag = () => {
      const tag = newTag.value.trim()
      if (tag && !config.profile.tags.includes(tag)) {
        config.profile.tags.push(tag)
        newTag.value = ''
      }
    }

    const removeTag = (index) => {
      config.profile.tags.splice(index, 1)
    }

    // ========== 邮箱管理 ==========
    const addEmail = () => {
      config.profile.emails.push('')
    }

    const removeEmail = (index) => {
      if (config.profile.emails.length > 1) {
        config.profile.emails.splice(index, 1)
      } else {
        showToast(copy.value.messages.keepOneEmail, 'error')
      }
    }

    // ========== 社交链接管理 ==========
    const addSocial = () => {
      config.profile.social.push({ platform: 'custom', url: '', icon: '🔗', name: copy.value.platforms.custom })
    }

    const removeSocial = (index) => {
      config.profile.social.splice(index, 1)
    }

    // Logo上传
    const handleLogoUpload = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const base64 = await fileToBase64(file)
          config.site.logo = base64
          logoPreviewFailed.value = false
          showToast(copy.value.messages.logoUploadSuccess, 'success')
        } catch (err) {
          showToast(copy.value.messages.uploadFailed, 'error')
        } finally {
          e.target.value = ''
        }
      }
    }

    const handleLogoPreviewError = () => {
      logoPreviewFailed.value = true
    }

    // 背景图上传
    const handleBackgroundUpload = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const base64 = await fileToBase64(file)
          config.background.image = base64
          showToast(copy.value.messages.backgroundUploadSuccess, 'success')
        } catch (err) {
          showToast(copy.value.messages.uploadFailed, 'error')
        } finally {
          e.target.value = ''
        }
      }
    }

    // 轮播图上传
    const handleSlideUpload = async (e, index) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const base64 = await fileToBase64(file)
          config.hero.slides[index].image = base64
          showToast(copy.value.messages.imageUploadSuccess, 'success')
        } catch (err) {
          showToast(copy.value.messages.uploadFailed, 'error')
        } finally {
          e.target.value = ''
        }
      }
    }

    // 作品上传
    const handleWorkUpload = async (e, index) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const base64 = await fileToBase64(file)
          config.gallery.works[index].image = base64
          showToast(copy.value.messages.imageUploadSuccess, 'success')
        } catch (err) {
          showToast(copy.value.messages.uploadFailed, 'error')
        } finally {
          e.target.value = ''
        }
      }
    }

    // 图片加载失败处理
    const handleImageError = (e) => {
      e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(copy.value.imageFallback)}`
    }

    // 添加轮播图
    const addSlide = () => {
      config.hero.slides.push({
        image: 'https://via.placeholder.com/1200x600',
        title: copy.value.hero.newTitle,
        desc: copy.value.hero.newDesc
      })
    }

    // 删除轮播图
    const removeSlide = (index) => {
      if (config.hero.slides.length <= 1) {
        showToast(copy.value.messages.keepOneSlide, 'error')
        return
      }
      config.hero.slides.splice(index, 1)
    }

    // 添加作品
    const addWork = () => {
      config.gallery.works.push({
        id: Date.now(),
        image: 'https://via.placeholder.com/600x400',
        title: copy.value.gallery.newTitle,
        category: copy.value.gallery.newCategory
      })
    }

    // 删除作品
    const removeWork = (index) => {
      config.gallery.works.splice(index, 1)
    }

    const handlePersonalizationChange = (e) => {
      Object.assign(config, e.detail)
      if (config.hero) {
        config.hero.enabled = true
      }
      config.site.logoSize = clampedLogoSize.value
      logoPreviewFailed.value = false
    }

    onMounted(() => {
      // 实时预览
      window.addEventListener('personalization-changed', handlePersonalizationChange)
      
      // 检查是否是预览后返回
      const savedState = sessionStorage.getItem('personalization_preview')
      if (savedState && route.query.from === 'preview') {
        const { tab, scrollY } = JSON.parse(savedState)
        currentTab.value = tab || 'profile'
        nextTick(() => {
          window.scrollTo(0, scrollY || 0)
        })
        sessionStorage.removeItem('personalization_preview')
      }
    })

    onBeforeUnmount(() => {
      window.removeEventListener('personalization-changed', handlePersonalizationChange)
      stopInteraction()
      stopResizeObserver()
    })

    return {
      copy,
      currentTab,
      tabs,
      config,
      themePresetOptions,
      builtInThemePresetOptions,
      customThemePresetOptions,
      customPresetCountLabel,
      currentThemePresetName,
      isEditingThemePresetName,
      themeNameToggleLabel,
      themePresetNameInput,
      logoPreviewFailed,
      showCropModal,
      cropImageSrc,
      cropArea,
      cropImageRef,
      hasCropSelection,
      cropDisplaySize,
      cropSliderSize,
      minCropSize,
      maxCropSize,
      selectionStyle,
      topMaskStyle,
      bottomMaskStyle,
      leftMaskStyle,
      rightMaskStyle,
      newTag,
      getPresetDisplayName,
      availablePlatformsList,
      siteFontOptionsList,
      backgroundToggleLabel,
      backgroundAngleLabel,
      backgroundOpacityLabel,
      backgroundGradientPreview,
      logoPreviewFrameStyle,
      logoPreviewImageStyle,
      syncLogoSize,
      saveSettings,
      previewSettings,
      resetSettings,
      applyPreset,
      toggleThemePresetNameEdit,
      finishThemePresetNameEdit,
      cancelThemePresetNameEdit,
      addCurrentThemeToPresets,
      deleteCustomThemePreset,
      onImageLoad,
      handleAvatarUpload,
      reopenCrop,
      closeCropModal,
      startMove,
      startResize,
      applyCrop,
      addTag,
      removeTag,
      addEmail,
      removeEmail,
      addSocial,
      removeSocial,
      handleLogoUpload,
      handleLogoPreviewError,
      handleBackgroundUpload,
      handleSlideUpload,
      handleWorkUpload,
      handleImageError,
      addSlide,
      removeSlide,
      addWork,
      removeWork
    }
  }
}
</script>

<style scoped>
.personalization-page {
  min-height: 100vh;
  background: var(--bg-light);
}

/* 裁剪弹窗 */
.crop-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.crop-modal-content {
  background: var(--white);
  border-radius: var(--radius);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.crop-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.crop-modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-dark);
}

.crop-container {
  padding: 20px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 裁剪包装器 */
.crop-wrapper {
  position: relative;
  display: inline-block;
  max-width: 100%;
  border-radius: 4px;
  overflow: hidden;
  line-height: 0;
}

/* 原始图片 - 保持原样 */
.crop-original-image {
  max-width: 100%;
  max-height: 400px;
  display: block;
}

/* 四边遮罩 */
.crop-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

/* 裁剪选择框 - 可拖拽 */
.crop-selection {
  position: absolute;
  z-index: 20;
  touch-action: none;
  user-select: none;
  box-sizing: border-box;
}

.selection-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 3px solid white;
  border-radius: 2px;
  box-shadow: 
    0 0 0 2px var(--primary-color),
    inset 0 0 0 1px rgba(0,0,0,0.3);
  pointer-events: none;
}

/* 九宫格辅助线 */
.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.6);
}

.grid-line.h1 {
  top: 33.33%;
  left: 0;
  right: 0;
  height: 1px;
}

.grid-line.h2 {
  top: 66.66%;
  left: 0;
  right: 0;
  height: 1px;
}

.grid-line.v1 {
  left: 33.33%;
  top: 0;
  bottom: 0;
  width: 1px;
}

.grid-line.v2 {
  left: 66.66%;
  top: 0;
  bottom: 0;
  width: 1px;
}

/* 四个角的调整手柄 */
.corner-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.18);
  z-index: 30;
  touch-action: none;
}

.corner-handle.tl {
  top: -8px;
  left: -8px;
  cursor: nw-resize;
}

.corner-handle.tr {
  top: -8px;
  right: -8px;
  cursor: ne-resize;
}

.corner-handle.bl {
  bottom: -8px;
  left: -8px;
  cursor: sw-resize;
}

.corner-handle.br {
  bottom: -8px;
  right: -8px;
  cursor: se-resize;
}

.crop-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 10px;
}

.crop-controls {
  width: 100%;
  max-width: 400px;
  margin-top: 20px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.control-row label {
  font-weight: 500;
}

.size-value {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.size-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 3px;
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
}

.size-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.crop-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.personalization-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 30px;
  padding: 30px 0;
}

/* 侧边导航 */
.settings-nav {
  position: sticky;
  top: 90px;
  height: fit-content;
}

.nav-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  margin-bottom: 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 15px 20px;
  background: none;
  border: none;
  cursor: pointer;
  transition: var(--transition);
  font-size: 1rem;
  color: var(--text-dark);
  text-align: left;
}

.nav-btn:hover {
  background: var(--bg-light);
}

.nav-btn.active {
  background: var(--primary-color);
  color: var(--white);
}

.nav-icon {
  font-size: 1.2rem;
}

.action-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

/* 设置内容区 */
.settings-content {
  min-height: 600px;
}

.settings-section h2 {
  margin-bottom: 20px;
  color: var(--text-dark);
}

.setting-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 25px;
  margin-bottom: 20px;
}

.setting-card h3 {
  margin-bottom: 20px;
  color: var(--text-dark);
  font-size: 1.1rem;
}

.setting-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.setting-card-header h3 {
  margin-bottom: 0;
}

.theme-custom-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-name-label {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
}

.theme-name-editor {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-name-value {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-light);
  color: var(--text-dark);
  font-weight: 600;
}

.theme-name-input {
  min-width: 220px;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  transition: var(--transition);
  font-family: inherit;
}

.theme-name-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.add-preset-btn {
  flex-shrink: 0;
}

.section-note {
  margin-bottom: 18px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

/* 表单布局 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-dark);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

/* 头像设置 */
.avatar-setting {
  display: flex;
  align-items: center;
  gap: 25px;
}

.avatar-preview img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 标签输入 */
.tags-input {
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  padding: 10px;
  background: var(--white);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--primary-color);
  color: var(--white);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--white);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  opacity: 0.8;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-add-row {
  display: flex;
  gap: 8px;
}

.tag-add-row input {
  flex: 1;
  border: none;
  padding: 8px;
  background: transparent;
}

.tag-add-row input:focus {
  outline: none;
}

.btn-sm {
  padding: 8px 15px;
  font-size: 0.9rem;
}

/* 邮箱列表 */
.emails-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.email-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.email-item input {
  flex: 1;
}

/* 社交链接 */
.social-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.platform-select {
  width: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 1rem;
}

.social-item input {
  flex: 1;
}

/* 颜色输入 */
.color-input {
  display: flex;
  gap: 10px;
}

.color-input input[type="color"] {
  width: 50px;
  height: 45px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.color-input input[type="text"] {
  flex: 1;
}

/* 主题预设 */
.preset-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preset-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.preset-group-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.preset-group-header h4 {
  margin: 0;
  color: var(--text-dark);
}

.preset-group-header p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.88rem;
}

.preset-group-count {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--bg-light);
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

.theme-presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.custom-theme-presets {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.preset-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-btn {
  background: var(--white);
  border: 2px solid #eee;
  border-radius: var(--radius-sm);
  padding: 15px;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preset-btn:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.preset-colors {
  display: flex;
  gap: 5px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.preset-name {
  font-size: 0.85rem;
  color: var(--text-dark);
}

.preset-delete-btn {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #f1c5c2;
  border-radius: var(--radius-sm);
  background: #fff5f5;
  color: #c0392b;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
}

.preset-delete-btn:hover {
  background: #fde9e7;
  border-color: #e0a39d;
}

.preset-empty {
  padding: 18px;
  border: 1px dashed #ddd;
  border-radius: var(--radius-sm);
  background: var(--bg-light);
  color: var(--text-muted);
  font-size: 0.92rem;
}

/* 开关 */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  width: 50px;
  height: 26px;
  background: #ccc;
  border-radius: 13px;
  position: relative;
  transition: var(--transition);
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: var(--transition);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--primary-color);
}

.toggle-switch input:checked + .toggle-slider::after {
  left: 27px;
}

.toggle-label {
  font-weight: 500;
}

/* 单选组 */
.radio-group {
  display: flex;
  gap: 20px;
}

.radio-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.radio-btn:has(input:checked) {
  border-color: var(--primary-color);
  background: rgba(107, 142, 107, 0.1);
}

.radio-btn input {
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

/* 背景图片设置 */
.background-image-setting {
  margin-bottom: 20px;
}

.gradient-setting {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gradient-grid {
  gap: 16px;
}

.gradient-preview {
  width: 100%;
  height: 140px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.image-preview {
  margin-bottom: 15px;
}

.image-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.url-input {
  margin-top: 10px;
}

/* 轮播图列表 */
.slides-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slide-item {
  display: grid;
  grid-template-columns: 150px 1fr 40px;
  gap: 15px;
  align-items: start;
  padding: 15px;
  background: var(--bg-light);
  border-radius: var(--radius-sm);
}

.slide-preview img {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.slide-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slide-fields input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
}

.image-input-row {
  display: flex;
  gap: 10px;
}

.image-input-row input {
  flex: 1;
}

.btn-remove {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e74c3c;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove:hover {
  background: #c0392b;
  transform: scale(1.1);
}

.btn-add {
  padding: 15px;
  border: 2px dashed #ddd;
}

.btn-add:hover {
  border-color: var(--primary-color);
}

/* 作品列表 */
.works-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.work-item {
  background: var(--bg-light);
  border-radius: var(--radius-sm);
  padding: 15px;
  position: relative;
}

.work-preview img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
}

.work-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-fields input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
}

.work-item .btn-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  font-size: 1.2rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 5px;
}

/* Logo 设置 */
.logo-setting {
  display: flex;
  align-items: center;
  gap: 25px;
}

.logo-preview {
  width: 92px;
  height: 92px;
  border-radius: var(--radius-sm);
  background: var(--bg-light);
  border: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-preview.empty {
  color: var(--primary-color);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.logo-size-control {
  margin-top: 20px;
}

.logo-size-inputs {
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 12px;
  align-items: center;
}

.logo-size-inputs input[type="range"] {
  width: 100%;
}

.logo-size-inputs input[type="number"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
}

.font-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.font-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border: 2px solid #e8e8e8;
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--text-dark);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.font-option:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.font-option.active {
  border-color: var(--primary-color);
  box-shadow: 0 10px 24px rgba(107, 142, 107, 0.12);
  background: linear-gradient(135deg, rgba(107, 142, 107, 0.08), rgba(255, 255, 255, 0.96));
}

.font-option-name {
  font-size: 1rem;
  font-weight: 700;
}

.font-option-preview {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.font-option-sample {
  font-size: 1.1rem;
  line-height: 1.4;
}

/* 响应式 */
@media (max-width: 1024px) {
  .personalization-layout {
    grid-template-columns: 1fr;
  }
  
  .settings-nav {
    position: static;
  }
  
  .nav-card {
    display: flex;
    flex-wrap: wrap;
  }
  
  .nav-btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .theme-presets {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .slide-item {
    grid-template-columns: 1fr;
  }
  
  .slide-preview img {
    width: 100%;
    height: 150px;
  }
  
  .avatar-setting,
  .logo-setting {
    flex-direction: column;
    text-align: center;
  }

  .setting-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .preset-group-header {
    flex-direction: column;
    align-items: stretch;
  }

  .theme-name-editor {
    width: 100%;
    align-items: stretch;
  }

  .theme-name-input {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .theme-presets {
    grid-template-columns: repeat(2, 1fr);
  }

  .font-options {
    grid-template-columns: 1fr;
  }
  
  .social-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .platform-select {
    width: 100%;
  }
}
</style>
