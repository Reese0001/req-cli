import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../req-cli.mjs';

const UUID = '06f4c4c5-6e3a-4d0b-9c2f-1234567890ab';
const ENDPOINT = 'https://codearts-ext.cn-north-4.myhuaweicloud.com';
const AK = 'test-ak-xxx';
const SK = 'test-sk-xxx';

function mockStream() {
  const chunks = [];
  return { write: (s) => chunks.push(s), content: () => chunks.join('') };
}

function mockFetch(data, { ok = true, status = 200 } = {}) {
  const fn = async (url, init) => {
    fn.lastUrl = url;
    fn.lastInit = init;
    return { ok, status, json: async () => data };
  };
  return fn;
}

function mockFetchError(message) {
  return async () => { throw new Error(message); };
}

function baseEnv() {
  return { CODEARTS_REQ_ENDPOINT: ENDPOINT, CODEARTS_REQ_AK: AK, CODEARTS_REQ_SK: SK };
}

function baseArgs(title = '测试工作项') {
  return ['issue', 'create', title, '--project-id', UUID, '--tracker', '2', '--priority', '1'];
}

async function exec(argv, env, fetchFn) {
  const stdout = mockStream();
  const stderr = mockStream();
  const code = await run(argv, env, { fetchFn, stdout, stderr });
  return { code, stdout: stdout.content(), stderr: stderr.content() };
}

describe('help 输出', () => {
  test('无参数显示根 help，退出码 0', async () => {
    const { code, stdout } = await exec([], baseEnv(), mockFetch({}));
    assert.equal(code, 0);
    assert.match(stdout, /req-cli - 华为云 CodeArts/);
  });

  test('--help 显示根 help', async () => {
    const { code, stdout } = await exec(['--help'], baseEnv(), mockFetch({}));
    assert.equal(code, 0);
    assert.match(stdout, /用法/);
  });

  test('issue --help 显示 issue help', async () => {
    const { code, stdout } = await exec(['issue', '--help'], baseEnv(), mockFetch({}));
    assert.equal(code, 0);
    assert.match(stdout, /req-cli issue/);
  });

  test('issue create --help 显示 create help', async () => {
    const { code, stdout } = await exec(['issue', 'create', '--help'], baseEnv(), mockFetch({}));
    assert.equal(code, 0);
    assert.match(stdout, /req-cli issue create/);
    assert.match(stdout, /--project-id/);
    assert.match(stdout, /--tracker/);
    assert.match(stdout, /--priority/);
  });
});

describe('参数错误（退出码 2）', () => {
  test('未知命令退出码 2', async () => {
    const { code, stderr } = await exec(['foobar'], baseEnv(), mockFetch({}));
    assert.equal(code, 2);
    assert.match(stderr, /未知命令/);
  });

  test('未知子命令退出码 2', async () => {
    const { code, stderr } = await exec(['issue', 'foobar'], baseEnv(), mockFetch({}));
    assert.equal(code, 2);
    assert.match(stderr, /未知子命令/);
  });

  test('缺少 title 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '--project-id', UUID, '--tracker', '2', '--priority', '1'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /缺少必填参数：工作项标题/);
  });

  test('缺少 --project-id 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--tracker', '2', '--priority', '1'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /缺少必填参数：--project-id/);
  });

  test('缺少 --tracker 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--priority', '1'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /缺少必填参数：--tracker/);
  });

  test('缺少 --priority 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /缺少必填参数：--priority/);
  });

  test('非法 tracker 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '9', '--priority', '1'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--tracker 非法/);
  });

  test('非法 priority 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2', '--priority', '5'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--priority 非法/);
  });

  test('非法 severity 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2', '--priority', '1', '--severity', '99'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--severity 非法/);
  });

  test('非法 status-id 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2', '--priority', '1', '--status-id', '99'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--status-id 非法/);
  });

  test('非法 project-id 格式退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', 'not-a-uuid', '--tracker', '2', '--priority', '1'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--project-id 格式不正确/);
  });

  test('非法日期格式退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2', '--priority', '1', '--begin', '2024/01/01'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--begin 日期格式不正确/);
  });

  test('非法 end 日期退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2', '--priority', '1', '--end', 'invalid'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--end 日期格式不正确/);
  });

  test('标题超过 512 字符退出码 2', async () => {
    const longTitle = 'a'.repeat(513);
    const { code, stderr } = await exec(
      ['issue', 'create', longTitle, '--project-id', UUID, '--tracker', '2', '--priority', '1'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /标题长度/);
  });

  test('非法 assigned-to 退出码 2', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '标题', '--project-id', UUID, '--tracker', '2', '--priority', '1', '--assigned-to', 'abc'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /--assigned-to/);
  });

  test('多个错误一次性输出', async () => {
    const { code, stderr } = await exec(
      ['issue', 'create', '--tracker', '9', '--priority', '5'],
      baseEnv(), mockFetch({})
    );
    assert.equal(code, 2);
    assert.match(stderr, /缺少必填参数：工作项标题/);
    assert.match(stderr, /缺少必填参数：--project-id/);
    assert.match(stderr, /--tracker 非法/);
    assert.match(stderr, /--priority 非法/);
  });
});

