# 绕过 Claude Code 官方鉴权、改用 Kimi（或其它 Anthropic 兼容端点）的说明

本文记录在本仓库里为 **不走 Claude.ai / Console OAuth**、**用环境变量里的第三方 API** 而做的改动与用法，便于以后回顾「绕过去」的路径。

---

## 背景：默认行为为什么会卡住

1. **首次引导**  
   原版会走主题、预检、OAuth 登录等步骤；未登录时对话容易提示登录。

2. **交互模式下的 `ANTHROPIC_API_KEY`**  
   逻辑上要求密钥出现在全局配置里的 **`customApiKeyResponses.approved`**（曾在 UI 里「批准」过自定义 Key）。  
   仅把 Key 写在 `~/.claude/settings.json` 的 `env` 里，**不**等于已批准 → `getAnthropicApiKeyWithSource()` 仍可能拿不到 Key → 请求像「未登录」，出现 **「Not logged in · Please run /login」**。

3. **启动时的 Key 校验**  
   `useApiKeyVerification` 会对官方 API 发一次探测请求；第三方网关的模型/beta 可能与官方不一致，导致误报失败。

---

## Kimi 官方推荐方式（产品侧）

[Kimi 文档：在第三方 Coding Agent 中使用 · Claude Code](https://www.kimi.com/code/docs/more/third-party-agents.html) 建议：

- `ENABLE_TOOL_SEARCH=false`（避免 `tool_search` 相关 400）
- `ANTHROPIC_BASE_URL=https://api.kimi.com/coding/`
- `ANTHROPIC_API_KEY=sk-kimi-...`（会员页生成的 Key）

本仓库通过 `applyConfigEnvironmentVariables` 会在信任流程之后把 `~/.claude/settings.json` 里的 `env` 注入进程，与上述一致。

---

## 本仓库代码层面的改动（摘要）

### 1. 首次引导：`src/components/Onboarding.tsx`

- 去掉 **预检（Preflight）** 步骤。
- 去掉 **OAuth / 控制台登录** 相关步骤（如 `ConsoleOAuthFlow`、`SkippableStep` 等）。
- 保留主题、（条件）API Key 审批 UI、安全说明、终端设置等仍可能存在的步骤（视你本地版本而定）。

### 2. 可选跳过整块首次引导：`src/interactiveHelpers.tsx`

- 在 `showSetupScreens` 开头：若设置环境变量 **`CLAUDE_CODE_SKIP_ONBOARDING=1`**（经 `isEnvTruthy` 判断），则调用 **`completeOnboarding()`**，把 `hasCompletedOnboarding` 写入全局配置，从而不再进入首次引导 UI。

使用示例：

```bash
export CLAUDE_CODE_SKIP_ONBOARDING=1
bun run dev
```

### 3. 第三方 Base URL 时直接信任环境变量 Key：`src/utils/auth.ts`

- 在 `getAnthropicApiKeyWithSource()` 中，在「仅 `-p`/CI 等才直接用 env」与「必须出现在 `approved` 列表」之间，增加分支：
- 当存在 **`ANTHROPIC_API_KEY`** 且 **`ANTHROPIC_BASE_URL` 不是 Anthropic 官方主机**（由 `isFirstPartyAnthropicBaseUrl()` 判断：未设置或 `api.anthropic.com` / 部分 staging 才算官方）时，**直接返回该环境变量作为 Key**，无需先加入 `approved` 列表。

这样 Kimi、LiteLLM 等「BASE_URL + Key」的配置在**交互 TUI** 下也会真正带上 `x-api-key`。

### 4. 跳过对第三方的「官方探测」：`src/hooks/useApiKeyVerification.ts`

- 增加 `hasThirdPartyEnvApiKey()`：有 `ANTHROPIC_API_KEY` 且非 `isFirstPartyAnthropicBaseUrl()`。
- 在此情况下，初始状态与 `reverify` 均视为 **`valid`**，**不再调用** `verifyApiKey()`，避免用官方 Haiku/ beta 探测误伤兼容网关。

---

## 本机配置（不在仓库里、需自己维护）

在用户目录 **`~/.claude/settings.json`** 中配置 `env`（示例结构，请把 Key 换成你自己的）：

```json
{
  "env": {
    "ENABLE_TOOL_SEARCH": "false",
    "ANTHROPIC_BASE_URL": "https://api.kimi.com/coding/",
    "ANTHROPIC_API_KEY": "sk-kimi-你的密钥"
  }
}
```

**不要**把真实 Key 提交到 Git 仓库。

---

## 行为小结（「绕过去」指什么）

| 环节 | 原逻辑 | 本仓库做法 |
|------|--------|------------|
| 首次引导 | 预检 + OAuth 等 | 移除相关步骤；可选用 `CLAUDE_CODE_SKIP_ONBOARDING` 整块跳过 |
| 交互模式下的 env Key | 需 `approved` 列表 | 非官方 `ANTHROPIC_BASE_URL` 时直接使用 env 中的 Key |
| 启动 Key 探测 | 调官方 API 验证 | 第三方 env 组合下跳过探测，避免误报 |

---

## 限制与注意

- **仍可能依赖 OAuth 的能力**（如部分 Channel、仅 claude.ai 账号可用的功能）在只用 Kimi Key 时**不可用**，属产品设计，不是本补丁能覆盖的。
- Key 若曾在聊天等不可信渠道暴露，应在 Kimi 后台**轮换**。
- `isFirstPartyAnthropicBaseUrl()` 定义在 `src/utils/model/providers.ts`：只有指向 Anthropic 官方 API 主机的 `ANTHROPIC_BASE_URL` 才算「第一方」；Kimi 域名会走「第三方 + env Key」分支。

---

## 相关文件路径（便于检索）

- `src/components/Onboarding.tsx`
- `src/interactiveHelpers.tsx`（`CLAUDE_CODE_SKIP_ONBOARDING`）
- `src/utils/auth.ts`（`getAnthropicApiKeyWithSource` + `isFirstPartyAnthropicBaseUrl`）
- `src/hooks/useApiKeyVerification.ts`
- `src/utils/model/providers.ts`（`isFirstPartyAnthropicBaseUrl`）
