# req-cli

华为云 CodeArts 需求管理命令行工具，封装 **CreateIssueV4** API（`POST /v4/projects/{project_id}/issue`）。

## 环境要求

- Node.js >= 18（使用原生 `fetch`，无需安装任何依赖）

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `CODEARTS_REQ_ENDPOINT` | CodeArts Req 终端节点 | `https://codearts-ext.cn-north-4.myhuaweicloud.com` |
| `CODEARTS_REQ_AK` | 访问密钥 AK（用于 SDK-HMAC-SHA256 签名） | 从控制台「我的凭证 → 访问密钥」获取 |
| `CODEARTS_REQ_SK` | 访问密钥 SK（与 AK 配对） | 创建时仅显示一次，妥善保管 |
| `CODEARTS_REQ_PROXY` | 可选，socks5 代理地址 | `socks5://127.0.0.1:10808` |

`CODEARTS_REQ_ENDPOINT`、`CODEARTS_REQ_AK`、`CODEARTS_REQ_SK` 必须配置，缺任意一个程序直接报错退出（退出码 2），不会发送请求。`CODEARTS_REQ_PROXY` 为可选，当网络环境需要 socks5 代理时设置。

```bash
# PowerShell
$env:CODEARTS_REQ_ENDPOINT = "https://codearts-ext.cn-north-4.myhuaweicloud.com"
$env:CODEARTS_REQ_AK       = "你的AK"
$env:CODEARTS_REQ_SK       = "你的SK"

# bash / zsh
export CODEARTS_REQ_ENDPOINT="https://codearts-ext.cn-north-4.myhuaweicloud.com"
export CODEARTS_REQ_AK="你的AK"
export CODEARTS_REQ_SK="你的SK"
export CODEARTS_REQ_PROXY="socks5://127.0.0.1:10808"  # 可选，需要代理时设置
```

## 用法

### 创建工作项

```bash
node req-cli.mjs issue create <title> [选项]
```

#### 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `<title>` | 是 | 工作项标题，1~512 字符 |

#### 必填选项

| 选项 | 说明 |
|------|------|
| `--project-id <uuid>` | 项目 ID（32位 UUID） |
| `--tracker <id>` | 工作项类型：`2` Task / `3` Bug / `5` Epic / `6` Feature / `7` Story |
| `--priority <id>` | 优先级：`1` 低 / `2` 中 / `3` 高 |

#### 选填选项

| 选项 | 说明 |
|------|------|
| `--description <text>` | 工作项描述 |
| `--status-id <id>` | 状态：`1` 新建 / `2` 进行中 / `3` 已解决 / `4` 测试中 / `5` 已关闭 / `6` 已拒绝（默认 `1`） |
| `--severity <id>` | 严重程度：`10` 关键 / `11` 重要 / `12` 一般 / `13` 提示 |
| `--assigned-to <id>` | 处理人数字 ID |
| `--parent-issue <id>` | 父工作项 ID |
| `--iteration <id>` | 迭代 ID |
| `--begin <yyyy-mm-dd>` | 开始日期 |
| `--end <yyyy-mm-dd>` | 结束日期 |
| `--json` | 以 JSON 格式输出响应 |

### 示例

```bash
# 创建一个 Bug
node req-cli.mjs issue create "修复登录页面白屏" \
  --project-id 06f4c4c5-6e3a-4d0b-9c2f-1234567890ab \
  --tracker 3 \
  --priority 3 \
  --severity 11 \
  --description "用户登录后页面白屏，需排查"

# 创建一个 Task 并以 JSON 输出
node req-cli.mjs issue create "编写单元测试" \
  --project-id 06f4c4c5-6e3a-4d0b-9c2f-1234567890ab \
  --tracker 2 \
  --priority 2 \
  --json

# 创建 Story，指定迭代与日期
node req-cli.mjs issue create "用户中心重构" \
  --project-id 06f4c4c5-6e3a-4d0b-9c2f-1234567890ab \
  --tracker 7 \
  --priority 2 \
  --iteration 401 \
  --begin 2024-03-01 \
  --end 2024-04-30
```

### Help

```bash
node req-cli.mjs --help                  # 根 help
node req-cli.mjs issue --help            # issue 子命令 help
node req-cli.mjs issue create --help     # create 完整选项
```

## 退出码

| 退出码 | 含义 |
|--------|------|
| `0` | 成功 |
| `1` | API 报错（透传 `error_code` / `error_msg`） |
| `2` | 参数错误（缺必填、非法值、日期格式不对、缺环境变量） |
| `3` | 网络异常 |

## 输出

- **默认**：摘要格式

```
工作项创建成功
  ID:       12345
  标题:      修复登录页面白屏
  类型:      3 (Bug)
  优先级:    3 (高)
  状态:      1 (新建)
```

- **`--json`**：完整 API 响应的 JSON

## 测试

```bash
npm test
# 或
node --test test/req-cli.test.mjs
```

测试使用 `node:test` 内置框架，通过 mock fetch 验证参数校验、环境变量检查、请求构造、响应处理、退出码等，不依赖网络。

## API 对应

本工具封装华为云 CodeArts 需求管理 **CreateIssueV4** 接口：

- 方法：`POST`
- 路径：`/v4/projects/{project_id}/issue`
- 鉴权：AK/SK 签名（SDK-HMAC-SHA256），请求头 `Authorization` + `X-Sdk-Date`
- 请求体字段映射：

| CLI 选项 | API 请求体字段 |
|----------|---------------|
| `<title>` | `name` |
| `--tracker` | `tracker_id` |
| `--priority` | `priority_id` |
| `--status-id` | `status_id` |
| `--severity` | `severity_id` |
| `--description` | `description` |
| `--assigned-to` | `assigned_to` |
| `--parent-issue` | `parent_issue_id` |
| `--iteration` | `iteration_id` |
| `--begin` | `begin_time` |
| `--end` | `end_time` |