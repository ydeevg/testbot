export const rateCauses: {text: string, grade: number, gradeEnd: number}[] = [
  // ЧТОБЫ ОТКЛЮЧИТЬ СТАРОЕ - поставьте grade и gradeEnd "0", но не удаляйте неиспользуемые и не заменяйте!, добавляйте новые в конец.
  {text: "Долгое обслуживание", grade: 0, gradeEnd: 0}, //НЕ МЕНЯТЬ
  {text: "Долгое обслуживание", grade: 4, gradeEnd: 1},
  {text: "Не полный заказ", grade: 4, gradeEnd: 1},
  {text: "Не вкусная еда", grade: 4, gradeEnd: 1,},
  {text: "Плохой сервис", grade: 4, gradeEnd: 1},
  {text: "Плохой сервис", grade: 0, gradeEnd: 0}, //НЕ МЕНЯТЬ
  {text: "Быстрое обслуживание", grade: 5, gradeEnd: 5},
  {text: "Отличный сервис", grade: 5, gradeEnd: 5},
  {text: "Вкусная еда", grade: 5, gradeEnd: 5},
]
