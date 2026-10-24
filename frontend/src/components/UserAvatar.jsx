import { Link } from 'react-router';
import { PATHS } from '../routes/paths.js';
import { getFullName, getInitials } from '../utils/initials.js';

// Circle with the signed-in user's initials; opens the Profile page.
export default function UserAvatar({ account, onClick }) {
  const name = getFullName(account) || account?.email || '';

  return (
    <Link to={PATHS.profile} className="user-avatar" title={name} aria-label={`Profile of ${name}`} onClick={onClick}>
      {getInitials(account)}
    </Link>
  );
}
