import { AuthProvider } from './store/auth/AuthContext';
import AppRouter from './routes/AppRouter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    return (
        <AuthProvider>
            <AppRouter />
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
            />
        </AuthProvider>
    );
}

export default App;
