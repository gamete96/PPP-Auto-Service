(async () => {
  const statusEl = document.getElementById('status');
  const form = document.getElementById('leadForm');

  // init LIFF (สำหรับดึง userId และชื่อ)
  await liff.init({ liffId: window.LIFF_ID });
  if (!liff.isLoggedIn()) liff.login();

  let profile = { userId: "", displayName: "" };
  try { profile = await liff.getProfile(); } catch(e){}

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    statusEl.textContent = 'กำลังส่ง...';

    const data = Object.fromEntries(new FormData(form).entries());
    data.userId = profile.userId || ""; // ให้บอทส่งใบเสนอราคาไปหา user นี้

    // ส่งแบบ form-urlencoded เพื่อเลี่ยง preflight (CORS)
    const payload = new URLSearchParams({ payload: JSON.stringify(data) });

    try{
      const r = await fetch(window.GAS_ENDPOINT, { method:'POST', body: payload });
      const j = await r.json().catch(()=>({}));
      if (j && j.ok) {
        statusEl.textContent = 'ส่งข้อมูลแล้ว ✔ กรุณาเปิดแชท LINE รอรับใบเสนอราคาครับ';
      } else {
        statusEl.textContent = 'ส่งไม่สำเร็จ กรุณาลองใหม่';
      }
    }catch(err){
      statusEl.textContent = 'เครือข่ายมีปัญหา กรุณาลองใหม่';
    }
  });
})();
