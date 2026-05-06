# VaultPaste 🔐

一个基于 **Tauri + React + Rust** 的本地密码管理器，专为配合 Windows 剪贴板历史（`Win+V`）高效填充账号信息而设计。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/tech-Tauri%20v2%20%2B%20React%20%2B%20Rust-orange)

---

## ✨ 核心功能

- **账号管理** — 集中存储网站账号、密码、API Key、手机号、Access Token、备注等信息
- **一键批量复制** — 按顺序批量写入剪贴板：账号 → 密码 → TOTP → API Key → 手机号 → Access Token → 备注（配合 `Win+V` 快速粘贴）
- **TOTP 验证码** — 基于 RFC 6238 标准实时生成 6 位动态验证码，带倒计时提示
- **本地加密存储** — AES-256-GCM 加密，Argon2id 密钥派生，数据库完全本地保存
- **快速搜索** — 支持按网站名实时模糊搜索，高亮匹配结果
- **导入/导出** — 支持 JSON/CSV 格式的数据迁移

---

## 📸 使用流程

1. 打开软件，自动进入主界面（无需输入密码）
2. 搜索目标网站（如 `github`）
3. 点击账号卡片的 **"复制全部"**
4. 在浏览器中按 `Win+V` 调出剪贴板历史
5. 依次选择并粘贴所需字段

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS |
| 桌面框架 | Tauri v2 (Rust) |
| 数据库 | SQLite (rusqlite) |
| 加密 | Argon2id + AES-256-GCM |
| 剪贴板 | arboard |
| TOTP | totp-rs |

---

## 🚀 开发 & 构建

```bash
# 1. 进入项目目录
cd vault-paste

# 2. 安装前端依赖
pnpm install

# 3. 拉取 Rust 依赖
cd src-tauri && cargo fetch && cd ..

# 4. 开发模式运行
pnpm tauri dev

# 5. 构建生产版本
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

---

## 📁 项目结构

```
vault-paste/
├── src/                    # 前端源码 (React + TS)
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型
│   └── utils/              # 工具函数
├── src-tauri/src/          # Rust 后端源码
│   ├── commands.rs         # Tauri 命令接口
│   ├── database.rs         # SQLite 数据层
│   ├── crypto.rs           # 加解密模块
│   ├── clipboard.rs        # 剪贴板批量复制
│   ├── totp.rs             # TOTP 生成
│   └── models.rs           # 数据模型
└── ...
```

---

## 🔒 安全说明

- **数据文件位置**：数据库 `vault.db` 存储在 `%APPDATA%\com.vaultpaste.app\vault.db`，**不会随本仓库上传至 GitHub**
- **加密策略**：敏感字段（密码、TOTP Secret、API Key、Access Token）均独立加密存储
- **自动解锁**：应用使用内置默认密码自动创建/打开数据库，无需手动输入密码
- **备份建议**：定期手动备份数据库文件，请勿将其同步至不安全的公共云存储

---

## 💾 数据迁移

将数据迁移到另一台电脑：

1. 在旧电脑上找到数据库文件：`%APPDATA%\com.vaultpaste.app\vault.db`
2. 在新电脑上先安装一遍程序（让它自动生成配置目录）
3. 关闭新电脑上的程序
4. 把旧电脑的 `vault.db` 复制到新电脑的 `%APPDATA%\com.vaultpaste.app\` 目录下覆盖即可

---

## 📄 License

MIT
