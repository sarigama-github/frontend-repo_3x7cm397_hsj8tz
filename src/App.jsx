import { useEffect, useMemo, useState } from "react";
import { api, saveAuth, getAuth, clearAuth } from "./lib/api";

function Landing({ onLoginClick }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-3">AgroVault</h1>
      <p className="text-slate-300 mb-8 text-center max-w-xl">
        Manage digital warehouse receipts for farmers and streamline credit
        against stored crops. Operators create receipts, bankers pledge loans,
        and farmers track everything in one place.
      </p>
      <button onClick={onLoginClick} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg">Login</button>
    </div>
  );
}

function Auth({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("farmer");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await api("/auth/login", { method: "POST", body: { username: email || phone, password }, });
      const token = data.access_token || data.token || data.accessToken;
      saveAuth(token, role);
      onAuthed();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }
  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api("/auth/register", { method: "POST", body: { name, email, phone, password, role } });
      // auto login
      await handleLogin(e);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
      <div className="w-full max-w-md bg-slate-900/60 p-6 rounded-xl border border-slate-800">
        <div className="flex gap-2 mb-4">
          <button className={`flex-1 py-2 rounded ${mode==='login'?'bg-blue-600':'bg-slate-800'}`} onClick={()=>setMode('login')}>Login</button>
          <button className={`flex-1 py-2 rounded ${mode==='register'?'bg-blue-600':'bg-slate-800'}`} onClick={()=>setMode('register')}>Register</button>
        </div>
        {mode==='register' && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button className={`py-2 rounded ${role==='farmer'?'bg-green-600':'bg-slate-800'}`} onClick={()=>setRole('farmer')}>Farmer</button>
            <button className={`py-2 rounded ${role==='operator'?'bg-amber-600':'bg-slate-800'}`} onClick={()=>setRole('operator')}>Operator</button>
            <button className={`py-2 rounded ${role==='banker'?'bg-purple-600':'bg-slate-800'}`} onClick={()=>setRole('banker')}>Banker</button>
            <button className={`py-2 rounded ${role==='admin'?'bg-sky-600':'bg-slate-800'}`} onClick={()=>setRole('admin')}>Admin</button>
          </div>
        )}
        <form onSubmit={mode==='login'?handleLogin:handleRegister} className="space-y-3">
          {mode==='register' && (
            <input className="w-full px-3 py-2 bg-slate-800 rounded" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
          )}
          <input className="w-full px-3 py-2 bg-slate-800 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full px-3 py-2 bg-slate-800 rounded" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <input type="password" className="w-full px-3 py-2 bg-slate-800 rounded" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button disabled={loading} className="w-full py-2 bg-blue-600 rounded hover:bg-blue-500">{loading? 'Please wait...': (mode==='login'?'Login':'Create account')}</button>
        </form>
      </div>
    </div>
  );
}

function Topbar({ role, onLogout }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
      <div className="font-semibold">AgroVault</div>
      <div className="text-sm">{role}</div>
      <button onClick={onLogout} className="text-sm text-slate-300 hover:text-white">Logout</button>
    </div>
  );
}

