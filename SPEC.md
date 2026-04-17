# 账号密码管理工具 - 产品需求文档 (SPEC)

## 1. 项目概述

### 1.1 产品名称
VaultPaste - 本地密码管理器（配合 Windows 剪贴板历史使用）

### 1.2 目标用户
拥有大量网站账号、API Key、2FA 验证码需要管理的个人用户

### 1.3 核心使用场景
1. 用户需要登录某个网站
2. 在软件中搜索并选中对应账号
3. 点击"一键复制全部"
4. 在目标网站按 `Win+V` 调出剪贴板历史
5. 按顺序粘贴：账号 → 密码 → TOTP → API Key → 手机号 → Access Token → 备注

---

## 2. 功能需求

### 2.1 核心功能

#### 2.1.1 账号管理
- **添加账号**：填写网站名、账号、密码、TOTP Secret、API Key、手机号、Access Token、备注
- **编辑账号**：修改任意字段
- **删除账号**：支持删除单条记录
- **查看账号**：主界面列表展示，支持搜索筛选

#### 2.1.2 一键批量复制（核心功能）
- **复制顺序**：账号 → 密码 → TOTP(6位数字) → API Key → 手机号 → Access Token → 备注
- **跳过空字段**：值为空的字段不复制，减少等待时间
- **复制间隔**：每个字段间隔 80ms（保证 Windows 剪贴板历史能正确记录）
- **完成提示**：复制完成后弹出 Toast 提示，显示"成功复制 X 个字段"
- **TOTP 生成**：根据 Secret 实时计算 6 位数字验证码（30秒有效期）

#### 2.1.3 搜索功能
- **搜索字段**：仅支持按"网站名"搜索
- **搜索方式**：实时模糊匹配（输入即搜索）
- **搜索结果**：高亮匹配文本

#### 2.1.4 数据安全
- **主密码**：首次使用设置主密码，用于加密数据库
- **加密方式**：AES-256-GCM 加密本地数据库
- **密钥派生**：使用 Argon2id 从主密码派生加密密钥
- **存储格式**：SQLite 数据库（加密存储）

#### 2.1.5 导入导出
- **导入**：支持从 JSON/CSV 文件导入（格式需符合模板）
- **导出**：支持导出为加密 JSON 或 CSV（明文，需确认风险提示）
- **现有数据迁移**：提供 TXT 格式转换脚本/指南

---

## 3. 技术规格

### 3.1 技术栈
| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 后端 | Rust | 极致性能与安全性 |
| 前端框架 | Tauri v2 | 轻量级桌面应用框架 |
| UI 框架 | React 18 + Tailwind CSS | 现代化响应式界面 |
| 数据库 | SQLite (rusqlite) | 单文件、加密支持 |
| 加密库 | ring / argon2 | Argon2id + AES-256-GCM |
| TOTP 计算 | totp-rs | 标准 RFC 6238 实现 |
| 剪贴板 | arboard | 跨平台剪贴板操作 |
| 构建工具 | Cargo + pnpm/npm | Rust + Node.js 工具链 |

### 3.2 数据模型

```rust
// Rust 后端模型
pub struct Account {
    pub id: String,              // UUID
    pub site_name: String,       // 网站名（搜索字段）
    pub username: String,        // 账号
    pub password: String,        // 密码（加密存储）
    pub totp_secret: Option<String>,  // TOTP Secret（加密存储）
    pub api_key: Option<String>, // API Key（加密存储）
    pub phone: Option<String>,   // 手机号
    pub access_token: Option<String>, // Access Token（加密存储）
    pub notes: Option<String>,   // 备注
    pub created_at: i64,         // Unix timestamp
    pub updated_at: i64,         // Unix timestamp
}
```

```typescript
// TypeScript 前端模型
interface Account {
  id: string;
  site_name: string;
  username: string;
  password: string;
  totp_secret?: string;
  api_key?: string;
  phone?: string;
  access_token?: string;
  notes?: string;
  totp_code?: string;  // 前端计算/展示的动态验证码
  totp_remaining?: number;  // 验证码剩余有效秒数
}
```

### 3.3 复制顺序定义

```typescript
const COPY_ORDER = [
  { field: "username", label: "账号" },
  { field: "password", label: "密码" },
  { field: "totp_code", label: "验证码" },  // 动态计算
  { field: "api_key", label: "API Key" },
  { field: "phone", label: "手机号" },
  { field: "access_token", label: "Access Token" },
  { field: "notes", label: "备注" },
];
```

---

## 4. 界面设计

### 4.1 设计原则
- **深色主题**：默认深色模式，护眼且专业
- **毛玻璃效果**：适当使用 backdrop-blur 增强质感
- **圆角设计**：统一使用 rounded-xl (12px) 圆角
- **间距舒适**：使用 16px/24px 作为基础间距

### 4.2 主窗口布局

