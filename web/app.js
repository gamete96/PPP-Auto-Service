// app.js

let LIFF_ID = document.getElementById('liff-id').textContent.trim();
let USER_ID = "";

function setNow() {
  const now = new Date();
  document.getElementById("now").textContent = now.toLocaleString("th-TH");
}
setNow();
setInterval(setNow, 1000);

async function initLIFF() {
  try {
    await liff.init({ liffId: LIFF_ID });
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }
    const profile = await liff.getProfile();
    USER_ID = profile.userId || "";
  } catch (err) {
    console.error("LIFF init error:", err);
  }
}
initLIFF();

const form = document.getElementById("quote-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  data.sumInsured = Number(data.sumInsured || 0);
  data.userId = USER_ID;

  document.activeElement?.blur();
  form.querySelector("button[type=submit]").setAttribute("aria-busy", "true");

  google.script.run
    .withSuccessHandler((res) => {
      form.querySelector("button[type=submit]").removeAttribute("aria-busy");
      if (!res || !res.ok) {
        alert(res?.message || "ไม่สามารถคำนวณได้");
        return;
      }
      renderResult(res);
    })
    .withFailureHandler((err) => {
      form.querySelector("button[type=submit]").removeAttribute("aria-busy");
      console.error(err);
      alert("เกิดข้อผิดพลาดบนเซิร์ฟเวอร์");
    })
    .api_quote(data);
});

function renderResult(res) {
  const el = document.getElementById("result");
  const sum = res.summary;
  const html = `
    <ul>
      <li><strong>ลูกค้า:</strong> ${escapeHtml(sum.name)}</li>
      <li><strong>เบอร์:</strong> ${escapeHtml(sum.phone)}</li>
      <li><strong>บริษัท:</strong> ${escapeHtml(sum.company)}</li>
      <li><strong>คุ้มครอง:</strong> ${escapeHtml(sum.coverage)}</li>
      <li><strong>จังหวัด:</strong> ${escapeHtml(sum.province)} (${escapeHtml(sum.region)})</li>
      <li><strong>รุ่นรถ:</strong> ${escapeHtml(sum.carCode)}</li>
      <li><strong>ทุนประกัน:</strong> ${escapeHtml(String(sum.sumInsured))}</li>
      <li><strong>เบี้ยรวม:</strong> ${Number(sum.premium).toLocaleString("th-TH", {minimumFractionDigits:2})} บาท</li>
    </ul>
  `;
  document.getElementById("summary").innerHTML = html;
  const aPdf = document.getElementById("open-pdf");
  const aDoc = document.getElementById("open-doc");
  aPdf.href = res.pdfUrl;
  aDoc.href = res.docUrl;
  el.hidden = false;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}
