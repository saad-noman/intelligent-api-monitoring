import { Link, useNavigate } from 'react-router';
import AuthForm from '../components/AuthForm.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { register } from '../services/authService.js';
import { PATHS } from '../routes/paths.js';

export default function RegisterPage() {
  const navigate = useNavigate();

  async function handleRegister(registration) {
    await register(registration);
    navigate(PATHS.login, { state: { registered: true } });
  }

  return (
    <section className="narrow stack">
      <PageHeader title="Create an" highlight="account">
        An account is required for saved alerts and email reporting.
      </PageHeader>
      <AuthForm
        submitLabel="Create account →"
        withNames
        onSubmit={handleRegister}
        footer={
          <>
            Already have an account? <Link to={PATHS.login}>Log in</Link>
          </>
        }
      />
    </section>
  );
}