```
┌─────────────────────────────────────────────────────────────┐
│  🔐 VaultPaste                                    ─ □ ✕    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 搜索网站名...                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ GitHub     user@email.com          复制全部  ▼     │   │
│  │ google.com myname@gmail.com        复制全部  ▼     │   │
│  │ AWS Console  admin                 复制全部  ▼     │   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────┐  ┌────────┐  ┌────────┐                    │
│  │ ＋ 添加账号 │  │  导入  │  │  导出  │                    │
│  └────────────┘  └────────┘  └────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 添加/编辑账号对话框

```
┌─────────────────────────────────────────┐
│  添加账号                          ✕   │
├─────────────────────────────────────────┤
│                                         │
│  网站名 *                               │
│  ┌─────────────────────────────────┐   │
│  │ GitHub                          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  账号 *                                 │
│  ┌─────────────────────────────────┐   │
│  │ user@example.com                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  密码                                   │
│  ┌─────────────────────────────────┐👁️ │
│  │ ••••••••••••••                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  TOTP Secret                            │
│  ┌─────────────────────────────────┐   │
│  │ JBSWY3DPEHPK3PXP                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  API Key                                │
│  ┌─────────────────────────────────┐   │
│  │ sk-...                          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [展开更多] ↓                            │
│                                         │
│  手机号                                 │
│  ┌─────────────────────────────────┐   │
│  │ +86 138****8888                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│       ┌────────┐    ┌────────┐         │
│       │  取消  │    │  保存  │         │
│       └────────┘    └────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

### 4.4 Toast 提示

```
┌─────────────────────────────┐
│  ✅ 成功复制 5 个字段        │
│     账号、密码、验证码...    │
└─────────────────────────────┘
         (2秒后自动消失)
```

### 4.5 配色方案（深色主题）

```css
/* Tailwind 配置 */
colors: {
  background: '#0f0f0f',      /* 主背景 */
  surface: '#1a1a1a',         /* 卡片背景 */
  surfaceHover: '#252525',    /* 悬停背景 */
  border: '#2a2a2a',          /* 边框 */
  primary: '#3b82f6',         /* 主色调 - 蓝色 */
  primaryHover: '#2563eb',    /* 主色悬停 */
  text: '#f5f5f5',            /* 主文字 */
  textSecondary: '#a3a3a3',   /* 次要文字 */
  success: '#22c55e',         /* 成功绿 */
  warning: '#f59e0b',         /* 警告黄 */
  danger: '#ef4444',          /* 危险红 */
}
```

### 4.6 交互细节

| 操作 | 行为 |
|------|------|
| 点击"复制全部" | 按顺序复制非空字段，显示 Toast 提示 |
| 点击下拉 [▼] | 展开菜单：编辑 / 删除 / 复制单个字段 |
| 搜索输入 | 实时过滤，300ms debounce |
| 双击列表项 | 快速复制全部 |
| TOTP 显示 | 右侧显示倒计时圆环，<5秒变红色 |
| 密码输入 | 支持显示/隐藏切换 |
| Esc 键 | 关闭弹窗 / 清空搜索 |
| Ctrl+K | 聚焦搜索框 |
| Ctrl+N | 新建账号 |

---

## 5. 安全规范

### 5.1 加密策略
1. **主密码**：用户设置，不存储，仅用于派生密钥
2. **密钥派生**：Argon2id
   - memory: 64MB
   - iterations: 3
   - parallelism: 1
3. **数据加密**：AES-256-GCM
   - 每个敏感字段独立加密
   - 随机 12 字节 nonce
4. **盐值**：随机 16 字节，存储于数据库文件头部

### 5.2 Rust 后端安全
```rust
// 安全内存清零
use zeroize::Zeroize;

fn process_password(mut password: String) {
    // 使用后清零
    password.zeroize();
}
```

### 5.3 导入导出安全
- 导出明文 CSV：弹窗二次确认，明确提示风险
- 导出加密 JSON：使用相同 Argon2id 参数加密

---

## 6. Tauri Commands 接口

```rust
// 核心命令列表
#[tauri::command]
async fn unlock_database(password: String) -> Result<(), String>;

#[tauri::command]
async fn create_database(password: String) -> Result<(), String>;

#[tauri::command]
async fn get_accounts(search: Option<String>) -> Result<Vec<Account>, String>;

#[tauri::command]
async fn add_account(account: NewAccount) -> Result<Account, String>;

#[tauri::command]
async fn update_account(id: String, account: UpdateAccount) -> Result<Account, String>;

#[tauri::command]
async fn delete_account(id: String) -> Result<(), String>;

#[tauri::command]
async fn copy_account_fields(id: String) -> Result<u32, String>;

#[tauri::command]
async fn generate_totp(secret: String) -> Result<TotpResult, String>;

#[tauri::command]
async fn import_from_json(path: String, password: Option<String>) -> Result<u32, String>;

#[tauri::command]
async fn export_to_json(path: String, encrypt: bool) -> Result<(), String>;
```

---

## 7. 性能指标

| 指标 | 目标值 |
|------|--------|
| 安装包大小 | < 8 MB |
| 启动时间 | < 1.5 秒 |
| 搜索响应 | < 50ms（1000 条数据）|
| 复制延迟 | 80ms/字段，总耗时 < 600ms |
| 内存占用 | < 100 MB |
| TOTP 计算 | < 10ms |

