class Todo {
  constructor(id, title, todoComplete) {
    this.id = id;
    this.title = title;
    this.todoComplete = todoComplete;
  }
}

const inputField = document.querySelector(".inputField input");
const addButton = document.querySelector(".inputField button");
const todosList = document.querySelector(".todoList");
const clearCompletedButton = document.querySelector(".clearCompletedButton");
const taskCount = document.querySelector("#pendingTasks");
const categorySelect = document.querySelector("#categorySelect");
const newCategoryInput = document.querySelector("#newCategoryInput");
const addCategoryButton = document.querySelector("#addCategoryButton");
const categoryList = document.querySelector("#categoryList");

function populateCategoryDropdown() {
  fetch('/api/categories')
    .then(response => response.json())
    .then(categories => {
      categorySelect.innerHTML = "";
      categories.forEach(categoryName => {
        const option = document.createElement("option");
        option.value = categoryName;
        option.innerText = categoryName;
        categorySelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching categories:', error));
}

function populateCategoryList() {
  fetch('/api/categories')
    .then(response => response.json())
    .then(categories => {
      categoryList.innerHTML = "";
      categories.forEach(categoryName => {
        const listItem = document.createElement("li");

        const categoryNameSpan = document.createElement("span");
        categoryNameSpan.innerText = categoryName;

        const editButton = document.createElement("button");
        editButton.innerText = "Edit";
        editButton.addEventListener("click", () => {
          const editInput = document.createElement("input");
          editInput.type = "text";
          editInput.value = categoryName;

          const saveButton = document.createElement("button");
          saveButton.innerText = "Save";
          saveButton.addEventListener("click", () => {
            const updatedCategoryName = editInput.value.trim();
            if (updatedCategoryName && updatedCategoryName !== categoryName) {
              fetch(`/api/categories/${categoryName}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newName: updatedCategoryName })
              }).then(() => {
                populateCategoryDropdown();
                populateCategoryList();
                renderTodos();
              });
            }
          });

          listItem.replaceChild(editInput, categoryNameSpan);
          listItem.replaceChild(saveButton, editButton);
        });

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteButton.addEventListener("click", () => {
          fetch(`/api/categories/${categoryName}`, { method: 'DELETE' })
            .then(() => {
              populateCategoryDropdown();
              populateCategoryList();
              renderTodos();
            });
        });

        listItem.appendChild(categoryNameSpan);
        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
        categoryList.appendChild(listItem);
      });
    })
    .catch(error => console.error('Error fetching categories:', error));
}

function renderTodos() {
  todosList.innerHTML = "";
  fetch('/api/todos')
    .then(response => response.json())
    .then(todos => {
      const groupedTodos = todos.reduce((groups, todo) => {
        (groups[todo.category] = groups[todo.category] || []).push(todo);
        return groups;
      }, {});

      Object.keys(groupedTodos).forEach(categoryName => {
        const categoryHeader = document.createElement("h3");
        categoryHeader.innerText = categoryName;
        todosList.appendChild(categoryHeader);

        groupedTodos[categoryName].forEach(todo => {
          const newListItem = document.createElement("li");
          newListItem.className = "todo-item";

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = todo.todoComplete;
          checkbox.className = "todo-checkbox";
          checkbox.addEventListener("change", () => {
            updateTodo(todo.id, { todoComplete: checkbox.checked });
          });

          const todoText = document.createElement("span");
          todoText.innerText = todo.title;
          todoText.className = "todo-text";
          if (todo.todoComplete) todoText.classList.add("completed");

          const editButton = document.createElement("button");
          editButton.innerText = "Edit";
          editButton.className = "todo-edit-btn";
          editButton.addEventListener("click", () => {
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.value = todo.title;
            const saveButton = document.createElement("button");
            saveButton.innerText = "Save";
            saveButton.className = "save-btn";
            saveButton.addEventListener("click", () => {
              updateTodo(todo.id, { title: editInput.value });
            });
            newListItem.replaceChild(editInput, todoText);
            newListItem.replaceChild(saveButton, editButton);
          });

          const deleteButton = document.createElement("button");
          deleteButton.innerText = "Delete";
          deleteButton.className = "todo-delete-btn";
          deleteButton.addEventListener("click", () => deleteTodo(todo.id));

          newListItem.appendChild(checkbox);
          newListItem.appendChild(todoText);
          newListItem.appendChild(editButton);
          newListItem.appendChild(deleteButton);

          todosList.appendChild(newListItem);
        });
      });

      updatePendingTasksCount();
    })
    .catch(error => console.error('Error fetching todos:', error));
}

function addTodo() {
  const newTodoText = inputField.value.trim();
  const selectedCategory = categorySelect.value;
  if (newTodoText && selectedCategory) {
    fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTodoText,
        description: "",
        category: selectedCategory,
      })
    })
      .then(response => response.json())
      .then(() => {
        inputField.value = "";
        renderTodos();
      })
      .catch(error => console.error('Error adding todo:', error));
  }
}

function updateTodo(id, updatedData) {
  fetch(`/api/todos/${id}`)
    .then(response => response.json())
    .then(todo => {
      const updatedTodo = {
        ...todo,
        ...updatedData
      };

      fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTodo)
      })
        .then(() => renderTodos())
        .catch(error => console.error('Error updating todo:', error));
    })
    .catch(error => console.error('Error retrieving todo for update:', error));
}

function deleteTodo(id) {
  fetch(`/api/todos/${id}`, { method: 'DELETE' })
    .then(() => renderTodos())
    .catch(error => console.error('Error deleting todo:', error));
}

function addCategory() {
  const newCategoryName = newCategoryInput.value.trim();
  if (newCategoryName) {
    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName })
    })
      .then(() => {
        newCategoryInput.value = "";
        populateCategoryDropdown();
        populateCategoryList();
      })
      .catch(error => console.error('Error adding category:', error));
  }
}

function updatePendingTasksCount() {
  fetch('/api/todos')
    .then(response => response.json())
    .then(todos => {
      const pendingCount = todos.filter(todo => !todo.todoComplete).length;
      taskCount.innerText = `You have ${pendingCount} pending task${pendingCount !== 1 ? "s" : ""}.`;
    })
    .catch(error => console.error('Error updating pending tasks count:', error));
}

addButton.addEventListener("click", addTodo);
inputField.addEventListener("keypress", (event) => {
  if (event.key === "Enter") addTodo();
});
clearCompletedButton.addEventListener("click", () => {
  console.log("Clearing completed todos"); // Log for debugging
  fetch('/api/todos/clear-completed', { method: 'DELETE' })
    .then(response => {
      if (!response.ok) throw new Error('Failed to clear completed todos');
      return response.json();
    })
    .then(() => renderTodos())
    .catch(error => console.error('Error clearing completed todos:', error));
});
addCategoryButton.addEventListener("click", addCategory);
newCategoryInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") addCategory();
});

populateCategoryDropdown();
populateCategoryList();
renderTodos();