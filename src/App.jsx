import {useEffect, useState} from 'react'
import './App.css'
import {supabase} from "./utils/supabase.js";
import LoginForm from "./components/LoginForm.jsx";
import Dashboard from "./components/Dashboard.jsx";

function App() {
  const [session, setSession] = useState(null);
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => setSession(data.session));
    const {data: sub} = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return session ? <Dashboard session={session} date={date} onDateChange={setDate}/> : <LoginForm/>;
}

export default App
