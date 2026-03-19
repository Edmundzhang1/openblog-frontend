.PHONY: dev check install

# 安装依赖
install:
	npm install

# 启动前端本地开发服务（默认端口 3000）
dev:
	@echo "Starting frontend development server..."
	@echo "Server will be available at http://127.0.0.1:3000"
	npm run dev

# 执行前端仓库的基础检查
check:
	@echo "Running frontend checks..."
	@echo "1. Checking package.json..."
	@node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" && echo "  ✓ package.json is valid"
	@echo "2. Running build check..."
	npm run build
	@echo "  ✓ Build successful"
	@echo "All checks passed!"
