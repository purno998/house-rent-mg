import {useState} from 'react'
import './LoginForm.css'
import {supabase} from "../utils/supabase.js";

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    const {error} = await supabase.auth.signInWithPassword({email, password});
    setError(error?.message ?? null);
    setLoading(false);
  }

  return (
    <section className="login">
      <form className="login-card" onSubmit={login}>
        <h2>House Rent MG</h2>
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required/>
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 autoComplete="current-password" required/>
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </section>
  );
}

export default LoginForm
