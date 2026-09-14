export function createTaskClient() {
  let worker;
  let rejectTask;
  return {
    run(task, payload, onProgress) {
      this.cancel();
      worker ??= new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      const active = worker;
      return new Promise((resolve, reject) => {
        rejectTask = reject;
        active.onmessage = ({ data }) => {
          if (worker !== active) return;
          if (data.type === 'progress') { onProgress?.(data.value); return; }
          rejectTask = null;
          active.onmessage = null;
          if (data.error) reject(new Error(data.error));
          else resolve(data.result);
        };
        active.onerror = () => {
          active.terminate();
          if (worker === active) { worker = null; rejectTask = null; }
          reject(new Error('计算模块无法运行，请刷新页面后重试。'));
        };
        active.postMessage({ task, payload });
      });
    },
    cancel() {
      if (!rejectTask) return;
      worker?.terminate();
      worker = null;
      rejectTask(new DOMException('已取消处理。', 'AbortError'));
      rejectTask = null;
    },
    dispose() {
      this.cancel();
      worker?.terminate();
      worker = null;
    },
  };
}
