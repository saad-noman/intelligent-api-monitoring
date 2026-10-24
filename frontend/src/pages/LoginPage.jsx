import { Link, useLocation, useNavigate } from 'react-router';
import AuthForm from '../components/AuthForm.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PATHS } from '../routes/paths.js';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  async function handleLogin(credentials) {
    await signIn(credentials);
    navigate(state?.from ?? PATHS.monitor, { replace: true });
  }

  let notice = null;
  if (state?.registered) {
    notice = <StatusMessage variant="success" title="Account created">You can now log in.</StatusMessage>;
  } else if (state?.from) {
    notice = <StatusMessage title="Account required">Log in to access alerts and email reporting.</StatusMessage>;
  }

  return (
    <section className="narrow stack">
      <PageHeader title="Log in" />
      <AuthForm
        submitLabel="Log in →"
        onSubmit={handleLogin}
        notice={notice}
        footer={
          <>
            No account? <Link to={PATHS.register}>Create one</Link>
          </>
        }
      />
    </section>
  );
}
