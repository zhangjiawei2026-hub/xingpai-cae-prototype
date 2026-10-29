import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
const port = process.env.CAE_PORT ?? "4198";
const baseURL = `http://127.0.0.1:${port}`;
const artifactDir = path.resolve(
  process.env.CAE_ARTIFACT_DIR ??
    `../outputs/prototype-review-20261022/v0.2-${Date.now()}`,
);
await mkdir(artifactDir, { recursive: true });
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    port,
    "--strictPort",
  ],
  { stdio: "pipe" },
);
let serverOutput = "";
server.stdout.on("data", (d) => (serverOutput += d));
server.stderr.on("data", (d) => (serverOutput += d));
const checks = [],
  errors = [],
  consoleErrors = [],
  responses = [];
let browser, page;
async function check(name, fn) {
  if (process.env.CAE_CHECKS && !new RegExp(process.env.CAE_CHECKS).test(name))
    return;
  await fn();
  checks.push({ name, status: "passed" });
  console.log(`PASS ${name}`);
}
try {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(serverOutput);
    try {
      if ((await fetch(baseURL)).ok) break;
    } catch {
      /* preview server is still starting */
    }
    await pause(200);
  }
  browser = await chromium.launch({
    channel: process.env.CAE_BROWSER === "chromium" ? undefined : "chrome",
    headless: true,
    args: ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      responses.push(`${response.status()} ${response.url()}`);
  });
  page.setDefaultTimeout(30000);
  const button = (name) =>
    ["节点集合", "分析步", "设计域", "模型树", "信息窗口"].includes(name)
      ? page
          .getByLabel("Ribbon 功能区")
          .getByRole("button", { name, exact: true })
      : ["创建分析步", "创建设计域"].includes(name)
        ? page
            .locator("dialog[open]")
            .getByRole("button", { name, exact: true })
        : ["放大模型", "缩小模型"].includes(name)
          ? page.locator('[aria-label="视图工具"]').getByRole("button", { name, exact: true })
          : page.getByRole("button", { name, exact: true });
  const field = (name) => page.getByRole("textbox", { name, exact: true });
  const dialog = () => page.locator("dialog[open]");
  const shot = (name) =>
    page.screenshot({ path: path.join(artifactDir, name + ".png") });
  await page.goto(baseURL);
  await check("主界面与 WebGL 初始化", async () => {
    await expect(
      page.getByRole("heading", { name: "当前模型没有部件" }),
    ).toHaveCount(0);
    await expect(page.locator("canvas")).toBeVisible();
    await expect(button("等轴测")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1,084 顶点")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
  await check("1920/1440/1280 窗口主界面无横向溢出", async () => {
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1280, 720],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(
        page.getByRole("region", { name: "模型视图区" }),
      ).toBeVisible();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await shot(`workspace-${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
  });
  await check("Ribbon 下拉命令菜单与取消", async () => {
    await button("创建命令下拉菜单").click();
    await expect(
      page.getByRole("menu", { name: "Ribbon 创建命令" }),
    ).toBeVisible();
    await page
      .getByRole("menuitem", { name: "创建节点集合", exact: true })
      .click();
    await expect(dialog()).toBeVisible();
    await button("取消").click();
  });
  await check("节点集合类型限制、空选择提示", async () => {
    await button("节点集合").click();
    await expect(
      page.getByRole("combobox", { name: "节点集合对象类型" }),
    ).toBeDisabled();
    await button("创建集合").click();
    await expect(page.getByRole("alert")).toContainText("至少一个");
    await field("集合名称").fill("Review-nodes");
  });
  await check("选择取消恢复原草稿，键盘 Esc 结束拾取", async () => {
    await button("拾取节点").click();
    await expect(dialog()).toHaveCount(0);
    await button("选择Node 1").click();
    await page.keyboard.press("Escape");
    await expect(dialog()).toBeVisible();
    await expect(page.getByTestId("node-count")).toHaveText("已选 0 项");
    await expect(field("集合名称")).toHaveValue("Review-nodes");
  });
  await check("模型射线拾取可命中显示顶点", async () => {
    await button("拾取节点").click();
    const canvas = page.locator("canvas");
    const rect = await canvas.boundingBox();
    for (const [x, y] of [
      [0.5, 0.6],
      [0.5, 0.65],
      [0.48, 0.55],
      [0.48, 0.7],
    ]) {
      await canvas.click({
        position: { x: rect.width * x, y: rect.height * y },
      });
      if ((await page.getByTestId("pick-count").textContent()) !== "已选 0 项")
        break;
    }
    await expect(page.getByTestId("pick-count")).not.toHaveText("已选 0 项");
    await button("取消拾取").click();
    await expect(page.getByTestId("node-count")).toHaveText("已选 0 项");
  });
  await check("Node 确认、二次拾取取消和模型上下文锁定", async () => {
    await button("拾取节点").click();
    await expect(
      page.getByRole("combobox", { name: "当前模型" }),
    ).toBeDisabled();
    await button("选择Node 1").click();
    await button("选择Node 2").click();
    await shot("node-picking");
    await button("确认选择").click();
    await expect(page.getByTestId("node-count")).toHaveText("已选 2 项");
    await button("拾取节点").click();
    await button("选择Node 3").click();
    await button("取消拾取").click();
    await expect(page.getByTestId("node-count")).toHaveText("已选 2 项");
    await shot("node-dialog");
  });
  await check("节点集合提交更新模型树与日志", async () => {
    await button("创建集合").click();
    await expect(
      page.getByRole("treeitem", { name: "Review-nodes", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("log")).toContainText("Review-nodes");
  });
  await check(
    "模型树入口复用流程、重复名称、取消不提交、焦点恢复",
    async () => {
      const trigger = button("从树创建节点集合");
      await trigger.click();
      await field("集合名称").fill("Review-nodes");
      await button("从已有集合读取").click();
      await button("Fixture-nodes (4 个节点)").click();
      await button("创建集合").click();
      await expect(page.getByRole("alert")).toContainText("名称需唯一");
      await button("取消").click();
      await expect(trigger).toBeFocused();
      await expect(
        page.getByRole("treeitem", { name: "Review-nodes", exact: true }),
      ).toHaveCount(1);
    },
  );
  await check("分析步阶段切换与草稿保留", async () => {
    await button("分析步").click();
    await field("分析步名称").fill("Review-step");
    await shot("step-type");
    await button("继续").click();
    await expect(field("分析类型")).toHaveValue("静力，通用");
    await page.getByRole("tab", { name: "增量", exact: true }).click();
    await page.getByRole("radio", { name: "固定", exact: true }).check();
    await field("初始增量尺寸").fill("0.25");
    await field("最大增量数").fill("20");
    await button("上一步").click();
    await expect(field("分析步名称")).toHaveValue("Review-step");
    await button("继续").click();
    await expect(field("初始增量尺寸")).toHaveValue("0.25");
    await shot("step-parameters");
  });
  await check("分析步创建后上下文与树同步", async () => {
    await button("创建分析步").click();
    await expect(
      page.getByRole("combobox", { name: "当前分析步" }),
    ).toHaveValue("Review-step");
    await expect(
      page.getByRole("treeitem", { name: "Review-step", exact: true }),
    ).toBeVisible();
  });
  await check("设计域 Element 选择与页签草稿", async () => {
    await button("设计域").click();
    await field("设计域名称").fill("Review-domain");
    await button("拾取单元").click();
    await button("选择Element 1").click();
    await button("选择Element 2").click();
    await shot("element-picking");
    await button("确认选择").click();
    await field("最小尺寸值").fill("2.5");
    await page.getByRole("tab", { name: "最大尺寸", exact: true }).click();
    await field("最大尺寸值").fill("8");
    await page.getByRole("tab", { name: "基础", exact: true }).click();
    await expect(field("最小尺寸值")).toHaveValue("2.5");
    await shot("domain-basic");
  });
  await check("约束激活控制禁用，基准点与方向选择不串用", async () => {
    await page.getByRole("tab", { name: "脱模", exact: true }).click();
    await expect(button("选择基准点")).toBeDisabled();
    await page.getByRole("checkbox", { name: "激活", exact: true }).check();
    await button("选择基准点").click();
    await button("选择Node 1").click();
    await button("确认选择").click();
    await button("选择第一点").click();
    await expect(button("选择Node 1")).toHaveAttribute("aria-pressed", "false");
    await button("选择Node 2").click();
    await button("确认选择").click();
    await shot("domain-draw");
    await button("创建设计域").click();
    await expect(
      page.getByRole("treeitem", { name: "Review-domain", exact: true }),
    ).toBeVisible();
  });
  await check("取消新表单无跨命令数据泄漏", async () => {
    await button("节点集合").click();
    await expect(page.getByTestId("node-count")).toHaveText("已选 0 项");
    await button("取消").click();
    await button("设计域").click();
    await expect(field("最小尺寸值")).toHaveValue("");
    await page.keyboard.press("Escape");
    await expect(dialog()).toHaveCount(0);
  });
  await check("空模型隔离、命令禁用与切回恢复", async () => {
    await page
      .getByRole("combobox", { name: "当前模型" })
      .selectOption("Model-Empty");
    await expect(
      page.getByRole("heading", { name: "当前模型没有部件" }),
    ).toBeVisible();
    await expect(
      page.getByRole("treeitem", { name: "Review-nodes", exact: true }),
    ).toHaveCount(0);
    await expect(button("节点集合")).toBeDisabled();
    await page
      .getByRole("combobox", { name: "当前模型" })
      .selectOption("Model-1");
    await expect(
      page.getByRole("treeitem", { name: "Review-nodes", exact: true }),
    ).toBeVisible();
  });
  await check("结果空态、树搜索、面板显隐、分隔条键盘调整", async () => {
    await page.getByRole("tab", { name: "结果" }).click();
    await expect(page.getByText("暂无计算结果")).toBeVisible();
    await page.getByRole("tab", { name: "模型" }).click();
    await field("搜索模型树").fill("Review-nodes");
    await expect(
      page.getByRole("treeitem", { name: "Review-nodes", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("treeitem", { name: "Initial", exact: true }),
    ).toHaveCount(0);
    await field("搜索模型树").fill("");
    const splitter = page.getByRole("separator", { name: "调整模型树宽度" });
    await splitter.focus();
    await page.keyboard.press("ArrowRight");
    await expect(splitter).toHaveAttribute("aria-valuenow", "263");
    await button("模型树").click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await button("模型树").click();
    await button("信息窗口").click();
    await expect(page.getByRole("region", { name: "信息窗口" })).toHaveCount(0);
    await button("信息窗口").click();
  });
  await check("视图方向、缩放、线框切换与帮助 Esc", async () => {
    await button("前").click();
    await expect(button("前")).toHaveAttribute("aria-pressed", "true");
    await button("放大模型").click();
    await button("缩小模型").click();
    await button("显示三角面边线").click();
    await expect(button("显示三角面边线")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await button("显示三角面边线").click();
    await button("等轴测").click();
    await button("帮助").click();
    await page.keyboard.press("Escape");
    await expect(dialog()).toHaveCount(0);
  });
  await check("1280×720 三类弹窗与键盘焦点约束", async () => {
    await page.setViewportSize({ width: 1280, height: 720 });
    for (const name of ["节点集合", "分析步", "设计域"]) {
      await button(name).click();
      const rect = await dialog().boundingBox();
      assert(rect && rect.y >= 0 && rect.y + rect.height <= 721);
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press("Tab");
        assert(
          await page.evaluate(() =>
            document
              .querySelector("dialog[open]")
              .contains(document.activeElement),
          ),
        );
      }
      await shot(`dialog-1280-${name}`);
      await page.keyboard.press("Escape");
    }
  });
  await check("1280×720 复杂参数与脱模页按钮可访问", async () => {
    await button("分析步").click();
    await button("继续").click();
    await expect(button("创建分析步")).toBeInViewport();
    await shot("step-parameters-1280");
    await button("取消").click();
    await button("设计域").click();
    await page.getByRole("tab", { name: "脱模", exact: true }).click();
    await expect(button("创建设计域")).toBeInViewport();
    await shot("domain-draw-1280");
    await button("取消").click();
  });
  await check("125% 页面缩放下主界面与弹窗操作", async () => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => (document.body.style.zoom = "1.25"));
    await button("设计域").click();
    await button("取消").click();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await shot("zoom-125");
    await page.evaluate(() => (document.body.style.zoom = ""));
  });
  await check("四类入口取消、Esc、创建后焦点恢复", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const entries = [
      { trigger: () => button("创建对象菜单"), menu: "创建对象" },
      { trigger: () => button("创建命令下拉菜单"), menu: "Ribbon 创建命令" },
      { trigger: () => button("从树创建节点集合") },
      { trigger: () => button("节点集合") },
    ];
    for (const [index, entry] of entries.entries()) {
      for (const exit of ["取消", "Escape", "创建"]) {
        await entry.trigger().click();
        if (entry.menu)
          await page
            .getByRole("menu", { name: entry.menu, exact: true })
            .getByRole("menuitem", { name: "创建节点集合", exact: true })
            .click();
        if (exit === "创建") {
          await field("集合名称").fill(`Focus-${index}`);
          await button("从已有集合读取").click();
          await button("Fixture-nodes (4 个节点)").click();
          await button("创建集合").click();
        } else if (exit === "Escape") await page.keyboard.press("Escape");
        else await button("取消").click();
        await expect(entry.trigger()).toBeFocused();
      }
    }
  });
  await check(
    "全部模块、分析步与空模型上下文一致，重复英文已移除",
    async () => {
      const modules = [
        "部件",
        "属性",
        "装配",
        "分析步",
        "相互作用",
        "载荷",
        "网格",
        "优化",
      ];
      for (const model of ["Model-1", "Model-Empty"]) {
        await page
          .getByRole("combobox", { name: "当前模型" })
          .selectOption(model);
        for (const module of modules) {
          await page
            .getByRole("navigation", { name: "分析模块" })
            .getByRole("button", { name: module, exact: true })
            .click();
          const expected = ["部件", "属性", "网格"].includes(module)
            ? model === "Model-Empty"
              ? "无部件"
              : "Part-1"
            : ["分析步", "相互作用", "载荷"].includes(module)
              ? await page
                  .getByRole("combobox", { name: "当前分析步" })
                  .inputValue()
              : module === "优化"
                ? model === "Model-Empty"
                  ? "无优化任务"
                  : "Task-1"
                : model;
          await expect(page.getByTestId("workspace-context")).toContainText(
            expected,
          );
          if (
            model === "Model-1" &&
            ["分析步", "相互作用", "载荷"].includes(module)
          ) {
            await page
              .getByRole("combobox", { name: "当前分析步" })
              .selectOption("Review-step");
            await expect(page.getByTestId("workspace-context")).toContainText(
              "Review-step",
            );
            await page
              .getByRole("combobox", { name: "当前分析步" })
              .selectOption("Initial");
          }
        }
      }
      await page
        .getByRole("combobox", { name: "当前模型" })
        .selectOption("Model-1");
      const text = await page.locator("body").innerText();
      for (const redundant of [
        "Viewport 01",
        "Mounting-bracket",
        "Create node set",
        "Design domain",
        "Static, General",
      ])
        assert(!text.includes(redundant));
      await shot("contexts-cleaned");
    },
  );
  await check("坐标轴随方向及自由旋转联动", async () => {
    const axes = page.getByRole("img", { name: "相机联动坐标轴" });
    const endpoints = () =>
      axes
        .locator("line")
        .evaluateAll((lines) =>
          lines.map((line) => [
            Number(line.getAttribute("x2")),
            Number(line.getAttribute("y2")),
          ]),
        );
    await button("前").click();
    const front = await endpoints();
    assert(front[0][0] > 60 && front[1][1] < 15);
    await shot("axis-front");
    await button("顶").click();
    const top = await endpoints();
    assert(top[2][1] > 55);
    await shot("axis-top");
    await button("右").click();
    const right = await endpoints();
    assert(right[2][0] < 15);
    await shot("axis-right");
    const box = await page.locator("canvas").boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.6, {
      steps: 8,
    });
    await page.mouse.up();
    assert.notDeepEqual(await endpoints(), right);
    await shot("axis-orbit");
  });
  await check("三种窗口平移缩放后适合窗口恢复模型，两个入口一致", async () => {
    for (const [width, height] of [
      [1920, 1080],
      [1440, 900],
      [1280, 720],
    ]) {
      await page.setViewportSize({ width, height });
      await button("等轴测").click();
      const canvas = page.locator("canvas");
      await page.mouse.move(5, 5);
      const canvasShot = () =>
        canvas.screenshot({
          style:
            '[data-testid="viewport"] ~ * { visibility: hidden !important; }',
        });
      const baseline = await canvasShot();
      for (const entry of [
        page.locator('[aria-label="视图工具"] [title="适合窗口"]'),
        page
          .getByLabel("Ribbon 功能区")
          .getByRole("button", { name: "适合窗口", exact: true }),
      ]) {
        const box = await canvas.boundingBox();
        await page.mouse.move(
          box.x + box.width * 0.35,
          box.y + box.height * 0.55,
        );
        await page.mouse.down({ button: "right" });
        await page.mouse.move(
          box.x + box.width * 0.85,
          box.y + box.height * 0.55,
          { steps: 10 },
        );
        await page.mouse.up({ button: "right" });
        await button("放大模型").click();
        assert(
          !baseline.equals(await canvasShot()),
          "平移缩放必须确实改变画面",
        );
        await entry.click();
        await page.mouse.move(5, 5);
        const restored = await canvasShot();
        await writeFile(
          path.join(artifactDir, `fit-baseline-${width}.png`),
          baseline,
        );
        await writeFile(
          path.join(artifactDir, `fit-restored-canvas-${width}.png`),
          restored,
        );
        const difference = await page.evaluate(
          async ([a, b]) => {
            const pixels = async (encoded) => {
              const bitmap = await createImageBitmap(
                await (await fetch("data:image/png;base64," + encoded)).blob(),
              );
              const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
              const ctx = canvas.getContext("2d");
              ctx.drawImage(bitmap, 0, 0);
              return ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
            };
            const [first, second] = await Promise.all([pixels(a), pixels(b)]);
            let sum = 0;
            for (let i = 0; i < first.length; i++)
              sum += Math.abs(first[i] - second[i]);
            return sum / first.length;
          },
          [baseline.toString("base64"), restored.toString("base64")],
        );
        assert(
          difference < 0.3,
          `fit 后模型画面平均像素差应小于0.3/255，实际 ${difference}`,
        );
      }
      await shot(`fit-restored-${width}`);
    }
  });

  await check("A01–A06 编辑闭环、字段结构和树键盘", async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const tree = page.getByRole("tree");
    const parts = tree.locator('[data-id="parts"]');
    await parts.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(parts).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(tree.locator('[data-id="part"]')).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(parts).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(tree.locator('[data-id="part"]')).toBeFocused();
    await page.keyboard.press("End");
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(
      1,
    );
    for (const [name, input, value, save] of [
      ["Review-nodes", "集合名称", "Review-nodes", "保存集合"],
      ["Review-step", "分析步名称", "Review-step", "保存分析步"],
      ["Review-domain", "设计域名称", "Review-domain", "保存设计域"],
    ]) {
      const object = page.getByRole("treeitem", { name, exact: true });
      await object.dblclick();
      await expect(field(input)).toHaveValue(value);
      await field(input).fill("Unsaved");
      await button("取消").click();
      await expect(object).toBeFocused();
      await object.click();
      await button(
        name.includes("nodes")
          ? "编辑节点集合"
          : name.includes("step")
            ? "编辑分析步"
            : "编辑设计域",
      ).click();
      await expect(field(input)).toHaveValue(value);
      if (name.includes("step")) await button("继续").click();
      if (name.includes("domain")) {
        for (const tab of ["基础", "最大尺寸", "脱模"]) {
          await page.getByRole("tab", { name: tab, exact: true }).click();
          await expect(
            page.getByRole("group", { name: "多材料/多截面优化", exact: true }),
          ).toBeVisible();
        }
        await field("脱模方向上的结构最大尺寸").fill("12");
        await expect(
          page.getByRole("combobox", { name: "脱模类型", exact: true }),
        ).toHaveValue("SINGLE");
        await expect(button("选择障碍物 · 未接入")).toBeDisabled();
        await page
          .getByRole("checkbox", { name: "激活多材料/多截面优化", exact: true })
          .check();
        await page.getByRole("radio", { name: "截面", exact: true }).check();
        await shot("fixed-domain-draw");
        await button("选择基准点").click();
        await expect(
          page.getByRole("group", { name: "专业选择方式" }),
        ).toContainText("基准点");
        await expect(button("框选 · 未接入")).toBeDisabled();
        await shot("fixed-selection-tools");
        await button("选择Node 3").click();
        await button("取消拾取").click();
      }
      await button(save).click();
      await expect(object).toHaveCount(1);
      await object.dblclick();
      if (name.includes("domain")) {
        await page.getByRole("tab", { name: "脱模", exact: true }).click();
        await expect(field("脱模方向上的结构最大尺寸")).toHaveValue("12");
        await expect(
          page.getByRole("radio", { name: "截面", exact: true }),
        ).toBeChecked();
        await expect(
          page.getByRole("group", { name: "脱模方向与基准对象" }),
        ).toContainText("已选 1 项");
      }
      await button("取消").click();
    }
    await page.getByRole("treeitem", { name: "Initial", exact: true }).click();
    await button("分析步").click();
    await expect(page.getByRole("combobox", { name: "插入位置", exact: true }).locator("option:checked")).toHaveText("Review-step 之后");
    await field("分析步名称").fill("Append-check");
    await button("继续").click();
    await button("创建分析步").click();
    const names = await tree.locator('[data-parent="steps"]').allTextContents();
    assert.deepEqual(names, ["Initial", "Review-step", "Append-check"]);
    await shot("fixed-step-order");
  });
  await check("Figma 基线：树选中对象优先于分析步上下文", async () => {
    for (const [selected, contextStep] of [["Review-step", "Append-check"], ["Append-check", "Review-step"]]) {
      await page.getByRole("treeitem", { name: selected, exact: true }).click();
      await page.getByRole("combobox", { name: "当前分析步" }).selectOption(contextStep);
      await button("编辑分析步").click();
      await expect(field("分析步名称")).toHaveValue(selected);
      await button("取消").click();
    }
    await page.getByRole("treeitem", { name: "Initial", exact: true }).click();
    await expect(button("编辑分析步")).toHaveAttribute("aria-disabled", "true");
  });
  await check("Figma 基线：重置确认与拾取保护", async () => {
    const reset = page.getByTitle("恢复初始演示", { exact: true });
    await button("节点集合").click();
    await button("拾取节点").click();
    await expect(reset).toBeDisabled();
    await button("取消拾取").click();
    await button("取消").click();
    await reset.click();
    await button("保留当前会话").click();
    await expect(page.getByRole("treeitem", { name: "Append-check", exact: true })).toBeVisible();
    await reset.click();
    await button("确认恢复").click();
    await expect(page.getByRole("treeitem", { name: "Append-check", exact: true })).toHaveCount(0);
  });
  await check("Figma 基线：页签及菜单键盘闭环", async () => {
    const modelTab = page.getByRole("tab", { name: "模型", exact: true });
    await modelTab.focus(); await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "结果", exact: true })).toBeFocused();
    await page.keyboard.press("Home"); await expect(modelTab).toBeFocused();
    for (const trigger of [page.getByTitle("创建对象菜单"), page.getByLabel("创建命令下拉菜单", { exact: true })]) {
      await trigger.focus(); await page.keyboard.press("Enter");
      await expect(page.getByRole("menuitem", { name: "创建节点集合", exact: true })).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.getByRole("menuitem", { name: "创建分析步", exact: true })).toBeFocused();
      await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
    }
  });
  await check("Figma 基线：壳实体条件页签与草稿", async () => {
    await button("设计域").click();
    await page.getByRole("tab", { name: "脱模", exact: true }).click();
    await page.getByRole("radio", { name: "壳", exact: true }).check();
    await expect(page.getByRole("tab", { name: "脱模", exact: true })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "挤压", exact: true })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "基础", exact: true })).toHaveAttribute("aria-selected", "true");
    await shot("figma-domain-shell");
    await page.getByRole("radio", { name: "实体", exact: true }).check();
    await expect(page.getByRole("tab", { name: "脱模", exact: true })).toBeVisible();
    await button("取消").click();
  });
  await check("Figma 基线：旋转取消预设状态，缩放保留预设", async () => {
    const front = page.getByRole("button", { name: "前", exact: true });
    await front.click();
    await page.locator('[aria-label="视图工具"]').getByTitle("放大模型", { exact: true }).click();
    await expect(front).toHaveAttribute("aria-pressed", "true");
    const box = await page.locator("canvas").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, { steps: 10 }); await page.mouse.up();
    await expect(front).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "等轴测", exact: true }).click();
  });
  await check("标签样式对比与新增常用工具栏", async () => {
    await page.reload();
    await page.setViewportSize({ width: 1440, height: 900 });
    const toolbar = page.getByRole("toolbar", { name: "常用工具栏" });
    const styles = ["线条", "页签", "色块"];
    for (const style of styles) {
      await page.getByRole("radio", { name: style, exact: true }).check();
      await page.getByRole("navigation", { name: "分析模块" }).getByRole("button", { name: "优化", exact: true }).click();
      await expect(page.getByRole("combobox", { name: "当前优化任务" })).toBeVisible();
      await expect(toolbar).toBeVisible();
      await shot(`module-style-${style}`);
      await page.locator("[data-module-style]").screenshot({ path: path.join(artifactDir, `module-strip-${style}.png`) });
    }
    for (const [label, heading] of [["创建节点集合", "创建节点集合"], ["创建分析步", "创建分析步"], ["创建设计域", "创建设计域"]]) {
      await toolbar.getByRole("button", { name: label, exact: true }).click();
      await expect(dialog().getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(toolbar.getByRole("button", { name: "创建节点集合", exact: true })).toBeDisabled();
      await button("取消").click();
      await expect(toolbar.getByRole("button", { name: label, exact: true })).toBeFocused();
    }
    await toolbar.getByRole("button", { name: "模型树", exact: true }).click();
    await expect(button("模型树")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("complementary", { name: "模型导航" })).toHaveCount(0);
    await button("模型树").click();
    await expect(toolbar.getByRole("button", { name: "模型树", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "前", exact: true }).click();
    await toolbar.getByRole("button", { name: "等轴测视图", exact: true }).click();
    await expect(page.getByRole("button", { name: "等轴测", exact: true })).toHaveAttribute("aria-pressed", "true");
    await toolbar.getByRole("button", { name: "放大模型", exact: true }).click();
    await toolbar.getByRole("button", { name: "缩小模型", exact: true }).click();
    await toolbar.getByRole("button", { name: "适合窗口", exact: true }).click();
    await toolbar.getByRole("button", { name: "适合窗口", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(toolbar.getByRole("button", { name: "等轴测视图", exact: true })).toBeFocused();
    for (const [width,height] of [[1280,720],[1920,1080]]) {
      await page.setViewportSize({width,height});
      for (const style of styles) {
        await page.getByRole("radio", {name:style,exact:true}).check();
        const nav = page.getByRole("navigation", {name:"分析模块"});
        await expect(nav.getByRole("button", {name:"部件",exact:true})).toBeInViewport();
        await expect(nav.getByRole("button", {name:"优化",exact:true})).toBeInViewport();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
      }
      await shot(`module-toolbar-${width}`);
    }
    await page.getByRole("combobox", {name:"当前模型"}).selectOption("Model-Empty");
    await expect(toolbar.getByRole("button", {name:"创建节点集合",exact:true})).toBeDisabled();
    await page.getByRole("combobox", {name:"当前模型"}).selectOption("Model-1");
    await page.getByRole("radio", {name:"线条",exact:true}).check();
    await page.setViewportSize({width:1440,height:900});
  });
  await check("客户意见：文件菜单、项目切换与选择工具清空", async () => {
    await page.reload();
    const moduleBar = page.locator("[data-module-style]");
    await moduleBar.locator("summary").click();
    await expect(moduleBar.getByRole("button", { name: "打开文件 · 未接入" })).toBeDisabled();
    await moduleBar.locator("summary").click();
    await page.getByRole("combobox", { name: "当前模型", exact: true }).selectOption("Model-Empty");
    await expect(page.getByRole("heading", { name: "当前模型没有部件" })).toBeVisible();
    await page.getByRole("combobox", { name: "当前模型", exact: true }).selectOption("Model-1");
    const tools = page.getByRole("group", { name: "视图区选择工具", exact: true });
    await expect(tools.getByRole("button", { name: "点选显示网格" })).toHaveAttribute("aria-pressed", "false");
    await button("节点集合").click();
    await dialog().getByRole("button", { name: "拾取节点", exact: true }).click();
    await page.getByRole("button", { name: "选择Node 1", exact: true }).click();
    await page.getByRole("button", { name: "选择Node 2", exact: true }).click();
    await expect(tools.getByLabel("已选数量")).toHaveText("2");
    await tools.getByRole("button", { name: "清除全部选择" }).click();
    await expect(page.getByTestId("pick-count")).toHaveText("已选 0 项");
    await expect(tools.getByRole("combobox", { name: "选择对象类型" })).toBeDisabled();
    await button("取消拾取").click(); await button("取消").click();
  });
  await check("客户意见：面板四边停靠、尺寸与载荷草稿", async () => {
    await page.reload();
    await page.getByRole("button", { name: "AI 对话", exact: true }).click();
    for (const side of ["right", "top", "bottom", "left"]) {
      await page.getByRole("combobox", { name: "目录树停靠位置" }).selectOption(side);
      await expect(page.getByRole("complementary", { name: "模型导航" })).toBeVisible();
      await expect(page.locator("canvas")).toBeVisible();
    }
    const separator = page.getByRole("separator", { name: "调整模型树宽度" });
    await separator.focus(); await page.keyboard.press("ArrowRight");
    await expect(separator).toHaveAttribute("aria-valuenow", "263");
    await page.getByRole("combobox", { name: "目录树停靠位置" }).selectOption("right");
    const viewBox = await page.locator("canvas").boundingBox();
    assert(viewBox.width > 600 && viewBox.height > 200, "同侧面板应堆叠并保留视图区");
    await page.getByRole("combobox", { name: "目录树停靠位置" }).selectOption("left");
    await page.getByRole("combobox", { name: "模型树样式" }).selectOption("compact");
    await shot("customer-dock-tree");
    await page.getByRole("navigation", { name: "分析模块" }).getByRole("button", { name: "载荷", exact: true }).click();
    await page.getByRole("button", { name: "编辑载荷", exact: true }).click();
    await field("载荷名称").fill("Customer-load");
    await field("CF1").fill("12.5");
    await shot("customer-load");
    await button("保存载荷草稿").click();
    await page.getByRole("button", { name: "编辑载荷", exact: true }).click();
    await expect(field("CF1")).toHaveValue("12.5");
    await field("CF1").fill("99"); await button("取消").click();
    await page.getByRole("button", { name: "编辑载荷", exact: true }).click();
    await expect(field("CF1")).toHaveValue("12.5"); await button("取消").click();
  });
  await check("客户 HTML：稳定参数、增量模式、其他页与载荷场草稿", async () => {
    await page.reload();
    await button("分析步").click();
    await field("分析步名称").fill("Reference-step");
    await button("继续").click();
    await page.getByRole("combobox", { name: "自动稳定", exact: true }).selectOption("energy");
    await field("稳定参数值").fill("0.002");
    await page.getByRole("checkbox", { name: "包含绝热加热效应" }).check();
    await page.getByRole("tab", { name: "增量", exact: true }).click();
    await expect(field("最小增量尺寸")).toBeEnabled();
    await field("初始增量尺寸").fill("0.1");
    await field("最小增量尺寸").fill("0.01");
    await page.getByRole("radio", { name: "固定", exact: true }).check();
    await expect(field("最小增量尺寸")).toBeDisabled();
    await expect(field("初始增量尺寸")).toBeEnabled();
    await page.getByRole("tab", { name: "其他", exact: true }).click();
    await page.getByRole("combobox", { name: "外推", exact: true }).selectOption("linear");
    await page.getByRole("combobox", { name: "矩阵存储", exact: true }).selectOption("symmetric");
    await shot("reference-step-other");
    await button("创建分析步").click();
    await page.getByRole("treeitem", { name: "Reference-step", exact: true }).dblclick();
    await button("继续").click();
    await expect(field("稳定参数值")).toHaveValue("0.002");
    await shot("reference-step-basic");
    await page.getByRole("tab", { name: "基本", exact: true }).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "其他", exact: true })).toBeFocused();
    await expect(page.getByRole("combobox", { name: "外推", exact: true })).toHaveValue("linear");
    await button("取消").click();
    await page.getByRole("navigation", { name: "分析模块" }).getByRole("button", { name: "载荷", exact: true }).click();
    await page.getByRole("button", { name: "编辑载荷", exact: true }).click();
    await page.getByRole("combobox", { name: "载荷分布" }).selectOption("field");
    await field("载荷场引用").fill("Field-review");
    await page.getByRole("combobox", { name: "载荷幅值" }).selectOption("step");
    await shot("reference-load-field");
    await button("保存载荷草稿").click();
    await page.getByRole("button", { name: "编辑载荷", exact: true }).click();
    await expect(field("载荷场引用")).toHaveValue("Field-review");
    await page.getByRole("combobox", { name: "载荷分布" }).selectOption("uniform");
    await expect(field("载荷场引用")).toHaveCount(0);
    await button("取消").click();
    await page.getByRole("button", { name: "编辑载荷", exact: true }).click();
    await expect(field("载荷场引用")).toHaveValue("Field-review");
    await button("取消").click();
  });
  await check("统一下拉：展开层、键盘选择、禁用项与弹窗 Esc", async () => {
    await page.reload();
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(await page.evaluate(() => CSS.supports("appearance", "base-select")), "当前验证浏览器应支持可设计的原生下拉");
    const selects = ["当前模型", "当前部件", "目录树停靠位置", "模型树样式", "消息停靠位置", "选择对象类型"];
    for (const [i, label] of selects.entries()) {
      const select = page.getByRole("combobox", { name: label, exact: true });
      const value = await select.inputValue();
      await select.click();
      await expect(select).toHaveJSProperty("disabled", false);
      assert(await select.evaluate(el => el.matches(":open")), `${label}应展开`);
      await shot(`dropdown-${i}`);
      await page.keyboard.press("Escape");
      assert(await select.evaluate(el => !el.matches(":open")), `${label}应在 Esc 后关闭`);
      await expect(select).toBeFocused(); await expect(select).toHaveValue(value);
    }
    const entity = page.getByRole("combobox", { name: "选择对象类型", exact: true });
    await entity.click(); await page.keyboard.press("End"); await page.keyboard.press("Enter");
    await expect(entity).toHaveValue("Node");
    await entity.click(); await page.keyboard.press("Home"); await page.keyboard.press("Enter");
    await expect(entity).toHaveValue("Element");
    await button("分析步").click(); await button("继续").click();
    const stabilization = page.getByRole("combobox", { name: "自动稳定", exact: true });
    await stabilization.click(); await shot("dropdown-dialog");
    await page.keyboard.press("Escape"); await expect(dialog()).toBeVisible();
    await expect(stabilization).toBeFocused();
    await stabilization.click(); await page.keyboard.press("End"); await page.keyboard.press("Enter");
    await expect(stabilization).toHaveValue("damping"); await expect(field("稳定参数值")).toBeVisible();
    await button("取消").click();
    await button("节点集合").click();
    await expect(page.getByRole("combobox", { name: "节点集合对象类型" })).toBeDisabled();
    await button("取消").click();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => { document.documentElement.style.zoom = "1.25"; });
    await entity.click(); await shot("dropdown-125-percent"); await page.keyboard.press("Escape");
    await page.evaluate(() => { document.documentElement.style.zoom = ""; });
    await page.setViewportSize({ width: 1440, height: 900 });
  });
  await check("客户复核：分析步插入顺序、过程清单与编辑取消", async () => {
    await page.reload();
    const create = async (name, after) => {
      await button("分析步").click(); await field("分析步名称").fill(name);
      if (after) await page.getByRole("combobox", { name: "插入位置", exact: true }).selectOption(after);
      await expect(page.getByRole("listbox", { name: "分析过程类型", exact: true }).locator("option")).toHaveCount(8);
      await expect(page.getByRole("listbox", { name: "分析过程类型", exact: true }).locator("option:disabled")).toHaveCount(7);
      if (name === "Order-A") {
        await page.getByRole("combobox", { name: "过程分类", exact: true }).selectOption("perturbation");
        await expect(page.getByRole("listbox", { name: "分析过程类型", exact: true }).locator("option:disabled")).toHaveCount(5);
        await expect(button("继续")).toBeDisabled(); await shot("followup-step-perturbation");
        await page.getByRole("combobox", { name: "过程分类", exact: true }).selectOption("general");
      }
      await shot("followup-step-create");
      await button("继续").click(); await button("创建分析步").click();
    };
    await create("Order-A"); await create("Order-B"); await create("Order-first", "initial");
    await button("分析步").click(); await field("分析步名称").fill("Order-middle");
    await page.getByRole("combobox", { name: "插入位置", exact: true }).selectOption({label:"Order-A 之后"});
    await button("继续").click(); await button("创建分析步").click();
    const order = () => page.getByRole("tree", { name: "模型对象" }).locator('[data-parent="steps"]').allTextContents();
    assert.deepEqual(await order(), ["Initial", "Order-first", "Order-A", "Order-middle", "Order-B"]);
    await page.getByRole("treeitem", { name: "Order-middle", exact: true }).dblclick();
    await expect(field("插入位置")).toHaveValue("保留当前列表位置");
    await field("分析步名称").fill("Canceled"); await button("取消").click();
    assert.deepEqual(await order(), ["Initial", "Order-first", "Order-A", "Order-middle", "Order-B"]);
  });
  await check("客户复核：目录二级不可拖拽、轮廓样式和换边保留状态", async () => {
    await page.reload();
    const tree = page.getByRole("complementary", { name: "模型导航" });
    await expect(tree.getByText("目录树", { exact: true })).toHaveCount(0);
    await page.getByRole("combobox", { name: "模型树样式" }).selectOption("compact");
    await page.getByRole("treeitem", { name: "部件 1", exact: true }).click();
    await field("搜索模型树").fill("Fixture");
    await page.getByRole("combobox", { name: "目录树停靠位置" }).selectOption("right");
    await expect(field("搜索模型树")).toHaveValue("Fixture");
    await expect(page.getByRole("combobox", { name: "模型树样式" })).toHaveValue("compact");
    await expect(page.getByRole("combobox", { name: "目录树停靠位置" })).toBeFocused();
    await field("搜索模型树").fill("");
    await expect(page.getByRole("treeitem", { name: "部件 1", exact: true })).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("tab", { name: "结果", exact: true }).click();
    await page.getByRole("combobox", { name: "目录树停靠位置" }).selectOption("left");
    await expect(page.getByRole("tab", { name: "结果", exact: true })).toHaveAttribute("aria-selected", "true");
    assert(await page.getByRole("tab", { name: "结果", exact: true }).evaluate(el => !el.draggable));
    await page.getByRole("tab", { name: "模型", exact: true }).click();
    await page.getByRole("treeitem", { name: "部件 1", exact: true }).click();
    await shot("followup-outline-tree");
    await button("模型树").click(); await button("模型树").click();
    await expect(page.getByRole("combobox", { name: "模型树样式" })).toHaveValue("compact");
    const header = page.getByRole("combobox", { name: "目录树停靠位置" }).locator("..");
    const target = page.locator('[data-side="right"]').first();
    const dragBox = await header.boundingBox();
    await page.mouse.move(dragBox.x + 35, dragBox.y + dragBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragBox.x + 80, dragBox.y + dragBox.height / 2, { steps: 8 });
    await expect(page.getByText("右侧停靠", { exact: true })).toBeVisible();
    const dropBox = await page.getByText("右侧停靠", { exact: true }).boundingBox();
    await page.mouse.move(dropBox.x + dropBox.width / 2, dropBox.y + dropBox.height / 2, { steps: 12 });
    await page.mouse.up();
    await expect(page.getByRole("combobox", { name: "目录树停靠位置" })).toHaveValue("right");
    await expect(target).toBeVisible();
    await shot("followup-docked-right");
  });
  await check("客户复核：选择工具激活、已选数与更多菜单键盘闭环", async () => {
    await page.reload();
    const point = page.getByRole("button", { name: "点选显示网格", exact: true });
    await expect(point).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "更多选择方式", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "激活点选", exact: true })).toBeFocused();
    await shot("followup-method-inactive");
    await page.getByRole("menuitem", { name: "激活点选", exact: true }).click();
    await expect(point).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "更多选择方式", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: "退出点选", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "更多选择方式", exact: true })).toBeFocused();
    await point.click(); await button("节点集合").click();
    await dialog().getByRole("button", { name: "拾取节点", exact: true }).click();
    await page.getByRole("button", { name: "选择Node 1", exact: true }).click();
    await page.getByRole("button", { name: "更多选择方式", exact: true }).click();
    await shot("followup-method-selection");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("pick-count")).toHaveText("已选 1 项");
    await button("取消拾取").click(); await button("取消").click();
  });
  await check("刷新恢复初始演示数据", async () => {
    await page.reload();
    await expect(
      page.getByRole("treeitem", { name: "Review-nodes", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("treeitem", { name: "Fixture-nodes", exact: true }),
    ).toBeVisible();
  });
  await check("浏览器异常、控制台错误和资源请求", async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(responses, []);
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await shot("workspace-final");
  const report = {
    date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" }),
    browser: await browser.version(),
    browserChannel: process.env.CAE_BROWSER ?? "chrome",
    runtime: process.version,
    platform: process.platform,
    baseURL: baseURL,
    scope: process.env.CAE_CHECKS ?? "full",
    checks,
    errors,
    consoleErrors,
    responses,
    zoom: "CSS zoom 125% at 1920×1080; not browser UI zoom or Windows DPI",
    status: "passed",
  };
  await writeFile(
    path.join(artifactDir, "browser-results.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`Completed ${checks.length} checks; artifacts: ${artifactDir}`);
} catch (error) {
  if (page)
    await page
      .screenshot({ path: path.join(artifactDir, "failure.png") })
      .catch(() => {});
  await writeFile(
    path.join(artifactDir, "browser-results.json"),
    JSON.stringify(
      {
        status: "failed",
        checks,
        errors,
        consoleErrors,
        responses,
        failure: String(error),
      },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
