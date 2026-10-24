import { Link } from 'react-router';
import EyeIcon from './EyeIcon.jsx';
import { alertDetailPath } from '../routes/paths.js';

// Opens the detail page of one alert. Same structure and size as DeleteButton.
export default function ViewButton({ alertId, label = 'View' }) {
  return (
    <Link to={alertDetailPath(alertId)} className="btn btn-secondary btn-sm btn-action">
      <EyeIcon />
      {label}
    </Link>
  );
}
