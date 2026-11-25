const $ = id => document.getElementById(id);
const STORAGE_KEY = "megaEnglishStudentsV1";
let students = loadStudents();

function loadStudents(){
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
function monthKey(date = new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
}
function monthLabel(){
  return new Intl.DateTimeFormat("uz-UZ",{month:"long",year:"numeric"}).format(new Date());
}
function formatMoney(value){
  return `${Number(value || 0).toLocaleString("uz-UZ")} so‘m`;
}
function isPaid(student){ return Boolean(student.payments && student.payments[monthKey()]); }
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  render();
}
function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}

$("today").textContent = new Intl.DateTimeFormat("uz-UZ",{
  day:"numeric",month:"long",year:"numeric"
}).format(new Date());
$("currentMonth").textContent = monthLabel();

function render(){
  const paidStudents = students.filter(isPaid);
  $("totalStudents").textContent = students.length;
  $("paidCount").textContent = paidStudents.length;
  $("unpaidCount").textContent = students.length - paidStudents.length;
  const income = paidStudents.reduce((sum,s) => sum + Number(s.payments[monthKey()]), 0);
  $("totalIncome").textContent = formatMoney(income);

  const query = $("search").value.trim().toLocaleLowerCase("uz-UZ");
  const filter = $("filter").value;
  const visible = students.filter(s => {
    const full = `${s.first} ${s.last} ${s.phone} ${s.phone2 || ""}`.toLocaleLowerCase("uz-UZ");
    const matchesQuery = full.includes(query);
    const matchesFilter = filter === "all" ||
      (filter === "paid" && isPaid(s)) ||
      (filter === "unpaid" && !isPaid(s));
    return matchesQuery && matchesFilter;
  });

  $("studentList").innerHTML = visible.map(s => `
    <tr>
      <td><span class="student-name">${escapeHTML(s.first)} ${escapeHTML(s.last)}</span></td>
      <td><div>${escapeHTML(s.phone)}</div><div class="student-phone">${escapeHTML(s.phone2 || "Qo‘shimcha raqam yo‘q")}</div></td>
      <td>${escapeHTML(s.group)}</td>
      <td>${formatMoney(s.fee)}</td>
      <td><span class="status ${isPaid(s) ? "paid" : "unpaid"}">${isPaid(s) ? "To‘langan" : "To‘lanmagan"}</span></td>
      <td>
        <button class="action-btn" data-action="payment" data-id="${escapeHTML(s.id)}">${isPaid(s) ? "Bekor qilish" : "To‘lov"}</button>
        <button class="action-btn delete" data-action="delete" data-id="${escapeHTML(s.id)}" aria-label="O‘quvchini o‘chirish">✕</button>
      </td>
    </tr>`).join("");
  $("empty").style.display = visible.length ? "none" : "block";
}

$("studentForm").addEventListener("submit", event => {
  event.preventDefault();
  const student = {
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
    first: $("firstName").value.trim(),
    last: $("lastName").value.trim(),
    phone: $("phone").value.trim(),
    phone2: $("phone2").value.trim(),
    fee: Number($("fee").value),
    group: $("group").value,
    payments: {}
  };
  if(!student.first || !student.last || !student.phone || !Number.isFinite(student.fee) || student.fee <= 0){
    $("formMessage").textContent = "Iltimos, barcha majburiy ma’lumotlarni to‘g‘ri kiriting.";
    return;
  }
  students.push(student);
  save();
  event.target.reset();
  $("formMessage").textContent = "O‘quvchi muvaffaqiyatli ro‘yxatga qo‘shildi!";
});

$("studentList").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if(!button) return;
  const student = students.find(s => s.id === button.dataset.id);
  if(!student) return;

  if(button.dataset.action === "payment"){
    student.payments ||= {};
    if(isPaid(student)){
      if(!confirm(`${student.first} ${student.last} uchun joriy oy to‘lovini bekor qilasizmi?`)) return;
      delete student.payments[monthKey()];
    } else {
      if(!confirm(`${student.first} ${student.last} — ${formatMoney(student.fee)} to‘lov qabul qilindi deb belgilansinmi?`)) return;
      student.payments[monthKey()] = student.fee;
    }
    save();
  }

  if(button.dataset.action === "delete"){
    if(!confirm(`${student.first} ${student.last} ma’lumotlarini o‘chirmoqchimisiz?`)) return;
    students = students.filter(s => s.id !== student.id);
    save();
  }
});

$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const target = button.dataset.target;
    if(target === "dashboard") window.scrollTo({top:0,behavior:"smooth"});
    else $(target).scrollIntoView({behavior:"smooth"});
  });
});

render();
