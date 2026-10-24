import { Link } from 'react-router';
import StatusMessage from './StatusMessage.jsx';
import { useDismissible } from '../hooks/useDismissible.js';
import { PATHS } from '../routes/paths.js';

const STORAGE_KEY = 'guest-notice-dismissed';

// Warning for signed-out users that their results are not saved. Can be dismissed.
export default function GuestNotice() {
  const [isDismissed, dismiss] = useDismissible(STORAGE_KEY);
  if (isDismissed) {
    return <h2 className="guest-reminder">Records will not be saved unless you login with an account</h2>;
  }

  return (
    <StatusMessage variant="warning" title="You are not signed in" onDismiss={dismiss}>
      Results are shown for this session only and are not saved. To save data,{' '}
      <Link to={PATHS.register}>register</Link> for an account and <Link to={PATHS.login}>log in</Link>.
    </StatusMessage>
  );
}