describe('环境变量缺失（退出码 2）', () => {
  test('缺少 CODEARTS_REQ_ENDPOINT 退出码 2', async () => {
    const { code, stderr } = await exec(baseArgs(), { CODEARTS_REQ_AK: AK, CODEARTS_REQ_SK: SK }, mockFetch({}));
    assert.equal(code, 2);
    assert.match(stderr, /CODEARTS_REQ_ENDPOINT/);
  });

  test('缺少 CODEARTS_REQ_AK 退出码 2', async () => {
    const { code, stderr } = await exec(baseArgs(), { CODEARTS_REQ_ENDPOINT: ENDPOINT, CODEARTS_REQ_SK: SK }, mockFetch({}));
    assert.equal(code, 2);
    assert.match(stderr, /CODEARTS_REQ_AK/);
  });

  test('缺少 CODEARTS_REQ_SK 退出码 2', async () => {
    const { code, stderr } = await exec(baseArgs(), { CODEARTS_REQ_ENDPOINT: ENDPOINT, CODEARTS_REQ_AK: AK }, mockFetch({}));
    assert.equal(code, 2);
    assert.match(stderr, /CODEARTS_REQ_SK/);
  });

  test('全部缺少时都提示', async () => {
    const { code, stderr } = await exec(baseArgs(), {}, mockFetch({}));
    assert.equal(code, 2);
    assert.match(stderr, /CODEARTS_REQ_ENDPOINT/);
    assert.match(stderr, /CODEARTS_REQ_AK/);
    assert.match(stderr, /CODEARTS_REQ_SK/);
  });
});

