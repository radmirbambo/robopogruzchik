// Заглушка до Task 11: там появится загрузчик Метрики с той же сигнатурой goal().
export function goal(name: string, params?: Record<string, unknown>) { (window as any).__afGoal?.(name, params); }
