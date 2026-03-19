// 日历工具类
export class Calendar {
  constructor(options = {}) {
    this.currentDate = new Date()
    this.selectedDate = null
    this.todos = JSON.parse(localStorage.getItem('calendarTodos') || '{}')
    this.onDateClick = options.onDateClick || null
    this.readOnly = options.readOnly || false
  }

  changeMonth(delta) {
    this.currentDate.setMonth(this.currentDate.getMonth() + delta)
  }

  getMonthData() {
    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    
    const today = new Date()
    const days = []
    
    // 上个月的日期
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isOtherMonth: true,
        date: null
      })
    }
    
    // 当前月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push({
        day: i,
        isOtherMonth: false,
        isToday: year === today.getFullYear() && month === today.getMonth() && i === today.getDate(),
        date: dateStr,
        hasTodo: this.todos[dateStr] && this.todos[dateStr].length > 0,
        todoCount: this.todos[dateStr] ? this.todos[dateStr].length : 0
      })
    }
    
    // 下个月的日期
    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isOtherMonth: true,
        date: null
      })
    }
    
    return {
      year,
      month: month + 1,
      days
    }
  }

  getTodos(date) {
    return this.todos[date] || []
  }

  addTodo(date, text) {
    if (!this.todos[date]) {
      this.todos[date] = []
    }
    this.todos[date].push({
      id: Date.now(),
      text: text,
      completed: false
    })
    this.saveTodos()
  }

  toggleTodo(date, index) {
    if (this.todos[date] && this.todos[date][index]) {
      this.todos[date][index].completed = !this.todos[date][index].completed
      this.saveTodos()
    }
  }

  deleteTodo(date, index) {
    if (this.todos[date]) {
      this.todos[date].splice(index, 1)
      if (this.todos[date].length === 0) {
        delete this.todos[date]
      }
      this.saveTodos()
    }
  }

  saveTodos() {
    localStorage.setItem('calendarTodos', JSON.stringify(this.todos))
  }
}
