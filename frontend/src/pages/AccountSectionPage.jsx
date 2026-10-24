import { Link } from 'react-router';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PATHS } from '../routes/paths.js';

// Separate view for one account section (see routes/accountSections.js), with a link
// back to Profile. Every section receives the account and a way to reload it.
export default function AccountSectionPage({ section }) {
  const { account, refresh } = useAuth();
  const { Component } = section;

  return (
    <section className="narrow stack">
      <Link to={PATHS.profile}>← Back to Profile</Link>
      <PageHeader title={section.title} />
      <Component account={account} onChanged={refresh} />
    </section>
  );
}
