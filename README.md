# OpenBlog Frontend

## 仓库定位

OpenBlog 的 Vue 3 前端子仓，包含公开展示、委托提交、订单跟踪、订单聊天和管理后台。正式联调与发布由 OpenBlog 主仓统一编排。

## 快速开始

推荐在主仓根目录启动完整 Docker 环境：

```bash
make stack-up
```

统一入口为 `http://127.0.0.1:8000`。只调试前端时，可在本目录执行 `make dev`，该命令使用 `node:24-alpine` 容器在 `http://127.0.0.1:3000` 启动 Vite。

## 环境文件

环境变量样板见 `.env.example`：

- `VITE_API_BASE_URL`：浏览器可见的 API 地址；默认留空并使用同源网关。
- `VITE_DEV_PROXY_TARGET`：Vite 开发服务器的后端代理目标。
- `VITE_DEV_PORT`：前端开发端口，默认 `3000`。

本地私有配置写入 `.env`，不要提交真实密钥或个人环境地址。

## 常用命令

```bash
make dev       # 使用 Docker 启动 Vite 开发服务器
make check     # 在一次性 Node 容器中安装依赖并生产构建
npm run build  # 仅在已准备好 Node 环境时直接构建
```

`make check` 不会在宿主机创建 `node_modules`。

## 上传代码

在本子仓创建分支、完成修改并执行 `make check`。提交只包含前端自身的源码、配置和锁文件；构建产物与本地环境文件不得提交。推送稳定 commit 后，再到主仓更新 `apps/frontend` 的子模块指针。

## 更新代码

从主仓协作时先更新主仓，再执行 `make init` 同步固定的子模块版本。只在前端子仓独立工作时，按团队约定拉取目标分支并处理本地改动，不要直接覆盖未提交工作。

## 版本发布

前端子仓不单独创建正式版本或 Release。可发布 commit 由主仓集成，主仓通过 `make check`、`make snapshot` 和 tag 固定前后端组合。

## 本地服务约定

- Vite 开发服务：`http://127.0.0.1:3000`
- 主仓统一网关：`http://127.0.0.1:8000`
- 开发时 `/api`、`/uploads` 与 `/ws` 由 Vite 或主仓网关转发到后端
- 生产镜像由 Nginx 提供静态文件与 SPA 路由回退

## 相关文档

- 主仓 [README](../../README.md)
- [架构说明](../../docs/architecture.md)
- [协作流程](../../docs/workflow.md)
- [部署与回滚](../../docs/deployment.md)