---

## 8. 项目结构

```
vault-paste/
├── src/                          # 前端源码 (React + TypeScript)
│   ├── components/
│   │   ├── AccountCard.tsx       # 账号卡片组件
│   │   ├── AccountDialog.tsx     # 添加/编辑弹窗
│   │   ├── SearchBar.tsx         # 搜索栏
│   │   ├── Toast.tsx             # 提示组件
│   │   └── TotpCountdown.tsx     # TOTP 倒计时
│   ├── hooks/
│   │   ├── useAccounts.ts        # 账号数据管理
│   │   ├── useClipboard.ts       # 剪贴板操作
│   │   └── useTotp.ts            # TOTP 计算
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── utils/
│   │   └── format.ts             # 格式化工具
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 入口文件
│   └── styles.css                # 全局样式
├── src-tauri/                    # Rust 后端源码
│   ├── src/
│   │   ├── main.rs               # 程序入口
│   │   ├── lib.rs                # 库入口
│   │   ├── commands.rs           # Tauri 命令处理
│   │   ├── database.rs           # SQLite 操作
│   │   ├── crypto.rs             # 加密/解密模块
│   │   ├── clipboard.rs          # 剪贴板批量复制
│   │   ├── totp.rs               # TOTP 生成
│   │   └── models.rs             # 数据模型
│   ├── Cargo.toml                # Rust 依赖
│   └── tauri.conf.json           # Tauri 配置
├── public/                       # 静态资源
├── dist/                         # 前端构建输出
├── src-tauri/target/release/     # Rust 构建输出
├── templates/                    # 导入模板
│   ├── import_template.json
│   └── import_template.csv
├── docs/                         # 使用文档
├── package.json                  # Node.js 依赖
├── tailwind.config.js            # Tailwind 配置
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
└── README.md
```

---

## 9. 构建与发布

### 9.1 开发环境
```bash
# 1. 安装依赖
pnpm install
cd src-tauri && cargo fetch

# 2. 开发模式运行
pnpm tauri dev

# 3. 构建生产版本
pnpm tauri build
```

### 9.2 发布产物
- `VaultPaste_<version>_x64-setup.exe` - Windows 安装包
- `VaultPaste_<version>_x64_en-US.msi` - MSI 安装包（可选）

---

## 10. 迭代计划

### Phase 1 - MVP（最小可用版本）
- [ ] 项目初始化（Tauri + React + Tailwind）
- [ ] 解锁/初始化数据库界面
- [ ] 账号列表展示 + 搜索
- [ ] 添加/编辑账号弹窗
- [ ] 一键批量复制功能
- [ ] TOTP 实时生成

### Phase 2 - 完善功能
- [ ] 导入/导出功能
- [ ] 修改主密码
- [ ] 快捷键支持（Ctrl+K 搜索等）
- [ ] 自动检查更新

### Phase 3 - 体验优化
- [ ] 密码生成器
- [ ] 深色/浅色主题切换
- [ ] 系统托盘常驻
- [ ] 全局快捷键快速唤起

---

## 11. 使用流程示例

### 11.1 首次使用
1. 运行 `VaultPaste.exe`
2. 设置主密码（建议 8 位以上，包含大小写和数字）
3. 进入主界面，点击"添加账号"
4. 填写第一个网站信息，保存

### 11.2 日常使用
1. 运行软件，输入主密码解锁
2. 在搜索框输入"github"，找到对应账号
3. 点击"复制全部"
4. 提示"成功复制 5 个字段"（自动跳过空字段）
5. 切换到浏览器，按 `Win+V` 调出剪贴板历史
6. 依次选择并粘贴：账号 → 密码 → 验证码

### 11.3 导入现有 TXT 数据
1. 按 `templates/import_template.json` 格式整理数据
2. 点击"导入"，选择 JSON 文件
3. 数据自动加密导入数据库

---

## 12. 注意事项

1. **请务必记住主密码**：忘记主密码将无法恢复数据
2. **定期备份数据库**：数据文件位于 `%APPDATA%/VaultPaste/vault.db`
3. **TOTP 时间同步**：确保系统时间准确，否则验证码可能不正确
4. **剪贴板历史**：Windows 剪贴板历史默认保存 25 条，超出后旧的会被覆盖
5. **安全建议**：不要将数据库文件同步到不安全的云存储

---

## 13. 技术依赖

### Rust 依赖 (Cargo.toml)
```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.32", features = ["bundled", "uuid"] }
argon2 = "0.5"
aes-gcm = "0.10"
rand = "0.8"
totp-rs = { version = "5", features = ["gen_secret"] }
arboard = "3"
zeroize = "1"
chrono = "0.4"
uuid = { version = "1", features = ["v4"] }
```

### Node.js 依赖 (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

---

*文档版本: 1.1*
*创建日期: 2026-03-24*
*更新日期: 2026-03-24*
*技术栈: Tauri v2 + React + Rust*
*作者: AI Assistant*
