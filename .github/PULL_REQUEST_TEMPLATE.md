<!--
Thanks for contributing to SEEDAO! 感谢贡献！
Please read CONTRIBUTING.md first. 请先阅读 CONTRIBUTING.md。
-->

## Summary · 概述
<!-- What does this PR do, and why? 这个 PR 做了什么、为什么？ -->


## Related issue · 关联 issue
<!-- e.g. Closes #123 -->


## Type of change · 改动类型
- [ ] `feat` — new feature · 新功能
- [ ] `fix` — bug fix · 缺陷修复
- [ ] `docs` — documentation only · 仅文档
- [ ] `refactor` / `chore` — no user-facing change · 无用户可见变更

## Screenshots · 截图
<!-- REQUIRED for any UI change: BOTH desktop and mobile. UI 改动必须附桌面 + 移动两端截图。 -->

| Desktop · 桌面 | Mobile · 移动 |
| --- | --- |
|  |  |

## Checklist · 自查清单
- [ ] I read [CONTRIBUTING.md](../CONTRIBUTING.md) · 已阅读贡献指南
- [ ] `npx tsc --noEmit && npm run lint && npm run build` passes · 校验通过
- [ ] UI changes implemented for **both** desktop and mobile systems · 桌面与移动两端均已实现
- [ ] New user-facing copy added to `lib/i18n/messages.ts` (zh + en) · 文案已加入 i18n（中英）
- [ ] No backend calls from client code; secrets stay server-only · 客户端未直连后端，密钥仅服务端
- [ ] Wire-type changes are in `lib/api/types.ts` / `lib/payment/types.ts` only · 类型改动集中于唯一真源
