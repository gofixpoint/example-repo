<?php

namespace Tests\Feature;

use App\Models\Todo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_todos(): void
    {
        Todo::create(['title' => 'First']);
        Todo::create(['title' => 'Second']);

        $this->getJson('/api/todos')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_creates_a_todo(): void
    {
        $this->postJson('/api/todos', ['title' => 'Buy milk'])
            ->assertCreated()
            ->assertJson(['title' => 'Buy milk', 'completed' => false]);

        $this->assertDatabaseHas('todos', ['title' => 'Buy milk', 'completed' => false]);
    }

    public function test_requires_a_title(): void
    {
        $this->postJson('/api/todos', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');
    }

    public function test_toggles_completion(): void
    {
        $todo = Todo::create(['title' => 'Walk the dog']);

        $this->patchJson("/api/todos/{$todo->id}", ['completed' => true])
            ->assertOk()
            ->assertJson(['completed' => true]);
    }

    public function test_deletes_a_todo(): void
    {
        $todo = Todo::create(['title' => 'Old task']);

        $this->deleteJson("/api/todos/{$todo->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('todos', ['id' => $todo->id]);
    }
}
