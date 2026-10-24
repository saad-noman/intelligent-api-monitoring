import AppHeader from './components/AppHeader.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <div className="app">
      <AppHeader />
      <main>
        <AppRoutes />
      </main>
    </div>
  );
}
