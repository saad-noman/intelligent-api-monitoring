import { Link } from 'react-router';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ACCOUNT_SECTIONS } from '../routes/accountSections.js';
import { NOT_AVAILABLE } from '../utils/format.js';

const NOT_SET = 'Not set';

// Opened from the profile circle: shows the current account details (never the
// password) and links to the views that change them or delete the account.
export default function ProfilePage() {
  const { account } = useAuth();

  return (
    <section className="profile-page stack">
      <PageHeader title="Profile">Your account details and login settings.</PageHeader>

      <div className="profile-layout">
        <div className="card form-card">
          <h2>Account details</h2>
          <dl className="details">
            <dt>First name</dt>
            <dd>{account?.firstName || NOT_SET}</dd>
            <dt>Last name</dt>
            <dd>{account?.lastName || NOT_SET}</dd>
            <dt>Login email</dt>
            <dd>{account?.email ?? NOT_AVAILABLE}</dd>
          </dl>
        </div>

        <div className="card form-card">
          <h2>Manage account</h2>
          <div className="account-section-buttons">
            {ACCOUNT_SECTIONS.map((section) => (
              <Link
                key={section.path}
                to={section.path}
                className={`btn btn-sm ${section.danger ? 'btn-danger' : 'btn-secondary'}`}
              >
                {section.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
