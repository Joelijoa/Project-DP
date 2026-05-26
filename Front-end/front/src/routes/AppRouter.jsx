import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AuditsListPage from '../pages/audits/AuditsListPage';
import NewAuditPage from '../pages/audits/NewAuditPage';
import AuditDetailPage from '../pages/audits/AuditDetailPage';
import ReferentielsPage from '../pages/referentiels/ReferentielsPage';
import EntitesPage from '../pages/entites/EntitesPage';
import ResultatsPage from '../pages/resultats/ResultatsPage';
import PlansActionsPage from '../pages/actions/PlansActionsPage';
import IndicateursPage from '../pages/indicateurs/IndicateursPage';
import RapportsPage from '../pages/rapports/RapportsPage';
import UtilisateursPage from '../pages/utilisateurs/UtilisateursPage';
import JournauxPage from '../pages/journaux/JournauxPage';
import ParametresPage from '../pages/parametres/ParametresPage';
import ProfilPage from '../pages/profil/ProfilPage';
import ValidationPage from '../pages/validation/ValidationPage';
import MesSoumissionsPage from '../pages/messoumissions/MesSoumissionsPage';
import MesRapportsPage from '../pages/mesrapports/MesRapportsPage';
import ArchivesPage from '../pages/archives/ArchivesPage';

const AppRouter = () => {
    const { isAuthenticated } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                {/* Routes publiques */}
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />

                {/* Routes protégées dans le layout */}
                <Route element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }>
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Audit & Conformité */}
                    <Route path="/audits" element={<AuditsListPage />} />
                    <Route path="/audits/nouveau" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior']}>
                            <NewAuditPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/audits/:id" element={<AuditDetailPage />} />
                    <Route path="/referentiels" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior', 'auditeur_junior']}>
                            <ReferentielsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/entites" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior']}>
                            <EntitesPage />
                        </ProtectedRoute>
                    } />

                    {/* Validation — admin + auditeur_senior */}
                    <Route path="/validation" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior']}><ValidationPage /></ProtectedRoute>
                    } />

                    {/* Mes soumissions — auditeur_junior */}
                    <Route path="/mes-soumissions" element={
                        <ProtectedRoute roles={['auditeur_junior']}><MesSoumissionsPage /></ProtectedRoute>
                    } />

                    {/* Mes rapports — client */}
                    <Route path="/mes-rapports" element={
                        <ProtectedRoute roles={['client']}><MesRapportsPage /></ProtectedRoute>
                    } />

                    {/* Résultats & Suivi */}
                    <Route path="/resultats" element={<ResultatsPage />} />
                    <Route path="/plans-actions" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior', 'auditeur_junior', 'client']}>
                            <PlansActionsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/indicateurs" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior']}>
                            <IndicateursPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/rapports" element={
                        <ProtectedRoute roles={['admin', 'auditeur_senior']}>
                            <RapportsPage />
                        </ProtectedRoute>
                    } />

                    {/* Administration — admin uniquement */}
                    <Route path="/utilisateurs" element={
                        <ProtectedRoute roles={['admin']}><UtilisateursPage /></ProtectedRoute>
                    } />
                    <Route path="/journaux" element={
                        <ProtectedRoute roles={['admin']}><JournauxPage /></ProtectedRoute>
                    } />
                    <Route path="/parametres" element={<ParametresPage />} />

                    {/* Archives */}
                    <Route path="/archives" element={<ArchivesPage />} />

                    {/* Profil */}
                    <Route path="/profil" element={<ProfilPage />} />
                </Route>

                {/* Redirection par défaut */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
