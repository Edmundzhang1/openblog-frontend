<template>
  <div class="personalization-page fade-in">
    <!-- v2 SaaS适配：权限检查 -->
    <div v-if="!canEdit" class="permission-denied">
      <div class="container">
        <h2>⚠️ 无权访问</h2>
        <p>只有空间主人才能编辑个性化设置</p>
        <button class="btn btn-primary" @click="goToSpaceHome">返回空间首页</button>
      </div>
    </div>
    
    <!-- 原有内容（仅主人可见） -->
    <div v-else class="personalization-content">
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

                <div v-if="platformThemePresetOptions.length" class="preset-group">
                  <div class="preset-group-header">
                    <div>
                      <h4>{{ copy.theme.platformTitle }}</h4>
                      <p>{{ copy.theme.platformDesc }}</p>
                    </div>
                  </div>
                  <div class="theme-presets">
                    <button 
                      v-for="preset in platformThemePresetOptions" 
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

          <!-- 页面布局设置 -->
          <section v-if="currentTab === 'layout'" class="settings-section">
            <h2>{{ copy.layout.section }}</h2>

            <!-- 模块显隐 -->
            <div class="setting-card">
              <h3>{{ copy.layout.modulesTitle }}</h3>
              <p class="section-note">{{ copy.layout.modulesDesc }}</p>
              <div class="layout-modules">
                <label v-for="mod in layoutModuleList" :key="mod.key" class="toggle-switch">
                  <input type="checkbox" v-model="config.modules[mod.key]">
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">{{ mod.label }}</span>
                </label>
              </div>
            </div>

            <!-- 模块排序 -->
            <div class="setting-card">
              <h3>{{ copy.layout.orderTitle }}</h3>
              <p class="section-note">{{ copy.layout.orderDesc }}</p>
              <div class="layout-order-list">
                <div v-for="(key, index) in config.sectionOrder" :key="key" class="layout-order-item">
                  <span class="layout-order-name">{{ copy.layout.orderNames[key] || key }}</span>
                  <div class="layout-order-actions">
                    <button class="btn btn-sm btn-outline" :disabled="index === 0" @click="moveSection(index, -1)">
                      ↑ {{ copy.layout.moveUp }}
                    </button>
                    <button class="btn btn-sm btn-outline" :disabled="index === config.sectionOrder.length - 1" @click="moveSection(index, 1)">
                      ↓ {{ copy.layout.moveDown }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 内容置顶 -->
            <div class="setting-card">
              <h3>{{ copy.layout.pinnedTitle }}</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>{{ copy.layout.pinnedMoment }}</label>
                  <select v-model="config.pinned.momentId">
                    <option :value="null">{{ copy.layout.pinnedNone }}</option>
                    <option v-for="moment in moments" :key="moment.id" :value="moment.id">
                      {{ moment.title || (moment.content || '').slice(0, 20) }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>{{ copy.layout.pinnedWork }}</label>
                  <select v-model="config.pinned.workId">
                    <option :value="null">{{ copy.layout.pinnedNone }}</option>
                    <option v-for="work in config.gallery.works" :key="work.id" :value="work.id">
                      {{ work.title }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 自定义板块 -->
            <div class="setting-card">
              <h3>{{ copy.layout.sectionsTitle }}</h3>
              <p class="section-note">{{ copy.layout.sectionsDesc }}</p>
              <div class="custom-section-list">
                <div v-for="(section, index) in config.customSections" :key="section.id" class="custom-section-item">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="section.enabled">
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">{{ section.title || copy.layout.sectionTitlePlaceholder }}</span>
                  </label>
                  <div class="layout-order-actions">
                    <button class="btn btn-sm btn-outline" :disabled="index === 0" @click="moveCustomSection(index, -1)">↑</button>
                    <button class="btn btn-sm btn-outline" :disabled="index === config.customSections.length - 1" @click="moveCustomSection(index, 1)">↓</button>
                    <button class="btn btn-sm btn-outline" @click="startEditCustomSection(section)">{{ copy.layout.editSection }}</button>
                    <button class="btn btn-small btn-danger" @click="removeCustomSection(index)">{{ copy.actions.deleteTitle }}</button>
                  </div>
                </div>
              </div>

              <!-- 板块编辑器 -->
              <div v-if="editingCustomSection" class="custom-section-editor">
                <div class="form-group">
                  <label>{{ copy.layout.sectionTitleLabel }}</label>
                  <input v-model="customSectionForm.title" :placeholder="copy.layout.sectionTitlePlaceholder">
                </div>
                <div class="form-group">
                  <label>{{ copy.layout.sectionContentLabel }}</label>
                  <textarea v-model="customSectionForm.content" rows="6" :placeholder="copy.layout.sectionContentPlaceholder"></textarea>
                  <p class="hint">{{ copy.layout.htmlHint }}</p>
                </div>
                <div class="action-row">
                  <button class="btn btn-outline" @click="cancelEditCustomSection">{{ copy.layout.cancelEdit }}</button>
                  <button class="btn btn-primary" @click="saveCustomSection">{{ copy.layout.saveSection }}</button>
                </div>
              </div>

              <button v-if="!editingCustomSection" class="btn btn-outline btn-add" @click="startAddCustomSection">
                {{ copy.layout.addSection }}
              </button>
            </div>

            <!-- 自定义 CSS -->
            <div class="setting-card">
              <h3>{{ copy.layout.cssTitle }}</h3>
              <p class="section-note">{{ copy.layout.cssDesc }}</p>
              <div class="form-group">
                <textarea v-model="config.customCSS" rows="8" class="custom-css-input" :placeholder="copy.layout.cssPlaceholder"></textarea>
                <p class="hint hint-warning">{{ copy.layout.cssWarning }}</p>
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

          <!-- 关于页面设置 -->
          <section v-if="currentTab === 'about'" class="settings-section">
            <h2>{{ copy.about.section }}</h2>
            
            <!-- 空状态提示 -->
            <div v-if="aboutSections.length === 0" class="empty-state-card">
              <div class="empty-icon">📝</div>
              <p>{{ copy.about.emptyHint }}</p>
            </div>
            
            <!-- 添加新板块 -->
            <div class="setting-card">
              <h3>{{ copy.about.addSectionTitle }} <small>({{ aboutSections.length }}/{{ maxAboutSections }})</small></h3>
              <div class="add-category-row">
                <input v-model="newSectionTitle" :placeholder="copy.about.sectionPlaceholder" @keypress.enter="addAboutSection">
                <button 
                  class="btn btn-outline" 
                  @click="addAboutSection"
                  :disabled="aboutSections.length >= maxAboutSections"
                >
                  {{ copy.about.addSection }}
                </button>
              </div>
            </div>

            <!-- 动态板块列表 -->
            <div v-for="(section, sectionIndex) in aboutSections" :key="section.id" class="setting-card">
              <div class="section-header-with-action">
                <h3>
                  <input v-model="section.title" class="section-title-input" :placeholder="copy.about.sectionNamePlaceholder">
                </h3>
                <button class="btn btn-small btn-danger" @click="removeAboutSection(sectionIndex)">{{ copy.actions.deleteTitle }}</button>
              </div>
              
              <div v-for="(item, itemIndex) in section.items" :key="itemIndex" class="about-item-editor">
                <div class="form-grid">
                  <div class="form-group">
                    <label>{{ copy.about.iconLabel }}</label>
                    <input v-model="item.icon" placeholder="如: 🎨">
                  </div>
                  <div class="form-group">
                    <label>{{ copy.about.dateLabel }}</label>
                    <input v-model="item.date" placeholder="如: 2023年">
                  </div>
                </div>
                <div class="form-group">
                  <label>{{ copy.about.titleLabel }}</label>
                  <input v-model="item.title" placeholder="标题">
                </div>
                <div class="form-group">
                  <label>{{ copy.about.nameLabel }}</label>
                  <input v-model="item.name" placeholder="名称">
                </div>
                <div class="form-group">
                  <label>{{ copy.about.roleLabel }}</label>
                  <input v-model="item.role" placeholder="职位/角色">
                </div>
                <div class="form-group">
                  <label>{{ copy.about.descLabel }}</label>
                  <textarea v-model="item.desc" placeholder="描述" rows="2"></textarea>
                </div>
                <button class="btn btn-small btn-danger" @click="removeAboutItem(sectionIndex, itemIndex)">{{ copy.actions.deleteTitle }}</button>
              </div>
              <button class="btn btn-outline btn-add" @click="addAboutItem(sectionIndex)">{{ copy.about.addItem }}</button>
            </div>

            <div class="action-card">
              <button class="btn btn-primary btn-block" @click="saveAbout" :disabled="aboutSaving">
                {{ aboutSaving ? 'Saving...' : copy.about.saveAbout }}
              </button>
            </div>
          </section>

          <!-- 联系方式管理 -->
          <section v-if="currentTab === 'contact'" class="settings-section">
            <h2>{{ copy.contact.section }}</h2>
            
            <!-- 基本信息 -->
            <div class="setting-card">
              <h3>{{ copy.contact.basicInfo }}</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>QQ</label>
                  <input v-model="contactData.qq" placeholder="如: 123456789">
                </div>
                <div class="form-group">
                  <label>{{ copy.contact.wechatLabel }}</label>
                  <input v-model="contactData.wechat" placeholder="如: mywechat">
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input v-model="contactData.email" placeholder="如: contact@example.com" type="email">
                </div>
              </div>
            </div>

            <!-- 社交平台 -->
            <div class="setting-card">
              <h3>{{ copy.contact.socialTitle }} <small>({{ contactData.socials.length }}/{{ maxSocials }})</small></h3>
              <div v-for="(item, index) in contactData.socials" :key="index" class="social-item-editor">
                <div class="form-grid">
                  <div class="form-group">
                    <label>{{ copy.contact.platformLabel }}</label>
                    <select v-model="item.name">
                      <option value="bilibili">📺 Bilibili</option>
                      <option value="xiaohongshu">📕 小红书</option>
                      <option value="twitter">𝕏 Twitter</option>
                      <option value="weibo">📝 微博</option>
                      <option value="website">🌐 个人网站</option>
                      <option value="custom">🔗 其他</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ copy.contact.urlLabel }}</label>
                    <input v-model="item.url" placeholder="https://...">
                  </div>
                </div>
                <button class="btn btn-small btn-danger" @click="removeSocial(index)">{{ copy.actions.deleteTitle }}</button>
              </div>
              <button 
                class="btn btn-outline btn-add" 
                @click="addSocial"
                :disabled="contactData.socials.length >= maxSocials"
              >
                {{ copy.contact.addSocial }} ({{ contactData.socials.length }}/{{ maxSocials }})
              </button>
            </div>

            <!-- FAQ -->
            <div class="setting-card">
              <h3>{{ copy.contact.faqTitle }}</h3>
              <div v-for="(item, index) in contactData.faq" :key="index" class="about-item-editor">
                <div class="form-group">
                  <label>{{ copy.contact.questionLabel }}</label>
                  <input v-model="item.q" placeholder="问题">
                </div>
                <div class="form-group">
                  <label>{{ copy.contact.answerLabel }}</label>
                  <textarea v-model="item.a" placeholder="回答" rows="3"></textarea>
                </div>
                <button class="btn btn-small btn-danger" @click="removeFaq(index)">{{ copy.actions.deleteTitle }}</button>
              </div>
              <button class="btn btn-outline btn-add" @click="addFaq">{{ copy.contact.addFaq }}</button>
            </div>

            <div class="action-card">
              <button class="btn btn-primary btn-block" @click="saveContact" :disabled="contactSaving">
                {{ contactSaving ? 'Saving...' : copy.contact.saveContact }}
              </button>
            </div>
          </section>

          <!-- 动态管理 -->
          <section v-if="currentTab === 'moments'" class="settings-section">
            <h2>{{ copy.moments.section }}</h2>
            
            <!-- 添加/编辑动态 -->
            <div v-if="editingMoment" class="setting-card">
              <h3>{{ editingMoment.isNew ? copy.moments.addMoment : copy.moments.editMoment }}</h3>
              
              <div class="form-group">
                <label>{{ copy.moments.titleLabel }}</label>
                <input v-model="momentForm.title" :placeholder="copy.moments.titlePlaceholder" type="text">
              </div>
              
              <div class="form-group">
                <label>{{ copy.moments.categoryLabel }}</label>
                <div class="category-select-row">
                  <select v-model="momentForm.category">
                    <option value="">{{ copy.moments.selectCategory }}</option>
                    <option v-for="cat in momentCategories" :key="cat" :value="cat">{{ cat }}</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label>{{ copy.moments.contentLabel }}</label>
                <textarea v-model="momentForm.content" :placeholder="copy.moments.contentPlaceholder" rows="4"></textarea>
              </div>
              
              <div class="form-group">
                <label>{{ copy.moments.imagesLabel }}</label>
                <div class="moment-images-editor">
                  <div v-for="(img, index) in momentForm.images" :key="index" class="moment-image-item">
                    <img :src="img" @error="handleImageError">
                    <button class="btn btn-small btn-danger" @click="removeImageFromMoment(index)">{{ copy.moments.removeImage }}</button>
                  </div>
                </div>
                <div class="add-image-row">
                  <input v-model="newImageUrl" placeholder="图片 URL">
                  <button class="btn btn-outline" @click="addImageToMoment">{{ copy.moments.addImage }}</button>
                </div>
              </div>
              
              <div class="form-group">
                <label>{{ copy.moments.visibilityLabel }}</label>
                <div class="radio-group">
                  <label class="radio-btn">
                    <input type="radio" v-model="momentForm.visibility" value="public">
                    <span>{{ copy.moments.visibilityPublic }}</span>
                  </label>
                  <label class="radio-btn">
                    <input type="radio" v-model="momentForm.visibility" value="private">
                    <span>{{ copy.moments.visibilityPrivate }}</span>
                  </label>
                </div>
              </div>
              
              <div class="action-row">
                <button class="btn btn-outline" @click="cancelEditMoment">{{ copy.moments.cancelEdit }}</button>
                <button class="btn btn-primary" @click="saveMoment" :disabled="momentSaving">
                  {{ momentSaving ? 'Saving...' : (editingMoment.isNew ? copy.moments.createMoment : copy.moments.saveMoment) }}
                </button>
              </div>
            </div>
            
            <!-- 分类管理 -->
            <div class="setting-card" v-if="!editingMoment">
              <h3>{{ copy.moments.categoryTitle }} <small>({{ momentCategories.length }}/{{ maxCategories }})</small></h3>
              <div class="category-list">
                <span v-for="(cat, index) in momentCategories" :key="index" class="category-tag">
                  {{ cat }}
                  <button class="btn-remove" @click="removeCategory(index)">×</button>
                </span>
              </div>
              <div class="add-category-row">
                <input v-model="newCategory" :placeholder="copy.moments.newCategoryPlaceholder" @keypress.enter="addCategory">
                <button class="btn btn-outline" @click="addCategory" :disabled="momentCategories.length >= maxCategories">
                  {{ copy.moments.addCategory }}
                </button>
              </div>
            </div>

            <!-- 动态列表 -->
            <div class="setting-card">
              <div class="section-header-with-action">
                <h3>{{ copy.moments.listTitle }}</h3>
                <button v-if="!editingMoment" class="btn btn-primary" @click="startAddMoment">{{ copy.moments.addMoment }}</button>
              </div>
              
              <div v-if="momentsLoading" class="loading-state">
                <div class="spinner">📝</div>
                <p>加载中...</p>
              </div>
              
              <div v-else-if="moments.length === 0" class="empty-state">
                <div class="empty-icon">💬</div>
                <p>{{ copy.moments.noMoments }}</p>
              </div>
              
              <div v-else class="moments-list">
                <div v-for="moment in moments" :key="moment.id" class="moment-card">
                  <div class="moment-header">
                    <div class="moment-badges">
                      <span class="moment-visibility">{{ moment.visibility === 'public' ? copy.moments.visibilityPublic : copy.moments.visibilityPrivate }}</span>
                      <span v-if="moment.category" class="moment-category">{{ moment.category }}</span>
                    </div>
                    <span class="moment-date">{{ moment.created_at }}</span>
                  </div>
                  <h4 v-if="moment.title" class="moment-title">{{ moment.title }}</h4>
                  <p class="moment-content">{{ moment.content }}</p>
                  <div v-if="moment.images?.length" class="moment-images">
                    <img v-for="(img, idx) in moment.images" :key="idx" :src="img" @error="handleImageError">
                  </div>
                  <div class="moment-actions">
                    <button class="btn btn-small btn-outline" @click="startEditMoment(moment)">{{ copy.actions.rename }}</button>
                    <button class="btn btn-small btn-danger" @click="deleteMoment(moment)">{{ copy.actions.deleteTitle }}</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <!-- 保存成功提示 -->
    <Toast />
  </div>
    </div><!-- /v2 SaaS适配 -->
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
  fetchPlatformPresets,
  addThemePreset,
  removeThemePreset,
  fileToBase64,
  availablePlatforms,
  siteFontOptions,
  configToBackend,
  configFromBackend,
  sanitizeHTML,
  sanitizeCSS
} from '../utils/personalization.js'
import { showToast, apiRequest } from '../utils/eventBus.js'
import Toast from '../components/Toast.vue'
import { getMyAboutAPI, updateMyAboutAPI, getMyContactAPI, updateMyContactAPI, getMyMomentsAPI, createMomentAPI, updateMomentAPI, deleteMomentAPI } from '@/api/artist.js'
import { PERSONALIZATION_IMAGES } from '../config/assets.js'

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
      layout: '页面布局',
      background: '页面背景',
      gallery: '作品展示',
      site: '站点信息',
      about: '关于页面',
      moments: '动态',
      contact: '联系方式'
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
      platformTitle: '平台预设',
      platformDesc: '由平台管理员发布的官方配色方案',
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
    layout: {
      section: '🧩 页面布局',
      modulesTitle: '模块显隐',
      modulesDesc: '控制主页各模块是否展示',
      moduleNames: {
        hero: '首页轮播',
        gallery: '作品画廊',
        moments: '动态',
        about: '关于入口',
        contact: '联系入口',
        calendar: '排单日历',
        commission: '约稿入口'
      },
      orderTitle: '模块排序',
      orderDesc: '调整主页各模块的显示顺序（custom 代表自定义板块区）',
      orderNames: {
        hero: '首页轮播',
        gallery: '作品画廊',
        calendar: '排单日历',
        moments: '动态',
        about: '关于入口',
        contact: '联系入口',
        custom: '自定义板块'
      },
      moveUp: '上移',
      moveDown: '下移',
      pinnedTitle: '内容置顶',
      pinnedMoment: '置顶动态',
      pinnedWork: '置顶作品',
      pinnedNone: '不置顶',
      sectionsTitle: '自定义板块',
      sectionsDesc: '在主页添加自定义内容板块，可在上方「模块排序」中调整位置',
      sectionTitleLabel: '板块标题',
      sectionTitlePlaceholder: '板块标题',
      sectionContentLabel: '板块内容',
      sectionContentPlaceholder: '支持 <p><b><i><u><a><ul><ol><li><h3><h4><blockquote><br><img> 等常用标签',
      htmlHint: '支持常用 HTML 标签，保存时会自动过滤不安全内容',
      addSection: '+ 添加板块',
      editSection: '编辑',
      saveSection: '保存板块',
      cancelEdit: '取消',
      deleteConfirm: '确定删除这个自定义板块吗？',
      emptyContent: '标题和内容不能同时为空',
      cssTitle: '自定义 CSS',
      cssDesc: '仅作用于你的主页',
      cssPlaceholder: '例如：.hero-section { padding-top: 32px; }',
      cssWarning: '⚠️ 自定义 CSS 可能破坏页面布局，请谨慎使用；保存时会自动过滤危险内容'
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
    about: {
      section: '📝 关于页面',
      emptyHint: '点击下方按钮添加板块（如：工作室历史、团队成员、服务范围等）',
      addSectionTitle: '添加板块',
      sectionPlaceholder: '输入板块名称，如：荣誉奖项、作品展示等',
      sectionNamePlaceholder: '板块名称',
      addSection: '+ 添加板块',
      maxSections: '板块数量已达上限（最多6个）',
      addItem: '+ 添加条目',
      dateLabel: '日期',
      datePlaceholder: '如: 2023年',
      titleLabel: '标题',
      descLabel: '描述',
      iconLabel: '图标',
      iconPlaceholder: '如: 🎨',
      nameLabel: '名称',
      roleLabel: '职位/角色',
      rolePlaceholder: '如: 主画师',
      saveAbout: '保存关于页面',
      saveSuccess: '关于页面保存成功',
      saveFailed: '关于页面保存失败'
    },
    moments: {
      section: '📝 动态管理',
      listTitle: '动态列表',
      categoryTitle: '分类管理',
      categoryLabel: '分类',
      selectCategory: '选择分类',
      addCategory: '+ 添加分类',
      newCategoryPlaceholder: '输入新分类名称',
      maxCategories: '分类数量已达上限',
      categoryExists: '分类已存在',
      titleLabel: '标题',
      titlePlaceholder: '输入标题（可选）',
      contentLabel: '内容',
      contentPlaceholder: '分享你的创作心得、新作预告...',
      imagesLabel: '图片',
      addImage: '+ 添加图片',
      removeImage: '删除',
      visibilityLabel: '可见性',
      visibilityPublic: '公开',
      visibilityPrivate: '仅自己',
      addMoment: '+ 发布动态',
      editMoment: '编辑动态',
      saveMoment: '保存动态',
      createMoment: '发布动态',
      cancelEdit: '取消',
      deleteConfirm: '确定删除这条动态吗？',
      noMoments: '还没有发布过动态',
      createdAt: '发布于',
      saveSuccess: '动态保存成功',
      saveFailed: '动态保存失败',
      deleteSuccess: '动态已删除',
      deleteFailed: '删除失败'
    },
    contact: {
      section: '📞 联系方式',
      basicInfo: '基本信息',
      wechatLabel: '微信',
      socialTitle: '社交平台',
      platformLabel: '平台',
      urlLabel: '链接',
      addSocial: '+ 添加平台',
      faqTitle: '常见问题 (FAQ)',
      questionLabel: '问题',
      answerLabel: '回答',
      addFaq: '+ 添加FAQ',
      saveContact: '保存联系方式',
      saveSuccess: '联系方式保存成功',
      saveFailed: '联系方式保存失败'
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
      layout: 'Layout',
      background: 'Background',
      gallery: 'Gallery',
      site: 'Site',
      about: 'About',
      moments: 'Moments',
      contact: 'Contact'
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
      platformTitle: 'Platform',
      platformDesc: 'Official palettes published by the platform team',
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
    layout: {
      section: '🧩 Layout',
      modulesTitle: 'Module Visibility',
      modulesDesc: 'Choose which modules appear on your homepage',
      moduleNames: {
        hero: 'Hero Carousel',
        gallery: 'Gallery',
        moments: 'Moments',
        about: 'About Link',
        contact: 'Contact Link',
        calendar: 'Schedule Calendar',
        commission: 'Commission Entry'
      },
      orderTitle: 'Module Order',
      orderDesc: 'Reorder the modules on your homepage ("custom" is the custom sections area)',
      orderNames: {
        hero: 'Hero Carousel',
        gallery: 'Gallery',
        calendar: 'Schedule Calendar',
        moments: 'Moments',
        about: 'About Link',
        contact: 'Contact Link',
        custom: 'Custom Sections'
      },
      moveUp: 'Up',
      moveDown: 'Down',
      pinnedTitle: 'Pinned Content',
      pinnedMoment: 'Pinned Moment',
      pinnedWork: 'Pinned Work',
      pinnedNone: 'None',
      sectionsTitle: 'Custom Sections',
      sectionsDesc: 'Add custom content sections to your homepage; reorder them via "Module Order" above',
      sectionTitleLabel: 'Section Title',
      sectionTitlePlaceholder: 'Section title',
      sectionContentLabel: 'Section Content',
      sectionContentPlaceholder: 'Common tags supported: <p><b><i><u><a><ul><ol><li><h3><h4><blockquote><br><img>',
      htmlHint: 'Common HTML tags are supported. Unsafe content is stripped on save.',
      addSection: '+ Add Section',
      editSection: 'Edit',
      saveSection: 'Save Section',
      cancelEdit: 'Cancel',
      deleteConfirm: 'Delete this custom section?',
      emptyContent: 'Title and content cannot both be empty',
      cssTitle: 'Custom CSS',
      cssDesc: 'Only applies to your own homepage',
      cssPlaceholder: 'e.g. .hero-section { padding-top: 32px; }',
      cssWarning: '⚠️ Custom CSS may break the page layout. Use with caution; dangerous content is stripped on save.'
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
    about: {
      section: '📝 About',
      emptyHint: 'Click below to add sections (e.g. History, Team, Services)',
      addSectionTitle: 'Add Section',
      sectionPlaceholder: 'Section name, e.g. Awards, Portfolio',
      sectionNamePlaceholder: 'Section Name',
      addSection: '+ Add Section',
      maxSections: 'Maximum sections reached (max 6)',
      addItem: '+ Add Item',
      dateLabel: 'Date',
      datePlaceholder: 'e.g. 2023',
      titleLabel: 'Title',
      descLabel: 'Description',
      iconLabel: 'Icon',
      iconPlaceholder: 'e.g. 🎨',
      nameLabel: 'Name',
      roleLabel: 'Role',
      rolePlaceholder: 'e.g. Lead Artist',
      saveAbout: 'Save About Page',
      saveSuccess: 'About page saved',
      saveFailed: 'Failed to save about page'
    },
    contact: {
      section: '📞 Contact',
      basicInfo: 'Basic Info',
      qqLabel: 'QQ',
      qqPlaceholder: 'e.g. 123456789',
      wechatLabel: 'WeChat',
      wechatPlaceholder: 'e.g. mywechat',
      emailLabel: 'Email',
      emailPlaceholder: 'e.g. contact@example.com',
      socialTitle: 'Social Platforms',
      xiaohongshuLabel: 'Xiaohongshu',
      xiaohongshuPlaceholder: 'Profile link',
      bilibiliLabel: 'Bilibili',
      bilibiliPlaceholder: 'Space link',
      twitterLabel: 'Twitter',
      twitterPlaceholder: 'Profile link',
      weiboLabel: 'Weibo',
      weiboPlaceholder: 'Profile link',
      websiteLabel: 'Website',
      websitePlaceholder: 'https://example.com',
      faqTitle: 'FAQ',
      questionLabel: 'Question',
      answerLabel: 'Answer',
      addFaq: '+ Add FAQ',
      saveContact: 'Save Contact',
      saveSuccess: 'Contact saved',
      saveFailed: 'Failed to save contact'
    },
    moments: {
      section: '📝 Moments',
      listTitle: 'My Moments',
      contentLabel: 'Content',
      contentPlaceholder: 'Share your creative thoughts, WIPs...',
      imagesLabel: 'Images',
      addImage: '+ Add Image',
      removeImage: 'Remove',
      visibilityLabel: 'Visibility',
      visibilityPublic: 'Public',
      visibilityPrivate: 'Private',
      addMoment: '+ Post Moment',
      editMoment: 'Edit Moment',
      saveMoment: 'Save Moment',
      createMoment: 'Post Moment',
      cancelEdit: 'Cancel',
      deleteConfirm: 'Delete this moment?',
      noMoments: 'No moments yet',
      createdAt: 'Posted on',
      saveSuccess: 'Moment saved',
      saveFailed: 'Failed to save moment',
      deleteSuccess: 'Moment deleted',
      deleteFailed: 'Failed to delete'
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
    
    // ========== v2 SaaS 适配 ==========
    // 从 Space.vue 获取 slug 和艺术家信息
    const injectedSlug = inject('slug', null)
    const injectedArtistInfo = inject('artistInfo', null)
    const injectedIsSpaceOwner = inject('isSpaceOwner', null)
    
    // 计算 slug（优先使用注入的，其次从路由获取）
    const slug = computed(() => {
      if (injectedSlug?.value) return injectedSlug.value
      if (route.params.slug) return route.params.slug
      // 尝试从 artistInfo 提取
      if (injectedArtistInfo?.value?.slug) return injectedArtistInfo.value.slug
      return ''
    })
    
    // 计算当前用户是否拥有此空间
    const canEdit = computed(() => {
      if (injectedIsSpaceOwner !== null) return injectedIsSpaceOwner.value
      return false
    })
    
    // 权限不足提示
    const permissionDenied = computed(() => {
      return !canEdit.value
    })
    
    // 路由跳转辅助函数（添加 slug 前缀）
    const goToSpaceHome = () => {
      const s = slug.value
      if (s) {
        router.push(`/@${s}/home`)
      } else {
        router.push('/')
      }
    }
    
    const goToSpacePreview = () => {
      const s = slug.value
      if (s) {
        router.push(`/@${s}/home`)
      } else {
        router.push('/')
      }
    }
    const MIN_CROP_SIZE_DISPLAY = 60
    const createEmptyCropSelection = () => ({ x: 0, y: 0, size: 0 })
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
    const getDefaultThemePresetName = () => `${copy.value.theme.defaultPresetPrefix} ${themePresetOptions.value.filter(preset => preset.isCustom).length + 1}`
    const themePresetOptions = ref(getThemePresets())
    const builtInThemePresetOptions = computed(() => themePresetOptions.value.filter(preset => !preset.isCustom))
    const customThemePresetOptions = computed(() => themePresetOptions.value.filter(preset => preset.isCustom))
    // 平台预设（管理后台发布），与内置方案一样不可删除
    const platformThemePresetOptions = ref([])
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
      { id: 'layout', name: copy.value.tabs.layout, icon: '🧩' },
      { id: 'background', name: copy.value.tabs.background, icon: '🌅' },
      { id: 'gallery', name: copy.value.tabs.gallery, icon: '🎨' },
      { id: 'site', name: copy.value.tabs.site, icon: '🌐' },
      { id: 'about', name: copy.value.tabs.about, icon: '📝' },
      { id: 'moments', name: copy.value.tabs.moments, icon: '💬' },
      { id: 'contact', name: copy.value.tabs.contact, icon: '📞' }
    ])

    // 创建响应式配置对象
    const config = reactive(getPreviewDraft() || getSavedPersonalization())
    
    // About 数据
    const aboutSections = ref([])
    const aboutSaving = ref(false)
    const newSectionTitle = ref('')
    const maxAboutSections = 6
    
    // Moments 数据
    const moments = ref([])
    const momentsLoading = ref(false)
    const momentSaving = ref(false)
    const editingMoment = ref(null)
    const momentForm = reactive({
      title: '',
      content: '',
      category: '',
      images: [],
      visibility: 'public'
    })
    const newImageUrl = ref('')
    const momentCategories = ref(['公告', '作品', '日常'])
    const newCategory = ref('')
    const maxCategories = 10
    
    // Contact 数据
    const contactData = reactive({
      qq: '',
      wechat: '',
      email: '',
      socials: [],
      faq: []
    })
    const contactSaving = ref(false)
    const maxSocials = 10
    
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

    // ========== 布局（模块显隐/排序/置顶/自定义板块/自定义CSS） ==========
    const layoutModuleKeys = ['hero', 'gallery', 'moments', 'about', 'contact', 'calendar', 'commission']
    const DEFAULT_SECTION_ORDER = ['hero', 'gallery', 'calendar', 'moments', 'about', 'contact', 'custom']

    // 布局字段兼容旧数据
    if (!config.modules || typeof config.modules !== 'object') config.modules = {}
    layoutModuleKeys.forEach(key => {
      if (typeof config.modules[key] !== 'boolean') config.modules[key] = true
    })
    if (!Array.isArray(config.sectionOrder) || config.sectionOrder.length === 0) {
      config.sectionOrder = [...DEFAULT_SECTION_ORDER]
    }
    if (!Array.isArray(config.customSections)) config.customSections = []
    config.customSections = config.customSections.map(section => ({
      id: section.id || `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: section.title || '',
      content: section.content || '',
      enabled: section.enabled !== false
    }))
    if (!config.pinned || typeof config.pinned !== 'object') {
      config.pinned = { momentId: null, workId: null }
    }
    if (typeof config.customCSS !== 'string') config.customCSS = ''

    const layoutModuleList = computed(() => layoutModuleKeys.map(key => ({
      key,
      label: copy.value.layout.moduleNames[key] || key
    })))

    const moveSection = (index, delta) => {
      const next = index + delta
      if (next < 0 || next >= config.sectionOrder.length) return
      const [item] = config.sectionOrder.splice(index, 1)
      config.sectionOrder.splice(next, 0, item)
    }

    // 自定义板块编辑
    const editingCustomSection = ref(null) // 'new' 或板块 id
    const customSectionForm = reactive({ title: '', content: '' })

    const startAddCustomSection = () => {
      customSectionForm.title = ''
      customSectionForm.content = ''
      editingCustomSection.value = 'new'
    }

    const startEditCustomSection = (section) => {
      customSectionForm.title = section.title
      customSectionForm.content = section.content
      editingCustomSection.value = section.id
    }

    const cancelEditCustomSection = () => {
      editingCustomSection.value = null
    }

    const saveCustomSection = () => {
      const title = customSectionForm.title.trim()
      const content = sanitizeHTML(customSectionForm.content)
      if (!title && !content) {
        showToast(copy.value.layout.emptyContent, 'error')
        return
      }
      if (editingCustomSection.value === 'new') {
        config.customSections.push({ id: `cs_${Date.now()}`, title, content, enabled: true })
      } else {
        const target = config.customSections.find(section => section.id === editingCustomSection.value)
        if (target) {
          target.title = title
          target.content = content
        }
      }
      editingCustomSection.value = null
    }

    const removeCustomSection = (index) => {
      if (!confirm(copy.value.layout.deleteConfirm)) return
      config.customSections.splice(index, 1)
    }

    const moveCustomSection = (index, delta) => {
      const next = index + delta
      if (next < 0 || next >= config.customSections.length) return
      const [item] = config.customSections.splice(index, 1)
      config.customSections.splice(next, 0, item)
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
    const saveSettings = async () => {
      syncLogoSize()
      config.hero.enabled = true
      // 保存前过滤自定义内容
      config.customCSS = sanitizeCSS(config.customCSS)
      config.customSections.forEach(section => {
        section.content = sanitizeHTML(section.content)
      })
      
      // 先保存到 localStorage（本地缓存）
      if (!savePersonalization(config)) {
        showToast(copy.value.messages.saveFailed, 'error')
        return
      }
      
      // v2: 同时保存到后端 API
      try {
        // 转换 config 为后端 DTO 格式
        const backendConfig = configToBackend(config)
        console.log('[Personalization] Saving to backend:', backendConfig)
        
        await apiRequest('/api/v1/user/page-config', { method: 'PUT', body: backendConfig })
        applyTheme(config.theme, config.site)
        applyBackground(config.background)
        showToast(copy.value.messages.saveSuccess, 'success')
      } catch (err) {
        console.error('Failed to save page config:', err)
        showToast(copy.value.messages.saveFailed + ' (Server error)', 'error')
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
      
      // 跳转到首页预览（v2: 使用 slug 前缀）
      const s = slug.value
      if (s) {
        router.push(`/@${s}/home?preview=1`)
      } else {
        router.push({
          path: '/',
          query: { preview: '1' }
        })
      }
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
      e.target.src = PERSONALIZATION_IMAGES.fallback
    }

    // 添加轮播图
    const addSlide = () => {
      config.hero.slides.push({
        image: PERSONALIZATION_IMAGES.defaultHero,
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
        image: PERSONALIZATION_IMAGES.defaultCard,
        title: copy.value.gallery.newTitle,
        category: copy.value.gallery.newCategory
      })
    }

    // 删除作品
    const removeWork = (index) => {
      config.gallery.works.splice(index, 1)
    }

    // ========== About 管理 ==========
    const loadAbout = async () => {
      try {
        const res = await getMyAboutAPI()
        if (res.data) {
          aboutSections.value = res.data.sections || []
        }
      } catch (err) {
        console.error('[Personalization] 加载关于页面失败:', err)
      }
    }

    const saveAbout = async () => {
      aboutSaving.value = true
      try {
        await updateMyAboutAPI({
          sections: aboutSections.value
        })
        showToast(copy.value.about.saveSuccess, 'success')
      } catch (err) {
        console.error('[Personalization] 保存关于页面失败:', err)
        showToast(copy.value.about.saveFailed, 'error')
      } finally {
        aboutSaving.value = false
      }
    }

    const addAboutSection = () => {
      const title = newSectionTitle.value.trim()
      if (!title) return
      if (aboutSections.value.length >= maxAboutSections) {
        showToast(copy.value.about.maxSections, 'error')
        return
      }
      const id = 'section_' + Date.now()
      aboutSections.value.push({
        id,
        title,
        items: []
      })
      newSectionTitle.value = ''
    }

    const removeAboutSection = (index) => {
      aboutSections.value.splice(index, 1)
    }

    const addAboutItem = (sectionIndex) => {
      aboutSections.value[sectionIndex].items.push({
        date: '',
        title: '',
        desc: '',
        icon: '',
        name: '',
        role: ''
      })
    }

    const removeAboutItem = (sectionIndex, itemIndex) => {
      aboutSections.value[sectionIndex].items.splice(itemIndex, 1)
    }

    // ========== Contact 管理 ==========
    const loadContact = async () => {
      try {
        const res = await getMyContactAPI()
        if (res.data) {
          contactData.qq = res.data.qq || ''
          contactData.wechat = res.data.wechat || ''
          contactData.email = res.data.email || ''
          contactData.socials = res.data.socials || [
            { name: 'bilibili', icon: '📺', url: '' },
            { name: 'xiaohongshu', icon: '📕', url: '' }
          ]
          contactData.faq = res.data.faq || []
        }
      } catch (err) {
        console.error('[Personalization] 加载联系方式失败:', err)
      }
    }

    const saveContact = async () => {
      contactSaving.value = true
      try {
        await updateMyContactAPI({
          qq: contactData.qq,
          wechat: contactData.wechat,
          email: contactData.email,
          socials: contactData.socials.filter(s => s.url.trim()),
          faq: contactData.faq
        })
        showToast(copy.value.contact.saveSuccess, 'success')
      } catch (err) {
        console.error('[Personalization] 保存联系方式失败:', err)
        showToast(copy.value.contact.saveFailed, 'error')
      } finally {
        contactSaving.value = false
      }
    }

    const addSocial = () => {
      if (contactData.socials.length < maxSocials) {
        contactData.socials.push({ name: 'custom', icon: '🔗', url: '' })
      }
    }
    const removeSocial = (index) => {
      contactData.socials.splice(index, 1)
    }

    const addFaq = () => {
      contactData.faq.push({ q: '', a: '' })
    }
    const removeFaq = (index) => {
      contactData.faq.splice(index, 1)
    }

    // ========== Moments 管理 ==========
    const loadMoments = async () => {
      momentsLoading.value = true
      try {
        const res = await getMyMomentsAPI()
        if (res.data?.list) {
          moments.value = res.data.list
        }
      } catch (err) {
        console.error('[Personalization] 加载动态失败:', err)
      } finally {
        momentsLoading.value = false
      }
    }

    const resetMomentForm = () => {
      editingMoment.value = null
      momentForm.title = ''
      momentForm.content = ''
      momentForm.category = ''
      momentForm.images = []
      momentForm.visibility = 'public'
      newImageUrl.value = ''
    }

    const startAddMoment = () => {
      resetMomentForm()
      editingMoment.value = { isNew: true }
    }

    const startEditMoment = (moment) => {
      editingMoment.value = moment
      momentForm.title = moment.title || ''
      momentForm.content = moment.content
      momentForm.category = moment.category || ''
      momentForm.images = [...(moment.images || [])]
      momentForm.visibility = moment.visibility || 'public'
    }

    const cancelEditMoment = () => {
      resetMomentForm()
    }

    const addImageToMoment = () => {
      const url = newImageUrl.value.trim()
      if (url) {
        momentForm.images.push(url)
        newImageUrl.value = ''
      }
    }

    const removeImageFromMoment = (index) => {
      momentForm.images.splice(index, 1)
    }

    const saveMoment = async () => {
      if (!momentForm.content.trim()) {
        showToast('请输入内容', 'error')
        return
      }
      
      // 调试日志
      console.log('[saveMoment] 保存数据:', {
        title: momentForm.title,
        content: momentForm.content,
        category: momentForm.category,
        isNew: editingMoment.value?.isNew,
        id: editingMoment.value?.id
      })
      
      momentSaving.value = true
      try {
        const payload = {
          title: momentForm.title,
          content: momentForm.content,
          category: momentForm.category,
          images: momentForm.images,
          visibility: momentForm.visibility
        }
        
        if (editingMoment.value?.isNew) {
          await createMomentAPI(payload)
        } else if (editingMoment.value?.id) {
          console.log('[saveMoment] 调用 updateMomentAPI, id:', editingMoment.value.id)
          const res = await updateMomentAPI(editingMoment.value.id, payload)
          console.log('[saveMoment] 更新响应:', res)
        }
        showToast(copy.value.moments.saveSuccess, 'success')
        resetMomentForm()
        await loadMoments()
      } catch (err) {
        console.error('[Personalization] 保存动态失败:', err)
        showToast(copy.value.moments.saveFailed, 'error')
      } finally {
        momentSaving.value = false
      }
    }

    const deleteMoment = async (moment) => {
      if (!confirm(copy.value.moments.deleteConfirm)) return
      
      try {
        await deleteMomentAPI(moment.id)
        showToast(copy.value.moments.deleteSuccess, 'success')
        await loadMoments()
      } catch (err) {
        console.error('[Personalization] 删除动态失败:', err)
        showToast(copy.value.moments.deleteFailed, 'error')
      }
    }

    // ========== 分类管理 ==========
    const addCategory = () => {
      const name = newCategory.value.trim()
      if (!name) return
      if (momentCategories.value.length >= maxCategories) {
        showToast(copy.value.moments.maxCategories, 'error')
        return
      }
      if (momentCategories.value.includes(name)) {
        showToast(copy.value.moments.categoryExists, 'error')
        return
      }
      momentCategories.value.push(name)
      newCategory.value = ''
    }

    const removeCategory = (index) => {
      momentCategories.value.splice(index, 1)
    }

    const handlePersonalizationChange = (e) => {
      Object.assign(config, e.detail)
      if (config.hero) {
        config.hero.enabled = true
      }
      config.site.logoSize = clampedLogoSize.value
      logoPreviewFailed.value = false
    }

    onMounted(async () => {
      // 实时预览
      window.addEventListener('personalization-changed', handlePersonalizationChange)

      // 平台预设（失败时静默为空列表）
      fetchPlatformPresets().then(list => {
        platformThemePresetOptions.value = list
      })
      
      // v2: 从后端加载配置并合并
      try {
        // 加载页面配置
        const res = await apiRequest('/api/v1/user/page-config', { showError: false })
        console.log('[Personalization] Loaded from backend:', res)
        
        // 加载 About、Contact 和 Moments
        await Promise.all([loadAbout(), loadContact(), loadMoments()])
        
        // 注意：apiRequest 默认已解包 data，所以 res 直接是配置数据
        if (res) {
          // 将后端配置转换为前端格式
          const backendConfig = configFromBackend(res)
          if (backendConfig) {
            // 合并后端配置到当前 config
            Object.assign(config, backendConfig)
            // 同时保存到 localStorage 作为缓存
            savePersonalization(config)
            // 应用主题
            applyTheme(config.theme, config.site)
            applyBackground(config.background)
          }
        }
      } catch (err) {
        // 如果后端没有配置，使用本地配置（首次使用或离线）
        console.log('[Personalization] No server config found, using local:', err.message)
      }
      
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
      // v2 SaaS 适配
      slug,
      canEdit,
      permissionDenied,
      goToSpaceHome,
      goToSpacePreview,
      
      copy,
      currentTab,
      tabs,
      config,

      // Layout
      layoutModuleList,
      moveSection,
      editingCustomSection,
      customSectionForm,
      startAddCustomSection,
      startEditCustomSection,
      cancelEditCustomSection,
      saveCustomSection,
      removeCustomSection,
      moveCustomSection,
      
      // About
      aboutSections,
      aboutSaving,
      newSectionTitle,
      maxAboutSections,
      saveAbout,
      addAboutSection,
      removeAboutSection,
      addAboutItem,
      removeAboutItem,
      
      // Moments
      moments,
      momentsLoading,
      momentSaving,
      editingMoment,
      momentForm,
      newImageUrl,
      loadMoments,
      startAddMoment,
      startEditMoment,
      cancelEditMoment,
      addImageToMoment,
      removeImageFromMoment,
      saveMoment,
      deleteMoment,
      
      // Contact
      contactData,
      contactSaving,
      maxSocials,
      saveContact,
      addSocial,
      removeSocial,
      addFaq,
      removeFaq,
      
      // Moment Categories
      momentCategories,
      newCategory,
      maxCategories,
      addCategory,
      removeCategory,
      themePresetOptions,
      builtInThemePresetOptions,
      customThemePresetOptions,
      platformThemePresetOptions,
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
  border-bottom: 1px solid var(--border-color);
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
  border-radius: var(--radius);
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
  border-radius: var(--radius);
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
  background: var(--border-color);
  border-radius: var(--radius);
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
  border-top: 1px solid var(--border-color);
}

.personalization-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  padding: var(--space-page) 0;
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
  background: var(--secondary-color);
}

.nav-btn.active {
  background: var(--accent-color);
  color: var(--white);
}

.nav-icon {
  font-size: 1.2rem;
}

.action-card {
  background: var(--white);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px;
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
  padding: 32px;
  margin-bottom: 24px;
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
  background: var(--secondary-color);
  color: var(--text-dark);
  font-weight: 600;
}

.theme-name-input {
  min-width: 220px;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  transition: var(--transition);
  font-family: inherit;
}

.theme-name-input:focus {
  outline: none;
  border-color: var(--accent-color);
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
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  transition: var(--transition);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
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
  border: 3px solid var(--border-color);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 标签输入 */
.tags-input {
  border: 1px solid var(--border-color);
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
  border-radius: var(--radius);
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
  border: 1px solid var(--border-color);
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
  border: 1px solid var(--border-color);
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
  border-radius: var(--radius);
  background: var(--secondary-color);
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
  border: 2px solid var(--border-color);
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
  border-color: var(--accent-color);
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
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--secondary-color);
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
  background: var(--border-color);
  border-radius: var(--radius);
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
  background: var(--accent-color);
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
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.radio-btn:has(input:checked) {
  border-color: var(--accent-color);
  background: rgba(59, 130, 246, 0.06);
}

.radio-btn input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-color);
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
  border: 1px solid var(--border-color);
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
  background: var(--secondary-color);
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
  border: 1px solid var(--border-color);
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
  border-radius: var(--radius);
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
}

.btn-add {
  padding: 15px;
  border: 2px dashed var(--border-color);
}

.btn-add:hover {
  border-color: var(--accent-color);
}

/* 作品列表 */
.works-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.work-item {
  background: var(--secondary-color);
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
  border: 1px solid var(--border-color);
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

/* 页面布局 Tab */
.hint-warning {
  color: #B45309;
}

.layout-modules {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.layout-order-list,
.custom-section-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.layout-order-item,
.custom-section-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-light);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.layout-order-name {
  font-weight: 500;
  color: var(--text-dark);
}

.layout-order-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.custom-section-editor {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  margin-bottom: 14px;
}

.custom-css-input {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.6;
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
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
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
  border: 1px solid var(--border-color);
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
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--white);
  color: var(--text-dark);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}

.font-option:hover {
  border-color: var(--accent-color);
}

.font-option.active {
  border-color: var(--accent-color);
  box-shadow: var(--shadow);
  background: var(--white);
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

/* 空状态卡片 */
.empty-state-card {
  text-align: center;
  padding: 40px 20px;
  background: var(--secondary-color);
  border-radius: var(--radius);
  border: 2px dashed var(--border-color);
  margin-bottom: 24px;
}

.empty-state-card .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state-card p {
  color: var(--text-muted);
  font-size: 15px;
}

/* Social 编辑器样式 */
.social-item-editor {
  background: var(--secondary-color);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.social-item-editor .form-grid {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .social-item-editor .form-grid {
    grid-template-columns: 1fr;
  }
}

.social-item-editor select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: white;
}

/* About & Contact 编辑器样式 */
.about-item-editor {
  background: var(--secondary-color);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.about-item-editor .form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.about-item-editor .form-group {
  margin-bottom: 12px;
}

.about-item-editor label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 4px;
  display: block;
}

.about-item-editor input,
.about-item-editor textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 0.9rem;
}

.about-item-editor .btn-danger {
  margin-top: 8px;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.8rem;
}

.about-item-editor .btn-small {
  padding: 4px 10px;
  font-size: 0.75rem;
}

/* Moments 样式 */
.section-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title-input {
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  padding: 4px 8px;
  width: 100%;
}

.section-title-input:hover,
.section-title-input:focus {
  border-bottom-color: var(--accent-color);
  outline: none;
}

/* 分类管理样式 */
.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--secondary-color);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 0.9rem;
}

.category-tag .btn-remove {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-category-row {
  display: flex;
  gap: 10px;
}

.add-category-row input {
  flex: 1;
}

.category-select-row select {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: white;
}

.moment-images-editor {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.moment-image-item {
  position: relative;
}

.moment-image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.moment-image-item .btn {
  position: absolute;
  bottom: 5px;
  right: 5px;
  padding: 2px 8px;
  font-size: 0.7rem;
}

.add-image-row {
  display: flex;
  gap: 10px;
}

.add-image-row input {
  flex: 1;
}

.action-row {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.moments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.moment-card {
  background: var(--secondary-color);
  padding: 16px;
  border-radius: var(--radius);
}

.moment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.85rem;
}

.moment-badges {
  display: flex;
  gap: 8px;
}

.moment-visibility {
  background: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius);
}

.moment-category {
  background: var(--text-muted);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius);
}

.moment-date {
  color: var(--text-muted);
}

.moment-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-dark);
}

.moment-content {
  margin-bottom: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.moment-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.moment-images img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.moment-actions {
  display: flex;
  gap: 10px;
}
</style>
