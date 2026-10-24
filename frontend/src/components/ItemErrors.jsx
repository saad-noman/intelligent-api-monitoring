import StatusMessage from './StatusMessage.jsx';

// Item-level validation errors returned by POST /monitor: [{ index, api_name, errors: [{ field, message }] }].
export default function ItemErrors({ errors, title = 'Some observations were rejected' }) {
  if (!errors?.length) return null;
  return (
    <StatusMessage variant="warning" title={title}>
      {errors.map((item) => (
        <span key={item.index} className="item-error">
          Item #{item.index + 1}
          {item.api_name ? ` (${item.api_name})` : ''}: {item.errors.map((error) => error.message).join(' ')}
        </span>
      ))}
    </StatusMessage>
  );
}
