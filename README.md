# Claude Code 源码改造 · 可跑 Kimi

> 在 [npm 还原源码](https://www.npmjs.com/package/@anthropic-ai/claude-code) 基础上做了**鉴权与体验向的改造**，配合 **Kimi（Anthropic 兼容协议）** 即可在终端里直接开聊，无需走官方 OAuth。

![预览](preview.png)

> [!WARNING]
> **非官方**、仅供学习研究；还原与 shim 可能导致行为与上游不一致。上游版权属 [Anthropic](https://www.anthropic.com)。

---

## 相对原版 / 还原版，本仓库做了哪些改造

### 1. 登录与「Not logged in」校验（Kimi 等第三方端点）

目标：**不配官方 Claude 账号也能用**，环境变量里的 Key 在交互 TUI 下真正生效。

| 方向 | 说明 |
|------|------|
| 首次引导 | `Onboarding.tsx` 去掉预检与 OAuth/控制台登录步骤，减少强制登录感。 |
| 一键跳过引导 | `interactiveHelpers.tsx`：设置 **`CLAUDE_CODE_SKIP_ONBOARDING=1`** 时直接 `completeOnboarding()`。 |
| 环境 Key 直连 | `auth.ts`：当 `ANTHROPIC_BASE_URL` 指向**非 Anthropic 官方主机**且存在 `ANTHROPIC_API_KEY` 时，**直接采用该 Key**，不要求先写入 `approved` 列表。 |
| 校验不误伤网关 | `useApiKeyVerification.ts`：上述第三方配置下将 Key 视为 **valid**，跳过对官方 API 的探测请求。 |

细节、文件路径与安全注意见 **[`dissAuth.md`](dissAuth.md)**。

### 2. Buddy（伴侣精灵）与 `/buddy` 命令

| 方向 | 说明 |
|------|------|
| 编译开关 | `package.json` 的 `dev` / `start` 默认带 **`bun --feature=BUDDY`**，角落精灵 UI 才会启用。 |
| 斜杠命令 | `commands/buddy/`：`/buddy` 注册为 **`local-jsx` + `immediate`**，与 `/status` 类似即时弹出界面。 |
| 档案卡 | `BuddyProfileCard.tsx`：展示精灵 ASCII、稀有度、属性条、性格等；**Esc / Enter** 关闭。 |
| 逻辑与覆盖 | `buddy-ui.tsx` 处理 `list` / `pick` / `mute` / `reset` 等；`companion.ts` 支持 **`buddySpeciesOverride`** 只改展示物种、不改变稀有度等 roll。 |

### 3. 维护用文档与 Cursor 技能（可选）

- **`docs/YYYY-MM-DD.md`** — 按日开发日志（实现与选型）。
- **`developerWords/YYYY-MM-DD.md`** — 仅归档开发者侧原话。
- **`.cursor/skills/daily-record/SKILL.md`** — 收尾流程说明（触发词见该文件 `description`）。

---

## 快速开始

**环境：** Bun ≥ 1.3.5、Node.js ≥ 24。

```bash
bun install
bun run dev      # 默认含 --feature=BUDDY
bun run version
```

### 配置 Kimi（`~/.claude/settings.json`，勿提交密钥）

```json
{
  "env": {
    "ENABLE_TOOL_SEARCH": "false",
    "ANTHROPIC_BASE_URL": "https://api.kimi.com/coding/",
    "ANTHROPIC_API_KEY": "sk-kimi-你的密钥"
  }
}
```

[Kimi 与 Claude Code 对接说明](https://www.kimi.com/code/docs/more/third-party-agents.html)

**可选：** 跳过首次引导界面

```bash
export CLAUDE_CODE_SKIP_ONBOARDING=1
```

### 全局命令（可选）

```bash
echo 'export CLAUDE_CODE_SKIP_ONBOARDING=1' >> ~/.zshrc
echo "alias claude='bun run --cwd /path/to/本仓库 dev'" >> ~/.zshrc
source ~/.zshrc
```

将 `/path/to/本仓库` 换成你的克隆路径。

---

## 协作者仍看到「Not logged in」？

补丁在仓库里，但 **`~/.claude/settings.json` 和 API Key 不会随 Git 分发**。克隆后每人要在本机配置 `env`（见上文 JSON），通过工作区信任后变量才会注入进程。详见 [`dissAuth.md`](dissAuth.md)。

---

## 目录（与改造相关的路径）

```
src/utils/auth.ts              # 第三方 Base URL 下直接使用 env Key
src/hooks/useApiKeyVerification.ts
src/components/Onboarding.tsx
src/interactiveHelpers.tsx
src/buddy/                     # 精灵渲染、roll、BuddyProfileCard
src/commands/buddy/            # /buddy local-jsx
dissAuth.md                    # 鉴权改造说明
docs/ / developerWords/        # 可选维护记录
.cursor/skills/daily-record/   # 可选 Cursor 技能
```

---

## 声明

- 源码版权归 Anthropic；本仓库用于技术研究与学习，请勿用于商业用途；侵权请联系删除。
