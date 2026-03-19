# openblog-frontend

## 仓库定位

OpenBlog 前端仓库，负责博客站点的页面、交互和前端展示逻辑。

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/Edmundzhang1/openblog-frontend.git
cd openblog-frontend
```

### 2. 检查环境

确保已安装 Node.js 16+：

```bash
node --version
```

如果未安装，请前往 https://nodejs.org/ 下载并安装 LTS 版本。

### 3. 配置环境变量

```bash
cp .env.example .env
```

根据需要编辑 `.env` 文件，主要配置项：
- `VITE_API_BASE_URL`：后端 API 地址（默认：`http://127.0.0.1:8080`）
- `VITE_DEV_PORT`：开发服务器端口（默认：`3000`）

### 4. 安装依赖

```bash
make install
```

或使用 npm 直接安装：

```bash
npm install
```

安装过程可能需要几分钟，请耐心等待。

### 5. 启动开发服务器

```bash
make dev
```

或使用 npm：

```bash
npm run dev
```

启动成功后，会显示如下信息：

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

打开浏览器访问 http://127.0.0.1:3000 即可看到前端页面。

### 6. 联调后端（可选）

如需与后端联调，请确保：
1. 后端服务已启动（默认地址：http://127.0.0.1:8080）
2. `.env` 文件中的 `VITE_API_BASE_URL` 指向正确的后端地址
3. 前端会自动代理 `/api` 和 `/uploads` 请求到后端

---

## 环境文件

- 使用 `.env.example` 作为本地环境变量样板。
- 首次开发前复制为 `.env`，再按本地需要调整。
- 主要配置项：
  - `VITE_API_BASE_URL`：后端 API 地址
  - `VITE_DEV_PORT`：开发服务器端口（默认 3000）

---

## 常用命令

```bash
make install    # 安装依赖
make dev        # 启动开发服务器
make check      # 执行项目检查
npm run build   # 生产构建
npm run preview # 预览生产构建
```

- `make dev`：启动前端本地开发服务，默认访问 http://127.0.0.1:3000
- `make check`：执行前端仓库的基础检查（包含构建验证）

---

## 上传代码

```bash
make check
git status
git add .
git commit -m "feat: <变更摘要>"
git push origin main
```

- 上传前先执行 `make check`。
- 推荐使用 `feat:`、`fix:`、`docs:`、`chore:` 作为提交前缀。
- 默认直接推送到 `main`：`git push origin main`。
- 不要使用 `git push --force` 覆盖 `main` 历史。

---

## 更新代码

```bash
git status
git stash push -u
git checkout main
git pull --ff-only
git stash pop
```

- 如果当前没有未提交改动，可以直接执行 `git checkout main` 和 `git pull --ff-only`。
- 如果 `git pull --ff-only` 失败，先检查是否有未推送的本地提交，不要用强推覆盖远端。

---

## 版本发布

- `openblog-frontend` 不单独打版本 tag，也不单独创建 Release 页面。
- 前端可发布状态以稳定 commit 的形式推送到 `main`。
- 当该 commit 通过前端自身检查后，由主仓更新 `apps/frontend` 子模块指针并发布 OpenBlog 集成快照。
- 正式版本发布说明统一参考 `https://github.com/Edmundzhang1/OpenBlog/blob/main/docs/deployment.md`。

---

## 本地服务约定

- 本地默认访问地址为 `http://127.0.0.1:3000`
- 主仓联调时，主仓会默认把前端流量转发到该地址
- 技术栈：Vue 3 + Vite + Vue Router

---

## 相关文档

- OpenBlog 主仓架构说明：`https://github.com/Edmundzhang1/OpenBlog/blob/main/docs/architecture.md`
- OpenBlog 主仓协作流程：`https://github.com/Edmundzhang1/OpenBlog/blob/main/docs/workflow.md`
