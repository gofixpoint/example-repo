import { FormEvent, useEffect, useMemo, useState } from 'react';

interface Todo {
    id: number;
    title: string;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

type Filter = 'all' | 'active' | 'completed';

// Laravel serves both this app and the API from the same origin, so a
// relative path works in every environment (sandbox proxy or local dev)
// and avoids baking a sandbox-specific URL into the build
const API = '/api/todos';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        ...options,
    });
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.status === 204 ? (undefined as T) : response.json();
}

export default function App() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [title, setTitle] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        request<Todo[]>(API)
            .then(setTodos)
            .catch(() => setError('Could not load todos.'))
            .finally(() => setLoading(false));
    }, []);

    const visible = useMemo(() => {
        if (filter === 'active') return todos.filter((t) => !t.completed);
        if (filter === 'completed') return todos.filter((t) => t.completed);
        return todos;
    }, [todos, filter]);

    const remaining = todos.filter((t) => !t.completed).length;

    async function addTodo(event: FormEvent) {
        event.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        setError(null);
        try {
            const todo = await request<Todo>(API, {
                method: 'POST',
                body: JSON.stringify({ title: trimmed }),
            });
            setTodos((prev) => [todo, ...prev]);
            setTitle('');
        } catch {
            setError('Could not add the todo.');
        }
    }

    async function toggleTodo(todo: Todo) {
        setError(null);
        try {
            const updated = await request<Todo>(`${API}/${todo.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ completed: !todo.completed }),
            });
            setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        } catch {
            setError('Could not update the todo.');
        }
    }

    async function deleteTodo(todo: Todo) {
        setError(null);
        try {
            await request<void>(`${API}/${todo.id}`, { method: 'DELETE' });
            setTodos((prev) => prev.filter((t) => t.id !== todo.id));
        } catch {
            setError('Could not delete the todo.');
        }
    }

    return (
        <main className="app">
            <header className="app-header">
                <h1>Amika TODO</h1>
                <p className="subtitle">A Laravel + React task manager</p>
            </header>

            <form className="add-form" onSubmit={addTodo}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    aria-label="New todo title"
                    maxLength={255}
                />
                <button type="submit" disabled={!title.trim()}>
                    Add
                </button>
            </form>

            {error && <p className="error">{error}</p>}

            <div className="filters" role="group" aria-label="Filter todos">
                {(['all', 'active', 'completed'] as const).map((f) => (
                    <button
                        key={f}
                        className={filter === f ? 'filter active' : 'filter'}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="empty">Loading…</p>
            ) : visible.length === 0 ? (
                <p className="empty">
                    {todos.length === 0 ? 'Nothing here yet. Add your first todo!' : 'No todos match this filter.'}
                </p>
            ) : (
                <ul className="todo-list">
                    {visible.map((todo) => (
                        <li key={todo.id} className={todo.completed ? 'todo done' : 'todo'}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => toggleTodo(todo)}
                                />
                                <span>{todo.title}</span>
                            </label>
                            <button
                                className="delete"
                                onClick={() => deleteTodo(todo)}
                                aria-label={`Delete ${todo.title}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <footer className="app-footer">
                {remaining} {remaining === 1 ? 'task' : 'tasks'} remaining
            </footer>
        </main>
    );
}
