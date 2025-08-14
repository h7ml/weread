import { getKv } from "./db.ts";

/**
 * 阅读任务
 */
export interface ReadTask {
  id: string;
  vid: number;
  bookId: string;
  bookName: string;
  isActive: boolean;
  seconds: number; // 每次阅读秒数
  lastReadAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 获取用户的所有任务
 */
export async function getTasksByVid(vid: number): Promise<ReadTask[]> {
  const kv = await getKv();
  const tasks: ReadTask[] = [];
  const iter = kv.list<ReadTask>({ prefix: ["tasks", vid] });

  for await (const entry of iter) {
    if (entry.value) {
      tasks.push(entry.value);
    }
  }

  return tasks;
}

/**
 * 获取所有活跃任务
 */
export async function getActiveTasks(): Promise<ReadTask[]> {
  const kv = await getKv();
  const tasks: ReadTask[] = [];
  const iter = kv.list<ReadTask>({ prefix: ["tasks"] });

  for await (const entry of iter) {
    if (entry.value && entry.value.isActive) {
      tasks.push(entry.value);
    }
  }

  return tasks;
}

/**
 * 获取单个任务
 */
export async function getTask(
  vid: number,
  taskId: string,
): Promise<ReadTask | null> {
  const kv = await getKv();
  const entry = await kv.get<ReadTask>(["tasks", vid, taskId]);
  return entry.value;
}

/**
 * 创建或更新任务
 */
export async function saveTask(task: ReadTask): Promise<void> {
  const kv = await getKv();
  task.updatedAt = Date.now();

  if (!task.createdAt) {
    task.createdAt = Date.now();
  }

  await kv.set(["tasks", task.vid, task.id], task);
}

/**
 * 删除任务
 */
export async function deleteTask(vid: number, taskId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["tasks", vid, taskId]);
}

/**
 * 更新任务最后阅读时间
 */
export async function updateTaskReadTime(
  vid: number,
  taskId: string,
): Promise<void> {
  const task = await getTask(vid, taskId);
  if (task) {
    task.lastReadAt = Date.now();
    await saveTask(task);
  }
}

/**
 * 切换任务状态
 */
export async function toggleTaskStatus(
  vid: number,
  taskId: string,
): Promise<boolean> {
  const task = await getTask(vid, taskId);
  if (task) {
    task.isActive = !task.isActive;
    await saveTask(task);
    return task.isActive;
  }
  return false;
}