function FarmerDashboard() {
  const { token } = getAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  useEffect(()=>{ (async ()=>{
    try { setRows(await api("/farmer/receipts", { token })); } catch(e){}
  })(); },[token]);
  const filtered = useMemo(()=> rows.filter(r=> !q || r.status===q), [rows,q]);
  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2 items-center">
        <div className="font-semibold">My Receipts</div>
        <select className="ml-auto bg-slate-800 px-2 py-1 rounded" value={q} onChange={e=>setQ(e.target.value)}>
          <option value="">All</option>
          <option>stored</option>
          <option>pledged</option>
          <option>partially_sold</option>
          <option>sold</option>
          <option>released</option>
        </select>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="text-left p-2">Receipt Code</th>
              <th className="text-left p-2">Crop</th>
              <th className="text-left p-2">Quantity</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Linked Loan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r=> (
              <tr key={r.id} className="odd:bg-slate-900 even:bg-slate-950">
                <td className="p-2">{r.receiptCode}</td>
                <td className="p-2">{r.crop}</td>
                <td className="p-2">{r.quantity}</td>
                <td className="p-2 capitalize">{r.status}</td>
                <td className="p-2">{r.linkedLoan? 'Yes':'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OperatorDashboard() {
  const { token } = getAuth();
  const [crops, setCrops] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [form, setForm] = useState({ farmerId:"", warehouseId:"", cropTypeId:"", quantity:"", grade:"A"});
  const [created, setCreated] = useState(null);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  useEffect(()=>{ (async()=>{
    try {
      setCrops(await api("/admin/crops", { token }));
      setWarehouses(await api("/admin/warehouses", { token }));
      const users = await api("/admin/users", { token }).catch(()=>[]);
      setFarmers(users.filter(u=>u.role==='farmer'));
      setList(await api("/operator/receipts", { token }));
    } catch(e){}
  })(); },[token]);

  async function submit(e){
    e.preventDefault(); setError("");
    try {
      const res = await api("/operator/receipts", { method:"POST", body: { ...form, quantity: Number(form.quantity) }, token });
      setCreated(res);
      setList(await api("/operator/receipts", { token }));
    } catch(err){ setError(err.message); }
  }

  async function updateStatus(id, status){
    await api(`/operator/receipts/${id}/status`, { method:"POST", body:{ status }, token });
    setList(await api("/operator/receipts", { token }));
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="font-semibold mb-2">Create new receipt</div>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-2">
          <select className="bg-slate-800 p-2 rounded" value={form.farmerId} onChange={e=>setForm({...form, farmerId:e.target.value})}>
            <option value="">Select Farmer</option>
            {farmers.map(f=>(<option key={f.id} value={f.id}>{f.name} ({f.phone})</option>))}
          </select>
          <select className="bg-slate-800 p-2 rounded" value={form.cropTypeId} onChange={e=>setForm({...form, cropTypeId:e.target.value})}>
            <option value="">Crop</option>
            {crops.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <select className="bg-slate-800 p-2 rounded" value={form.warehouseId} onChange={e=>setForm({...form, warehouseId:e.target.value})}>
            <option value="">Warehouse</option>
            {warehouses.map(w=>(<option key={w.id} value={w.id}>{w.name}</option>))}
          </select>
          <input className="bg-slate-800 p-2 rounded" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})}/>
          <input className="bg-slate-800 p-2 rounded" placeholder="Grade" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})}/>
          <button className="bg-blue-600 rounded p-2">Create</button>
        </form>
        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
        {created && (
          <div className="mt-3 p-3 bg-slate-800 rounded">
            <div className="font-semibold">Receipt created</div>
            <div className="text-sm">Code: {created.receiptCode}</div>
            {created.qr && <img alt="QR" src={created.qr} className="mt-2 w-32 h-32"/>}
          </div>
        )}
      </div>
      <div>
        <div className="font-semibold mb-2">Warehouse receipts</div>
        <div className="space-y-2">
          {list.map(r=> (
            <div key={r.id} className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-sm">
                <div className="font-mono">{r.receiptCode}</div>
                <div className="ml-auto capitalize">{r.status}</div>
              </div>
              <div className="flex gap-2 mt-2 text-xs">
                {['stored','partially_sold','sold','released'].map(s=> (
                  <button key={s} onClick={()=>updateStatus(r.id,s)} className="px-2 py-1 bg-slate-800 rounded capitalize">{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BankerDashboard(){
  const { token } = getAuth();
  const [receiptCode, setReceiptCode] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [results, setResults] = useState([]);
  const [loanForm, setLoanForm] = useState({ principalAmount:"", interestRate:"" });
  const [error, setError] = useState("");

  async function search(){
    const data = await api(`/banker/receipts/search?${new URLSearchParams({ receiptCode, farmerPhone })}`, { token });
    setResults(data);
  }
  async function createLoan(id){
    try{
      await api(`/banker/receipts/${id}/loan`, { method:"POST", body: { principalAmount: Number(loanForm.principalAmount), interestRate: Number(loanForm.interestRate) }, token });
      await search();
    }catch(e){ setError(e.message); }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <input className="bg-slate-800 p-2 rounded flex-1" placeholder="Receipt code" value={receiptCode} onChange={e=>setReceiptCode(e.target.value)} />
        <input className="bg-slate-800 p-2 rounded flex-1" placeholder="Farmer phone" value={farmerPhone} onChange={e=>setFarmerPhone(e.target.value)} />
        <button onClick={search} className="bg-blue-600 rounded px-3">Search</button>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="grid gap-3">
        {results.map(r=> (
          <div key={r.id} className="p-3 bg-slate-900 rounded border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="font-mono">{r.receiptCode}</div>
              <div className="text-xs ml-auto capitalize">{r.status}</div>
            </div>
            <div className="text-xs text-slate-300">{r.crop} • {r.quantity} • {r.warehouse}</div>
            <div className="mt-2 flex gap-2 items-end">
              <input className="bg-slate-800 p-2 rounded" placeholder="Principal" value={loanForm.principalAmount} onChange={e=>setLoanForm({...loanForm, principalAmount:e.target.value})}/>
              <input className="bg-slate-800 p-2 rounded" placeholder="Interest %" value={loanForm.interestRate} onChange={e=>setLoanForm({...loanForm, interestRate:e.target.value})}/>
              <button disabled={r.pledged} onClick={()=>createLoan(r.id)} className={`px-3 py-2 rounded ${r.pledged? 'bg-slate-700':'bg-purple-600'}`}>{r.pledged? 'Already pledged': 'Create Loan'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard(){
  const { token } = getAuth();
  const [analytics, setAnalytics] = useState({ totalReceipts:0, totalPledged:0, totalLoanAmount:0 });
  const [crops, setCrops] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [newCrop, setNewCrop] = useState("");
  const [whForm, setWhForm] = useState({ name:"", locationText:"", contactPerson:"", phone:"" });

  async function refresh(){
    setAnalytics(await api("/admin/analytics", { token }));
    setCrops(await api("/admin/crops", { token }));
    setWarehouses(await api("/admin/warehouses", { token }));
  }
  useEffect(()=>{ refresh(); },[]);
  async function addCrop(){ await api("/admin/crops", { method:"POST", body:{ name:newCrop }, token }); setNewCrop(""); refresh(); }
  async function addWh(e){ e.preventDefault(); await api("/admin/warehouses", { method:"POST", body:whForm, token }); setWhForm({ name:"", locationText:"", contactPerson:"", phone:"" }); refresh(); }

  return (
    <div className="p-4 space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat title="Total receipts" value={analytics.totalReceipts} />
        <Stat title="Pledged receipts" value={analytics.totalPledged} />
        <Stat title="Active loan amount" value={`₹ ${analytics.totalLoanAmount}`} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-3 bg-slate-900 rounded border border-slate-800">
          <div className="font-semibold mb-2">Crop Types</div>
          <div className="flex gap-2 mb-2">
            <input className="flex-1 bg-slate-800 p-2 rounded" placeholder="New crop name" value={newCrop} onChange={e=>setNewCrop(e.target.value)}/>
            <button onClick={addCrop} className="bg-blue-600 rounded px-3">Add</button>
          </div>
          <ul className="text-sm space-y-1">
            {crops.map(c=> (<li key={c.id} className="p-2 bg-slate-800 rounded">{c.name}</li>))}
          </ul>
        </div>
        <div className="p-3 bg-slate-900 rounded border border-slate-800">
          <div className="font-semibold mb-2">Warehouses</div>
          <form onSubmit={addWh} className="grid gap-2">
            <input className="bg-slate-800 p-2 rounded" placeholder="Name" value={whForm.name} onChange={e=>setWhForm({...whForm, name:e.target.value})}/>
            <input className="bg-slate-800 p-2 rounded" placeholder="Location" value={whForm.locationText} onChange={e=>setWhForm({...whForm, locationText:e.target.value})}/>
            <input className="bg-slate-800 p-2 rounded" placeholder="Contact person" value={whForm.contactPerson} onChange={e=>setWhForm({...whForm, contactPerson:e.target.value})}/>
            <input className="bg-slate-800 p-2 rounded" placeholder="Phone" value={whForm.phone} onChange={e=>setWhForm({...whForm, phone:e.target.value})}/>
            <button className="bg-blue-600 rounded px-3 py-2">Add</button>
          </form>
          <ul className="text-sm mt-2 space-y-1">
            {warehouses.map(w=> (<li key={w.id} className="p-2 bg-slate-800 rounded">{w.name} – {w.locationText}</li>))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }){
  return (
    <div className="p-3 bg-slate-900 rounded border border-slate-800">
      <div className="text-slate-400 text-xs">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

export default function App(){
  const [view, setView] = useState("landing");
  const [role, setRole] = useState(null);

  useEffect(()=>{
    const a = getAuth();
    if(a?.token){ setView("dashboard"); setRole(a.role); }
  },[]);

  function onAuthed(){ const a = getAuth(); setRole(a.role); setView("dashboard"); }
  function onLogout(){ clearAuth(); setView("landing"); setRole(null); }

  if(view==='landing') return <Landing onLoginClick={()=>setView('auth')} />;
  if(view==='auth') return <Auth onAuthed={onAuthed} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Topbar role={role} onLogout={onLogout} />
      {role==='farmer' && <FarmerDashboard />}
      {role==='operator' && <OperatorDashboard />}
      {role==='banker' && <BankerDashboard />}
      {role==='admin' && <AdminDashboard />}
    </div>
  );
}
