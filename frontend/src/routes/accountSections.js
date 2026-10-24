import ProfileNameForm from '../components/ProfileNameForm.jsx';
import AccountEmailForm from '../components/AccountEmailForm.jsx';
import PasswordForm from '../components/PasswordForm.jsx';
import DeleteAccountSection from '../components/DeleteAccountSection.jsx';
import { PATHS } from './paths.js';

// Account sections that each open in their own view from the Profile page.
// Used for both the Profile buttons and the routes, so they always match.
// `danger` shows the button in the red style.
export const ACCOUNT_SECTIONS = [
  { path: PATHS.profileName, label: 'Change name', title: 'Change name', Component: ProfileNameForm },
  { path: PATHS.profileEmail, label: 'Change login email', title: 'Change login email', Component: AccountEmailForm },
  { path: PATHS.profilePassword, label: 'Change password', title: 'Change password', Component: PasswordForm },
  {
    path: PATHS.profileDeleteAccount,
    label: 'Delete account',
    title: 'Delete account',
    Component: DeleteAccountSection,
    danger: true,
  },
];