describe('API 成功（退出码 0）', () => {
  test('创建成功输出摘要', async () => {
    const apiData = { id: 12345, name: '测试工作项', tracker: { id: 2, name: 'Task' }, priority: { id: 1, name: '低' }, status: { id: 1, name: '新建' } };
    const fn = mockFetch(apiData);
    const { code, stdout } = await exec(baseArgs(), baseEnv(), fn);
    assert.equal(code, 0);
    assert.match(stdout, /工作项创建成功/);
    assert.match(stdout, /12345/);
    assert.match(stdout, /Task/);
  });

  test('--json 输出 JSON 格式', async () => {
    const apiData = { id: 12345, name: '测试工作项', tracker: { id: 2, name: 'Task' } };
    const fn = mockFetch(apiData);
    const argv = [...baseArgs(), '--json'];
    const { code, stdout } = await exec(argv, baseEnv(), fn);
    assert.equal(code, 0);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.id, 12345);
    assert.equal(parsed.name, '测试工作项');
  });

  test('请求 URL 正确拼接', async () => {
    const fn = mockFetch({ id: 1 });
    await exec(baseArgs(), baseEnv(), fn);
    assert.equal(fn.lastUrl, `${ENDPOINT}/v4/projects/${UUID}/issue`);
  });

  test('请求头包含 Authorization 签名与 X-Sdk-Date', async () => {
    const fn = mockFetch({ id: 1 });
    await exec(baseArgs(), baseEnv(), fn);
    assert.match(fn.lastInit.headers['Authorization'], /^SDK-HMAC-SHA256 Access=test-ak-xxx, SignedHeaders=host;x-sdk-date, Signature=[0-9a-f]+$/);
    assert.match(fn.lastInit.headers['X-Sdk-Date'], /^\d{8}T\d{6}Z$/);
    assert.equal(fn.lastInit.headers['X-Auth-Token'], undefined);
  });

  test('请求体包含必填字段和默认 status_id', async () => {
    const fn = mockFetch({ id: 1 });
    await exec(baseArgs(), baseEnv(), fn);
    const body = JSON.parse(fn.lastInit.body);
    assert.equal(body.name, '测试工作项');
    assert.equal(body.tracker_id, 2);
    assert.equal(body.priority_id, 1);
    assert.equal(body.status_id, 1);
  });

  test('选填字段正确传入请求体', async () => {
    const fn = mockFetch({ id: 1 });
    const argv = [
      'issue', 'create', '完整工作项',
      '--project-id', UUID,
      '--tracker', '3',
      '--priority', '3',
      '--description', '这是一个描述',
      '--status-id', '2',
      '--severity', '11',
      '--assigned-to', '100',
      '--parent-issue', '200',
      '--iteration', '300',
      '--begin', '2024-01-01',
      '--end', '2024-12-31',
    ];
    await exec(argv, baseEnv(), fn);
    const body = JSON.parse(fn.lastInit.body);
    assert.equal(body.name, '完整工作项');
    assert.equal(body.tracker_id, 3);
    assert.equal(body.priority_id, 3);
    assert.equal(body.description, '这是一个描述');
    assert.equal(body.status_id, 2);
    assert.equal(body.severity_id, 11);
    assert.equal(body.assigned_to, 100);
    assert.equal(body.parent_issue_id, 200);
    assert.equal(body.iteration_id, 300);
    assert.equal(body.begin_time, '2024-01-01');
    assert.equal(body.end_time, '2024-12-31');
  });

  test('endpoint 尾部斜杠被去除', async () => {
    const fn = mockFetch({ id: 1 });
    await exec(baseArgs(), { CODEARTS_REQ_ENDPOINT: ENDPOINT + '/', CODEARTS_REQ_AK: AK, CODEARTS_REQ_SK: SK }, fn);
    assert.equal(fn.lastUrl, `${ENDPOINT}/v4/projects/${UUID}/issue`);
  });
});

describe('API 报错（退出码 1）', () => {
  test('透传 error_code 和 error_msg', async () => {
    const fn = mockFetch(
      { error_code: 'REQ.001', error_msg: '项目不存在' },
      { ok: false, status: 400 }
    );
    const { code, stderr } = await exec(baseArgs(), baseEnv(), fn);
    assert.equal(code, 1);
    assert.match(stderr, /REQ\.001/);
    assert.match(stderr, /项目不存在/);
  });

  test('嵌套 error 对象也能提取', async () => {
    const fn = mockFetch(
      { error: { code: 'REQ.002', message: '权限不足' } },
      { ok: false, status: 403 }
    );
    const { code, stderr } = await exec(baseArgs(), baseEnv(), fn);
    assert.equal(code, 1);
    assert.match(stderr, /REQ\.002/);
    assert.match(stderr, /权限不足/);
  });
});

describe('网络异常（退出码 3）', () => {
  test('fetch 抛异常退出码 3', async () => {
    const fn = mockFetchError('connect ECONNREFUSED');
    const { code, stderr } = await exec(baseArgs(), baseEnv(), fn);
    assert.equal(code, 3);
    assert.match(stderr, /网络异常/);
    assert.match(stderr, /ECONNREFUSED/);
  });
});